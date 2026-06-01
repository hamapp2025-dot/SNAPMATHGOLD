from __future__ import annotations

import math
from pathlib import Path

import arabic_reshaper
import imageio.v2 as imageio
import numpy as np
from bidi.algorithm import get_display
from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
FOUNDER_DIR = ROOT / "assets" / "media" / "founder"
LESSONS_DIR = ROOT / "assets" / "media" / "lessons"

WIDTH = 1080
HEIGHT = 1920
FPS = 24

BG = (11, 13, 34)
SURFACE = (26, 31, 62)
ACCENT = (201, 168, 76)
ACCENT_SOFT = (111, 93, 214)
TEXT = (246, 247, 252)
MUTED = (184, 190, 214)
INK = (27, 29, 48)

FONT_PATH = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"


def make_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_PATH, size=size)


FONT_DISPLAY = make_font(80)
FONT_TITLE = make_font(62)
FONT_SUBTITLE = make_font(38)
FONT_BODY = make_font(34)
FONT_SMALL = make_font(26)
FONT_TINY = make_font(22)


def rtl_text(text: str) -> str:
    return get_display(arabic_reshaper.reshape(text))


def draw_centered(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, y: int, fill, rtl=False):
    rendered = rtl_text(text) if rtl else text
    bbox = draw.textbbox((0, 0), rendered, font=font)
    x = (WIDTH - (bbox[2] - bbox[0])) / 2
    draw.text((x, y), rendered, font=font, fill=fill)


def draw_left(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, x: int, y: int, fill, rtl=False):
    rendered = rtl_text(text) if rtl else text
    draw.text((x, y), rendered, font=font, fill=fill)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))


def ease_out_cubic(t: float) -> float:
    t = clamp01(t)
    return 1 - (1 - t) ** 3


def ease_in_out(t: float) -> float:
    t = clamp01(t)
    return 3 * t * t - 2 * t * t * t


def make_base_canvas():
    img = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(img)

    for i in range(HEIGHT):
        blend = i / HEIGHT
        color = (
            int(lerp(BG[0], 17, blend)),
            int(lerp(BG[1], 18, blend)),
            int(lerp(BG[2], 46, blend)),
        )
        draw.line((0, i, WIDTH, i), fill=color)

    orb = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    od = ImageDraw.Draw(orb)
    od.ellipse((-120, -50, 420, 490), fill=(ACCENT[0], ACCENT[1], ACCENT[2], 70))
    od.ellipse((WIDTH - 470, 180, WIDTH + 110, 760), fill=(ACCENT_SOFT[0], ACCENT_SOFT[1], ACCENT_SOFT[2], 56))
    od.ellipse((WIDTH - 380, HEIGHT - 620, WIDTH + 90, HEIGHT - 140), fill=(ACCENT[0], ACCENT[1], ACCENT[2], 40))
    orb = orb.filter(ImageFilter.GaussianBlur(80))
    img = Image.alpha_composite(img.convert("RGBA"), orb)
    return img


def add_brand_shell(base: Image.Image, progress_t: float = 0.0):
    img = base.copy()
    draw = ImageDraw.Draw(img)

    card = (70, HEIGHT - 310, WIDTH - 70, HEIGHT - 160)
    draw.rounded_rectangle(card, radius=42, fill=(22, 26, 52, 220), outline=(255, 255, 255, 18), width=2)

    draw_left(draw, "SnapMath Academy", FONT_SUBTITLE, 120, HEIGHT - 275, TEXT)
    draw_left(draw, "Jordan Grade 12", FONT_SMALL, 120, HEIGHT - 225, MUTED)
    draw_left(draw, "Learn. Master. Stand Out.", FONT_SMALL, 120, HEIGHT - 190, (220, 221, 230))

    # Progress track
    bar_x1, bar_y1, bar_x2, bar_y2 = 120, HEIGHT - 120, WIDTH - 120, HEIGHT - 102
    draw.rounded_rectangle((bar_x1, bar_y1, bar_x2, bar_y2), radius=16, fill=(255, 255, 255, 20))
    fill_w = int((bar_x2 - bar_x1) * clamp01(progress_t))
    if fill_w > 0:
        draw.rounded_rectangle((bar_x1, bar_y1, bar_x1 + fill_w, bar_y2), radius=16, fill=ACCENT)
    return img


