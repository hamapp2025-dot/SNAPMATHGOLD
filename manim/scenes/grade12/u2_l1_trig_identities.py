from __future__ import annotations

import json
import os

import numpy as np
from manim import (
  BOLD,
  DEGREES,
  DOWN,
  LEFT,
  ORIGIN,
  RIGHT,
  UP,
  WHITE,
  Angle,
  Circle,
  Create,
  Dot,
  FadeIn,
  FadeOut,
  Line,
  MathTex,
  Scene,
  Text,
  Transform,
  TransformFromCopy,
  TransformMatchingTex,
  ValueTracker,
  VGroup,
  Write,
  always_redraw,
  config,
)

# ---- 3Blue1Brown-style palette ----
BG = '#000000'
C_SIN = '#F2D33C'   # sine  → yellow
C_COS = '#3B8CFF'   # cosine → blue
C_ONE = '#FFFFFF'   # radius / unit → white
C_GREEN = '#83C167'  # angle / result accent
C_TAN = '#FF784F'   # tangent family → orange
C_MUT = '#AEB8DC'   # muted caption
C_GRID = '#1d2740'


def ar(text: str, *, size: int = 26, color: str = WHITE, weight=BOLD) -> Text:
  return Text(text, font='Cairo', font_size=size, color=color, weight=weight)


