from __future__ import annotations

import argparse
import re
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import imageio_ffmpeg


FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SECTION_RE = re.compile(r"### `(?P<start>\d+:\d+)-(?P<end>\d+:\d+)`")


@dataclass
class Segment:
    start: float
    end: float
    text: str

    @property
    def duration(self) -> float:
        return self.end - self.start


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Render a timed Arabic voiceover track from a markdown script.")
    parser.add_argument("--script", required=True, help="Path to the markdown voiceover script.")
    parser.add_argument("--output", required=True, help="Path to the rendered narration track.")
    parser.add_argument(
        "--engine",
        choices=("say", "edge-freevc"),
        default="say",
        help="Rendering engine. Use 'say' for macOS TTS or 'edge-freevc' for Jordanian Arabic source speech converted to a cloned voice.",
    )
    parser.add_argument("--voice", default="Majed", help="macOS 'say' voice to use when --engine=say.")
    parser.add_argument("--rate", type=int, default=175, help="macOS 'say' speech rate when --engine=say.")
    parser.add_argument(
        "--edge-voice",
        default="ar-JO-TaimNeural",
        help="Edge TTS voice to use when --engine=edge-freevc.",
    )
    parser.add_argument(
        "--speaker-reference",
        nargs="+",
        default=None,
        help="One or more audio/video files that contain the target voice when --engine=edge-freevc.",
    )
    parser.add_argument("--duration", type=float, required=True, help="Total output duration in seconds.")
    parser.add_argument(
        "--skip-before",
        type=float,
        default=0.0,
        help="Skip all sections that start before this time in seconds.",
    )
    return parser


def parse_mmss(value: str) -> float:
    minutes, seconds = value.split(":")
    return int(minutes) * 60 + int(seconds)


def parse_segments(script_path: Path, skip_before: float) -> list[Segment]:
    content = script_path.read_text(encoding="utf-8")
    matches = list(SECTION_RE.finditer(content))
    segments: list[Segment] = []

    for index, match in enumerate(matches):
        start = parse_mmss(match.group("start"))
        end = parse_mmss(match.group("end"))
        if start < skip_before:
            continue

        section_start = match.end()
        section_end = matches[index + 1].start() if index + 1 < len(matches) else len(content)
        section_body = content[section_start:section_end]
        voiceover_idx = section_body.find("Voiceover:")
        if voiceover_idx == -1:
            continue

        voiceover_block = section_body[voiceover_idx + len("Voiceover:") :]
        text_match = re.search(r"`([^`]+)`", voiceover_block, flags=re.S)
        if not text_match:
            continue

        text = " ".join(text_match.group(1).split())
        segments.append(Segment(start=start, end=end, text=text))

    if not segments:
        raise ValueError(f"No voiceover segments found in {script_path}")

    return segments


