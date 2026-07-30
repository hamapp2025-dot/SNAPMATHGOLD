from __future__ import annotations

from manim import DOWN, UP, Flash, MathTex, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_SIN, Base3B1BScene


class RepeatedFactorClip(Base3B1BScene):
    lesson_id = 'u1-c2.3'

    def construct(self):
        self.section_label('عوامل مكرّرة')
        whole = MathTex(r'\dfrac{2x+1}{(x-1)^{2}} = \dfrac{A}{x-1} + \dfrac{B}{(x-1)^{2}}',
                        font_size=30, color=C_SIN)
        self.fit(whole, 4.4).move_to(UP * 1.6)
        self.cap('العامل المكرّر يأخذ حدًّا لكل قوّة حتى أعلاها.')
        self.play(Write(whole), run_time=1.4)

        m = MathTex(r'2x+1 = A(x-1) + B', font_size=30, color=C_COS).move_to(UP * 0.2)
        self.play(Write(m), run_time=1.2)
        self.cap('نعوّض الجذر ثم نقارن المعاملات.')

        vals = MathTex(r'x=1:\ B=3 \qquad A=2', font_size=28).move_to(DOWN * 0.9)
        self.play(Write(vals), run_time=1.1)

        res = MathTex(r'= \dfrac{2}{x-1} + \dfrac{3}{(x-1)^{2}}', font_size=34, color=C_GREEN)
        res.move_to(DOWN * 2.0)
        self.play(Write(res), run_time=1.0)
        self.play(Flash(res, color=C_GREEN, line_length=0.14, num_lines=14, flash_radius=1.2))
        self.cap('فلا ننسى حدّ القوّة الأولى مع المربّع.', hold=2.0)
        self.wait(0.4)
        self.flush()
