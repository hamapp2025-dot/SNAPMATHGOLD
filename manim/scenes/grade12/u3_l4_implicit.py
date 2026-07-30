from __future__ import annotations

import numpy as np
from manim import (
  DOWN,
  RIGHT,
  UP,
  Circle,
  Create,
  Dot,
  FadeIn,
  Flash,
  Line,
  MathTex,
  VGroup,
  Write,
)

from snapmath_manim.threeblue import C_AXIS, C_COS, C_GREEN, C_SIN, C_TAN, Base3B1BScene, ar


class ImplicitDifferentiationScene(Base3B1BScene):
  lesson_id = 'u3-l4'

  def construct(self):
    self.s_idea()
    self.s_example()
    self.s_circle()
    self.s_recap()
    self.flush()

  def s_idea(self):
    self.section_label('التفاضل الضمني')
    idea = MathTex(r'x^{2}+y^{2}=25', font_size=52).move_to(UP * 1.0)
    note = ar('نعامل y كدالة في x، ونشتق الطرفين.', size=24, color='#AEB8DC')
    self.fit(note, 4.3).next_to(idea, DOWN, buff=0.8)
    self.cap('أحياناً لا نستطيع عزل y بسهولة.')
    self.play(Write(idea), run_time=1.1)
    self.play(FadeIn(note, shift=UP * 0.08))
    self.cap('الحل: اشتق الطرفين وتذكّر أن y دالة في x.')
    self._i = VGroup(idea, note)

  def s_example(self):
    self.clear_body(self._i)
    self.section_label('الاشتقاق خطوة بخطوة')
    e1 = MathTex(r"2x + 2y\,y' = 0", font_size=46).move_to(UP * 1.0)
    e2 = MathTex(r"2y\,y' = -2x", font_size=44).next_to(e1, DOWN, buff=0.7)
    e3 = MathTex(r"y' = -\dfrac{x}{y}", font_size=54, color=C_GREEN).next_to(e2, DOWN, buff=0.7)
    self.cap('اشتق كل حد، ويظهر الميل من الحد الذي فيه y.')
    self.play(Write(e1), run_time=1.2)
    self.play(Write(e2), run_time=1.0)
    self.play(Write(e3), run_time=0.9)
    self.play(Flash(e3, color=C_GREEN, line_length=0.16, num_lines=14, flash_radius=1.4))
    self.cap('اعزل الميل فتحصل على سالب x على y.')
    self._e = VGroup(e1, e2, e3)

  def s_circle(self):
    self.clear_body(self._e)
    self.section_label('الميل عند نقطة')
    center = UP * 0.5
    R = 1.7
    circle = Circle(radius=R, color=C_COS, stroke_width=5).move_to(center)
    x_axis = Line(center + RIGHT * -2.2, center + RIGHT * 2.2, color=C_AXIS, stroke_width=2)
    y_axis = Line(center + UP * -2.2, center + UP * 2.2, color=C_AXIS, stroke_width=2)
    ang = np.radians(50)
    P = center + R * np.array([np.cos(ang), np.sin(ang), 0])
    dot = Dot(P, color=C_GREEN, radius=0.09)
    # tangent slope -x/y => perpendicular to radius
    tdir = np.array([-np.sin(ang), np.cos(ang), 0])
    tan = Line(P - 1.1 * tdir, P + 1.1 * tdir, color=C_SIN, stroke_width=4)
    rad = Line(center, P, color=C_TAN, stroke_width=3)
    slope = MathTex(r"y' = -\dfrac{x}{y}", font_size=40, color=C_GREEN).to_edge(DOWN, buff=1.5)
    self.cap('المماس عمودي على نصف القطر عند النقطة.')
    self.play(Create(x_axis), Create(y_axis), Create(circle), run_time=1.0)
    self.play(Create(rad), FadeIn(dot))
    self.play(Create(tan))
    self.play(Write(slope))
    self.cap('وميله يساوي سالب x على y تماماً.')
    self._c = VGroup(x_axis, y_axis, circle, rad, dot, tan, slope)

  def s_recap(self):
    self.clear_body(self._c)
    self.section_label('الخلاصة')
    r1 = ar('١. اشتق الطرفين بالنسبة لـ x', size=25, color='#AEB8DC')
    r2 = ar('٢. الحدود التي فيها y تُنتج مشتقتها', size=25, color='#AEB8DC')
    r3 = ar('٣. اعزل مشتقة y في النهاية', size=25, color='#AEB8DC')
    stack = VGroup(*[self.fit(x, 4.2) for x in (r1, r2, r3)]).arrange(DOWN, buff=0.6).move_to(UP * 0.2)
    self.cap('ثلاث خطوات لأي معادلة ضمنية.')
    self.play(FadeIn(r1, shift=UP * 0.08))
    self.play(FadeIn(r2, shift=UP * 0.08))
    self.play(FadeIn(r3, shift=UP * 0.08))
    self.cap('اشتق، ولّد الميل، ثم اعزله.', hold=2.0)
    self.wait(0.6)
