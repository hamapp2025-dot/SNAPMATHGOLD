from __future__ import annotations

from manim import DOWN, UP, FadeOut, Flash, MathTex, Write

from snapmath_manim.threeblue import C_GREEN, C_SIN, C_TAN, Base3B1BScene


class FactorTheoremClip(Base3B1BScene):
    lesson_id = 'u1-c1.5'

    def construct(self):
        self.section_label('نظرية العامل')
        rule = MathTex(r'P(c) = 0 \iff (x-c)\mid P(x)', font_size=36, color=C_SIN)
        rule.move_to(UP * 1.6)
        self.cap('إذا كانت قيمة الدالة عند العدد صفرًا فالقوس عامل لها.')
        self.play(Write(rule), run_time=1.3)
        self.play(Flash(rule, color=C_SIN, line_length=0.12, num_lines=12, flash_radius=1.4))
        self.play(FadeOut(rule, shift=UP * 0.2))

        p = MathTex(r'P(x) = x^{3} + 6x^{2} + 5x - 12', font_size=32).move_to(UP * 1.5)
        self.play(Write(p), run_time=1.1)
        test = MathTex(r'P(-4) = -64 + 96 - 20 - 12 = 0', font_size=28, color=C_GREEN)
        test.move_to(UP * 0.2)
        self.cap('نجرّب ناقص أربعة فتكون النتيجة صفرًا.')
        self.play(Write(test), run_time=1.2)

        fac = MathTex(r'P(x) = (x+4)(x+3)(x-1)', font_size=30, color=C_TAN).move_to(DOWN * 1.2)
        self.play(Write(fac), run_time=1.2)
        self.play(Flash(fac, color=C_TAN, line_length=0.12, num_lines=12, flash_radius=1.3))
        self.cap('فالقوس عامل ونكمل التحليل بسهولة.', hold=2.0)
        self.wait(0.4)
        self.flush()
