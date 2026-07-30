from __future__ import annotations

from manim import (
  DOWN,
  UP,
  Axes,
  Create,
  Dot,
  FadeIn,
  FadeOut,
  Flash,
  MathTex,
  TransformMatchingTex,
  VGroup,
  Write,
)

from snapmath_manim.threeblue import (
  C_COS,
  C_GREEN,
  C_ONE,
  C_SIN,
  C_TAN,
  Base3B1BScene,
)


class RemainderFactorTheoremsScene(Base3B1BScene):
  lesson_id = 'u1-l1'

  def construct(self):
    self.s_division()
    self.s_remainder()
    self.s_factor()
    self.s_graph()
    self.s_example()
    self.s_recap()
    self.flush()

  # ---- S1: the division statement ----
  def s_division(self):
    self.section_label('القسمة على (x − a)')
    div = MathTex(r'P(x)', r'=', r'(x-a)', r'\,Q(x)', r'+', r'R', font_size=48)
    div.set_color_by_tex('(x-a)', C_COS)
    div.set_color_by_tex('R', C_TAN)
    self.fit(div, 4.0).move_to(UP * 0.5)

    self.cap('أي كثير حدود مقسوم على (x − a) يترك خارجاً وباقياً.')
    self.play(Write(div), run_time=1.4)
    self.play(Flash(div.get_part_by_tex('R'), color=C_TAN, line_length=0.15, num_lines=12, flash_radius=0.7))
    self.cap('الباقي R هو ما يهمنا.')
    self._div = div

  # ---- S2: remainder theorem ----
  def s_remainder(self):
    self.section_label('نظرية الباقي')
    self.play(self._div.animate.scale_to_fit_width(3.4).move_to(UP * 2.1))

    s2 = MathTex(r'P(a)', r'=', r'(a-a)', r'\,Q(a)', r'+', r'R', font_size=44)
    s2.set_color_by_tex('(a-a)', C_COS)
    s2.set_color_by_tex('R', C_TAN)
    self.fit(s2, 4.0).move_to(UP * 0.9)

    s3 = MathTex(r'P(a)', r'=', r'0\cdot Q(a)', r'+', r'R', font_size=44)
    s3.set_color_by_tex('0\\cdot Q(a)', C_COS)
    s3.set_color_by_tex('R', C_TAN)
    self.fit(s3, 4.0).move_to(DOWN * 0.1)

    s4 = MathTex(r'P(a)', r'=', r'R', font_size=64)
    s4.set_color_by_tex('R', C_GREEN)
    s4.move_to(DOWN * 1.4)

    self.cap('عوّض x = a في الطرفين.')
    self.play(TransformMatchingTex(self._div.copy(), s2), run_time=1.3)
    self.cap('فيصبح (a − a) صفراً، ويختفي حد الخارج.')
    self.play(TransformMatchingTex(s2.copy(), s3), run_time=1.2)
    self.play(Write(s4), run_time=0.9)
    self.play(Flash(s4, color=C_GREEN, line_length=0.18, num_lines=16, flash_radius=1.1))
    self.cap('فالباقي هو ببساطة قيمة كثير الحدود عند a.')
    self._rem = VGroup(s2, s3, s4)

  # ---- S3: factor theorem ----
  def s_factor(self):
    self.clear_body(self._rem)
    self.play(self._div.animate.scale_to_fit_width(3.0).move_to(UP * 2.2))
    self.section_label('نظرية العامل')

    f1 = MathTex(r'P(a)=0', r'\;\Rightarrow\;', r'R=0', font_size=46)
    f1.set_color_by_tex('R=0', C_TAN)
    self.fit(f1, 4.0).move_to(UP * 0.7)
    f2 = MathTex(r'P(x)=(x-a)\,Q(x)', font_size=42)
    f2.set_color(C_COS)
    self.fit(f2, 4.0).move_to(DOWN * 0.4)
    f3 = MathTex(r'(x-a)', font_size=52, color=C_GREEN)
    from snapmath_manim.threeblue import ar
    badge = ar('عامل', size=30, color=C_GREEN)
    grp = VGroup(f3, badge).arrange(DOWN, buff=0.2).move_to(DOWN * 1.6)

    self.cap('إذا كان P(a) = 0 فالباقي صفر.')
    self.play(Write(f1), run_time=1.1)
    self.cap('فلا يبقى إلا حاصل الضرب في (x − a).')
    self.play(Write(f2), run_time=1.1)
    self.play(FadeIn(grp, shift=UP * 0.1))
    self.play(Flash(f3, color=C_GREEN, line_length=0.16, num_lines=14, flash_radius=1.0))
    self.cap('أي أن (x − a) عامل لكثير الحدود.')
    self._fac = VGroup(f1, f2, grp)

  # ---- S4: roots are factors (graph) ----
  def s_graph(self):
    self.clear_body(self._fac, self._div)
    self.section_label('الجذر يعني عاملاً')

    axes = Axes(
      x_range=[-3, 2, 1], y_range=[-3, 3, 1],
      x_length=4.1, y_length=3.6,
      axis_config={'stroke_color': '#48557f', 'stroke_width': 2, 'include_ticks': True, 'tip_length': 0.16},
    ).move_to(UP * 0.55)

    def f(x):
      return 0.6 * (x ** 3 + 2 * x ** 2 - x - 2)

    curve = axes.plot(f, x_range=[-2.9, 1.35], color=C_SIN, stroke_width=4)
    roots = [-2, -1, 1]
    dots = VGroup(*[Dot(axes.c2p(rx, 0), color=C_GREEN, radius=0.08) for rx in roots])
    poly = MathTex(r'P(x)=x^3+2x^2-x-2', font_size=30).next_to(axes, DOWN, buff=0.5)
    self.fit(poly, 4.1)
    hi = Dot(axes.c2p(-2, 0), color=C_TAN, radius=0.12)
    hlabel = MathTex(r'x=-2', font_size=30, color=C_TAN).next_to(hi, UP, buff=0.15)

    self.cap('انظر إلى منحنى كثير الحدود.')
    self.play(Create(axes), run_time=1.0)
    self.play(Create(curve), run_time=1.6)
    self.play(Write(poly))
    self.cap('حيث يقطع المحور الأفقي، هناك جذر.')
    self.play(FadeIn(dots, lag_ratio=0.3))
    self.play(FadeIn(hi), Write(hlabel), Flash(hi, color=C_TAN, line_length=0.14, num_lines=12, flash_radius=0.6))
    self.cap('وكل جذر a يقابله عامل (x − a).')
    self._graph = VGroup(axes, curve, dots, poly, hi, hlabel)

  # ---- S5: worked example ----
  def s_example(self):
    self.clear_body(self._graph)
    self.section_label('مثال محلول')
    q = MathTex(r'(x+2)\ ?', font_size=40, color=C_COS).move_to(UP * 2.1)
    e1 = MathTex(r'P(-2)=(-2)^3+2(-2)^2-(-2)-2', font_size=30)
    e2 = MathTex(r'=-8+8+2-2', font_size=34)
    e3 = MathTex(r'=0', font_size=52, color=C_GREEN)
    stack = VGroup(self.fit(e1, 4.1), e2, e3).arrange(DOWN, buff=0.5).move_to(DOWN * 0.1)
    from snapmath_manim.threeblue import ar
    concl = VGroup(
      MathTex(r'(x+2)', font_size=44, color=C_GREEN),
      ar('عامل', size=28, color=C_GREEN),
    ).arrange(DOWN, buff=0.16).move_to(DOWN * 2.5)

    self.cap('هل (x + 2) عامل لـ P(x)؟')
    self.play(FadeIn(q, shift=DOWN * 0.1))
    self.cap('عوّض x = −2 مباشرة.')
    self.play(Write(e1), run_time=1.3)
    self.play(Write(e2), run_time=1.0)
    self.play(Write(e3), run_time=0.7)
    self.play(Flash(e3, color=C_GREEN, line_length=0.16, num_lines=14, flash_radius=0.9))
    self.cap('النتيجة صفر، إذن (x + 2) عامل.')
    self.play(FadeIn(concl, shift=UP * 0.1))
    self._ex = VGroup(q, stack, concl)

  # ---- S6: recap ----
  def s_recap(self):
    self.clear_body(self._ex)
    self.section_label('الخلاصة')
    r1 = MathTex(r'P(a)=R', font_size=52)
    r1.set_color_by_tex('R', C_TAN)
    r2 = MathTex(r'P(a)=0', r'\iff', r'(x-a)\mid P(x)', font_size=40)
    r2.set_color(C_GREEN)
    stack = VGroup(self.fit(r1, 4.0), self.fit(r2, 4.1)).arrange(DOWN, buff=0.8).move_to(UP * 0.2)

    self.cap('عوّض أولاً: قيمة P عند a هي الباقي.')
    self.play(Write(r1), run_time=1.0)
    self.cap('وإذا كان الباقي صفراً، فلديك عامل.')
    self.play(Write(r2), run_time=1.1)
    self.play(stack.animate.scale(1.06), run_time=0.4)
    self.play(stack.animate.scale(1 / 1.06), run_time=0.35)
    self.wait(0.8)
