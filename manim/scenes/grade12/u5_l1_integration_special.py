from __future__ import annotations

from manim import (
  DOWN,
  RIGHT,
  UP,
  FadeIn,
  Flash,
  MathTex,
  VGroup,
  Write,
)

from snapmath_manim.threeblue import C_COS, C_GREEN, C_SIN, C_TAN, Base3B1BScene, ar


class IntegrationSpecialScene(Base3B1BScene):
  lesson_id = 'u5-l1'

  def construct(self):
    self.s_reverse()
    self.s_table()
    self.s_example()
    self.s_recap()
    self.flush()

  def s_reverse(self):
    self.section_label('التكامل عكس الاشتقاق')
    f = MathTex(r'x^{3}', font_size=48, color=C_SIN)
    arrow = MathTex(r'\longrightarrow', font_size=44, color=C_COS)
    g = MathTex(r'3x^{2}', font_size=48, color=C_GREEN)
    row = VGroup(f, arrow, g).arrange(RIGHT, buff=0.4)
    row.move_to(UP * 0.6)
    note = ar('التكامل يعيدنا من المشتقة إلى الأصل.', size=24, color='#AEB8DC')
    self.fit(note, 4.3).next_to(row, DOWN, buff=0.9)
    self.cap('التكامل هو العملية العكسية للاشتقاق.')
    self.play(Write(row), run_time=1.2)
    self.play(FadeIn(note, shift=UP * 0.08))
    self.cap('نبحث عن الدالة التي مشتقتها المعطى.')
    self._r = VGroup(row, note)

  def s_table(self):
    self.clear_body(self._r)
    self.section_label('تكاملات أساسية')
    rows = [
      (r"\int x^{n}\,dx = \dfrac{x^{n+1}}{n+1} + C", C_SIN),
      (r"\int e^{x}\,dx = e^{x} + C", C_GREEN),
      (r"\int \sin x\,dx = -\cos x + C", C_COS),
      (r"\int \cos x\,dx = \sin x + C", C_TAN),
    ]
    mobs = [self.fit(MathTex(t, font_size=36, color=c), 4.3) for t, c in rows]
    stack = VGroup(*mobs).arrange(DOWN, buff=0.55).move_to(UP * 0.1)
    self.cap('احفظ هذه التكاملات الأربعة.')
    for m in mobs:
      self.play(Write(m), run_time=0.8)
    self.cap('ولا تنسَ ثابت التكامل C.')
    self._t = stack

  def s_example(self):
    self.clear_body(self._t)
    self.section_label('مثال محلول')
    e0 = MathTex(r'\int (3x^{2} + 2)\,dx', font_size=46).move_to(UP * 1.1)
    e1 = MathTex(r'= x^{3} + 2x + C', font_size=48, color=C_GREEN).next_to(e0, DOWN, buff=0.9)
    self.cap('كامل كل حد على حدة.')
    self.play(Write(e0), run_time=1.1)
    self.play(Write(e1), run_time=1.0)
    self.play(Flash(e1, color=C_GREEN, line_length=0.16, num_lines=14, flash_radius=1.4))
    self.cap('ارفع الأس وقسّم عليه، وأضف C.')
    self._e = VGroup(e0, e1)

  def s_recap(self):
    self.clear_body(self._e)
    self.section_label('الخلاصة')
    r1 = MathTex(r'\int x^{n}\,dx = \dfrac{x^{n+1}}{n+1} + C', font_size=38)
    r2 = ar('التكامل عكس الاشتقاق دائماً.', size=26, color='#AEB8DC')
    stack = VGroup(self.fit(r1, 4.3), self.fit(r2, 4.2)).arrange(DOWN, buff=0.9).move_to(UP * 0.2)
    self.cap('القاعدة الأساسية: ارفع الأس واقسم عليه.')
    self.play(Write(r1), run_time=1.2)
    self.play(FadeIn(r2, shift=UP * 0.08))
    self.wait(1.6)
