from __future__ import annotations

from manim import (
  DOWN,
  UP,
  FadeIn,
  Flash,
  MathTex,
  VGroup,
  Write,
)

from snapmath_manim.threeblue import C_COS, C_GREEN, C_SIN, C_TAN, Base3B1BScene, ar


class ProductQuotientScene(Base3B1BScene):
  lesson_id = 'u3-l2'

  def construct(self):
    self.s_product()
    self.s_example()
    self.s_quotient()
    self.s_recap()
    self.flush()

  def s_product(self):
    self.section_label('قاعدة الضرب')
    f = MathTex(r"(f\,g)' = ", r"f'g", r"+", r"f g'", font_size=48)
    f.set_color_by_tex(r"f'g", C_SIN)
    f.set_color_by_tex(r"f g'", C_COS)
    self.fit(f, 4.2).move_to(UP * 0.6)
    note = ar('اشتق الأول واترك الثاني، ثم بالعكس.', size=24, color='#AEB8DC')
    self.fit(note, 4.2).next_to(f, DOWN, buff=0.8)
    self.cap('لمشتقة حاصل ضرب دالتين قاعدة خاصة.')
    self.play(Write(f), run_time=1.4)
    self.play(FadeIn(note, shift=UP * 0.08))
    self.cap('اشتق واحدة في كل مرة واجمع.')
    self._p = VGroup(f, note)

  def s_example(self):
    self.clear_body(self._p)
    self.section_label('مثال محلول')
    e0 = MathTex(r'y = x^{2}\,\sin x', font_size=46).move_to(UP * 1.2)
    e1 = MathTex(r"y' = ", r"2x\,\sin x", r"+", r"x^{2}\cos x", font_size=40)
    e1.set_color_by_tex(r"2x\,\sin x", C_SIN)
    e1.set_color_by_tex(r"x^{2}\cos x", C_COS)
    self.fit(e1, 4.3).next_to(e0, DOWN, buff=0.9)
    self.cap('خذ y يساوي x² في جيب x.')
    self.play(Write(e0), run_time=1.0)
    self.cap('اشتق x² واترك الجيب، ثم العكس.')
    self.play(Write(e1), run_time=1.4)
    self.play(Flash(e1, color=C_GREEN, line_length=0.14, num_lines=12, flash_radius=1.5))
    self.cap('فتحصل على المشتقة مباشرة.')
    self._e = VGroup(e0, e1)

  def s_quotient(self):
    self.clear_body(self._e)
    self.section_label('قاعدة القسمة')
    q = MathTex(r"\left(\dfrac{f}{g}\right)' = \dfrac{f'g - f g'}{g^{2}}", font_size=46)
    self.fit(q, 4.2).move_to(UP * 0.4)
    note = ar('البسط: مشتقة العلوي × السفلي، ناقص العكس.', size=23, color='#AEB8DC')
    self.fit(note, 4.3).next_to(q, DOWN, buff=0.8)
    self.cap('ولقسمة دالتين قاعدة مشابهة بالطرح.')
    self.play(Write(q), run_time=1.5)
    self.play(FadeIn(note, shift=UP * 0.08))
    self.cap('انتبه للترتيب والإشارة، والمقام مربّع.')
    self._q = VGroup(q, note)

  def s_recap(self):
    self.clear_body(self._q)
    self.section_label('الخلاصة')
    r1 = MathTex(r"(fg)' = f'g + fg'", font_size=40)
    r2 = MathTex(r"\left(\tfrac{f}{g}\right)' = \dfrac{f'g - fg'}{g^{2}}", font_size=40)
    stack = VGroup(self.fit(r1, 4.2), self.fit(r2, 4.2)).arrange(DOWN, buff=0.9).move_to(UP * 0.2)
    self.cap('قاعدتان تحلّان أغلب أسئلة الاشتقاق.')
    self.play(Write(r1), run_time=1.0)
    self.play(Write(r2), run_time=1.2)
    self.wait(1.6)
