from __future__ import annotations

from manim import DOWN, UP, Flash, MathTex, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_SIN, C_TAN, Base3B1BScene


class SolvingEquationsClip(Base3B1BScene):
    lesson_id = 'u1-c1.9'

    def construct(self):
        self.section_label('حل المعادلات كثيرة الحدود')
        eq = MathTex(r'x^{3} + 6x^{2} + 5x - 12 = 0', font_size=36, color=C_SIN)
        eq.move_to(UP * 1.7)
        self.cap('لحل المعادلة نحلّلها إلى عوامل أولًا.')
        self.play(Write(eq), run_time=1.2)

        fac = MathTex(r'(x-1)(x+3)(x+4) = 0', font_size=34, color=C_TAN).move_to(UP * 0.4)
        self.play(Write(fac), run_time=1.2)
        self.cap('حاصل الضرب صفر يعني أحد العوامل صفر.')

        each = MathTex(r'x-1=0 \;\lor\; x+3=0 \;\lor\; x+4=0',
                       font_size=28, color=C_COS).move_to(DOWN * 0.7)
        self.play(Write(each), run_time=1.2)

        res = MathTex(r'x = 1,\ -3,\ -4', font_size=40, color=C_GREEN).move_to(DOWN * 1.9)
        self.play(Write(res), run_time=1.0)
        self.play(Flash(res, color=C_GREEN, line_length=0.14, num_lines=14, flash_radius=1.3))
        self.cap('فللمعادلة ثلاثة حلول.', hold=2.0)
        self.wait(0.4)
        self.flush()
