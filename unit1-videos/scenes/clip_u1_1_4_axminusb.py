from __future__ import annotations

from manim import DOWN, UP, FadeOut, Flash, MathTex, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_MUT, C_SIN, Base3B1BScene


class AxMinusBClip(Base3B1BScene):
    lesson_id = 'u1-c1.4'

    def construct(self):
        self.section_label('نظرية الباقي مع معامل')
        rule = MathTex(r'P(x) \div (ax-b)\ \Rightarrow\ R = P\!\left(\tfrac{b}{a}\right)',
                       font_size=34, color=C_SIN).move_to(UP * 1.6)
        self.cap('إذا كان القاسم فيه معامل نعوّض النسبة بين الحدّين.')
        self.play(Write(rule), run_time=1.3)
        self.play(FadeOut(rule, shift=UP * 0.2))

        p = MathTex(r'P(x) = 2x^{3} - 7x^{2} + 5', font_size=32).move_to(UP * 1.5)
        d = MathTex(r'(2x - 1)\ \Rightarrow\ x = \tfrac{1}{2}', font_size=30, color=C_COS)
        d.move_to(UP * 0.4)
        self.play(Write(p), run_time=1.0)
        self.play(Write(d), run_time=1.0)
        self.cap('هنا القاسم اثنان س ناقص واحد فنعوّض النصف.')

        step = MathTex(r'P\!\left(\tfrac{1}{2}\right) = \tfrac{1}{4} - \tfrac{7}{4} + 5',
                       font_size=30, color=C_MUT).move_to(DOWN * 0.7)
        self.play(Write(step), run_time=1.1)
        res = MathTex(r'= \tfrac{7}{2}', font_size=40, color=C_GREEN).move_to(DOWN * 1.8)
        self.play(Write(res), run_time=0.9)
        self.play(Flash(res, color=C_GREEN, line_length=0.14, num_lines=14, flash_radius=1.2))
        self.cap('فالباقي سبعة على اثنين.', hold=2.0)
        self.wait(0.4)
        self.flush()
