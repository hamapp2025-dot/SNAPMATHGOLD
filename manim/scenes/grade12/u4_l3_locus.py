from __future__ import annotations

import numpy as np
from manim import (
  DOWN,
  RIGHT,
  UP,
  Arrow,
  Axes,
  Circle,
  Create,
  Dot,
  FadeIn,
  Flash,
  MathTex,
  VGroup,
  Write,
)

from snapmath_manim.threeblue import C_AXIS, C_COS, C_GREEN, C_SIN, C_TAN, Base3B1BScene, ar


class LocusScene(Base3B1BScene):
  lesson_id = 'u4-l3'

  def construct(self):
    self.s_idea()
    self.s_circle()
    self.s_ray()
    self.s_recap()
    self.flush()

  def s_idea(self):
    self.section_label('المحل الهندسي')
    e = MathTex(r'|z - z_{0}| = r', font_size=52).move_to(UP * 1.0)
    note = ar('كل النقاط التي تبعد r عن z₀ تكوّن دائرة.', size=24, color='#AEB8DC')
    self.fit(note, 4.3).next_to(e, DOWN, buff=0.8)
    self.cap('المحل الهندسي هو مجموعة نقاط تحقق شرطاً.')
    self.play(Write(e), run_time=1.1)
    self.play(FadeIn(note, shift=UP * 0.08))
    self.cap('البُعد الثابت عن نقطة يعني دائرة.')
    self._i = VGroup(e, note)

  def s_circle(self):
    self.clear_body(self._i)
    self.section_label('مثال: دائرة')
    axes = Axes(
      x_range=[-2, 6, 1], y_range=[-2, 5, 1],
      x_length=4.0, y_length=3.6,
      axis_config={'stroke_color': C_AXIS, 'stroke_width': 2, 'include_ticks': True, 'tip_length': 0.14},
    ).move_to(UP * 0.6)
    cx, cy, r = 2, 1, 3
    center = Dot(axes.c2p(cx, cy), color=C_TAN, radius=0.09)
    clabel = MathTex(r'(2,1)', font_size=26, color=C_TAN).next_to(center, DOWN, buff=0.12)
    unit = np.linalg.norm(axes.c2p(1, 0) - axes.c2p(0, 0))
    circ = Circle(radius=r * unit, color=C_GREEN, stroke_width=5).move_to(axes.c2p(cx, cy))
    eq = MathTex(r'|z-(2+i)|=3', font_size=36).to_edge(DOWN, buff=1.5)
    self.cap('خذ الشرط: بُعد z عن ٢ زائد i يساوي ٣.')
    self.play(Create(axes), run_time=0.9)
    self.play(FadeIn(center), Write(clabel))
    self.play(Create(circ), run_time=1.5)
    self.play(Write(eq))
    self.cap('فينتج دائرة مركزها (٢، ١) ونصف قطرها ٣.')
    self._c = VGroup(axes, center, clabel, circ, eq)

  def s_ray(self):
    self.clear_body(self._c)
    self.section_label('حالة الزاوية')
    e = MathTex(r'\arg(z - z_{1}) = \theta', font_size=46).move_to(UP * 1.2)
    from manim import Line
    origin = DOWN * 0.6
    ray = Arrow(origin, origin + np.array([1.8, 1.2, 0]) * 1.3, color=C_SIN, stroke_width=5, buff=0)
    d = Dot(origin, color=C_TAN, radius=0.08)
    note = ar('زاوية ثابتة تعني شعاعاً من نقطة.', size=24, color='#AEB8DC')
    self.fit(note, 4.3).to_edge(DOWN, buff=1.3)
    self.cap('أما ثبات الزاوية فيعطي شعاعاً.')
    self.play(Write(e), run_time=1.1)
    self.play(FadeIn(d), Create(ray))
    self.play(FadeIn(note, shift=UP * 0.08))
    self.cap('شعاع يبدأ من z₁ باتجاه الزاوية θ.')
    self._r = VGroup(e, ray, d, note)

  def s_recap(self):
    self.clear_body(self._r)
    self.section_label('الخلاصة')
    r1 = MathTex(r'|z-z_{0}|=r\ \rightarrow\ \mathrm{circle}', font_size=34)
    r2 = MathTex(r'\arg(z-z_{1})=\theta\ \rightarrow\ \mathrm{ray}', font_size=34)
    stack = VGroup(self.fit(r1, 4.3), self.fit(r2, 4.3)).arrange(DOWN, buff=0.9).move_to(UP * 0.2)
    self.cap('البُعد الثابت دائرة، والزاوية الثابتة شعاع.')
    self.play(Write(r1), run_time=1.1)
    self.play(Write(r2), run_time=1.1)
    self.wait(1.6)
