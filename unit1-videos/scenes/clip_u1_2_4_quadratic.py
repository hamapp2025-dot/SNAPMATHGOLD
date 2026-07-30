from __future__ import annotations

from manim import DOWN, UP, Flash, MathTex, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_SIN, Base3B1BScene


class QuadraticFactorClip(Base3B1BScene):
    lesson_id = 'u1-c2.4'

    def construct(self):
        self.section_label('عامل تربيعي غير قابل للتحليل')
        whole = MathTex(r'\dfrac{2x^{2}+2x+2}{(x+1)(x^{2}+1)}'
                        r'= \dfrac{A}{x+1} + \dfrac{Bx+C}{x^{2}+1}',
                        font_size=26, color=C_SIN)
        self.fit(whole, 4.5).move_to(UP * 1.6)
        self.cap('العامل التربيعي يأخذ بسطًا خطّيًّا كاملًا.')
        self.play(Write(whole), run_time=1.5)

        m = MathTex(r'A(x^{2}+1) + (Bx+C)(x+1)', font_size=28, color=C_COS).move_to(UP * 0.1)
        self.play(Write(m), run_time=1.2)
        self.cap('نوحّد المقام ونقارن معاملات القوى.')

        vals = MathTex(r'A=1,\ B=1,\ C=1', font_size=30).move_to(DOWN * 0.9)
        self.play(Write(vals), run_time=1.0)

        res = MathTex(r'= \dfrac{1}{x+1} + \dfrac{x+1}{x^{2}+1}', font_size=32, color=C_GREEN)
        res.move_to(DOWN * 2.0)
        self.play(Write(res), run_time=1.0)
        self.play(Flash(res, color=C_GREEN, line_length=0.14, num_lines=14, flash_radius=1.2))
        self.cap('فالبسط فوق التربيعي من الدرجة الأولى.', hold=2.0)
        self.wait(0.4)
        self.flush()
