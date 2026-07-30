from __future__ import annotations

from manim import DOWN, UP, FadeIn, FadeOut, Flash, MathTex, VGroup, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_MUT, C_SIN, C_TAN, Base3B1BScene, ar


class RationalZerosClip(Base3B1BScene):
  lesson_id = 'u1-c1.8'

  def construct(self):
    self.section_label('نظرية الأصفار النسبية')
    rule = MathTex(r'\pm\dfrac{p}{q}', font_size=48, color=C_GREEN).move_to(UP * 1.6)
    sub1 = ar('p من عوامل الحد الثابت', size=19, color=C_SIN).next_to(rule, DOWN, buff=0.35)
    sub2 = ar('q من عوامل معامل الحد الأعلى', size=19, color=C_COS).next_to(sub1, DOWN, buff=0.2)
    self.cap('كيف نجد أصفار كثير الحدود المحتملة؟')
    self.play(Write(rule), run_time=1.0)
    self.play(FadeIn(sub1), FadeIn(sub2))
    self.cap('الأصفار النسبية نسبة عامل من الثابت إلى عامل من المعامل الأعلى.')
    self.play(FadeOut(VGroup(rule, sub1, sub2), shift=UP * 0.2))

    p = MathTex(r'P(x) = 3x^{3} + 14x^{2} - 7x - 10', font_size=32).move_to(UP * 1.6)
    self.play(Write(p), run_time=1.1)
    cand = MathTex(r'\pm 1,\ \pm 2,\ \pm 5,\ \pm 10,\ \pm\tfrac{1}{3},\ \pm\tfrac{2}{3},\ \dots', font_size=26, color=C_MUT)
    self.fit(cand, 4.2).next_to(p, DOWN, buff=0.5)
    self.cap('نكتب قائمة المرشّحين من الثابت عشرة والمعامل ثلاثة.')
    self.play(Write(cand), run_time=1.3)

    test = MathTex(r'P(1) = 3 + 14 - 7 - 10 = 0', font_size=30, color=C_GREEN).move_to(DOWN * 0.6)
    self.cap('نختبرهم؛ الواحد يعطي صفرًا فهو جذر.')
    self.play(Write(test), run_time=1.2)
    self.play(Flash(test, color=C_GREEN, line_length=0.12, num_lines=12, flash_radius=1.1))

    fac = MathTex(r'P(x) = (x-1)(3x+2)(x+5)', font_size=30, color=C_TAN).move_to(DOWN * 1.6)
    self.cap('ومنه نحلّل كثير الحدود بالكامل.')
    self.play(Write(fac), run_time=1.3)
    self.play(Flash(fac, color=C_TAN, line_length=0.12, num_lines=12, flash_radius=1.3))
    self.cap('النظرية تختصر البحث عن الأصفار في خطوات قليلة.', hold=2.0)
    self.wait(0.5)
    self.flush()
