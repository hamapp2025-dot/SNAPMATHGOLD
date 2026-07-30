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


class ChainRuleScene(Base3B1BScene):
  lesson_id = 'u3-l3'

  def construct(self):
    self.s_rule()
    self.s_ex1()
    self.s_ex2()
    self.s_recap()
    self.flush()

  def s_rule(self):
    self.section_label('قاعدة السلسلة')
    r = MathTex(r"\dfrac{d}{dx}\,", r"f(g(x))", r"=", r"f'(g(x))", r"\cdot", r"g'(x)", font_size=42)
    r.set_color_by_tex(r"f'(g(x))", C_SIN)
    r.set_color_by_tex(r"g'(x)", C_COS)
    self.fit(r, 4.3).move_to(UP * 0.6)
    note = ar('اشتق الدالة الخارجية، ثم اضرب بمشتقة الداخلية.', size=23, color='#AEB8DC')
    self.fit(note, 4.3).next_to(r, DOWN, buff=0.8)
    self.cap('عند تركيب دالتين نستخدم قاعدة السلسلة.')
    self.play(Write(r), run_time=1.4)
    self.play(FadeIn(note, shift=UP * 0.08))
    self.cap('خارجية أولاً، ثم × مشتقة الداخلية.')
    self._r = VGroup(r, note)

  def s_ex1(self):
    self.clear_body(self._r)
    self.section_label('مثال أول')
    e0 = MathTex(r'y = \sin(3x^{2})', font_size=46).move_to(UP * 1.2)
    e1 = MathTex(r"y' = ", r"\cos(3x^{2})", r"\cdot", r"6x", font_size=42)
    e1.set_color_by_tex(r"\cos(3x^{2})", C_SIN)
    e1.set_color_by_tex(r"6x", C_COS)
    self.fit(e1, 4.3).next_to(e0, DOWN, buff=0.8)
    e2 = MathTex(r"= 6x\,\cos(3x^{2})", font_size=42, color=C_GREEN).next_to(e1, DOWN, buff=0.7)
    self.cap('الخارجية جيب، والداخلية 3x².')
    self.play(Write(e0), run_time=1.0)
    self.play(Write(e1), run_time=1.3)
    self.play(Write(e2), run_time=0.9)
    self.play(Flash(e2, color=C_GREEN, line_length=0.14, num_lines=12, flash_radius=1.4))
    self.cap('مشتقة الجيب جيب تمام، × مشتقة الداخلية 6x.')
    self._e1 = VGroup(e0, e1, e2)

  def s_ex2(self):
    self.clear_body(self._e1)
    self.section_label('مثال ثانٍ')
    e0 = MathTex(r'y = (2x+1)^{5}', font_size=46).move_to(UP * 1.2)
    e1 = MathTex(r"y' = ", r"5(2x+1)^{4}", r"\cdot", r"2", font_size=42)
    e1.set_color_by_tex(r"5(2x+1)^{4}", C_SIN)
    e1.set_color_by_tex(r"2", C_COS)
    self.fit(e1, 4.3).next_to(e0, DOWN, buff=0.8)
    e2 = MathTex(r"= 10(2x+1)^{4}", font_size=44, color=C_GREEN).next_to(e1, DOWN, buff=0.7)
    self.cap('القوة خارجية، والقوس داخلي.')
    self.play(Write(e0), run_time=1.0)
    self.play(Write(e1), run_time=1.3)
    self.play(Write(e2), run_time=0.9)
    self.play(Flash(e2, color=C_GREEN, line_length=0.14, num_lines=12, flash_radius=1.4))
    self.cap('أنزل الأس واطرح واحداً، × مشتقة الداخلية.')
    self._e2 = VGroup(e0, e1, e2)

  def s_recap(self):
    self.clear_body(self._e2)
    self.section_label('الخلاصة')
    r = MathTex(r"[f(g)]' = f'(g)\cdot g'", font_size=46)
    self.fit(r, 4.2).move_to(UP * 0.4)
    note = ar('من الخارج إلى الداخل، ثم اضرب.', size=26, color='#AEB8DC')
    self.fit(note, 4.2).next_to(r, DOWN, buff=0.8)
    self.cap('تذكّر: من الخارج للداخل، ثم اضرب.')
    self.play(Write(r), run_time=1.1)
    self.play(FadeIn(note, shift=UP * 0.08))
    self.wait(1.6)
