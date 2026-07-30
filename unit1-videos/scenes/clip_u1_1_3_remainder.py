from __future__ import annotations

from manim import DOWN, UP, FadeOut, Flash, MathTex, VGroup, Write

from snapmath_manim.threeblue import C_GREEN, C_MUT, C_SIN, Base3B1BScene


class RemainderTheoremClip(Base3B1BScene):
    lesson_id = 'u1-c1.3'

    def construct(self):
        self.section_label('نظرية الباقي')
        rule = MathTex(r'P(x) \div (x-c)\ \Rightarrow\ R = P(c)', font_size=36, color=C_SIN)
        rule.move_to(UP * 1.6)
        self.cap('باقي القسمة على القوس يساوي قيمة الدالة عند الجذر.')
        self.play(Write(rule), run_time=1.3)
        self.play(Flash(rule, color=C_SIN, line_length=0.12, num_lines=12, flash_radius=1.4))
        self.play(FadeOut(rule, shift=UP * 0.2))

        p = MathTex(r'P(x) = 2x^{3} - 7x^{2} + 5', font_size=32).move_to(UP * 1.5)
        self.play(Write(p), run_time=1.1)
        self.cap('بدل القسمة الطويلة نعوّض قيمة الجذر مباشرة.')

        step = MathTex(r'P(3) = 54 - 63 + 5', font_size=32, color=C_MUT).move_to(UP * 0.2)
        self.play(Write(step), run_time=1.1)
        res = MathTex(r'= -4', font_size=40, color=C_GREEN).move_to(DOWN * 1.0)
        self.play(Write(res), run_time=0.9)
        self.play(Flash(res, color=C_GREEN, line_length=0.14, num_lines=14, flash_radius=1.2))
        self.cap('فالباقي سالب أربعة دون أي قسمة.', hold=2.0)
        self.wait(0.4)
        self.flush()
