from __future__ import annotations

from manim import DOWN, UP, Flash, MathTex, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_SIN, Base3B1BScene


class CoverUpClip(Base3B1BScene):
    lesson_id = 'u1-c2.5'

    def construct(self):
        self.section_label('طريقة التغطية')
        whole = MathTex(r'\dfrac{8x+3}{x(x-3)} = \dfrac{A}{x} + \dfrac{B}{x-3}',
                        font_size=32, color=C_SIN)
        self.fit(whole, 4.3).move_to(UP * 1.6)
        self.cap('طريقة سريعة لإيجاد البسوط المجهولة مباشرة.')
        self.play(Write(whole), run_time=1.4)

        a = MathTex(r'A = \dfrac{8(0)+3}{0-3} = -1', font_size=30, color=C_COS).move_to(UP * 0.1)
        self.cap('نغطّي القوس ونعوّض جذره لنجد بسطه.')
        self.play(Write(a), run_time=1.2)

        b = MathTex(r'B = \dfrac{8(3)+3}{3} = 9', font_size=30, color=C_COS).move_to(DOWN * 1.0)
        self.play(Write(b), run_time=1.2)

        res = MathTex(r'= \dfrac{-1}{x} + \dfrac{9}{x-3}', font_size=34, color=C_GREEN)
        res.move_to(DOWN * 2.1)
        self.play(Write(res), run_time=1.0)
        self.play(Flash(res, color=C_GREEN, line_length=0.14, num_lines=14, flash_radius=1.2))
        self.cap('فنحصل على البسوط بخطوة واحدة لكل عامل.', hold=2.0)
        self.wait(0.4)
        self.flush()
