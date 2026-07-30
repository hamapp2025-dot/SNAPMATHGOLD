from __future__ import annotations

from manim import DOWN, UP, FadeOut, Flash, MathTex, VGroup, Write

from snapmath_manim.threeblue import C_GREEN, C_MUT, C_SIN, C_TAN, Base3B1BScene


class LongDivisionClip(Base3B1BScene):
    lesson_id = 'u1-c1.1'

    def construct(self):
        self.section_label('القسمة المطوّلة لكثيرات الحدود')
        setup = MathTex(r'\dfrac{2x^{3} - 7x^{2} + 5}{x - 3}', font_size=40, color=C_SIN)
        setup.move_to(UP * 1.7)
        self.cap('نقسم كثير الحدود على القوس تمامًا كقسمة الأعداد.')
        self.play(Write(setup), run_time=1.2)

        s1 = MathTex(r'2x^{3} \div x = 2x^{2}', font_size=30, color=C_MUT).move_to(UP * 0.5)
        self.cap('نقسم الحد الأعلى على الحد الأعلى في كل خطوة.')
        self.play(Write(s1), run_time=1.0)

        s2 = MathTex(r'\Rightarrow\ 2x^{2} - x - 3', font_size=34, color=C_TAN).move_to(DOWN * 0.6)
        self.cap('نكرّر الطرح والإنزال حتى نصل للباقي.')
        self.play(Write(s2), run_time=1.2)

        res = MathTex(r'\text{Q}=2x^{2}-x-3,\quad \text{R}=-4', font_size=30, color=C_GREEN)
        res.move_to(DOWN * 1.8)
        self.play(Write(res), run_time=1.2)
        self.play(Flash(res, color=C_GREEN, line_length=0.13, num_lines=12, flash_radius=1.3))
        self.cap('فالخارج تربيعي والباقي عدد ثابت.', hold=2.0)
        self.wait(0.4)
        self.flush()
