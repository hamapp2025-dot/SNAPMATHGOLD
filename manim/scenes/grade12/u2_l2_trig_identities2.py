from __future__ import annotations

from manim import (
  DEGREES,
  DOWN,
  RIGHT,
  UP,
  Create,
  FadeIn,
  Flash,
  MathTex,
  SurroundingRectangle,
  ValueTracker,
  VGroup,
  Write,
)

from snapmath_manim.threeblue import C_COS, C_GREEN, C_SIN, C_TAN, Base3B1BScene, ar


class TrigIdentities2Scene(Base3B1BScene):
  lesson_id = 'u2-l2'

  def construct(self):
    self.s_formulas()
    self.s_circle()
    self.s_example()
    self.s_difference()
    self.s_recap()
    self.flush()

  def s_formulas(self):
    self.section_label('صيغ المجموع')
    f1 = MathTex(r'\sin(A+B)=', r'\sin A\cos B', r'+', r'\cos A\sin B', font_size=40)
    f1.set_color_by_tex(r'\sin A\cos B', C_SIN)
    f1.set_color_by_tex(r'\cos A\sin B', C_COS)
    f2 = MathTex(r'\cos(A+B)=', r'\cos A\cos B', r'-', r'\sin A\sin B', font_size=40)
    f2.set_color_by_tex(r'\cos A\cos B', C_COS)
    f2.set_color_by_tex(r'\sin A\sin B', C_SIN)
    stack = VGroup(self.fit(f1, 4.2), self.fit(f2, 4.2)).arrange(DOWN, buff=0.8).move_to(UP * 0.3)
    self.cap('صيغتا مجموع زاويتين هما مفتاح الوحدة.')
    self.play(Write(f1), run_time=1.3)
    self.play(Write(f2), run_time=1.3)
    self.cap('لاحظ إشارة الجمع للجيب والطرح لجيب التمام.')
    self._f = stack

  def s_circle(self):
    self.clear_body(self._f)
    self.section_label('جمع الزوايا')
    center = UP * 0.4
    r = 1.7
    theta = ValueTracker(28 * DEGREES)
    C = self.build_circle(center, r, theta, projections=False)
    self.play(Create(C['x_axis']), Create(C['y_axis']), Create(C['circle']), run_time=0.9)
    self.add(C['angle'])
    self.play(Create(C['radius_line']), FadeIn(C['dot']))
    lblA = MathTex(r'A', font_size=34, color=C_SIN).move_to(center + RIGHT * 0.9 + UP * 0.25)
    self.play(FadeIn(lblA))
    self.cap('ابدأ بزاوية A على الدائرة.')
    self.play(theta.animate.set_value(64 * DEGREES), run_time=1.6)
    lblB = MathTex(r'A+B', font_size=32, color=C_GREEN).move_to(center + UP * 1.1 + RIGHT * 0.5)
    self.play(FadeIn(lblB))
    self.cap('أضف B فتدور إلى A + B، ومنها تُشتق الصيغ.')
    self._c = VGroup(C['x_axis'], C['y_axis'], C['circle'], C['radius_line'], C['dot'], C['angle'], lblA, lblB)

  def s_example(self):
    self.clear_body(self._c)
    self.section_label('مثال: sin 75°')
    e1 = MathTex(r'\sin 75^\circ=\sin(45^\circ+30^\circ)', font_size=38)
    e2 = MathTex(r'=\sin 45^\circ\cos 30^\circ+\cos 45^\circ\sin 30^\circ', font_size=30)
    e3 = MathTex(r'=\tfrac{\sqrt2}{2}\cdot\tfrac{\sqrt3}{2}+\tfrac{\sqrt2}{2}\cdot\tfrac12', font_size=32)
    e4 = MathTex(r'=\dfrac{\sqrt6+\sqrt2}{4}', font_size=46, color=C_GREEN)
    stack = VGroup(*[self.fit(x, 4.2) for x in (e1, e2, e3, e4)]).arrange(DOWN, buff=0.5).move_to(UP * 0.1)
    self.cap('اكتب ٧٥ كمجموع ٤٥ و ٣٠.')
    self.play(Write(e1), run_time=1.0)
    self.play(Write(e2), run_time=1.2)
    self.cap('عوّض القيم المعروفة.')
    self.play(Write(e3), run_time=1.2)
    self.play(Write(e4), run_time=0.9)
    self.play(Flash(e4, color=C_GREEN, line_length=0.15, num_lines=14, flash_radius=1.2))
    self.cap('فنحصل على القيمة الدقيقة.')
    self._ex = stack

  def s_difference(self):
    self.clear_body(self._ex)
    self.section_label('صيغ الفرق')
    d1 = MathTex(r'\sin(A-B)=\sin A\cos B-\cos A\sin B', font_size=32)
    d2 = MathTex(r'\cos(A-B)=\cos A\cos B+\sin A\sin B', font_size=32)
    stack = VGroup(self.fit(d1, 4.2), self.fit(d2, 4.2)).arrange(DOWN, buff=0.8).move_to(UP * 0.2)
    self.cap('صيغ الفرق نفسها مع عكس الإشارة.')
    self.play(Write(d1), run_time=1.2)
    self.play(Write(d2), run_time=1.2)
    self.cap('الجيب يقلب إلى طرح، وجيب التمام إلى جمع.')
    self._d = stack

  def s_recap(self):
    self.clear_body(self._d)
    self.section_label('الخلاصة')
    r1 = MathTex(r'\sin(A\pm B)=\sin A\cos B\pm\cos A\sin B', font_size=30)
    r2 = MathTex(r'\cos(A\pm B)=\cos A\cos B\mp\sin A\sin B', font_size=30)
    stack = VGroup(self.fit(r1, 4.3), self.fit(r2, 4.3)).arrange(DOWN, buff=0.8).move_to(UP * 0.2)
    self.cap('احفظهما بالإشارات، فهما أساس بقية الوحدة.')
    self.play(Write(r1), run_time=1.1)
    self.play(Write(r2), run_time=1.1)
    self.play(stack.animate.scale(1.05), run_time=0.4)
    self.play(stack.animate.scale(1 / 1.05), run_time=0.35)
    self.wait(0.8)
