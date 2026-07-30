from __future__ import annotations

from manim import DOWN, UP, FadeOut, Flash, MathTex, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_MUT, C_SIN, Base3B1BScene


class AxMinusB2Min(Base3B1BScene):
    lesson_id = 'u1-c1.4'

    def construct(self):
        # hook
        self.section_label('نظرية الباقي مع معامل')
        q = MathTex(r'(2x^{3} - 7x^{2} + 5) \div (2x - 1)\ \Rightarrow\ R\ ?',
                    font_size=28, color=C_SIN)
        self.fit(q, 4.5).move_to(UP * 1.5)
        self.cap('ماذا لو كان أمام س معامل في القاسم؟', hold=7.6)
        self.play(Write(q), run_time=1.3)
        self.cap('نفس نظرية الباقي، مع تعديل صغير واحد.', hold=7.6)
        self.play(FadeOut(q, shift=UP * 0.2))

        # rule
        rule = MathTex(r'P(x) \div (ax - b)\ \Rightarrow\ R = P\!\left(\tfrac{b}{a}\right)',
                       font_size=34, color=C_SIN).move_to(UP * 1.5)
        self.cap('نعوّض ما يصفر القوس: النسبة بين الحدّين.', hold=8.2)
        self.play(Write(rule), run_time=1.4)
        self.play(Flash(rule, color=C_SIN, line_length=0.12, num_lines=12, flash_radius=1.5))
        self.wait(1.5)

        # example 1 — textbook
        self.play(FadeOut(rule, shift=UP * 0.2))
        self.section_label('مثال من الكتاب')
        p = MathTex(r'P(x) = 2x^{3} - 7x^{2} + 5', font_size=32).move_to(UP * 1.7)
        d = MathTex(r'(2x-1)=0\ \Rightarrow\ x = \tfrac{1}{2}', font_size=28, color=C_COS)
        d.next_to(p, DOWN, buff=0.4)
        self.play(Write(p), run_time=1.1)
        self.play(Write(d), run_time=1.0)
        self.cap('القوس يصفر عند النصف، فهذا ما نعوّضه.', hold=8.2)

        s1 = MathTex(r'P\!\left(\tfrac{1}{2}\right) = \tfrac{1}{4} - \tfrac{7}{4} + 5',
                     font_size=30, color=C_MUT).move_to(DOWN * 0.2)
        self.play(Write(s1), run_time=1.2)
        self.cap('نحسب كل حد بهدوء.', hold=6.5)

        r1 = MathTex(r'R = \tfrac{7}{2}', font_size=38, color=C_GREEN).move_to(DOWN * 1.5)
        self.play(Write(r1), run_time=0.9)
        self.play(Flash(r1, color=C_GREEN, line_length=0.14, num_lines=14, flash_radius=1.1))
        self.wait(1.5)
        self.cap('الباقي سبعة على اثنين دون أي قسمة.', hold=7.6)

        # example 2 — exam style
        self.clear_body(p, d, s1, r1)
        self.section_label('سؤال بنمط الامتحان')
        p2 = MathTex(r'P(x) = 4x^{3} + kx + 1', font_size=32).move_to(UP * 1.7)
        info = MathTex(r'\div\ (2x + 1)\ \Rightarrow\ R = 2', font_size=28, color=C_COS)
        info.next_to(p2, DOWN, buff=0.4)
        self.play(Write(p2), run_time=1.1)
        self.play(Write(info), run_time=1.0)
        self.cap('الباقي معلوم والمطلوب قيمة الثابت.', hold=7.6)

        s2 = MathTex(r'P\!\left(-\tfrac{1}{2}\right) = -\tfrac{1}{2} - \tfrac{k}{2} + 1 = 2',
                     font_size=28, color=C_MUT).move_to(DOWN * 0.2)
        self.fit(s2, 4.4)
        self.play(Write(s2), run_time=1.2)
        self.cap('القوس يصفر عند سالب النصف؛ نعوّض ونساوي بالباقي.', hold=8.8)

        s3 = MathTex(r'\tfrac{1}{2} - \tfrac{k}{2} = 2\ \Rightarrow\ -\tfrac{k}{2} = \tfrac{3}{2}',
                     font_size=28, color=C_MUT).move_to(DOWN * 1.2)
        self.play(Write(s3), run_time=1.1)
        self.cap('معادلة بسيطة في المجهول.', hold=6.5)

        r2 = MathTex(r'k = -3', font_size=38, color=C_GREEN).move_to(DOWN * 2.2)
        self.play(Write(r2), run_time=0.8)
        self.play(Flash(r2, color=C_GREEN, line_length=0.14, num_lines=14, flash_radius=1.0))
        self.wait(1.5)
        self.cap('قيمة الثابت سالب ثلاثة.', hold=6.5)

        # recap
        self.clear_body(p2, info, s2, s3, r2)
        self.section_label('الخلاصة')
        recap = MathTex(r'R = P\!\left(\tfrac{b}{a}\right)', font_size=48, color=C_SIN)
        recap.move_to(UP * 0.8)
        self.play(Write(recap), run_time=1.0)
        self.play(Flash(recap, color=C_SIN, line_length=0.14, num_lines=14, flash_radius=1.4))
        self.wait(1.5)
        self.cap('عوّض ما يصفر القوس مهما كان شكله.', hold=7.6)
        self.wait(0.6)
        self.flush()
