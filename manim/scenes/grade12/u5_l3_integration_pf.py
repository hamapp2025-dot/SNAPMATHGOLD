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


class IntegrationPFScene(Base3B1BScene):
  lesson_id = 'u5-l3'

  def construct(self):
    self.s_idea()
    self.s_example()
    self.s_recap()
    self.flush()

  def s_idea(self):
    self.section_label('التكامل بالكسور الجزئية')
    m = MathTex(r'\int \dfrac{A}{x-a}\,dx = A\,\ln|x-a| + C', font_size=38)
    self.fit(m, 4.3).move_to(UP * 0.7)
    note = ar('جزّئ الكسر أولاً، ثم كامل كل جزء.', size=24, color='#AEB8DC')
    self.fit(note, 4.3).next_to(m, DOWN, buff=0.8)
    self.cap('نحوّل الكسر المعقد إلى كسور بسيطة.')
    self.play(Write(m), run_time=1.3)
    self.play(FadeIn(note, shift=UP * 0.08))
    self.cap('تكامل كل كسر بسيط يعطي لوغاريتماً.')
    self._i = VGroup(m, note)

  def s_example(self):
    self.clear_body(self._i)
    self.section_label('مثال محلول')
    e0 = MathTex(r'\int \dfrac{1}{(x+1)(x-1)}\,dx', font_size=40).move_to(UP * 1.6)
    e1 = MathTex(r'= \int\!\left(\dfrac{1/2}{x-1} - \dfrac{1/2}{x+1}\right)dx', font_size=32)
    self.fit(e1, 4.3).next_to(e0, DOWN, buff=0.6)
    e2 = MathTex(r'= \tfrac12\ln|x-1| - \tfrac12\ln|x+1| + C', font_size=32, color=C_GREEN)
    self.fit(e2, 4.4).next_to(e1, DOWN, buff=0.7)
    self.cap('جزّئ الكسر إلى كسرين بسيطين.')
    self.play(Write(e0), run_time=1.1)
    self.play(Write(e1), run_time=1.3)
    self.cap('كامل كل كسر فينتج لوغاريتم.')
    self.play(Write(e2), run_time=1.3)
    self.play(Flash(e2, color=C_GREEN, line_length=0.14, num_lines=12, flash_radius=1.4))
    self.cap('فتكون النتيجة فرق لوغاريتمين.')
    self._e = VGroup(e0, e1, e2)

  def s_recap(self):
    self.clear_body(self._e)
    self.section_label('الخلاصة')
    r1 = MathTex(r'\int \dfrac{A}{x-a}\,dx = A\ln|x-a| + C', font_size=36)
    r2 = ar('جزّئ، ثم كامل كل كسر إلى لوغاريتم.', size=25, color='#AEB8DC')
    stack = VGroup(self.fit(r1, 4.4), self.fit(r2, 4.2)).arrange(DOWN, buff=0.9).move_to(UP * 0.2)
    self.cap('الكسور الجزئية تفتح باب تكامل اللوغاريتمات.')
    self.play(Write(r1), run_time=1.2)
    self.play(FadeIn(r2, shift=UP * 0.08))
    self.wait(1.6)
