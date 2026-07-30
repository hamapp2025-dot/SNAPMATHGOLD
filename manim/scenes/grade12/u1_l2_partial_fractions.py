from __future__ import annotations

from manim import (
  DOWN,
  UP,
  Create,
  FadeIn,
  Flash,
  MathTex,
  SurroundingRectangle,
  TransformMatchingTex,
  VGroup,
  Write,
)

from snapmath_manim.threeblue import C_COS, C_GREEN, C_SIN, C_TAN, Base3B1BScene, ar


class PartialFractionsScene(Base3B1BScene):
  lesson_id = 'u1-l2'

  def construct(self):
    self.s_idea()
    self.s_clear()
    self.s_coverup()
    self.s_result()
    self.s_forms()
    self.s_recap()
    self.flush()

  def s_idea(self):
    self.section_label('فكرة الكسور الجزئية')
    whole = MathTex(r'\frac{1}{x(x+1)}', font_size=64).move_to(UP * 1.2)
    split = MathTex(r'=', r'\frac{A}{x}', r'+', r'\frac{B}{x+1}', font_size=52)
    split.set_color_by_tex(r'\frac{A}{x}', C_SIN)
    split.set_color_by_tex(r'\frac{B}{x+1}', C_COS)
    self.fit(split, 4.0).next_to(whole, DOWN, buff=0.6)
    self.cap('كسر واحد صعب نحوّله إلى كسرين بسيطين.')
    self.play(Write(whole), run_time=1.1)
    self.play(Write(split), run_time=1.4)
    self.cap('نبحث عن A و B المجهولين.')
    self._idea = VGroup(whole, split)

  def s_clear(self):
    self.clear_body(self._idea)
    self.section_label('توحيد المقامات')
    e = MathTex(r'1', r'=', r'A(x+1)', r'+', r'B\,x', font_size=48)
    e.set_color_by_tex(r'A(x+1)', C_SIN)
    e.set_color_by_tex(r'B\,x', C_COS)
    self.fit(e, 4.1).move_to(UP * 0.3)
    self.cap('اضرب الطرفين في x(x+1) لإزالة المقامات.')
    self.play(Write(e), run_time=1.3)
    self.cap('نحصل على معادلة بسيطة في A و B.')
    self._clear = e

  def s_coverup(self):
    self.section_label('طريقة التغطية')
    self.play(self._clear.animate.scale_to_fit_width(3.4).move_to(UP * 2.0))
    a = MathTex(r'x=0:\quad 1 = A(1)\ \Rightarrow\ A=1', font_size=40, color=C_SIN)
    b = MathTex(r'x=-1:\quad 1 = B(-1)\ \Rightarrow\ B=-1', font_size=40, color=C_COS)
    stack = VGroup(self.fit(a, 4.1), self.fit(b, 4.1)).arrange(DOWN, buff=0.7).move_to(DOWN * 0.2)
    self.cap('عوّض x = 0 فيختفي B.')
    self.play(Write(a), run_time=1.2)
    self.play(Flash(a, color=C_SIN, line_length=0.12, num_lines=10, flash_radius=1.4))
    self.cap('وعوّض x = −1 فيختفي A.')
    self.play(Write(b), run_time=1.2)
    self.play(Flash(b, color=C_COS, line_length=0.12, num_lines=10, flash_radius=1.4))
    self.cap('كل تعويض يعطينا مجهولاً مباشرة.')
    self._cov = VGroup(a, b)

  def s_result(self):
    self.clear_body(self._cov, self._clear)
    self.section_label('النتيجة')
    res = MathTex(r'\frac{1}{x(x+1)}', r'=', r'\frac{1}{x}', r'-', r'\frac{1}{x+1}', font_size=56)
    res.set_color_by_tex(r'\frac{1}{x}', C_SIN)
    res.set_color_by_tex(r'\frac{1}{x+1}', C_COS)
    self.fit(res, 4.2).move_to(UP * 0.3)
    box = SurroundingRectangle(res, color=C_GREEN, buff=0.25, corner_radius=0.15)
    self.cap('إذن الكسر يساوي فرق كسرين بسيطين.')
    self.play(Write(res), run_time=1.5)
    self.play(Create(box))
    self.play(Flash(res, color=C_GREEN, line_length=0.16, num_lines=16, flash_radius=1.6))
    self.cap('صورة أسهل بكثير للتكامل أو التبسيط.')
    self._res = VGroup(res, box)

  def s_forms(self):
    self.clear_body(self._res)
    self.section_label('الصور القياسية')
    t1 = ar('عوامل خطية مختلفة', size=24, color=C_TAN)
    f1 = MathTex(r'\frac{A}{x-a}+\frac{B}{x-b}', font_size=44)
    t2 = ar('عامل مكرر', size=24, color=C_TAN)
    f2 = MathTex(r'\frac{A}{x-a}+\frac{B}{(x-a)^2}', font_size=44)
    g1 = VGroup(t1, self.fit(f1, 4.0)).arrange(DOWN, buff=0.25).move_to(UP * 1.2)
    g2 = VGroup(t2, self.fit(f2, 4.0)).arrange(DOWN, buff=0.25).move_to(DOWN * 1.1)
    self.cap('لكل نوع من العوامل صورة قياسية.')
    self.play(FadeIn(g1, shift=UP * 0.1))
    self.play(FadeIn(g2, shift=UP * 0.1))
    self.cap('العامل المكرر يأخذ حدين.')
    self._forms = VGroup(g1, g2)

  def s_recap(self):
    self.clear_body(self._forms)
    self.section_label('الخلاصة')
    r1 = ar('١. جزّئ حسب العوامل', size=26, color='#AEB8DC')
    r2 = ar('٢. وحّد المقامات', size=26, color='#AEB8DC')
    r3 = ar('٣. عوّض القيم الحرجة لإيجاد الثوابت', size=24, color='#AEB8DC')
    stack = VGroup(*[self.fit(x, 4.1) for x in (r1, r2, r3)]).arrange(DOWN, buff=0.55).move_to(UP * 0.2)
    self.cap('ثلاث خطوات فقط.')
    self.play(FadeIn(r1, shift=UP * 0.08))
    self.play(FadeIn(r2, shift=UP * 0.08))
    self.play(FadeIn(r3, shift=UP * 0.08))
    self.cap('طريقة التغطية أسرع أداة في الامتحان.', hold=2.2)
    self.wait(0.6)
