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
  VGroup,
  Write,
)

from snapmath_manim.threeblue import C_AXIS, C_COS, C_GREEN, C_ONE, C_SIN, C_TAN, Base3B1BScene, ar


class ComplexNumbersScene(Base3B1BScene):
  lesson_id = 'u4-l1'

  def construct(self):
    self.s_idea()
    self.s_plot()
    self.s_modulus()
    self.s_recap()
    self.flush()

  def s_idea(self):
    self.section_label('الأعداد المركبة')
    z = MathTex(r'z = a + b\,i', font_size=54).move_to(UP * 1.1)
    z.set_color_by_tex('a', C_COS)
    i2 = MathTex(r'i^{2} = -1', font_size=46, color=C_TAN).next_to(z, DOWN, buff=0.8)
    self.cap('العدد المركب له جزء حقيقي وجزء تخيلي.')
    self.play(Write(z), run_time=1.2)
    self.play(Write(i2), run_time=0.9)
    self.cap('حيث i تربيع يساوي سالب واحد.')
    self._i = VGroup(z, i2)

  def s_plot(self):
    self.clear_body(self._i)
    self.section_label('مستوى أرجاند')
    axes = Axes(
      x_range=[-1, 4, 1], y_range=[-1, 5, 1],
      x_length=3.8, y_length=4.2,
      axis_config={'stroke_color': C_AXIS, 'stroke_width': 2, 'include_ticks': True, 'tip_length': 0.15},
    ).move_to(UP * 0.2)
    re = MathTex(r'\mathrm{Re}', font_size=24, color=C_AXIS).next_to(axes.x_axis, RIGHT, buff=0.1)
    im = MathTex(r'\mathrm{Im}', font_size=24, color=C_AXIS).next_to(axes.y_axis, UP, buff=0.1)
    P = axes.c2p(3, 4)
    vec = Line(axes.c2p(0, 0), P, color=C_GREEN, stroke_width=5)
    dot = Dot(P, color=C_GREEN, radius=0.09)
    lbl = MathTex(r'3+4i', font_size=34, color=C_GREEN).next_to(dot, UP, buff=0.15)
    self.cap('نمثّل العدد المركب كنقطة في المستوى.')
    self.play(Create(axes), FadeIn(re), FadeIn(im), run_time=1.0)
    self.play(Create(vec), FadeIn(dot), Write(lbl))
    self.cap('الأفقي حقيقي، والرأسي تخيلي.')
    self._axes = axes
    self._p = VGroup(axes, re, im, vec, dot, lbl)

  def s_modulus(self):
    self.section_label('المقياس')
    axes = self._axes
    legx = Line(axes.c2p(0, 0), axes.c2p(3, 0), color=C_COS, stroke_width=6)
    legy = Line(axes.c2p(3, 0), axes.c2p(3, 4), color=C_SIN, stroke_width=6)
    l3 = MathTex(r'3', font_size=30, color=C_COS).next_to(legx, DOWN, buff=0.1)
    l4 = MathTex(r'4', font_size=30, color=C_SIN).next_to(legy, RIGHT, buff=0.1)
    formula = MathTex(r'|z| = \sqrt{3^{2}+4^{2}} = 5', font_size=40, color=C_GREEN).to_edge(DOWN, buff=1.4)
    self.cap('طوله هو المقياس، من فيثاغورس.')
    self.play(Create(legx), Create(legy), FadeIn(l3), FadeIn(l4))
    self.play(Write(formula), run_time=1.2)
    self.play(Flash(formula, color=C_GREEN, line_length=0.14, num_lines=12, flash_radius=1.4))
    self.cap('فمقياس ٣ زائد ٤i يساوي خمسة.')
    self._m = VGroup(legx, legy, l3, l4, formula)

  def s_recap(self):
    self.clear_body(self._p, self._m)
    self.section_label('الخلاصة')
    r1 = MathTex(r'z = a + bi', font_size=44)
    r2 = MathTex(r'|z| = \sqrt{a^{2}+b^{2}}', font_size=44, color=C_GREEN)
    stack = VGroup(self.fit(r1, 4.2), self.fit(r2, 4.2)).arrange(DOWN, buff=0.9).move_to(UP * 0.2)
    self.cap('العدد المركب نقطة، ومقياسه بُعده عن الأصل.')
    self.play(Write(r1), run_time=1.0)
    self.play(Write(r2), run_time=1.1)
    self.wait(1.6)
