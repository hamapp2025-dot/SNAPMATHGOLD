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


class DiffEqScene(Base3B1BScene):
  lesson_id = 'u5-l6'

  def construct(self):
    self.s_idea()
    self.s_example()
    self.s_curve()
    self.s_recap()
    self.flush()

  def s_idea(self):
    self.section_label('المعادلات التفاضلية')
    e = MathTex(r'\dfrac{dy}{dx} = f(x)\,g(y)', font_size=46).move_to(UP * 1.0)
    sep = MathTex(r'\int \dfrac{dy}{g(y)} = \int f(x)\,dx', font_size=40, color=C_SIN).next_to(e, DOWN, buff=0.8)
    self.cap('المعادلة التفاضلية تربط دالة بمشتقتها.')
    self.play(Write(e), run_time=1.1)
    self.cap('في النوع المنفصل نفصل المتغيرات ثم نكامل.')
    self.play(Write(sep), run_time=1.2)
    self._i = VGroup(e, sep)

  def s_example(self):
    self.clear_body(self._i)
    self.section_label('مثال محلول')
    e0 = MathTex(r'\dfrac{dy}{dx} = 2x,\quad y(0)=1', font_size=40).move_to(UP * 1.5)
    e1 = MathTex(r'\int dy = \int 2x\,dx', font_size=40).next_to(e0, DOWN, buff=0.6)
    e2 = MathTex(r'y = x^{2} + C', font_size=42).next_to(e1, DOWN, buff=0.6)
    e3 = MathTex(r'y = x^{2} + 1', font_size=48, color=C_GREEN).next_to(e2, DOWN, buff=0.6)
    self.cap('كامل الطرفين.')
    self.play(Write(e0), run_time=1.0)
    self.play(Write(e1), run_time=1.0)
    self.play(Write(e2), run_time=0.9)
    self.cap('استخدم الشرط الابتدائي لإيجاد C.')
    self.play(Write(e3), run_time=0.9)
    self.play(Flash(e3, color=C_GREEN, line_length=0.16, num_lines=14, flash_radius=1.4))
    self.cap('فعند x يساوي صفر و y يساوي واحد نجد C = 1.')
    self._e = VGroup(e0, e1, e2, e3)

  def s_curve(self):
    self.clear_body(self._e)
    self.section_label('منحنى الحل')
    axes = Axes(
      x_range=[-2.5, 2.5, 1], y_range=[0, 6, 1],
      x_length=4.0, y_length=3.2,
      axis_config={'stroke_color': C_AXIS, 'stroke_width': 2, 'include_ticks': True, 'tip_length': 0.14},
    ).move_to(UP * 0.6)
    curve = axes.plot(lambda x: x ** 2 + 1, x_range=[-2.2, 2.2], color=C_GREEN, stroke_width=4)
    from manim import Dot
    p = Dot(axes.c2p(0, 1), color=C_SIN, radius=0.09)
    lbl = MathTex(r'y=x^{2}+1', font_size=30, color=C_GREEN).next_to(axes.c2p(1.6, 3.5), UP)
    self.cap('الحل هو منحنى واحد يمر بالنقطة المعطاة.')
    self.play(Create(axes), run_time=0.9)
    self.play(Create(curve), FadeIn(lbl), run_time=1.3)
    self.play(FadeIn(p, scale=1.5))
    self.cap('الشرط الابتدائي يختار منحنى بعينه.')
    self._c = VGroup(axes, curve, p, lbl)

  def s_recap(self):
    self.clear_body(self._c)
    self.section_label('الخلاصة')
    r1 = ar('١. افصل المتغيرات', size=26, color='#AEB8DC')
    r2 = ar('٢. كامل الطرفين', size=26, color='#AEB8DC')
    r3 = ar('٣. استخدم الشرط لإيجاد C', size=26, color='#AEB8DC')
    stack = VGroup(*[self.fit(x, 4.2) for x in (r1, r2, r3)]).arrange(DOWN, buff=0.6).move_to(UP * 0.2)
    self.cap('افصل، كامل، ثم طبّق الشرط الابتدائي.')
    self.play(FadeIn(r1, shift=UP * 0.08))
    self.play(FadeIn(r2, shift=UP * 0.08))
    self.play(FadeIn(r3, shift=UP * 0.08))
    self.cap('هكذا نحوّل معادلة تفاضلية إلى دالة صريحة.', hold=2.0)
    self.wait(0.6)