class TrigIdentitiesIntroScene(Scene):
  lesson_id = 'u2-l1'

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

  # ---- helpers -----------------------------------------------------------
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
      json.dump({'lesson_id': self.lesson_id, 'fps': config.frame_rate, 'beats': self._beats}, fh, ensure_ascii=False, indent=2)

  # ---- unit-circle builder (reused) -------------------------------------
  def build_circle(self, center, r, theta):
    def tip():
      a = theta.get_value()
      return center + r * np.array([np.cos(a), np.sin(a), 0.0])

    def foot():
      a = theta.get_value()
      return center + r * np.cos(a) * RIGHT

    x_axis = Line(center + LEFT * 2.35, center + RIGHT * 2.35, color='#48557f', stroke_width=2)
    y_axis = Line(center + DOWN * 2.35, center + UP * 2.35, color='#48557f', stroke_width=2)
    circle = Circle(radius=r, color=C_COS, stroke_width=5).move_to(center)
    radius_line = always_redraw(lambda: Line(center, tip(), color=C_ONE, stroke_width=5))
    cos_line = always_redraw(lambda: Line(center, foot(), color=C_COS, stroke_width=7))
    sin_line = always_redraw(lambda: Line(foot(), tip(), color=C_SIN, stroke_width=7))
    dot = always_redraw(lambda: Dot(tip(), color=C_ONE, radius=0.07))
    angle = always_redraw(
      lambda: Angle(Line(center, center + RIGHT), Line(center, tip()), radius=0.5, color=C_GREEN, stroke_width=4)
    )
    return dict(
      tip=tip, foot=foot, x_axis=x_axis, y_axis=y_axis, circle=circle,
      radius_line=radius_line, cos_line=cos_line, sin_line=sin_line, dot=dot, angle=angle,
    )

  # ========================================================================
  def construct(self):
    self.section_one()
    self.section_two()
    self.section_three()
    self.section_four()
    self.section_five()
    self.flush()

  # ---- S1: identity from the unit circle --------------------------------
  def section_one(self):
    self.section_label('دائرة الوحدة')
    center = UP * 0.9
    r = 1.7
    theta = ValueTracker(52 * DEGREES)
    C = self.build_circle(center, r, theta)

    cos_lbl = always_redraw(lambda: MathTex(r'\cos\theta', color=C_COS, font_size=32).next_to(Line(center, C['foot']()), DOWN, buff=0.16))
    sin_lbl = always_redraw(lambda: MathTex(r'\sin\theta', color=C_SIN, font_size=32).next_to(Line(C['foot'](), C['tip']()), RIGHT, buff=0.14))
    one_lbl = MathTex(r'1', color=C_ONE, font_size=32)
    one_lbl.add_updater(lambda m: m.move_to((center + C['tip']()) / 2 + 0.26 * np.array([-np.sin(theta.get_value()), np.cos(theta.get_value()), 0])))

    self.play(Create(C['x_axis']), Create(C['y_axis']), run_time=0.6)
    self.play(Create(C['circle']), run_time=1.0)
    self.cap('دائرة نصف قطرها واحد.')
    self.add(C['angle'])
    self.play(Create(C['radius_line']), FadeIn(C['dot']), Write(one_lbl))
    self.play(Create(C['cos_line']), Create(C['sin_line']), FadeIn(cos_lbl), FadeIn(sin_lbl))
    self.cap('الإحداثي الأفقي جيب التمام، والرأسي الجيب.')
    self.play(theta.animate.set_value(74 * DEGREES), run_time=1.2)
    self.play(theta.animate.set_value(36 * DEGREES), run_time=1.3)
    self.play(theta.animate.set_value(52 * DEGREES), run_time=1.0)

    identity = MathTex(r'\sin^2\theta', r'+', r'\cos^2\theta', r'=', r'1', font_size=54)
    identity[0].set_color(C_SIN)
    identity[2].set_color(C_COS)
    identity[4].set_color(C_ONE)
    self.fit(identity, 3.9).move_to(DOWN * 2.75)
    self.cap('وبفيثاغورس نحصل على المتطابقة الأساسية.')
    self.play(
      TransformFromCopy(sin_lbl, identity[0]),
      TransformFromCopy(cos_lbl, identity[2]),
      TransformFromCopy(one_lbl, identity[4]),
      FadeIn(identity[1]), FadeIn(identity[3]),
      run_time=1.6,
    )
    self.play(identity.animate.scale(1.12), run_time=0.4)
    self.play(identity.animate.scale(1 / 1.12), run_time=0.35)
    self.wait(0.4)

    self._s1 = VGroup(
      C['x_axis'], C['y_axis'], C['circle'], C['radius_line'], C['cos_line'], C['sin_line'],
      C['dot'], C['angle'], cos_lbl, sin_lbl, one_lbl,
    )
    self._identity1 = identity

  # ---- S2: derived identities by division -------------------------------
  def section_two(self):
    self.clear_body(self._s1)
    self.section_label('الاشتقاق بالقسمة')
    base = self._identity1
    self.play(base.animate.scale_to_fit_width(3.6).move_to(UP * 2.0))

    op1 = ar('اقسم على جتا²θ', size=22, color=C_MUT).next_to(base, DOWN, buff=0.5)
    d1 = MathTex(r'\tan^2\theta', r'+', r'1', r'=', r'\sec^2\theta', font_size=46)
    d1[0].set_color(C_TAN)
    d1[4].set_color(C_TAN)
    self.fit(d1, 3.9).next_to(op1, DOWN, buff=0.4)

    op2 = ar('واقسم على جا²θ', size=22, color=C_MUT).next_to(d1, DOWN, buff=0.6)
    d2 = MathTex(r'1', r'+', r'\cot^2\theta', r'=', r'\csc^2\theta', font_size=46)
    d2[2].set_color(C_GREEN)
    d2[4].set_color(C_GREEN)
    self.fit(d2, 3.9).next_to(op2, DOWN, buff=0.4)

    self.cap('اقسم طرفي المتطابقة على جيب التمام تربيع.')
    self.play(FadeIn(op1, shift=DOWN * 0.05))
    self.play(TransformMatchingTex(base.copy(), d1), run_time=1.3)
    self.cap('فينتج: ظا² زائد واحد يساوي قا².')
    self.play(FadeIn(op2, shift=DOWN * 0.05))
    self.play(TransformMatchingTex(base.copy(), d2), run_time=1.3)
    self.cap('وبالقسمة على الجيب تربيع نحصل على المتطابقة الثالثة.')
    self.wait(0.3)
    self._s2 = VGroup(base, op1, d1, op2, d2)

  # ---- S3: double angle --------------------------------------------------
  def section_three(self):
    self.clear_body(self._s2)
    self.section_label('ضعف الزاوية')
    center = UP * 1.15
    r = 1.35
    theta = ValueTracker(30 * DEGREES)
    C = self.build_circle(center, r, theta)
    self.play(Create(C['x_axis']), Create(C['y_axis']), Create(C['circle']), run_time=0.9)
    self.add(C['angle'])
    self.play(Create(C['radius_line']), FadeIn(C['dot']))
    self.cap('ضاعف الزاوية على الدائرة.')
    self.play(theta.animate.set_value(60 * DEGREES), run_time=1.6)

    da_sin = MathTex(r'\sin 2\theta = 2\,', r'\sin\theta', r'\,', r'\cos\theta', font_size=40)
    da_sin[1].set_color(C_SIN)
    da_sin[3].set_color(C_COS)
    self.fit(da_sin, 4.0).move_to(DOWN * 1.15)
    da_cos = MathTex(r'\cos 2\theta = ', r'\cos^2\theta', r'-', r'\sin^2\theta', font_size=38)
    da_cos[1].set_color(C_COS)
    da_cos[3].set_color(C_SIN)
    self.fit(da_cos, 4.0).next_to(da_sin, DOWN, buff=0.4)

    self.cap('جيب الضعف يساوي اثنين جيب في جيب تمام.')
    self.play(Write(da_sin), run_time=1.1)
    self.play(Write(da_cos), run_time=1.1)
    self.cap('وجيب تمام الضعف بفرق المربعين.')
    self.wait(0.3)
    self._s3 = VGroup(
      C['x_axis'], C['y_axis'], C['circle'], C['radius_line'], C['cos_line'], C['sin_line'],
      C['dot'], C['angle'], da_sin, da_cos,
    )

  # ---- S4: worked example (3-4-5) ---------------------------------------
  def section_four(self):
    self.clear_body(self._s3)
    self.section_label('مثال محلول')
    center = UP * 1.0
    r = 1.55
    ang = np.arcsin(3 / 5)
    theta = ValueTracker(ang)
    C = self.build_circle(center, r, theta)

    sin_val = MathTex(r'\tfrac{3}{5}', color=C_SIN, font_size=30).next_to(Line(C['foot'](), C['tip']()), RIGHT, buff=0.14)
    cos_val = MathTex(r'\tfrac{4}{5}', color=C_COS, font_size=30).next_to(Line(center, C['foot']()), DOWN, buff=0.16)

    self.play(Create(C['x_axis']), Create(C['y_axis']), Create(C['circle']), run_time=0.9)
    self.add(C['angle'])
    self.play(Create(C['radius_line']), Create(C['cos_line']), Create(C['sin_line']), FadeIn(C['dot']))
    self.cap('مُعطى: جا θ = ٣/٥، والزاوية في الربع الأول.')
    self.play(FadeIn(sin_val))

    steps = MathTex(r'\cos\theta = \tfrac{4}{5}', font_size=40, color=C_COS).move_to(DOWN * 1.4)
    step2 = MathTex(r'\tan\theta = \tfrac{3}{4}', font_size=36, color=C_TAN).next_to(steps, DOWN, buff=0.35)
    step3 = MathTex(r'\sin 2\theta = 2\cdot\tfrac{3}{5}\cdot\tfrac{4}{5} = \tfrac{24}{25}', font_size=32, color=C_GREEN)
    self.fit(step3, 4.0).next_to(step2, DOWN, buff=0.35)

    self.cap('من المتطابقة الأساسية: جيب التمام يساوي ٤/٥.')
    self.play(Write(steps), FadeIn(cos_val))
    self.play(Write(step2))
    self.cap('ومنها الظل وجيب الضعف مباشرة.')
    self.play(Write(step3))
    self.play(step3.animate.scale(1.1), run_time=0.35)
    self.play(step3.animate.scale(1 / 1.1), run_time=0.3)
    self.wait(0.4)
    self._s4 = VGroup(
      C['x_axis'], C['y_axis'], C['circle'], C['radius_line'], C['cos_line'], C['sin_line'],
      C['dot'], C['angle'], sin_val, cos_val, steps, step2, step3,
    )

  # ---- S5: recap toolkit -------------------------------------------------
  def section_five(self):
    self.clear_body(self._s4)
    self.section_label('الخلاصة')
    r1 = MathTex(r'\sin^2\theta', r'+', r'\cos^2\theta', r'=', r'1', font_size=42)
    r1[0].set_color(C_SIN)
    r1[2].set_color(C_COS)
    r2 = MathTex(r'\tan^2\theta + 1 = \sec^2\theta', font_size=38, color=C_TAN)
    r3 = MathTex(r'\sin 2\theta = 2\sin\theta\cos\theta', font_size=38)
    stack = VGroup(self.fit(r1, 4.0), self.fit(r2, 4.0), self.fit(r3, 4.0)).arrange(DOWN, buff=0.6).move_to(UP * 0.2)

    self.cap('هذه هي أدواتك الأساسية للوحدة.')
    self.play(Write(r1), run_time=1.0)
    self.play(Write(r2), run_time=1.0)
    self.play(Write(r3), run_time=1.0)
    self.cap('أتقنها، وبقية الوحدة تصبح تعويضاً بسيطاً.', hold=2.4)
    self.play(stack.animate.scale(1.06), run_time=0.4)
    self.play(stack.animate.scale(1 / 1.06), run_time=0.35)
    self.wait(0.8)
