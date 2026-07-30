from __future__ import annotations

from manim import DOWN, UP, Flash, MathTex, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_MUT, C_SIN, C_TAN, Base3B1BScene


class SyntheticDivisionClip(Base3B1BScene):
    lesson_id = 'u1-c1.2'

    def construct(self):
        self.section_label('القسمة التركيبية')
        coeffs = MathTex(r'2,\ -7,\ 0,\ 5', font_size=40, color=C_SIN).move_to(UP * 1.7)
        div = MathTex(r'x - 3\ \Rightarrow\ c = 3', font_size=30, color=C_COS).move_to(UP * 0.7)
        self.cap('نأخذ معاملات كثير الحدود وقيمة الجذر.')
        self.play(Write(coeffs), run_time=1.0)
        self.play(Write(div), run_time=0.9)

        chain = MathTex(r'2 \;\to\; -1 \;\to\; -3 \;\to\; -4', font_size=34, color=C_MUT)
        chain.move_to(DOWN * 0.2)
        self.cap('ننزل ونضرب ونجمع خطوة خطوة.')
        self.play(Write(chain), run_time=1.4)

        res = MathTex(r'2x^{2} - x - 3,\quad \text{R}=-4', font_size=30, color=C_GREEN)
        res.move_to(DOWN * 1.6)
        self.play(Write(res), run_time=1.1)
        self.play(Flash(res, color=C_GREEN, line_length=0.13, num_lines=12, flash_radius=1.3))
        self.cap('طريقة أسرع بكثير من القسمة المطوّلة.', hold=2.0)
        self.wait(0.4)
        self.flush()
