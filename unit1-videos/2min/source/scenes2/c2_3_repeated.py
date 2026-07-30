from __future__ import annotations

from manim import DOWN, UP, FadeOut, Flash, MathTex, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_MUT, C_SIN, Base3B1BScene


class RepeatedFactor2Min(Base3B1BScene):
    lesson_id = 'u1-c2.3'

    def construct(self):
        # hook
        self.section_label('عوامل مكرّرة')
        q = MathTex(r'\dfrac{2x+1}{(x-1)^{2}}\ =\ ?', font_size=34, color=C_SIN).move_to(UP * 1.5)
        self.cap('العامل نفسه مكرّر مرتين؛ ماذا يتغيّر في التفكيك؟', hold=8.1)
        self.play(Write(q), run_time=1.2)
        self.play(FadeOut(q, shift=UP * 0.2))

        # rule
        rule = MathTex(r'\dfrac{N(x)}{(x-a)^{2}} = \dfrac{A}{x-a} + \dfrac{B}{(x-a)^{2}}',
                       font_size=28, color=C_SIN)
        self.fit(rule, 4.5).move_to(UP * 1.5)
        self.cap('القاعدة: حدّ لكل قوة من العامل حتى أعلاها.', hold=8.1)
        self.play(Write(rule), run_time=1.4)
        self.play(Flash(rule, color=C_SIN, line_length=0.12, num_lines=12, flash_radius=1.5))
        self.wait(1.5)
        self.cap('الخطأ الشائع: نسيان حدّ القوة الأولى.', hold=7.1)

        # example 1 — textbook
        self.play(FadeOut(rule, shift=UP * 0.2))
        self.section_label('مثال من الكتاب')
        st = MathTex(r'\dfrac{2x+1}{(x-1)^{2}} = \dfrac{A}{x-1} + \dfrac{B}{(x-1)^{2}}',
                     font_size=26, color=C_SIN)
        self.fit(st, 4.5).move_to(UP * 1.6)
        self.play(Write(st), run_time=1.4)
        m = MathTex(r'2x+1 = A(x-1) + B', font_size=28, color=C_MUT).move_to(UP * 0.4)
        self.play(Write(m), run_time=1.2)
        self.cap('نضرب في المقام كاملًا.', hold=6.5)

        v1 = MathTex(r'x=1:\ B = 3', font_size=28, color=C_COS).move_to(DOWN * 0.5)
        self.play(Write(v1), run_time=1.0)
        self.cap('الجذر يكشف حدّ القوة العليا مباشرة.', hold=7.1)
        v2 = MathTex(r'x^{1}:\ A = 2', font_size=28, color=C_COS).move_to(DOWN * 1.3)
        self.play(Write(v2), run_time=1.0)
        self.cap('ونقارن معاملات س لإيجاد الآخر.', hold=7.1)

        r1 = MathTex(r'= \dfrac{2}{x-1} + \dfrac{3}{(x-1)^{2}}', font_size=30, color=C_GREEN)
        r1.move_to(DOWN * 2.3)
        self.play(Write(r1), run_time=1.1)
        self.play(Flash(r1, color=C_GREEN, line_length=0.13, num_lines=12, flash_radius=1.3))
        self.wait(1.5)
        self.cap('حدّان لعامل واحد مكرّر.', hold=6.5)

        # example 2 — exam style
        self.clear_body(st, m, v1, v2, r1)
        self.section_label('سؤال بنمط الامتحان')
        st2 = MathTex(r'\dfrac{x+3}{(x+2)^{2}} = \dfrac{A}{x+2} + \dfrac{B}{(x+2)^{2}}',
                      font_size=26, color=C_SIN)
        self.fit(st2, 4.5).move_to(UP * 1.6)
        self.play(Write(st2), run_time=1.4)
        m2 = MathTex(r'x+3 = A(x+2) + B', font_size=28, color=C_MUT).move_to(UP * 0.4)
        self.play(Write(m2), run_time=1.1)
        self.cap('نفس البنية بعامل مختلف.', hold=6.5)

        v3 = MathTex(r'x=-2:\ B = 1,\qquad x^{1}:\ A = 1', font_size=27, color=C_COS)
        self.fit(v3, 4.4).move_to(DOWN * 0.6)
        self.play(Write(v3), run_time=1.2)
        self.cap('جذر للقوة العليا ومقارنة للقوة الأولى.', hold=7.5)

        r2 = MathTex(r'= \dfrac{1}{x+2} + \dfrac{1}{(x+2)^{2}}', font_size=30, color=C_GREEN)
        r2.move_to(DOWN * 1.8)
        self.play(Write(r2), run_time=1.1)
        self.play(Flash(r2, color=C_GREEN, line_length=0.13, num_lines=12, flash_radius=1.3))
        self.wait(1.5)
        self.cap('كلا البسطين واحد هنا، والحدّان معًا ضروريان.', hold=8.1)

        # recap
        self.clear_body(st2, m2, v3, r2)
        self.section_label('الخلاصة')
        recap = MathTex(r'\dfrac{A}{x-a} + \dfrac{B}{(x-a)^{2}}', font_size=34, color=C_SIN)
        recap.move_to(UP * 0.8)
        self.fit(recap, 4.4)
        self.play(Write(recap), run_time=1.0)
        self.play(Flash(recap, color=C_SIN, line_length=0.14, num_lines=14, flash_radius=1.4))
        self.wait(1.5)
        self.cap('عامل مكرّر يعني حدًّا لكل قوة، ولا تنسَ الأولى أبدًا.', hold=8.7)
        self.wait(0.6)
        self.flush()