def save_jpg(image: Image.Image, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(path, quality=95)


def write_video(path: Path, duration_sec: float, render_frame):
    path.parent.mkdir(parents=True, exist_ok=True)
    total_frames = max(1, int(duration_sec * FPS))
    writer = imageio.get_writer(path, fps=FPS, codec="libx264", quality=7, macro_block_size=None)
    try:
        for frame_idx in range(total_frames):
            t = frame_idx / max(1, total_frames - 1)
            frame = render_frame(t)
            writer.append_data(np.asarray(frame.convert("RGB")))
    finally:
        writer.close()


def founder_portrait():
    img = make_base_canvas()
    draw = ImageDraw.Draw(img)

    circle_box = (230, 270, WIDTH - 230, 1110)
    draw.ellipse(circle_box, fill=(26, 31, 62, 255), outline=(ACCENT[0], ACCENT[1], ACCENT[2], 180), width=6)

    halo = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    hd.ellipse((180, 220, WIDTH - 180, 1160), fill=(ACCENT[0], ACCENT[1], ACCENT[2], 48))
    halo = halo.filter(ImageFilter.GaussianBlur(60))
    img = Image.alpha_composite(img, halo)
    draw = ImageDraw.Draw(img)

    draw_centered(draw, "HA", FONT_DISPLAY, 530, TEXT)
    draw_centered(draw, "Hamza Alfasatleh", FONT_SUBTITLE, 1210, TEXT)
    draw_centered(draw, "Founder & Tawjihi Math Mentor", FONT_BODY, 1270, MUTED)
    draw_centered(draw, "Jordan Grade 12", FONT_SMALL, 1340, (231, 221, 177))

    img = img.resize((1200, 1200), Image.Resampling.LANCZOS)
    save_jpg(img, FOUNDER_DIR / "founder-portrait.jpg")


def render_founder_intro(t: float) -> Image.Image:
    base = add_brand_shell(make_base_canvas(), progress_t=ease_in_out(t))
    draw = ImageDraw.Draw(base)

    intro_in = ease_out_cubic(min(1.0, t / 0.22))
    subtitle_in = ease_out_cubic(clamp01((t - 0.12) / 0.24))
    founder_in = ease_out_cubic(clamp01((t - 0.26) / 0.22))

    draw.rounded_rectangle((90, 110, 400, 185), radius=32, fill=(255, 255, 255, 14), outline=(255, 255, 255, 18), width=2)
    draw_left(draw, rtl_text("رياضيات التوجيهي"), FONT_TINY, 118, 132, TEXT)

    title_y = int(460 - (1 - intro_in) * 40)
    draw_centered(draw, "Hamza Alfasatleh", FONT_TITLE, title_y, TEXT)
    draw_centered(draw, "Founder intro", FONT_BODY, title_y + 88, (232, 224, 197))

    card_y = int(720 - (1 - subtitle_in) * 50)
    draw.rounded_rectangle((110, card_y, WIDTH - 110, card_y + 270), radius=34, fill=(20, 25, 49, 225), outline=(255, 255, 255, 18), width=2)
    draw_centered(draw, "Step-by-step Tawjihi math", FONT_SUBTITLE, card_y + 34, ACCENT)
    draw_centered(draw, "أنا حمزة الفساطلة", FONT_SUBTITLE, card_y + 100, TEXT, rtl=True)
    draw_centered(draw, "نبني فهماً واضحاً وثقة حقيقية في الامتحان", FONT_BODY, card_y + 170, MUTED, rtl=True)

    pill_y = int(1090 - (1 - founder_in) * 36)
    draw.rounded_rectangle((320, pill_y, WIDTH - 320, pill_y + 66), radius=24, fill=(255, 255, 255, 16))
    draw_centered(draw, "Jordan Grade 12 • Learn with confidence", FONT_SMALL, pill_y + 16, TEXT)

    return base


def render_founder_welcome(t: float) -> Image.Image:
    base = add_brand_shell(make_base_canvas(), progress_t=ease_in_out(t))
    draw = ImageDraw.Draw(base)

    intro_in = ease_out_cubic(min(1.0, t / 0.2))
    card_in = ease_out_cubic(clamp01((t - 0.1) / 0.24))

    title_y = int(420 - (1 - intro_in) * 40)
    draw_centered(draw, "Welcome to SnapMath", FONT_TITLE, title_y, TEXT)
    draw_centered(draw, "Start with the lesson. Then practice.", FONT_BODY, title_y + 90, (232, 224, 197))

    card_y = int(690 - (1 - card_in) * 42)
    draw.rounded_rectangle((92, card_y, WIDTH - 92, card_y + 510), radius=40, fill=(21, 26, 52, 225), outline=(255, 255, 255, 18), width=2)

    steps = [
        ("1", "ابدأ بالدرس", "Start with the lesson"),
        ("2", "ثبّت الفكرة بالأمثلة", "Lock the idea with examples"),
        ("3", "ادخل إلى التدريب اليومي", "Move into daily practice"),
    ]
    for idx, (num, ar, en) in enumerate(steps):
        top = card_y + 48 + idx * 144
        draw.rounded_rectangle((130, top, 230, top + 100), radius=30, fill=(ACCENT[0], ACCENT[1], ACCENT[2], 220))
        draw_centered(draw, num, FONT_SUBTITLE, top + 22, INK)
        draw_left(draw, ar, FONT_SUBTITLE, 270, top + 10, TEXT, rtl=True)
        draw_left(draw, en, FONT_SMALL, 270, top + 64, MUTED)

    draw_centered(draw, "Clear steps. Real exam confidence.", FONT_SMALL, card_y + 460, (223, 226, 234))
    return base


def render_lesson_video(title_en: str, title_ar: str, formula: str, tagline_en: str, step_labels: list[str], accent_shift: float):
    def renderer(t: float) -> Image.Image:
        base = add_brand_shell(make_base_canvas(), progress_t=ease_in_out(t))
        draw = ImageDraw.Draw(base)

        pulse = 0.5 + 0.5 * math.sin((t + accent_shift) * math.pi * 2)
        orb = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
        od = ImageDraw.Draw(orb)
        od.ellipse((150, 180, 930, 960), fill=(ACCENT_SOFT[0], ACCENT_SOFT[1], ACCENT_SOFT[2], int(18 + pulse * 20)))
        orb = orb.filter(ImageFilter.GaussianBlur(50))
        base = Image.alpha_composite(base, orb)
        draw = ImageDraw.Draw(base)

        draw.rounded_rectangle((88, 120, 320, 186), radius=24, fill=(255, 255, 255, 14), outline=(255, 255, 255, 18), width=2)
        draw_left(draw, "Lesson hero", FONT_TINY, 118, 138, TEXT)

        draw_centered(draw, title_en, FONT_SUBTITLE, 300, TEXT)
        draw_centered(draw, title_ar, FONT_BODY, 364, (234, 227, 209), rtl=True)

        draw.rounded_rectangle((90, 470, WIDTH - 90, 700), radius=42, fill=(20, 26, 52, 228), outline=(255, 255, 255, 18), width=2)
        draw_centered(draw, formula, FONT_TITLE, 548, ACCENT)
        draw_centered(draw, tagline_en, FONT_SMALL, 642, MUTED)

        chips_y = 830
        for idx, label in enumerate(step_labels):
            chip_x = 110 + idx * 290
            draw.rounded_rectangle((chip_x, chips_y, chip_x + 250, chips_y + 74), radius=26, fill=(255, 255, 255, 16))
            draw_centered(draw, label, FONT_TINY, chips_y + 22, TEXT)

        draw_centered(draw, "Jordan-first notation • Worked example • Practice", FONT_SMALL, 1010, (223, 226, 234))
        return base

    return renderer


def lesson_videos():
    catalog_path = ROOT / "tools" / "lesson_hero_catalog.json"
    if not catalog_path.exists():
        raise SystemExit(f"Missing catalog: {catalog_path}")

    import json

    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    for index, lesson in enumerate(catalog):
        lesson_id = lesson["id"]
        filename = f"{lesson_id}-hero.mp4"
        target = LESSONS_DIR / filename
        if target.exists() and target.stat().st_size > 0:
            continue

        title_en = lesson["titleEn"]
        title_ar = lesson["titleAr"]
        formula = lesson.get("formula") or title_en
        tagline = lesson.get("taglineEn") or "Jordan Grade 12 • Worked example • Practice"
        chips = lesson.get("chips") or ["Idea", "Example", "Practice"]
        shift = (index % 10) * 0.07

        write_video(
            target,
            duration_sec=9.0,
            render_frame=render_lesson_video(title_en, title_ar, formula, tagline, chips, shift),
        )


def main():
    founder_portrait()
    write_video(FOUNDER_DIR / "founder-intro.mp4", duration_sec=7.5, render_frame=render_founder_intro)
    write_video(FOUNDER_DIR / "founder-welcome.mp4", duration_sec=8.5, render_frame=render_founder_welcome)
    lesson_videos()
    print("Generated founder and lesson media assets.")


if __name__ == "__main__":
    main()
