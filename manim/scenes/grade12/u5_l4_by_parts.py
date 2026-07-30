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


class ByPartsScene(Base3B1BScene):
  lesson_id = 'u5-l4'

  def construct(self):
    self.s_formula()
    self.s_example()
    self.s_recap()
    self.flush()

  def s_formula(self):
    self.section_label('التكامل بالتجزئة')
    f = MathTex(r'\int u\,dv = ', r'u\,v', r'-', r'\int v\,du', font_size=46)
    f.set_color_by_tex(r'u\,v', C_SIN)
    f.set_color_by_tex(r'\int v\,du', C_COS)
    self.fit(f, 4.3).move_to(UP * 0.7)
    note = ar('نستخدمها لتكامل حاصل ضرب دالتين مختلفتين.', size=23, color='#AEB8DC')
    self.fit(note, 4.3).next_to(f, DOWN, buff=0.8)
    self.cap('التجزئة هي عكس قاعدة الضرب في الاشتقاق.')
    self.play(Write(f), run_time=1.4)
    self.play(FadeIn(note, shift=UP * 0.08))
    self.cap('اختر u لتشتقه، و dv لتكامله.')
    self._f = VGroup(f, note)

  def s_example(self):
    self.clear_body(self._f)
    self.section_label('مثال محلول')
    e0 = MathTex(r'\int x\,e^{x}\,dx', font_size=46).move_to(UP * 1.6)
    sub = MathTex(r'u = x,\quad dv = e^{x}dx', font_size=32, color=C_SIN).next_to(e0, DOWN, buff=0.6)
    e1 = MathTex(r'= x\,e^{x} - \int e^{x}\,dx', font_size=40).next_to(sub, DOWN, buff=0.6)
    e2 = MathTex(r'= x\,e^{x} - e^{x} + C', font_size=44, color=C_GREEN).next_to(e1, DOWN, buff=0.6)
    self.cap('اختر u يساوي x، و dv يساوي e أُس x.')
    self.play(Write(e0), run_time=1.0)
    self.play(Write(sub), run_time=1.0)
    self.cap('طبّق الصيغة: u v ناقص تكامل v du.')
    self.play(Write(e1), run_time=1.2)
    self.play(Write(e2), run_time=1.0)
    self.play(Flash(e2, color=C_GREEN, line_length=0.14, num_lines=12, flash_radius=1.4))
    self.cap('التكامل المتبقي بسيط، فنحصل على النتيجة.')
    self._e = VGroup(e0, sub, e1, e2)

  def s_recap(self):
    self.clear_body(self._e)
    self.section_label('الخلاصة')
    r1 = MathTex(r'\int u\,dv = uv - \int v\,du', font_size=42)
    r2 = ar('اختر u الذي يبسُط عند اشتقاقه.', size=25, color='#AEB8DC')
    stack = VGroup(self.fit(r1, 4.3), self.fit(r2, 4.2)).arrange(DOWN, buff=0.9).move_to(UP * 0.2)
    self.cap('حسن اختيار u يجعل التكامل الثاني أسهل.')
    self.play(Write(r1), run_time=1.2)
    self.play(FadeIn(r2, shift=UP * 0.08))
    self.wait(1.6)
