from __future__ import annotations

import numpy as np
from manim import (
  DOWN,
  RIGHT,
  UP,
  Axes,
  Create,
  Dot,
  FadeIn,
  Flash,
  Line,
  MathTex,
  ValueTracker,
  VGroup,
  Write,
  always_redraw,
)

from snapmath_manim.threeblue import C_COS, C_GREEN, C_SIN, C_TAN, Base3B1BScene, ar


class SpecialDerivativesScene(Base3B1BScene):
  lesson_id = 'u3-l1'

  def construct(self):
    self.s_table()
    self.s_slope()
    self.s_example()
    self.s_recap()
    self.flush()

  def s_table(self):
    self.section_label('مشتقات الدوال الخاصة')
    rows = [
      (r"\dfrac{d}{dx}\sin x = \cos x", C_SIN),
      (r"\dfrac{d}{dx}\cos x = -\sin x", C_COS),
      (r"\dfrac{d}{dx}e^{x} = e^{x}", C_GREEN),
      (r"\dfrac{d}{dx}\ln x = \dfrac{1}{x}", C_TAN),
    ]
    mobs = [self.fit(MathTex(t, font_size=40, color=c), 4.2) for t, c in rows]
    stack = VGroup(*mobs).arrange(DOWN, buff=0.55).move_to(UP * 0.1)
    self.cap('أربع مشتقات أساسية يجب حفظها.')
    for m in mobs:
      self.play(Write(m), run_time=0.8)
    self.cap('لاحظ أن مشتقة e أُس x تساوي نفسها.')
    self._t = stack

  def s_slope(self):
    self.clear_body(self._t)
    self.section_label('ميل الجيب هو جيب التمام')
    axes = Axes(
      x_range=[0, 6.5, 1], y_range=[-1.5, 1.5, 1],
      x_length=4.3, y_length=2.6,
      axis_config={'stroke_color': '#48557f', 'stroke_width': 2, 'include_ticks': False, 'tip_length': 0.15},
    ).move_to(UP * 0.7)
    sin_c = axes.plot(np.sin, x_range=[0, 6.3], color=C_SIN, stroke_width=4)
    cos_c = axes.plot(np.cos, x_range=[0, 6.3], color=C_COS, stroke_width=4)
    slbl = MathTex(r'\sin x', color=C_SIN, font_size=28).next_to(axes, RIGHT, buff=0.05).shift(UP * 0.7)
    clbl = MathTex(r'\cos x', color=C_COS, font_size=28).next_to(axes, RIGHT, buff=0.05).shift(DOWN * 0.6)

    xt = ValueTracker(0.6)

    def tangent():
      x = xt.get_value()
      slope = np.cos(x)
      p = axes.c2p(x, np.sin(x))
      dx = 0.7
      a = axes.c2p(x - dx, np.sin(x) - slope * dx)
      b = axes.c2p(x + dx, np.sin(x) + slope * dx)
      return Line(a, b, color=C_GREEN, stroke_width=4)

    moving_dot = always_redraw(lambda: Dot(axes.c2p(xt.get_value(), np.sin(xt.get_value())), color=C_GREEN, radius=0.07))
    tan = always_redraw(tangent)

    self.cap('ارسم الجيب، وتتبّع ميله عند كل نقطة.')
    self.play(Create(axes), run_time=0.8)
    self.play(Create(sin_c), FadeIn(slbl), run_time=1.3)
    self.play(FadeIn(moving_dot), Create(tan))
    self.cap('الميل الأخضر يرتفع وينخفض تماماً مثل جيب التمام.')
    self.play(xt.animate.set_value(5.6), run_time=3.0)
    self.play(Create(cos_c), FadeIn(clbl), run_time=1.3)
    self.cap('لذلك مشتقة الجيب هي جيب التمام.')
    self._s = VGroup(axes, sin_c, cos_c, slbl, clbl, moving_dot, tan)

  def s_example(self):
    self.clear_body(self._s)
    self.section_label('مثال محلول')
    e0 = MathTex(r'f(x)=\sin x + e^{x}', font_size=44).move_to(UP * 1.1)
    e1 = MathTex(r"f'(x)=", r'\cos x', r'+', r'e^{x}', font_size=44)
    e1.set_color_by_tex(r'\cos x', C_SIN)
    e1.set_color_by_tex(r'e^{x}', C_GREEN)
    self.fit(e1, 4.2).next_to(e0, DOWN, buff=0.8)
    self.cap('اشتق كل حد على حدة.')
    self.play(Write(e0), run_time=1.0)
    self.play(Write(e1), run_time=1.2)
    self.play(Flash(e1, color=C_GREEN, line_length=0.14, num_lines=12, flash_radius=1.4))
    self.cap('مشتقة الجيب جيب تمام، ومشتقة e أُس x نفسها.')
    self._e = VGroup(e0, e1)

  def s_recap(self):
    self.clear_body(self._e)
    self.section_label('الخلاصة')
    r1 = MathTex(r'(\sin x)\!\to\!(\cos x)\!\to\!(-\sin x)', font_size=34)
    r2 = MathTex(r"(e^{x})' = e^{x}\qquad (\ln x)' = \tfrac1x", font_size=34)
    stack = VGroup(self.fit(r1, 4.3), self.fit(r2, 4.3)).arrange(DOWN, buff=0.8).move_to(UP * 0.2)
    self.cap('احفظ الدورة: جيب ← جيب تمام ← سالب جيب.')
    self.play(Write(r1), run_time=1.1)
    self.play(Write(r2), run_time=1.1)
    self.wait(1.6)
