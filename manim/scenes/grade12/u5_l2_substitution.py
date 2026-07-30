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


class SubstitutionScene(Base3B1BScene):
  lesson_id = 'u5-l2'

  def construct(self):
    self.s_idea()
    self.s_example()
    self.s_recap()
    self.flush()

  def s_idea(self):
    self.section_label('التكامل بالتعويض')
    e = MathTex(r'u = g(x)', r'\qquad', r"du = g'(x)\,dx", font_size=42)
    e.set_color_by_tex(r'u = g(x)', C_SIN)
    self.fit(e, 4.3).move_to(UP * 0.7)
    note = ar('نعوّض جزءاً معقداً بحرف u لتبسيط التكامل.', size=24, color='#AEB8DC')
    self.fit(note, 4.3).next_to(e, DOWN, buff=0.8)
    self.cap('التعويض هو عكس قاعدة السلسلة.')
    self.play(Write(e), run_time=1.2)
    self.play(FadeIn(note, shift=UP * 0.08))
    self.cap('اختر u بحيث تظهر مشتقته في التكامل.')
    self._i = VGroup(e, note)

  def s_example(self):
    self.clear_body(self._i)
    self.section_label('مثال محلول')
    e0 = MathTex(r'\int 2x\,(x^{2}+1)^{5}\,dx', font_size=42).move_to(UP * 1.6)
    sub = MathTex(r'u = x^{2}+1,\quad du = 2x\,dx', font_size=32, color=C_SIN).next_to(e0, DOWN, buff=0.6)
    e1 = MathTex(r'= \int u^{5}\,du', font_size=42).next_to(sub, DOWN, buff=0.6)
    e2 = MathTex(r'= \dfrac{u^{6}}{6} = \dfrac{(x^{2}+1)^{6}}{6} + C', font_size=38, color=C_GREEN)
    self.fit(e2, 4.3).next_to(e1, DOWN, buff=0.6)
    self.cap('اختر u يساوي x² زائد واحد.')
    self.play(Write(e0), run_time=1.1)
    self.play(Write(sub), run_time=1.1)
    self.cap('فيتحوّل التكامل إلى صورة بسيطة في u.')
    self.play(Write(e1), run_time=0.9)
    self.play(Write(e2), run_time=1.2)
    self.play(Flash(e2, color=C_GREEN, line_length=0.14, num_lines=12, flash_radius=1.4))
    self.cap('كامل ثم أعد u إلى صورته الأصلية.')
    self._e = VGroup(e0, sub, e1, e2)

  def s_recap(self):
    self.clear_body(self._e)
    self.section_label('الخلاصة')
    r1 = ar('١. اختر u الجزء الداخلي', size=26, color='#AEB8DC')
    r2 = ar('٢. جد du وعوّض', size=26, color='#AEB8DC')
    r3 = ar('٣. كامل ثم أرجِع u', size=26, color='#AEB8DC')
    stack = VGroup(*[self.fit(x, 4.2) for x in (r1, r2, r3)]).arrange(DOWN, buff=0.6).move_to(UP * 0.2)
    self.cap('اختر الداخلي، عوّض، كامل، ثم أرجِع.')
    self.play(FadeIn(r1, shift=UP * 0.08))
    self.play(FadeIn(r2, shift=UP * 0.08))
    self.play(FadeIn(r3, shift=UP * 0.08))
    self.cap('التعويض الجيد يحوّل تكاملاً صعباً إلى سهل.', hold=2.0)
    self.wait(0.6)
