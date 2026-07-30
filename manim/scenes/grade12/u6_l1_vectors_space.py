from __future__ import annotations

import numpy as np
from manim import (
  DOWN,
  RIGHT,
  UP,
  Arrow,
  Axes,
  Create,
  FadeIn,
  Flash,
  MathTex,
  VGroup,
  Write,
)

from snapmath_manim.threeblue import C_AXIS, C_COS, C_GREEN, C_SIN, C_TAN, Base3B1BScene, ar


class VectorsSpaceScene(Base3B1BScene):
  lesson_id = 'u6-l1'

  def construct(self):
    self.s_magnitude()
    self.s_example()
    self.s_unit()
    self.s_recap()
    self.flush()

  def s_magnitude(self):
    self.section_label('المتجهات في الفراغ')
    m = MathTex(r'|\vec{v}| = \sqrt{x^{2}+y^{2}+z^{2}}', font_size=44).move_to(UP * 1.0)
    note = ar('طول المتجه يُحسب من مركباته الثلاث.', size=24, color='#AEB8DC')
    self.fit(note, 4.3).next_to(m, DOWN, buff=0.8)
    self.cap('في الفراغ للمتجه ثلاث مركبات.')
    self.play(Write(m), run_time=1.3)
    self.play(FadeIn(note, shift=UP * 0.08))
    self.cap('وطوله جذر مجموع مربعاتها.')
    self._m = VGroup(m, note)

  def s_example(self):
    self.clear_body(self._m)
    self.section_label('مثال محلول')
    axes = Axes(
      x_range=[0, 4, 1], y_range=[0, 5, 1],
      x_length=3.2, y_length=3.4,
      axis_config={'stroke_color': C_AXIS, 'stroke_width': 2, 'include_ticks': True, 'tip_length': 0.14},
    ).move_to(UP * 0.9 + RIGHT * 0.3)
    vec = Arrow(axes.c2p(0, 0), axes.c2p(3, 4), color=C_GREEN, stroke_width=6, buff=0)
    vlabel = MathTex(r'(3,4,0)', font_size=28, color=C_GREEN).next_to(axes.c2p(3, 4), UP, buff=0.1)
    e1 = MathTex(r'|\vec{v}| = \sqrt{9+16}', font_size=40).to_edge(DOWN, buff=2.0)
    e2 = MathTex(r'= 5', font_size=52, color=C_GREEN).next_to(e1, DOWN, buff=0.5)
    self.cap('خذ المتجه ٣، ٤، ٠.')
    self.play(Create(axes), run_time=0.8)
    self.play(Create(vec), Write(vlabel))
    self.play(Write(e1), run_time=1.0)
    self.play(Write(e2), run_time=0.8)
    self.play(Flash(e2, color=C_GREEN, line_length=0.16, num_lines=14, flash_radius=1.2))
    self.cap('فطوله جذر خمسة وعشرين، أي خمسة.')
    self._e = VGroup(axes, vec, vlabel, e1, e2)

  def s_unit(self):
    self.clear_body(self._e)
    self.section_label('متجه الوحدة')
    u = MathTex(r'\hat{v} = \dfrac{\vec{v}}{|\vec{v}|}', font_size=48).move_to(UP * 0.9)
    note = ar('متجه الوحدة له نفس الاتجاه وطوله واحد.', size=23, color='#AEB8DC')
    self.fit(note, 4.3).next_to(u, DOWN, buff=0.8)
    self.cap('لتوحيد المتجه نقسمه على طوله.')
    self.play(Write(u), run_time=1.1)
    self.play(FadeIn(note, shift=UP * 0.08))
    self.cap('فنحصل على الاتجاه فقط بطول واحد.')
    self._u = VGroup(u, note)

  def s_recap(self):
    self.clear_body(self._u)
    self.section_label('الخلاصة')
    r1 = MathTex(r'|\vec{v}| = \sqrt{x^{2}+y^{2}+z^{2}}', font_size=40)
    r2 = MathTex(r'\hat{v} = \vec{v}/|\vec{v}|', font_size=40, color=C_GREEN)
    stack = VGroup(self.fit(r1, 4.3), self.fit(r2, 4.2)).arrange(DOWN, buff=0.9).move_to(UP * 0.2)
    self.cap('الطول جذر مجموع المربعات، والوحدة قسمة عليه.')
    self.play(Write(r1), run_time=1.1)
    self.play(Write(r2), run_time=1.1)
    self.wait(1.6)
