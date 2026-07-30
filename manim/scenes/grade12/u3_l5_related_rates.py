from __future__ import annotations

from manim import (
  DOWN,
  UP,
  Circle,
  Create,
  FadeIn,
  Flash,
  MathTex,
  VGroup,
  Write,
)

from snapmath_manim.threeblue import C_COS, C_GREEN, C_SIN, C_TAN, Base3B1BScene, ar


class RelatedRatesScene(Base3B1BScene):
  lesson_id = 'u3-l5'

  def construct(self):
    self.s_idea()
    self.s_setup()
    self.s_solve()
    self.s_recap()
    self.flush()

  def s_idea(self):
    self.section_label('المعدلات المترابطة')
    note = ar('كميات تتغير مع الزمن وترتبط بعضها ببعض.', size=26, color='#AEB8DC')
    self.fit(note, 4.3).move_to(UP * 1.2)
    circle = Circle(radius=0.5, color=C_COS, stroke_width=5).move_to(DOWN * 0.6)
    self.cap('عندما يكبر نصف القطر، يكبر الحجم.')
    self.play(FadeIn(note, shift=UP * 0.08))
    self.play(Create(circle))
    self.play(circle.animate.scale(2.6), run_time=2.2)
    self.cap('نربط معدل أحدهما بمعدل الآخر عبر الزمن.')
    self._i = VGroup(note, circle)

  def s_setup(self):
    self.clear_body(self._i)
    self.section_label('كرة يكبر نصف قطرها')
    e0 = MathTex(r'V = \tfrac{4}{3}\pi r^{3}', font_size=48).move_to(UP * 1.1)
    g1 = MathTex(r'\dfrac{dr}{dt} = 2', font_size=42, color=C_SIN).next_to(e0, DOWN, buff=0.7)
    g2 = MathTex(r'r = 3', font_size=42, color=C_COS).next_to(g1, DOWN, buff=0.6)
    self.cap('حجم الكرة يعتمد على نصف قطرها.')
    self.play(Write(e0), run_time=1.1)
    self.play(Write(g1), Write(g2), run_time=1.2)
    self.cap('معطى معدل نصف القطر، والمطلوب معدل الحجم.')
    self._s = VGroup(e0, g1, g2)

  def s_solve(self):
    self.clear_body(self._s)
    self.section_label('الاشتقاق بالنسبة للزمن')
    e1 = MathTex(r'\dfrac{dV}{dt} = 4\pi r^{2}\,\dfrac{dr}{dt}', font_size=44).move_to(UP * 1.0)
    e2 = MathTex(r'= 4\pi (3)^{2}(2)', font_size=42).next_to(e1, DOWN, buff=0.6)
    e3 = MathTex(r'= 72\pi \ \mathrm{cm}^3/\mathrm{s}', font_size=48, color=C_GREEN).next_to(e2, DOWN, buff=0.6)
    self.cap('اشتق الحجم بالنسبة للزمن بقاعدة السلسلة.')
    self.play(Write(e1), run_time=1.2)
    self.play(Write(e2), run_time=1.0)
    self.play(Write(e3), run_time=0.9)
    self.play(Flash(e3, color=C_GREEN, line_length=0.16, num_lines=14, flash_radius=1.4))
    self.cap('عوّض القيم فتحصل على 72π.')
    self._so = VGroup(e1, e2, e3)

  def s_recap(self):
    self.clear_body(self._so)
    self.section_label('الخلاصة')
    r1 = ar('١. اكتب العلاقة بين الكميات', size=25, color='#AEB8DC')
    r2 = ar('٢. اشتق الطرفين بالنسبة للزمن', size=25, color='#AEB8DC')
    r3 = ar('٣. عوّض المعطيات لإيجاد المعدل', size=25, color='#AEB8DC')
    stack = VGroup(*[self.fit(x, 4.2) for x in (r1, r2, r3)]).arrange(DOWN, buff=0.6).move_to(UP * 0.2)
    self.cap('اربط، ثم اشتق بالنسبة للزمن، ثم عوّض.')
    self.play(FadeIn(r1, shift=UP * 0.08))
    self.play(FadeIn(r2, shift=UP * 0.08))
    self.play(FadeIn(r3, shift=UP * 0.08))
    self.cap('قاعدة السلسلة هي جوهر هذه المسائل.', hold=2.0)
    self.wait(0.6)
