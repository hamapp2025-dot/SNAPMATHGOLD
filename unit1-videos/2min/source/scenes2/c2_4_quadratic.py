from __future__ import annotations

from manim import DOWN, UP, FadeOut, Flash, MathTex, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_MUT, C_SIN, Base3B1BScene


class QuadraticFactor2Min(Base3B1BScene):
    lesson_id = 'u1-c2.4'

    def construct(self):
        # hook
        self.section_label('عامل تربيعي غير قابل للتحليل')
        q = MathTex(r'\dfrac{2x^{2}+2x+2}{(x+1)(x^{2}+1)}\ =\ ?', font_size=28, color=C_SIN)
        self.fit(q, 4.5).move_to(UP * 1.5)
        self.cap('في المقام عامل تربيعي لا يتحلّل؛ ما شكل بسطه؟', hold=8.5)
        self.play(Write(q), run_time=1.3)
        self.play(FadeOut(q, shift=UP * 0.2))

        # rule
        rule = MathTex(r'\dfrac{\ \cdot\ }{x^{2}+c} \ \Rightarrow\ \dfrac{Bx + C}{x^{2}+c}',
                       font_size=30, color=C_SIN)
        self.fit(rule, 4.5).move_to(UP * 1.5)
        self.cap('القاعدة: فوق العامل التربيعي بسط خطي كامل لا ثابت فقط.', hold=9.6)
        self.play(Write(rule), run_time=1.4)
        self.play(Flash(rule, color=C_SIN, line_length=0.12, num_lines=12, flash_radius=1.5))
        self.wait(1.5)

        # example 1 — textbook
        self.play(FadeOut(rule, shift=UP * 0.2))
        self.section_label('مثال من الكتاب')
        st = MathTex(r'\dfrac{2x^{2}+2x+2}{(x+1)(x^{2}+1)} = \dfrac{A}{x+1} + \dfrac{Bx+C}{x^{2}+1}',
                     font_size=24, color=C_SIN)
        self.fit(st, 4.6).move_to(UP * 1.6)
        self.play(Write(st), run_time=1.5)
        m = MathTex(r'2x^{2}+2x+2 = A(x^{2}+1) + (Bx+C)(x+1)', font_size=24, color=C_MUT)
        self.fit(m, 4.5).move_to(UP * 0.4)
        self.play(Write(m), run_time=1.3)
        self.cap('نضرب في المقام ثم نجمع بين تعويض الجذر ومقارنة المعاملات.', hold=9.6)

        v1 = MathTex(r'x=-1:\ 2 = 2A\ \Rightarrow\ A = 1', font_size=26, color=C_COS)
        self.fit(v1, 4.4).move_to(DOWN * 0.5)
        self.play(Write(v1), run_time=1.1)
        self.cap('جذر العامل الخطي يعطي المجهول الأول.', hold=7.4)

        v2 = MathTex(r'x^{2}:\ 2 = A + B\ \Rightarrow\ B = 1,\qquad x^{0}:\ C = 1',
                     font_size=24, color=C_COS)
        self.fit(v2, 4.5).move_to(DOWN * 1.3)
        self.play(Write(v2), run_time=1.2)
        self.cap('والمقارنة تعطي الباقيين.', hold=6.8)

        r1 = MathTex(r'= \dfrac{1}{x+1} + \dfrac{x+1}{x^{2}+1}', font_size=28, color=C_GREEN)
        r1.move_to(DOWN * 2.3)
        self.play(Write(r1), run_time=1.1)
        self.play(Flash(r1, color=C_GREEN, line_length=0.13, num_lines=12, flash_radius=1.3))
        self.wait(1.5)
        self.cap('لاحظ البسط الخطي فوق التربيعي.', hold=7.4)

        # example 2 — exam style
        self.clear_body(st, m, v1, v2, r1)
        self.section_label('سؤال بنمط الامتحان')
        st2 = MathTex(r'\dfrac{3x^{2}+x+4}{x(x^{2}+4)} = \dfrac{A}{x} + \dfrac{Bx+C}{x^{2}+4}',
                      font_size=24, color=C_SIN)
        self.fit(st2, 4.6).move_to(UP * 1.6)
        self.play(Write(st2), run_time=1.5)
        self.cap('نفس الشكل: عامل خطي وعامل تربيعي صامد.', hold=7.9)

        v3 = MathTex(r'x=0:\ 4 = 4A\ \Rightarrow\ A = 1', font_size=26, color=C_COS)
        v3.move_to(UP * 0.4)
        self.play(Write(v3), run_time=1.1)
        v4 = MathTex(r'x^{2}:\ 3 = A + B\ \Rightarrow\ B = 2,\qquad x^{1}:\ C = 1',
                     font_size=24, color=C_COS)
        self.fit(v4, 4.5).move_to(DOWN * 0.5)
        self.play(Write(v4), run_time=1.2)
        self.cap('جذر ثم مقارنتان، بهدوء ودقة.', hold=7.4)

        r2 = MathTex(r'= \dfrac{1}{x} + \dfrac{2x+1}{x^{2}+4}', font_size=28, color=C_GREEN)
        r2.move_to(DOWN * 1.6)
        self.play(Write(r2), run_time=1.1)
        self.play(Flash(r2, color=C_GREEN, line_length=0.13, num_lines=12, flash_radius=1.3))
        self.wait(1.5)
        self.cap('اكتمل التفكيك بثلاثة مجاهيل.', hold=6.8)

        # recap
        self.clear_body(st2, v3, v4, r2)
        self.section_label('الخلاصة')
        recap = MathTex(r'\dfrac{Bx+C}{x^{2}+c}', font_size=44, color=C_SIN).move_to(UP * 0.8)
        self.play(Write(recap), run_time=1.0)
        self.play(Flash(recap, color=C_SIN, line_length=0.14, num_lines=14, flash_radius=1.4))
        self.wait(1.5)
        self.cap('تربيعي صامد يعني بسطًا خطيًا: هذه أشهر نقطة خصم في الامتحان.', hold=9.6)
        self.wait(0.6)
        self.flush()
