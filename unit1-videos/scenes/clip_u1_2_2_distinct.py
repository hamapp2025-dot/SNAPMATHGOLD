from __future__ import annotations

from manim import DOWN, UP, Flash, MathTex, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_SIN, Base3B1BScene


class DistinctLinearClip(Base3B1BScene):
    lesson_id = 'u1-c2.2'

    def construct(self):
        self.section_label('عوامل خطّية مختلفة')
        whole = MathTex(r'\dfrac{3x+5}{(x+1)(x+2)} = \dfrac{A}{x+1} + \dfrac{B}{x+2}',
                        font_size=30, color=C_SIN)
        self.fit(whole, 4.4).move_to(UP * 1.6)
        self.cap('لكل عامل خطّي بسيط بسط ثابت مجهول.')
        self.play(Write(whole), run_time=1.4)

        m = MathTex(r'3x+5 = A(x+2) + B(x+1)', font_size=30, color=C_COS).move_to(UP * 0.2)
        self.play(Write(m), run_time=1.2)
        self.cap('نضرب في المقام ثم نعوّض جذور المقام.')

        vals = MathTex(r'x=-1:\ A=2 \qquad x=-2:\ B=1', font_size=28).move_to(DOWN * 0.9)
        self.play(Write(vals), run_time=1.2)

        res = MathTex(r'= \dfrac{2}{x+1} + \dfrac{1}{x+2}', font_size=34, color=C_GREEN)
        res.move_to(DOWN * 2.0)
        self.play(Write(res), run_time=1.0)
        self.play(Flash(res, color=C_GREEN, line_length=0.14, num_lines=14, flash_radius=1.2))
        self.cap('فتتفكّك الكسر إلى كسرين بسيطين.', hold=2.0)
        self.wait(0.4)
        self.flush()