def normalize_text_for_tts(text: str) -> str:
    substitutions = [
        ("P(-2)", "بي عند سالب اثنين"),
        ("P(2)", "بي عند اثنين"),
        ("P(a)=0", "بي عند إيه تساوي صفر"),
        ("P(a)", "بي عند إيه"),
        ("Q(a)", "كيو عند إيه"),
        ("P(x)", "بي لإكس"),
        ("Q(x)", "كيو لإكس"),
        ("(x - a)", "إكس ناقص إيه"),
        ("(x + 2)", "إكس زائد اثنين"),
        ("(a - a)", "إيه ناقص إيه"),
        ("x = a", "إكس يساوي إيه"),
        ("3x", "ثلاثة إكس"),
        ("6x", "ستة إكس"),
        ("x²", "إكس تربيع"),
    ]

    for source, target in substitutions:
        text = text.replace(source, target)

    text = re.sub(r"(?<!\w)R(?!\w)", "آر", text)
    text = re.sub(r"(?<!\w)Q(?!\w)", "كيو", text)
    text = text.replace("=", " تساوي ")
    text = text.replace("+", " زائد ")
    text = text.replace("-", " ناقص ")
    text = text.replace("(", " ")
    text = text.replace(")", " ")
    text = text.replace("/", " على ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def run_command(command: list[str]) -> None:
    print("Running:", " ".join(command))
    subprocess.run(command, check=True)


def probe_duration(path: Path) -> float:
    result = subprocess.run(
        [FFMPEG, "-i", str(path)],
        capture_output=True,
        text=True,
        check=False,
    )
    match = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", result.stderr)
    if not match:
        raise ValueError(f"Could not determine duration for {path}")

    hours = int(match.group(1))
    minutes = int(match.group(2))
    seconds = float(match.group(3))
    return hours * 3600 + minutes * 60 + seconds


def build_atempo_chain(speed: float) -> str:
    filters: list[str] = []
    remaining = speed

    while remaining > 2.0:
        filters.append("atempo=2.0")
        remaining /= 2.0

    while remaining < 0.5:
        filters.append("atempo=0.5")
        remaining /= 0.5

    filters.append(f"atempo={remaining:.4f}")
    return ",".join(filters)


def fit_clip_to_segment(raw_output: Path, desired_duration: float, final_output: Path, volume: float) -> Path:
    raw_duration = probe_duration(raw_output)
    desired_duration = max(desired_duration * 0.92, 0.35)
    speed = raw_duration / desired_duration

    # Keep small pauses between segments, but tighten clips that run too long.
    if speed > 1.35:
        speed = 1.35
    elif speed < 0.85:
        speed = 0.85

    filters = [build_atempo_chain(speed), f"volume={volume:.2f}"]
    run_command(
        [
            FFMPEG,
            "-y",
            "-i",
            str(raw_output),
            "-filter:a",
            ",".join(filters),
            "-ar",
            "48000",
            "-ac",
            "2",
            str(final_output),
        ]
    )
    return final_output


def synthesize_segment_say(segment: Segment, voice: str, rate: int, output_dir: Path) -> Path:
    raw_output = output_dir / f"{int(segment.start * 1000):06d}-raw.aiff"
    final_output = output_dir / f"{int(segment.start * 1000):06d}-ready.wav"

    text = normalize_text_for_tts(segment.text)
    run_command(["say", "-v", voice, "-r", str(rate), "-o", str(raw_output), text])
    return fit_clip_to_segment(raw_output, segment.duration, final_output, volume=2.0)


def normalize_reference_clip(source_path: Path, clip_index: int, output_dir: Path) -> Path:
    normalized_output = output_dir / f"speaker-reference-{clip_index:02d}.wav"
    run_command(
        [
            FFMPEG,
            "-y",
            "-i",
            str(source_path),
            "-vn",
            "-ac",
            "1",
            "-ar",
            "24000",
            str(normalized_output),
        ]
    )
    return normalized_output


def prepare_speaker_reference(reference_paths: list[Path], output_dir: Path) -> Path:
    normalized_inputs = [
        normalize_reference_clip(reference_path, index + 1, output_dir)
        for index, reference_path in enumerate(reference_paths)
    ]
    if len(normalized_inputs) == 1:
        return normalized_inputs[0]

    combined_output = output_dir / "speaker-reference-combined.wav"
    command: list[str] = [FFMPEG, "-y"]
    for input_path in normalized_inputs:
        command.extend(["-i", str(input_path)])

    concat_inputs = "".join(f"[{index}:a]" for index in range(len(normalized_inputs)))
    command.extend(
        [
            "-filter_complex",
            f"{concat_inputs}concat=n={len(normalized_inputs)}:v=0:a=1[aout]",
            "-map",
            "[aout]",
            "-ac",
            "1",
            "-ar",
            "24000",
            str(combined_output),
        ]
    )
    run_command(command)
    return combined_output


def synthesize_segment_edge_freevc(
    segment: Segment,
    edge_voice: str,
    speaker_reference: Path,
    output_dir: Path,
) -> Path:
    segment_id = f"{int(segment.start * 1000):06d}"
    source_output = output_dir / f"{segment_id}-edge.mp3"
    source_wav = output_dir / f"{segment_id}-edge.wav"
    converted_output = output_dir / f"{segment_id}-clone.wav"
    final_output = output_dir / f"{segment_id}-ready.wav"

    text = normalize_text_for_tts(segment.text)
    run_command(["edge-tts", "--voice", edge_voice, "--text", text, "--write-media", str(source_output)])
    run_command(
        [
            FFMPEG,
            "-y",
            "-i",
            str(source_output),
            "-ac",
            "1",
            "-ar",
            "24000",
            str(source_wav),
        ]
    )
    run_command(
        [
            "tts",
            "--model_name",
            "voice_conversion_models/multilingual/vctk/freevc24",
            "--source_wav",
            str(source_wav),
            "--target_wav",
            str(speaker_reference),
            "--out_path",
            str(converted_output),
            "--progress_bar",
            "False",
        ]
    )
    return fit_clip_to_segment(converted_output, segment.duration, final_output, volume=1.6)


def render_track(
    segments: list[Segment],
    duration: float,
    voice: str,
    rate: int,
    output_path: Path,
    engine: str,
    edge_voice: str,
    speaker_references: Optional[list[Path]],
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="snapmath-voiceover-") as temp_dir:
        temp_root = Path(temp_dir)
        prepared_reference: Optional[Path] = None
        if engine == "edge-freevc":
            if not speaker_references:
                raise ValueError("--speaker-reference is required when --engine=edge-freevc")
            prepared_reference = prepare_speaker_reference(speaker_references, temp_root)

        rendered_clips: list[Path] = []
        for segment in segments:
            if engine == "say":
                rendered_clips.append(synthesize_segment_say(segment, voice, rate, temp_root))
            else:
                if prepared_reference is None:
                    raise ValueError("Speaker reference was not prepared for edge-freevc rendering.")
                rendered_clips.append(
                    synthesize_segment_edge_freevc(segment, edge_voice, prepared_reference, temp_root)
                )

        command: list[str] = [
            FFMPEG,
            "-y",
            "-f",
            "lavfi",
            "-t",
            f"{duration:.3f}",
            "-i",
            "anullsrc=channel_layout=stereo:sample_rate=48000",
        ]

        for clip in rendered_clips:
            command.extend(["-i", str(clip)])

        filter_parts: list[str] = []
        mix_inputs = ["[0:a]"]
        for idx, segment in enumerate(segments, start=1):
            delay_ms = int(segment.start * 1000)
            label = f"s{idx}"
            filter_parts.append(f"[{idx}:a]adelay={delay_ms}|{delay_ms}[{label}]")
            mix_inputs.append(f"[{label}]")

        filter_parts.append(
            "".join(mix_inputs) + f"amix=inputs={len(mix_inputs)}:duration=first:dropout_transition=0[aout]"
        )

        command.extend(
            [
                "-filter_complex",
                ";".join(filter_parts),
                "-map",
                "[aout]",
                "-c:a",
                "aac",
                "-b:a",
                "192k",
                str(output_path),
            ]
        )
        run_command(command)


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    if args.engine == "edge-freevc" and sys.version_info < (3, 10):
        parser.error("--engine=edge-freevc requires Python 3.10+ and the dedicated voice environment.")

    script_path = Path(args.script).expanduser().resolve()
    output_path = Path(args.output).expanduser().resolve()
    segments = parse_segments(script_path, args.skip_before)
    speaker_references = (
        [Path(path).expanduser().resolve() for path in args.speaker_reference] if args.speaker_reference else None
    )
    render_track(
        segments,
        args.duration,
        args.voice,
        args.rate,
        output_path,
        args.engine,
        args.edge_voice,
        speaker_references,
    )

    print(f"Rendered narration track to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
