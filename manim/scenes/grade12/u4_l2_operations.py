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


class ComplexOperationsScene(Base3B1BScene):
  lesson_id = 'u4-l2'

  def construct(self):
    self.s_multiply()
    self.s_example()
    self.s_conjugate()
    self.s_recap()
    self.flush()

  def s_multiply(self):
    self.section_label('ضرب الأعداد المركبة')
    m = MathTex(r'(a+bi)(c+di)=', r'(ac-bd)', r'+', r'(ad+bc)\,i', font_size=38)
    m.set_color_by_tex(r'(ac-bd)', C_COS)
    m.set_color_by_tex(r'(ad+bc)\,i', C_SIN)
    self.fit(m, 4.3).move_to(UP * 0.6)
    note = ar('اضرب كالمعتاد، وتذكّر أن i² = −1.', size=24, color='#AEB8DC')
    self.fit(note, 4.3).next_to(m, DOWN, buff=0.8)
    self.cap('نضرب العددين المركبين كالأقواس العادية.')
    self.play(Write(m), run_time=1.4)
    self.play(FadeIn(note, shift=UP * 0.08))
    self.cap('الجزء الحقيقي منفصل عن التخيلي.')
    self._m = VGroup(m, note)

  def s_example(self):
    self.clear_body(self._m)
    self.section_label('مثال محلول')
    e0 = MathTex(r'(2+3i)(1-i)', font_size=48).move_to(UP * 1.3)
    e1 = MathTex(r'= 2 - 2i + 3i - 3i^{2}', font_size=38).next_to(e0, DOWN, buff=0.7)
    e2 = MathTex(r'= 2 + i + 3', font_size=40).next_to(e1, DOWN, buff=0.6)
    e3 = MathTex(r'= 5 + i', font_size=52, color=C_GREEN).next_to(e2, DOWN, buff=0.6)
    self.cap('افتح القوسين حداً حداً.')
    self.play(Write(e0), run_time=1.0)
    self.play(Write(e1), run_time=1.2)
    self.cap('عوّض i² بسالب واحد فيصبح 3i² = −3.')
    self.play(Write(e2), run_time=1.0)
    self.play(Write(e3), run_time=0.8)
    self.play(Flash(e3, color=C_GREEN, line_length=0.16, num_lines=14, flash_radius=1.4))
    self.cap('اجمع المتشابهات فتحصل على النتيجة.')
    self._e = VGroup(e0, e1, e2, e3)

  def s_conjugate(self):
    self.clear_body(self._e)
    self.section_label('المرافق')
    c1 = MathTex(r'\bar{z} = a - bi', font_size=48).move_to(UP * 1.0)
    c1.set_color_by_tex('a', C_COS)
    c2 = MathTex(r'z\cdot\bar{z} = a^{2}+b^{2} = |z|^{2}', font_size=42, color=C_GREEN).next_to(c1, DOWN, buff=0.8)
    self.cap('مرافق العدد يقلب إشارة الجزء التخيلي.')
    self.play(Write(c1), run_time=1.1)
    self.play(Write(c2), run_time=1.2)
    self.play(Flash(c2, color=C_GREEN, line_length=0.14, num_lines=12, flash_radius=1.4))
    self.cap('وضرب العدد في مرافقه يعطي مربع المقياس.')
    self._c = VGroup(c1, c2)

  def s_recap(self):
    self.clear_body(self._c)
    self.section_label('الخلاصة')
    r1 = MathTex(r'i^{2} = -1', font_size=44, color=C_TAN)
    r2 = MathTex(r'\bar{z} = a - bi', font_size=44)
    r3 = MathTex(r'z\bar{z} = |z|^{2}', font_size=44, color=C_GREEN)
    stack = VGroup(*[self.fit(x, 4.0) for x in (r1, r2, r3)]).arrange(DOWN, buff=0.6).move_to(UP * 0.2)
    self.cap('ثلاث حقائق تحكم كل العمليات.')
    self.play(Write(r1), run_time=0.9)
    self.play(Write(r2), run_time=0.9)
    self.play(Write(r3), run_time=0.9)
    self.wait(1.6)
