from __future__ import annotations

import numpy as np
from manim import (
  DOWN,
  LEFT,
  RIGHT,
  UP,
  Create,
  DashedLine,
  Dot,
  FadeIn,
  Flash,
  MathTex,
  VGroup,
  Write,
)

from snapmath_manim.threeblue import C_COS, C_GREEN, C_ONE, C_SIN, C_TAN, Base3B1BScene, ar


class SolvingTrigEquationsScene(Base3B1BScene):
  lesson_id = 'u2-l3'

  def construct(self):
    self.s_question()
    self.s_solutions()
    self.s_general()
    self.s_cos()
    self.s_recap()
    self.flush()

  def s_question(self):
    self.section_label('حل المعادلات المثلثية')
    center = DOWN * 0.1
    r = 1.7
    x_axis = self._axis(center, r, horiz=True)
    y_axis = self._axis(center, r, horiz=False)
    from manim import Circle
    circle = Circle(radius=r, color=C_COS, stroke_width=5).move_to(center)
    line = DashedLine(center + LEFT * 2.2 + UP * (0.5 * r), center + RIGHT * 2.2 + UP * (0.5 * r), color=C_SIN, stroke_width=4)
    lbl = MathTex(r'y=\tfrac12', font_size=30, color=C_SIN).next_to(line, RIGHT, buff=0.05)
    p1 = Dot(center + r * np.array([np.cos(np.pi / 6), np.sin(np.pi / 6), 0]), color=C_GREEN, radius=0.09)
    p2 = Dot(center + r * np.array([np.cos(5 * np.pi / 6), np.sin(5 * np.pi / 6), 0]), color=C_GREEN, radius=0.09)

    self.cap('نبحث عن الزوايا التي جيبها يساوي نصفاً.')
    self.play(Create(x_axis), Create(y_axis), Create(circle), run_time=1.0)
    self.play(Create(line), Write(lbl))
    self.cap('ارسم الخط الأفقي y = ½؛ حيث يقطع الدائرة توجد الحلول.')
    self.play(FadeIn(p1, scale=1.5), FadeIn(p2, scale=1.5))
    self.play(Flash(p1, color=C_GREEN, line_length=0.12, num_lines=10, flash_radius=0.5),
              Flash(p2, color=C_GREEN, line_length=0.12, num_lines=10, flash_radius=0.5))
    self._q = VGroup(x_axis, y_axis, circle, line, lbl, p1, p2)

  def s_solutions(self):
    self.section_label('الحلان في [0, 2π]')
    s = MathTex(r'\theta=\dfrac{\pi}{6}', r'\quad,\quad', r'\theta=\dfrac{5\pi}{6}', font_size=44)
    s.set_color_by_tex(r'\dfrac{\pi}{6}', C_GREEN)
    s.set_color_by_tex(r'\dfrac{5\pi}{6}', C_GREEN)
    self.fit(s, 4.2).to_edge(DOWN, buff=1.6)
    self.cap('نقطتان تعنيان زاويتين ضمن الدورة الواحدة.')
    self.play(Write(s), run_time=1.3)
    self.cap('π/6 في الربع الأول و 5π/6 في الربع الثاني.')
    self._s = s

  def s_general(self):
    self.clear_body(self._q, self._s)
    self.section_label('الحل العام')
    g = MathTex(r'\sin\theta=k\ \Rightarrow\ \theta=n\pi+(-1)^n\arcsin k', font_size=34)
    g.set_color_by_tex(r'n\pi', C_TAN)
    self.fit(g, 4.3).move_to(UP * 0.6)
    note = ar('لأن الدالة دورية، تتكرر الحلول كل 2π.', size=24, color='#AEB8DC')
    self.fit(note, 4.2).next_to(g, DOWN, buff=0.8)
    self.cap('وبسبب الدورية، هناك عدد لا نهائي من الحلول.')
    self.play(Write(g), run_time=1.4)
    self.play(FadeIn(note, shift=UP * 0.08))
    self.cap('n عدد صحيح يولّد كل الحلول.')
    self._g = VGroup(g, note)

  def s_cos(self):
    self.clear_body(self._g)
    self.section_label('حالة جيب التمام')
    c = MathTex(r'\cos\theta=k\ \Rightarrow\ \theta=2n\pi\pm\arccos k', font_size=36)
    c.set_color_by_tex(r'2n\pi', C_TAN)
    self.fit(c, 4.3).move_to(UP * 0.3)
    self.cap('لجيب التمام صيغة مشابهة بإشارة ±.')
    self.play(Write(c), run_time=1.3)
    self.play(Flash(c, color=C_COS, line_length=0.14, num_lines=12, flash_radius=1.3))
    self.cap('احفظ الصيغتين لحل أي معادلة مثلثية.')
    self._c = c

  def s_recap(self):
    self.clear_body(self._c)
    self.section_label('الخلاصة')
    r1 = ar('١. ارسم الحل على الدائرة', size=26, color='#AEB8DC')
    r2 = ar('٢. جد الحلول في [0, 2π]', size=26, color='#AEB8DC')
    r3 = ar('٣. أضف الدورية للحل العام', size=26, color='#AEB8DC')
    stack = VGroup(*[self.fit(x, 4.2) for x in (r1, r2, r3)]).arrange(DOWN, buff=0.6).move_to(UP * 0.2)
    self.cap('الدائرة تحوّل المعادلة إلى صورة مرئية.')
    self.play(FadeIn(r1, shift=UP * 0.08))
    self.play(FadeIn(r2, shift=UP * 0.08))
    self.play(FadeIn(r3, shift=UP * 0.08))
    self.cap('فكّر بالدائرة أولاً، ثم اكتب الحل العام.', hold=2.2)
    self.wait(0.6)

  def _axis(self, center, r, *, horiz):
    from manim import Line
    from snapmath_manim.threeblue import C_AXIS
    if horiz:
      return Line(center + LEFT * (r + 0.5), center + RIGHT * (r + 0.5), color=C_AXIS, stroke_width=2)
    return Line(center + DOWN * (r + 0.5), center + UP * (r + 0.5), color=C_AXIS, stroke_width=2)
