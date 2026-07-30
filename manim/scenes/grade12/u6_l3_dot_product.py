from __future__ import annotations

import numpy as np
from manim import (
  DOWN,
  RIGHT,
  UP,
  Arrow,
  Create,
  FadeIn,
  Flash,
  MathTex,
  RightAngle,
  Line,
  VGroup,
  Write,
)

from snapmath_manim.threeblue import C_COS, C_GREEN, C_SIN, C_TAN, Base3B1BScene, ar


class DotProductScene(Base3B1BScene):
  lesson_id = 'u6-l3'

  def construct(self):
    self.s_formula()
    self.s_angle()
    self.s_example()
    self.s_recap()
    self.flush()

  def s_formula(self):
    self.section_label('الضرب القياسي')
    f = MathTex(r'\vec{a}\cdot\vec{b} = a_{1}b_{1}+a_{2}b_{2}+a_{3}b_{3}', font_size=38)
    self.fit(f, 4.3).move_to(UP * 0.9)
    note = ar('اضرب المركبات المتناظرة ثم اجمع.', size=24, color='#AEB8DC')
    self.fit(note, 4.3).next_to(f, DOWN, buff=0.8)
    self.cap('الضرب القياسي يعطي عدداً لا متجهاً.')
    self.play(Write(f), run_time=1.3)
    self.play(FadeIn(note, shift=UP * 0.08))
    self.cap('اضرب المتناظرات واجمع النواتج.')
    self._f = VGroup(f, note)

  def s_angle(self):
    self.clear_body(self._f)
    self.section_label('الزاوية بين متجهين')
    a = MathTex(r'\cos\theta = \dfrac{\vec{a}\cdot\vec{b}}{|\vec{a}|\,|\vec{b}|}', font_size=44)
    self.fit(a, 4.2).move_to(UP * 0.7)
    note = ar('الضرب القياسي يكشف الزاوية بين المتجهين.', size=23, color='#AEB8DC')
    self.fit(note, 4.3).next_to(a, DOWN, buff=0.8)
    self.cap('ومنه نستخرج الزاوية بين المتجهين.')
    self.play(Write(a), run_time=1.3)
    self.play(FadeIn(note, shift=UP * 0.08))
    self.cap('إذا كان الناتج صفراً فالمتجهان متعامدان.')
    self._a = VGroup(a, note)

  def s_example(self):
    self.clear_body(self._a)
    self.section_label('مثال محلول')
    origin = UP * 0.6
    va = Arrow(origin, origin + RIGHT * 1.8, color=C_SIN, stroke_width=6, buff=0)
    vb = Arrow(origin, origin + UP * 1.8, color=C_COS, stroke_width=6, buff=0)
    la = MathTex(r'(1,0,0)', font_size=26, color=C_SIN).next_to(va.get_end(), DOWN, buff=0.15)
    lb = MathTex(r'(0,1,0)', font_size=26, color=C_COS).next_to(vb.get_end(), RIGHT, buff=0.15)
    ra = RightAngle(Line(origin, origin + RIGHT), Line(origin, origin + UP), length=0.3, color=C_GREEN)
    e1 = MathTex(r'\vec{a}\cdot\vec{b} = 0', font_size=42).to_edge(DOWN, buff=2.0)
    e2 = MathTex(r'\theta = 90^\circ', font_size=50, color=C_GREEN).next_to(e1, DOWN, buff=0.5)
    self.cap('خذ متجهين على المحورين.')
    self.play(Create(va), Create(vb), Write(la), Write(lb))
    self.play(Write(e1), run_time=1.0)
    self.play(Create(ra), Write(e2), run_time=1.0)
    self.play(Flash(e2, color=C_GREEN, line_length=0.14, num_lines=12, flash_radius=1.2))
    self.cap('حاصل ضربهما صفر، فالزاوية بينهما قائمة.')
    self._e = VGroup(va, vb, la, lb, ra, e1, e2)

  def s_recap(self):
    self.clear_body(self._e)
    self.section_label('الخلاصة')
    r1 = MathTex(r'\vec{a}\cdot\vec{b} = \textstyle\sum a_i b_i', font_size=40)
    r2 = MathTex(r'\vec{a}\cdot\vec{b}=0 \iff \vec{a}\perp\vec{b}', font_size=38, color=C_GREEN)
    stack = VGroup(self.fit(r1, 4.2), self.fit(r2, 4.3)).arrange(DOWN, buff=0.9).move_to(UP * 0.2)
    self.cap('الضرب القياسي عدد، وصفره يعني تعامداً.')
    self.play(Write(r1), run_time=1.1)
    self.play(Write(r2), run_time=1.2)
    self.wait(1.6)
