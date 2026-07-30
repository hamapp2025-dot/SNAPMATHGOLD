from __future__ import annotations

from manim import DOWN, UP, FadeOut, Flash, MathTex, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_MUT, C_SIN, Base3B1BScene


class SyntheticDivision2Min(Base3B1BScene):
    lesson_id = 'u1-c1.2'

    def construct(self):
        # hook
        self.section_label('القسمة التركيبية')
        q = MathTex(r'(2x^{3} - 7x^{2} + 5) \div (x - 3)', font_size=30, color=C_SIN)
        self.fit(q, 4.5).move_to(UP * 1.5)
        self.cap('القسمة المطوّلة تعمل، لكن هل من طريق أقصر؟', hold=8.5)
        self.play(Write(q), run_time=1.2)
        self.cap('نعم: القسمة التركيبية تختصرها إلى أسطر قليلة.', hold=8.5)
        self.play(FadeOut(q, shift=UP * 0.2))

        # rule
        rule = MathTex(r'\text{bring down} \to \times c \to +', font_size=30, color=C_MUT)
        rule.move_to(UP * 1.5)
        self.cap('القاعدة: أنزل المعامل الأول، ثم اضرب بالجذر واجمع، وكرّر.', hold=9.6)
        self.play(Write(rule), run_time=1.2)
        self.wait(1.0)

        # example 1 — textbook
        self.play(FadeOut(rule, shift=UP * 0.2))
        self.section_label('مثال من الكتاب')
        co = MathTex(r'c=3:\quad 2,\ -7,\ 0,\ 5', font_size=32, color=C_SIN).move_to(UP * 1.6)
        self.play(Write(co), run_time=1.1)
        self.cap('نكتب المعاملات كاملة، والصفر مكان الحد الناقص.', hold=9.1)

        row = MathTex(r'2 \;\xrightarrow{\times 3}\; -1 \;\xrightarrow{\times 3}\; -3 \;\xrightarrow{\times 3}\; -4',
                      font_size=28, color=C_MUT)
        self.fit(row, 4.5).move_to(UP * 0.2)
        self.play(Write(row), run_time=1.5)
        self.cap('أنزل الاثنين، اضرب بثلاثة واجمع، وهكذا حتى النهاية.', hold=9.6)

        r1 = MathTex(r'Q = 2x^{2} - x - 3,\quad R = -4', font_size=30, color=C_GREEN)
        r1.move_to(DOWN * 1.2)
        self.play(Write(r1), run_time=1.1)
        self.play(Flash(r1, color=C_GREEN, line_length=0.13, num_lines=12, flash_radius=1.4))
        self.wait(1.5)
        self.cap('آخر عدد هو الباقي، وما قبله معاملات الخارج.', hold=8.5)

        # example 2 — exam style
        self.clear_body(co, row, r1)
        self.section_label('سؤال بنمط الامتحان')
        co2 = MathTex(r'c=1:\quad 1,\ -2,\ 3,\ -1', font_size=32, color=C_SIN).move_to(UP * 1.6)
        self.play(Write(co2), run_time=1.1)
        self.cap('اقسم بنفس الطريقة على القوس س ناقص واحد.', hold=7.8)

        row2 = MathTex(r'1 \;\to\; -1 \;\to\; 2 \;\to\; 1', font_size=30, color=C_MUT)
        row2.move_to(UP * 0.2)
        self.play(Write(row2), run_time=1.3)
        self.cap('أنزل، اضرب بواحد، اجمع؛ ثلاث مرات.', hold=7.8)

        r2 = MathTex(r'Q = x^{2} - x + 2,\quad R = 1', font_size=30, color=C_GREEN)
        r2.move_to(DOWN * 1.2)
        self.play(Write(r2), run_time=1.0)
        self.play(Flash(r2, color=C_GREEN, line_length=0.13, num_lines=12, flash_radius=1.3))
        self.wait(1.5)
        self.cap('نفس ناتج القسمة المطوّلة لكن بربع الوقت.', hold=7.8)

        # recap
        self.clear_body(co2, row2, r2)
        self.section_label('الخلاصة')
        recap = MathTex(r'\downarrow\ \ \times c\ \ +', font_size=48, color=C_SIN).move_to(UP * 0.8)
        self.play(Write(recap), run_time=1.0)
        self.play(Flash(recap, color=C_SIN, line_length=0.14, num_lines=14, flash_radius=1.4))
        self.wait(1.5)
        self.cap('أنزل، اضرب بالجذر، اجمع؛ وآخر عدد هو الباقي دائمًا.', hold=9.6)
        self.wait(0.6)
        self.flush()
