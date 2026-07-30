from __future__ import annotations

from manim import DOWN, UP, Flash, MathTex, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_MUT, C_SIN, C_TAN, Base3B1BScene


class FullFactorClip(Base3B1BScene):
    lesson_id = 'u1-c1.6'

    def construct(self):
        self.section_label('التحليل الكامل لكثير الحدود')
        p = MathTex(r'P(x) = x^{3} + 6x^{2} + 5x - 12', font_size=32, color=C_SIN)
        p.move_to(UP * 1.7)
        self.cap('نبدأ بإيجاد جذر واحد ثم نقسم عليه.')
        self.play(Write(p), run_time=1.1)

        root = MathTex(r'P(1) = 0\ \Rightarrow\ (x-1)', font_size=30, color=C_COS).move_to(UP * 0.6)
        self.play(Write(root), run_time=1.0)
        self.cap('الواحد جذر فالقوس عامل أول.')

        quo = MathTex(r'\Rightarrow\ x^{2} + 7x + 12', font_size=30, color=C_MUT).move_to(DOWN * 0.3)
        self.play(Write(quo), run_time=1.0)
        self.cap('يتبقّى مقدار تربيعي نحلّله بالطريقة العادية.')

        fac = MathTex(r'P(x) = (x-1)(x+3)(x+4)', font_size=30, color=C_TAN).move_to(DOWN * 1.5)
        self.play(Write(fac), run_time=1.2)
        self.play(Flash(fac, color=C_TAN, line_length=0.12, num_lines=12, flash_radius=1.3))
        self.cap('فنصل إلى ثلاثة عوامل خطّية كاملة.', hold=2.0)
        self.wait(0.4)
        self.flush()
