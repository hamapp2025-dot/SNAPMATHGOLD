"""Shared 3Blue1Brown-style base for SnapMath lesson scenes.

Every lesson subclasses Base3B1BScene and gets: pure-black canvas, section
labels, a bottom Arabic caption track (with voice-sync timing emission),
clean fade transitions, and a reusable unit-circle / axes builder.
"""
from __future__ import annotations

import json
import os

import numpy as np
from manim import (
  BOLD,
  DOWN,
  LEFT,
  RIGHT,
  UP,
  WHITE,
  Angle,
  Circle,
  Dot,
  FadeIn,
  FadeOut,
  Line,
  Scene,
  Text,
  ValueTracker,
  always_redraw,
  config,
)

# ---- palette (3b1b) ----
BG = '#000000'
C_SIN = '#F2D33C'    # yellow  — sine / first object
C_COS = '#3B8CFF'    # blue    — cosine / second object
C_ONE = '#FFFFFF'    # white   — unit / neutral
C_GREEN = '#83C167'  # green   — results / success
C_TAN = '#FF784F'    # orange  — tangent family / remainder
C_PURPLE = '#B58DF1'  # purple — extra accent
C_MUT = '#AEB8DC'    # muted caption / labels
C_AXIS = '#48557f'
C_GRID = '#1d2740'


def ar(text: str, *, size: int = 26, color: str = WHITE, weight=BOLD) -> Text:
  return Text(text, font='Cairo', font_size=size, color=color, weight=weight)


class Base3B1BScene(Scene):
  lesson_id = 'lesson'

  def setup(self):
    self.camera.background_color = BG
    self._cap = None
    self._label = None
    self._beat = -1
    self._beats = []
    self._durs = None
    p = os.environ.get('SNAP_BEAT_DURS')
    if p and os.path.exists(p):
      with open(p, encoding='utf-8') as fh:
        self._durs = json.load(fh)

  # ---- layout helpers ----
  def fit(self, mob, w):
    if mob.width > w:
      mob.scale_to_fit_width(w)
    return mob

  def section_label(self, text_ar):
    lbl = self.fit(ar(text_ar, size=30, color=C_MUT), 4.0).to_edge(UP, buff=0.5)
    if self._label is None:
      self.play(FadeIn(lbl, shift=DOWN * 0.1), run_time=0.5)
    else:
      self.play(FadeOut(self._label, shift=UP * 0.1), FadeIn(lbl, shift=DOWN * 0.1), run_time=0.5)
    self._label = lbl

  def _read(self, text):
    return max(2.0, min(5.0, len(text) / 9.0 + 1.2))

  def cap(self, text_ar, *, hold=None):
    self._beat += 1
    t = self.fit(ar(text_ar, size=25, color=C_MUT), 4.1).to_edge(DOWN, buff=0.45)
    if self._cap is None:
      self.play(FadeIn(t, shift=UP * 0.06), run_time=0.35)
    else:
      self.play(FadeOut(self._cap, shift=UP * 0.06), FadeIn(t, shift=UP * 0.06), run_time=0.4)
    self._cap = t
    start = float(getattr(self.renderer, 'time', 0.0) or 0.0)
    self._beats.append({'i': self._beat, 'ar': text_ar, 'en': '', 'start': round(start, 3)})
    if hold is not None:
      w = hold
    elif self._durs is not None and self._beat < len(self._durs):
      w = float(self._durs[self._beat]) + 0.35
    else:
      w = self._read(text_ar)
    self.wait(w)

  def clear_body(self, *groups):
    anims = []
    for g in groups:
      if g is None:
        continue
      g.clear_updaters()
      for sub in g.submobjects:
        sub.clear_updaters()
      anims.append(FadeOut(g))
    if anims:
      self.play(*anims, run_time=0.5)

  def flush(self):
    out = os.environ.get('SNAP_TIMINGS_OUT')
    if not out:
      return
    with open(out, 'w', encoding='utf-8') as fh:
      json.dump(
        {'lesson_id': self.lesson_id, 'fps': config.frame_rate, 'beats': self._beats},
        fh, ensure_ascii=False, indent=2,
      )

  # ---- reusable unit circle ----
  def build_circle(self, center, r, theta, *, projections=True):
    def tip():
      a = theta.get_value()
      return center + r * np.array([np.cos(a), np.sin(a), 0.0])

    def foot():
      a = theta.get_value()
      return center + r * np.cos(a) * RIGHT

    x_axis = Line(center + LEFT * (r + 0.65), center + RIGHT * (r + 0.65), color=C_AXIS, stroke_width=2)
    y_axis = Line(center + DOWN * (r + 0.65), center + UP * (r + 0.65), color=C_AXIS, stroke_width=2)
    circle = Circle(radius=r, color=C_COS, stroke_width=5).move_to(center)
    radius_line = always_redraw(lambda: Line(center, tip(), color=C_ONE, stroke_width=5))
    dot = always_redraw(lambda: Dot(tip(), color=C_ONE, radius=0.07))
    angle = always_redraw(
      lambda: Angle(Line(center, center + RIGHT), Line(center, tip()), radius=0.5, color=C_GREEN, stroke_width=4)
    )
    parts = dict(
      tip=tip, foot=foot, x_axis=x_axis, y_axis=y_axis, circle=circle,
      radius_line=radius_line, dot=dot, angle=angle,
    )
    if projections:
      parts['cos_line'] = always_redraw(lambda: Line(center, foot(), color=C_COS, stroke_width=7))
      parts['sin_line'] = always_redraw(lambda: Line(foot(), tip(), color=C_SIN, stroke_width=7))
    return parts
