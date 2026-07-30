from __future__ import annotations

from manim import DOWN, UP, FadeOut, Flash, MathTex, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_MUT, C_SIN, C_TAN, Base3B1BScene


class FullFactor2Min(Base3B1BScene):
    lesson_id = 'u1-c1.6'

    def construct(self):
        # hook
        self.section_label('التحليل الكامل لكثير الحدود')
        q = MathTex(r'x^{3} + 6x^{2} + 5x - 12 = (\ ?\ )(\ ?\ )(\ ?\ )',
                    font_size=28, color=C_SIN)
        self.fit(q, 4.5).move_to(UP * 1.5)
        self.cap('كيف نحلّل كثير حدود من الدرجة الثالثة بالكامل؟', hold=9.3)
        self.play(Write(q), run_time=1.3)
        self.play(FadeOut(q, shift=UP * 0.2))

        # rule
        rule = MathTex(r'\text{find a root} \to \text{divide} \to \text{factor the rest}',
                       font_size=26, color=C_MUT).move_to(UP * 1.5)
        self.fit(rule, 4.5)
        self.cap('الخطة: جد جذرًا واحدًا، اقسم عليه، ثم حلّل الباقي.', hold=10.0)
        self.play(Write(rule), run_time=1.3)
        self.wait(1.0)

        # example 1 — textbook
        self.play(FadeOut(rule, shift=UP * 0.2))
        self.section_label('مثال من الكتاب')
        p = MathTex(r'P(x) = x^{3} + 6x^{2} + 5x - 12', font_size=30).move_to(UP * 1.7)
        self.play(Write(p), run_time=1.1)
        s1 = MathTex(r'P(1) = 1 + 6 + 5 - 12 = 0', font_size=28, color=C_GREEN).move_to(UP * 0.6)
        self.play(Write(s1), run_time=1.1)
        self.cap('نجرّب الأعداد الصغيرة أولًا: الواحد جذر.', hold=8.6)

        s2 = MathTex(r'\div (x-1)\ \Rightarrow\ x^{2} + 7x + 12', font_size=28, color=C_MUT)
        s2.move_to(DOWN * 0.4)
        self.play(Write(s2), run_time=1.1)
        self.cap('نقسم تركيبيًا فيتبقى مقدار تربيعي.', hold=8.6)

        r1 = MathTex(r'P(x) = (x-1)(x+3)(x+4)', font_size=30, color=C_TAN).move_to(DOWN * 1.5)
        self.play(Write(r1), run_time=1.2)
        self.play(Flash(r1, color=C_TAN, line_length=0.13, num_lines=12, flash_radius=1.4))
        self.wait(1.5)
        self.cap('التربيعي يتحلّل بالطريقة المعتادة فيكتمل التحليل.', hold=9.3)

        # example 2 — exam style
        self.clear_body(p, s1, s2, r1)
        self.section_label('سؤال بنمط الامتحان')
        p2 = MathTex(r'P(x) = x^{3} - 3x^{2} - 4x + 12', font_size=30).move_to(UP * 1.7)
        self.play(Write(p2), run_time=1.1)
        self.cap('حلّل بنفس الخطة الثلاثية.', hold=7.4)

        s3 = MathTex(r'P(2) = 8 - 12 - 8 + 12 = 0', font_size=28, color=C_GREEN).move_to(UP * 0.6)
        self.play(Write(s3), run_time=1.1)
        self.cap('الاثنان جذر.', hold=6.2)

        s4 = MathTex(r'\div (x-2)\ \Rightarrow\ x^{2} - x - 6', font_size=28, color=C_MUT)
        s4.move_to(DOWN * 0.4)
        self.play(Write(s4), run_time=1.1)
        self.cap('نقسم ثم نحلّل التربيعي الباقي.', hold=8.1)

        r2 = MathTex(r'P(x) = (x-2)(x-3)(x+2)', font_size=30, color=C_TAN).move_to(DOWN * 1.5)
        self.play(Write(r2), run_time=1.2)
        self.play(Flash(r2, color=C_TAN, line_length=0.13, num_lines=12, flash_radius=1.4))
        self.wait(1.5)
        self.cap('ثلاثة عوامل خطية: اكتمل التحليل.', hold=8.1)

        # recap
        self.clear_body(p2, s3, s4, r2)
        self.section_label('الخلاصة')
        recap = MathTex(r'\text{root} \to \div \to \text{quadratic}', font_size=36, color=C_SIN)
        recap.move_to(UP * 0.8)
        self.fit(recap, 4.4)
        self.play(Write(recap), run_time=1.0)
        self.play(Flash(recap, color=C_SIN, line_length=0.14, num_lines=14, flash_radius=1.4))
        self.wait(1.5)
        self.cap('جذر واحد يفتح الباب؛ والقسمة تُنهي المهمة.', hold=9.3)
        self.wait(0.6)
        self.flush()
