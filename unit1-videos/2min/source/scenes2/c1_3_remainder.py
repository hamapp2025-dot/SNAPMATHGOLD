from __future__ import annotations

from manim import DOWN, UP, FadeIn, FadeOut, Flash, MathTex, VGroup, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_MUT, C_SIN, C_TAN, Base3B1BScene


class RemainderTheorem2Min(Base3B1BScene):
    """Model 2-minute snap clip: concept + textbook example + exam-style example."""
    lesson_id = 'u1-c1.3'

    def construct(self):
        # ---- 1) hook -------------------------------------------------------
        self.section_label('نظرية الباقي')
        q = MathTex(r'\dfrac{2x^{3} - 7x^{2} + 5}{x - 3}\ \Rightarrow\ R\ ?',
                    font_size=36, color=C_SIN).move_to(UP * 1.5)
        self.cap('سؤال: ما باقي هذه القسمة؟', hold=4.3)
        self.play(Write(q), run_time=1.3)
        self.cap('القسمة المطوّلة تعطينا الجواب لكنها طويلة.', hold=5.4)
        self.cap('توجد طريقة أسرع بكثير.', hold=4.3)
        self.play(FadeOut(q, shift=UP * 0.2))

        # ---- 2) the rule ---------------------------------------------------
        rule = MathTex(r'P(x) \div (x - c)\ \Rightarrow\ R = P(c)',
                       font_size=36, color=C_SIN).move_to(UP * 1.5)
        self.cap('نظرية الباقي تقول:', hold=3.6)
        self.play(Write(rule), run_time=1.4)
        self.play(Flash(rule, color=C_SIN, line_length=0.12, num_lines=12, flash_radius=1.5))
        self.wait(1.5)
        self.cap('باقي القسمة على القوس يساوي قيمة الدالة عند الجذر.', hold=6.1)
        self.cap('نعوّض العدد فقط، بلا أي قسمة.', hold=5.0)

        # ---- 3) example 1 — textbook --------------------------------------
        self.play(FadeOut(rule, shift=UP * 0.2))
        self.section_label('مثال من الكتاب')
        p = MathTex(r'P(x) = 2x^{3} - 7x^{2} + 5', font_size=32).move_to(UP * 1.7)
        d = MathTex(r'\div\ (x - 3)\ \Rightarrow\ c = 3', font_size=28, color=C_COS)
        d.next_to(p, DOWN, buff=0.4)
        self.play(Write(p), run_time=1.1)
        self.play(Write(d), run_time=0.9)
        self.cap('نحدّد الجذر أولًا: القوس يصفر عند ثلاثة.', hold=5.4)

        s1 = MathTex(r'P(3) = 2(27) - 7(9) + 5', font_size=30, color=C_MUT).move_to(DOWN * 0.1)
        self.play(Write(s1), run_time=1.2)
        self.cap('نعوّض ثلاثة في كل حد.', hold=4.7)
        s2 = MathTex(r'= 54 - 63 + 5', font_size=30, color=C_MUT).move_to(DOWN * 1.0)
        self.play(Write(s2), run_time=1.0)
        self.cap('نحسب بهدوء خطوة خطوة.', hold=4.7)
        r1 = MathTex(r'R = -4', font_size=40, color=C_GREEN).move_to(DOWN * 2.0)
        self.play(Write(r1), run_time=0.9)
        self.play(Flash(r1, color=C_GREEN, line_length=0.14, num_lines=14, flash_radius=1.1))
        self.wait(1.5)
        self.cap('الباقي سالب أربعة، وانتهينا في ثلاث خطوات.', hold=5.4)

        # ---- 4) example 2 — exam style -------------------------------------
        self.clear_body(p, d, s1, s2, r1)
        self.section_label('سؤال بنمط الامتحان')
        p2 = MathTex(r'P(x) = x^{3} + kx - 2', font_size=32).move_to(UP * 1.7)
        info = MathTex(r'\div\ (x - 2)\ \Rightarrow\ R = 8', font_size=28, color=C_COS)
        info.next_to(p2, DOWN, buff=0.4)
        self.play(Write(p2), run_time=1.1)
        self.play(Write(info), run_time=1.0)
        self.cap('الامتحان يعكس السؤال: الباقي معلوم والمطلوب قيمة الثابت.', hold=6.5)

        s3 = MathTex(r'P(2) = 8 + 2k - 2 = 8', font_size=30, color=C_MUT).move_to(DOWN * 0.1)
        self.play(Write(s3), run_time=1.2)
        self.cap('نفس النظرية: نعوّض الجذر ونساوي بالباقي.', hold=5.4)

        s4 = MathTex(r'2k + 6 = 8\ \Rightarrow\ 2k = 2', font_size=30, color=C_MUT).move_to(DOWN * 1.0)
        self.play(Write(s4), run_time=1.1)
        self.cap('ثم نحل معادلة بسيطة.', hold=4.3)

        r2 = MathTex(r'k = 1', font_size=40, color=C_GREEN).move_to(DOWN * 2.0)
        self.play(Write(r2), run_time=0.8)
        self.play(Flash(r2, color=C_GREEN, line_length=0.14, num_lines=14, flash_radius=1.0))
        self.wait(1.5)
        self.cap('قيمة الثابت واحد.', hold=4.3)

        # ---- 5) recap ------------------------------------------------------
        self.clear_body(p2, info, s3, s4, r2)
        self.section_label('الخلاصة')
        recap = MathTex(r'R = P(c)', font_size=52, color=C_SIN).move_to(UP * 0.8)
        self.play(Write(recap), run_time=1.0)
        self.play(Flash(recap, color=C_SIN, line_length=0.14, num_lines=14, flash_radius=1.4))
        self.wait(1.5)
        self.cap('القاعدة واحدة في الاتجاهين: عوّض الجذر تحصل على الباقي.', hold=6.1)
        self.cap('وإذا عُلم الباقي فعوّض وحلّ عن المجهول.', hold=5.8)
        self.wait(0.6)
        self.flush()
