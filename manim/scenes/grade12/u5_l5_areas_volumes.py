from __future__ import annotations

from manim import (
  DOWN,
  UP,
  Axes,
  Create,
  FadeIn,
  Flash,
  MathTex,
  VGroup,
  Write,
)

from snapmath_manim.threeblue import C_AXIS, C_COS, C_GREEN, C_SIN, C_TAN, Base3B1BScene, ar


class AreasVolumesScene(Base3B1BScene):
  lesson_id = 'u5-l5'

  def construct(self):
    self.s_area()
    self.s_compute()
    self.s_volume()
    self.s_recap()
    self.flush()

  def s_area(self):
    self.section_label('المساحة تحت المنحنى')
    axes = Axes(
      x_range=[0, 3.5, 1], y_range=[0, 10, 2],
      x_length=4.0, y_length=3.4,
      axis_config={'stroke_color': C_AXIS, 'stroke_width': 2, 'include_ticks': True, 'tip_length': 0.14},
    ).move_to(UP * 0.7)
    curve = axes.plot(lambda x: x ** 2, x_range=[0, 3.1], color=C_SIN, stroke_width=4)
    area = axes.get_area(curve, x_range=[0, 3], color=C_COS, opacity=0.45)
    lbl = MathTex(r'y=x^{2}', font_size=30, color=C_SIN).next_to(axes.c2p(2.4, 6), UP)
    formula = MathTex(r'A=\int_{a}^{b} f(x)\,dx', font_size=36).to_edge(DOWN, buff=1.5)
    self.cap('التكامل المحدد يعطي المساحة تحت المنحنى.')
    self.play(Create(axes), run_time=0.9)
    self.play(Create(curve), FadeIn(lbl), run_time=1.2)
    self.play(FadeIn(area), run_time=1.0)
    self.play(Write(formula))
    self.cap('المنطقة الملوّنة هي ما نحسبه.')
    self._a = VGroup(axes, curve, area, lbl, formula)

  def s_compute(self):
    self.clear_body(self._a)
    self.section_label('حساب المساحة')
    e0 = MathTex(r'\int_{0}^{3} x^{2}\,dx', font_size=46).move_to(UP * 1.3)
    e1 = MathTex(r'= \left[\dfrac{x^{3}}{3}\right]_{0}^{3}', font_size=42).next_to(e0, DOWN, buff=0.7)
    e2 = MathTex(r'= \dfrac{27}{3} = 9', font_size=48, color=C_GREEN).next_to(e1, DOWN, buff=0.7)
    self.cap('كامل ثم عوّض الحدين.')
    self.play(Write(e0), run_time=1.0)
    self.play(Write(e1), run_time=1.1)
    self.play(Write(e2), run_time=0.9)
    self.play(Flash(e2, color=C_GREEN, line_length=0.16, num_lines=14, flash_radius=1.4))
    self.cap('فالمساحة تساوي تسع وحدات مربعة.')
    self._c = VGroup(e0, e1, e2)

  def s_volume(self):
    self.clear_body(self._c)
    self.section_label('حجم الدوران')
    v = MathTex(r'V = \pi\int_{a}^{b} \big[f(x)\big]^{2}\,dx', font_size=42)
    self.fit(v, 4.3).move_to(UP * 0.6)
    note = ar('عند دوران المنطقة حول المحور ينشأ مجسم.', size=23, color='#AEB8DC')
    self.fit(note, 4.3).next_to(v, DOWN, buff=0.8)
    self.cap('وبتدوير المنطقة حول المحور نحصل على حجم.')
    self.play(Write(v), run_time=1.3)
    self.play(FadeIn(note, shift=UP * 0.08))
    self.cap('نربّع الدالة ونضرب في π.')
    self._v = VGroup(v, note)

  def s_recap(self):
    self.clear_body(self._v)
    self.section_label('الخلاصة')
    r1 = MathTex(r'A=\int_{a}^{b} f(x)\,dx', font_size=40)
    r2 = MathTex(r'V=\pi\int_{a}^{b} [f(x)]^{2}\,dx', font_size=40, color=C_GREEN)
    stack = VGroup(self.fit(r1, 4.3), self.fit(r2, 4.3)).arrange(DOWN, buff=0.9).move_to(UP * 0.2)
    self.cap('التكامل يقيس المساحة، ومربّعه يقيس الحجم.')
    self.play(Write(r1), run_time=1.1)
    self.play(Write(r2), run_time=1.2)
    self.wait(1.6)
