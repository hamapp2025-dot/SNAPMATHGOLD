from __future__ import annotations

from contextlib import ExitStack
from pathlib import Path

from manim import BOLD, MathTex, RoundedRectangle, Text, VGroup, config, register_font

SNAP_BG = '#0B0D22'
SNAP_SURFACE = '#171B39'
SNAP_SURFACE_SOFT = '#232A50'
SNAP_BLUE = '#0A7AFF'
SNAP_BLUE_SOFT = '#2590FF'
SNAP_GOLD = '#D9B44A'
SNAP_TEXT = '#F7F9FF'
SNAP_MUTED = '#AEB8DC'
SNAP_SUCCESS = '#38D26F'
SNAP_DANGER = '#FF6B6B'

ROOT = Path(__file__).resolve().parents[2]
ARABIC_BODY_FONT = 'Amiri'
ARABIC_DISPLAY_FONT = 'Cairo'
LATIN_FONT = 'Avenir Next'

AMIRI_FONT_FILES = [
  ROOT / 'node_modules' / '@expo-google-fonts' / 'amiri' / 'Amiri_400Regular.ttf',
  ROOT / 'node_modules' / '@expo-google-fonts' / 'amiri' / 'Amiri_700Bold.ttf',
]

CAIRO_FONT_FILES = [
  ROOT / 'node_modules' / '@expo-google-fonts' / 'cairo' / 'Cairo_400Regular.ttf',
  ROOT / 'node_modules' / '@expo-google-fonts' / 'cairo' / 'Cairo_700Bold.ttf',
]


def make_registered_text(
  text: str,
  *,
  font: str,
  font_files: list[Path],
  font_size: int = 28,
  color: str = SNAP_TEXT,
  weight=BOLD,
) -> Text:
  with ExitStack() as stack:
    for font_file in font_files:
      if font_file.exists():
        stack.enter_context(register_font(str(font_file)))
    return Text(text, font=font, font_size=font_size, color=color, weight=weight)


def make_ar_text(
  text: str,
  *,
  font_size: int = 28,
  color: str = SNAP_TEXT,
  weight=BOLD,
) -> Text:
  return make_registered_text(
    text,
    font=ARABIC_BODY_FONT,
    font_files=AMIRI_FONT_FILES,
    font_size=font_size,
    color=color,
    weight=weight,
  )


def make_ar_title_text(
  text: str,
  *,
  font_size: int = 28,
  color: str = SNAP_TEXT,
  weight=BOLD,
) -> Text:
  return make_registered_text(
    text,
    font=ARABIC_DISPLAY_FONT,
    font_files=CAIRO_FONT_FILES,
    font_size=font_size,
    color=color,
    weight=weight,
  )


def make_en_text(
  text: str,
  *,
  font_size: int = 28,
  color: str = SNAP_TEXT,
  weight=BOLD,
) -> Text:
  return Text(text, font=LATIN_FONT, font_size=font_size, color=color, weight=weight)


def make_math(tex: str, *, font_size: int = 40, color: str = SNAP_TEXT) -> MathTex:
  return MathTex(tex, font_size=font_size, color=color)


def make_stage_shell(
  *,
  width: float | None = None,
  height: float | None = None,
  fill_color: str = SNAP_SURFACE,
  stroke_color: str = SNAP_BLUE,
) -> RoundedRectangle:
  width = width if width is not None else config.frame_width - 0.45
  height = height if height is not None else config.frame_height - 1.2
  return RoundedRectangle(
    corner_radius=0.35,
    width=width,
    height=height,
    fill_color=fill_color,
    fill_opacity=1,
    stroke_color=stroke_color,
    stroke_opacity=0.35,
    stroke_width=2,
  )


def make_label_chip(
  label: str,
  *,
  is_ar: bool = False,
  chip_color: str = SNAP_BLUE,
  text_color: str = SNAP_TEXT,
  font_size: int = 18,
) -> VGroup:
  label_mob = (
    make_ar_text(label, font_size=font_size, color=text_color)
    if is_ar
    else make_en_text(label, font_size=font_size, color=text_color)
  )
  bg = RoundedRectangle(
    corner_radius=0.18,
    width=label_mob.width + 0.4,
    height=label_mob.height + 0.24,
    fill_color=chip_color,
    fill_opacity=0.16,
    stroke_color=chip_color,
    stroke_width=1.3,
  )
  label_mob.move_to(bg.get_center())
  return VGroup(bg, label_mob)
