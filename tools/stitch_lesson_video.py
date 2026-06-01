from __future__ import annotations

import argparse
import shutil
import subprocess
import tempfile
from pathlib import Path

import imageio_ffmpeg


ROOT = Path(__file__).resolve().parents[1]
LESSONS_DIR = ROOT / "assets" / "media" / "lessons"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Stitch a SnapMath lesson intro and Manim segment.")
    parser.add_argument("--lesson-id", required=True, help="Lesson id, for example u1-l1.")
    parser.add_argument("--intro", required=True, help="Path to the source intro clip.")
    parser.add_argument("--manim", required=True, help="Path to the rendered Manim clip.")
    parser.add_argument("--output", required=True, help="Path to the final stitched lesson video.")
    parser.add_argument(
        "--copy-intro",
        action="store_true",
        help="Copy the source intro into assets/media/lessons as a stable source file.",
    )
    parser.add_argument(
        "--intro-target-sec",
        type=float,
        default=30.0,
        help="Target duration for the intro section in seconds.",
    )
    parser.add_argument(
        "--manim-target-sec",
        type=float,
        default=270.0,
        help="Target duration for the animated lesson section in seconds.",
    )
    return parser


def format_seconds(value: float) -> str:
    return f"{value:.3f}"


def run_ffmpeg(*args: str) -> None:
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    command = [ffmpeg, *args]
    print("Running:", " ".join(command))
    subprocess.run(command, check=True)


def get_duration(path: Path) -> float:
    _, seconds = imageio_ffmpeg.count_frames_and_secs(str(path))
    return float(seconds)


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def normalized_intro(intro: Path, output: Path, target_seconds: float) -> None:
    duration = get_duration(intro)
    pad_seconds = max(0.0, target_seconds - duration)
    vf_parts = [
        "scale=1080:1920:force_original_aspect_ratio=decrease",
        "pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black",
    ]
    if pad_seconds > 0.01:
        vf_parts.append(f"tpad=stop_mode=clone:stop_duration={format_seconds(pad_seconds)}")

    command = [
        "-y",
        "-i",
        str(intro),
        "-vf",
        ",".join(vf_parts),
    ]
    if pad_seconds > 0.01:
        command.extend(["-af", f"apad=pad_dur={format_seconds(pad_seconds)}"])
    command.extend(
        [
            "-t",
            format_seconds(target_seconds),
            "-r",
            "30",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "20",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-ar",
            "48000",
            str(output),
        ]
    )
    run_ffmpeg(*command)


def normalized_manim(manim: Path, output: Path, target_seconds: float) -> None:
    duration = get_duration(manim)
    pad_seconds = max(0.0, target_seconds - duration)
    vf_parts = [
        "scale=1080:1920:force_original_aspect_ratio=decrease",
        "pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black",
    ]
    if pad_seconds > 0.01:
        vf_parts.append(f"tpad=stop_mode=clone:stop_duration={format_seconds(pad_seconds)}")

    run_ffmpeg(
        "-y",
        "-i",
        str(manim),
        "-f",
        "lavfi",
        "-i",
        "anullsrc=channel_layout=stereo:sample_rate=48000",
        "-vf",
        ",".join(vf_parts),
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-t",
        format_seconds(target_seconds),
        "-r",
        "30",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "20",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-ar",
        "48000",
        str(output),
    )


def concat_video(intro: Path, manim: Path, output: Path) -> None:
    run_ffmpeg(
        "-y",
        "-i",
        str(intro),
        "-i",
        str(manim),
        "-filter_complex",
        "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]",
        "-map",
        "[v]",
        "-map",
        "[a]",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "20",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-ar",
        "48000",
        "-movflags",
        "+faststart",
        str(output),
    )


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    intro_path = Path(args.intro).expanduser().resolve()
    manim_path = Path(args.manim).expanduser().resolve()
    output_path = Path(args.output).expanduser().resolve()

    if not intro_path.exists():
        parser.error(f"Intro clip not found: {intro_path}")
    if not manim_path.exists():
        parser.error(f"Manim clip not found: {manim_path}")

    ensure_parent(output_path)
    if args.copy_intro:
        copied_intro = LESSONS_DIR / f"{args.lesson_id}-intro-source.mp4"
        ensure_parent(copied_intro)
        shutil.copy2(intro_path, copied_intro)
        print(f"Copied intro source to {copied_intro}")

    with tempfile.TemporaryDirectory(prefix=f"{args.lesson_id}-stitch-") as temp_dir:
        temp_root = Path(temp_dir)
        intro_ready = temp_root / "intro-ready.mp4"
        manim_ready = temp_root / "manim-ready.mp4"

        normalized_intro(intro_path, intro_ready, args.intro_target_sec)
        normalized_manim(manim_path, manim_ready, args.manim_target_sec)
        concat_video(intro_ready, manim_ready, output_path)

    final_duration = get_duration(output_path)
    print(f"Final stitched lesson video: {output_path}")
    print(f"Final duration: {final_duration:.2f}s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
