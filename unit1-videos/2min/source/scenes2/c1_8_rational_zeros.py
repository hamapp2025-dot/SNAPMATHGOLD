from __future__ import annotations

from manim import DOWN, UP, FadeIn, FadeOut, Flash, MathTex, VGroup, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_MUT, C_SIN, C_TAN, Base3B1BScene


class RationalZeros2Min(Base3B1BScene):
    lesson_id = 'u1-c1.8'

    def construct(self):
        # hook
        self.section_label('نظرية الأصفار النسبية')
        q = MathTex(r'3x^{3} + 14x^{2} - 7x - 10 = 0', font_size=30, color=C_SIN)
        self.fit(q, 4.5).move_to(UP * 1.5)
        self.cap('من أين نبدأ البحث عن جذور معادلة كهذه؟', hold=8.5)
        self.play(Write(q), run_time=1.2)
        self.cap('النظرية تعطينا قائمة مرشّحين قصيرة بدل التخمين.', hold=8.5)
        self.play(FadeOut(q, shift=UP * 0.2))

        # rule
        rule = MathTex(r'\pm\dfrac{p}{q}', font_size=44, color=C_SIN).move_to(UP * 1.6)
        sub1 = MathTex(r'p \mid a_0', font_size=28, color=C_COS).next_to(rule, DOWN, buff=0.4)
        sub2 = MathTex(r'q \mid a_n', font_size=28, color=C_TAN).next_to(sub1, DOWN, buff=0.25)
        self.cap('البسط من عوامل الحد الثابت، والمقام من عوامل المعامل الأعلى.', hold=9.6)
        self.play(Write(rule), run_time=1.0)
        self.play(FadeIn(sub1), FadeIn(sub2))
        self.wait(1.2)

        # example 1 — textbook
        self.play(FadeOut(VGroup(rule, sub1, sub2), shift=UP * 0.2))
        self.section_label('مثال من الكتاب')
        p = MathTex(r'P(x) = 3x^{3} + 14x^{2} - 7x - 10', font_size=28).move_to(UP * 1.7)
        self.fit(p, 4.5)
        self.play(Write(p), run_time=1.1)
        cand = MathTex(r'\pm 1,\ \pm 2,\ \pm 5,\ \pm 10,\ \pm\tfrac{1}{3},\ \pm\tfrac{2}{3},\ \dots',
                       font_size=25, color=C_MUT)
        self.fit(cand, 4.4).move_to(UP * 0.6)
        self.play(Write(cand), run_time=1.3)
        self.cap('المرشّحون من عوامل العشرة على عوامل الثلاثة.', hold=8.5)

        t = MathTex(r'P(1) = 3 + 14 - 7 - 10 = 0', font_size=28, color=C_GREEN).move_to(DOWN * 0.5)
        self.play(Write(t), run_time=1.2)
        self.play(Flash(t, color=C_GREEN, line_length=0.12, num_lines=12, flash_radius=1.2))
        self.wait(1.5)
        self.cap('نختبرهم بالترتيب: الواحد يعطي صفرًا.', hold=7.9)

        f1 = MathTex(r'P(x) = (x-1)(3x+2)(x+5)', font_size=28, color=C_TAN).move_to(DOWN * 1.6)
        self.play(Write(f1), run_time=1.2)
        self.cap('ثم نقسم ونحلّل الباقي كاملًا.', hold=7.4)

        # example 2 — exam style
        self.clear_body(p, cand, t, f1)
        self.section_label('سؤال بنمط الامتحان')
        p2 = MathTex(r'P(x) = 2x^{3} + x^{2} - 5x + 2', font_size=28).move_to(UP * 1.7)
        self.fit(p2, 4.5)
        self.play(Write(p2), run_time=1.1)
        cand2 = MathTex(r'\pm 1,\ \pm 2,\ \pm\tfrac{1}{2}', font_size=26, color=C_MUT)
        cand2.move_to(UP * 0.6)
        self.play(Write(cand2), run_time=1.1)
        self.cap('اكتب مرشّحيك أولًا: عوامل الاثنين على عوامل الاثنين.', hold=9.2)

        t2 = MathTex(r'P(1) = 2 + 1 - 5 + 2 = 0', font_size=28, color=C_GREEN).move_to(DOWN * 0.5)
        self.play(Write(t2), run_time=1.2)
        self.cap('الواحد جذر من أول اختبار.', hold=6.8)

        f2 = MathTex(r'P(x) = (x-1)(2x-1)(x+2)', font_size=28, color=C_TAN).move_to(DOWN * 1.6)
        self.play(Write(f2), run_time=1.2)
        self.play(Flash(f2, color=C_TAN, line_length=0.13, num_lines=12, flash_radius=1.4))
        self.wait(1.5)
        self.cap('لاحظ الجذر الكسري نصف: جاء من مقام المرشّحين.', hold=8.5)

        # recap
        self.clear_body(p2, cand2, t2, f2)
        self.section_label('الخلاصة')
        recap = MathTex(r'\pm\dfrac{p}{q}', font_size=52, color=C_SIN).move_to(UP * 0.8)
        self.play(Write(recap), run_time=1.0)
        self.play(Flash(recap, color=C_SIN, line_length=0.14, num_lines=14, flash_radius=1.3))
        self.wait(1.5)
        self.cap('قائمة قصيرة، اختبار سريع، ثم قسمة تُكمل الحل.', hold=8.5)
        self.wait(0.6)
        self.flush()
