from __future__ import annotations

from manim import DOWN, UP, FadeOut, Flash, MathTex, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_MUT, C_SIN, C_TAN, Base3B1BScene


class LongDivision2Min(Base3B1BScene):
    lesson_id = 'u1-c1.1'

    def construct(self):
        # hook
        self.section_label('القسمة المطوّلة لكثيرات الحدود')
        q = MathTex(r'\dfrac{2x^{3} - 7x^{2} + 5}{x - 3}\ =\ ?', font_size=36, color=C_SIN)
        q.move_to(UP * 1.5)
        self.cap('كيف نقسم كثير حدود على آخر؟', hold=5.2)
        self.play(Write(q), run_time=1.3)
        self.cap('تمامًا كما نقسم الأعداد: خطوة بعد خطوة.', hold=6.1)
        self.play(FadeOut(q, shift=UP * 0.2))

        # rule
        rule = MathTex(r'\text{divide} \to \text{multiply} \to \text{subtract} \to \text{repeat}',
                       font_size=28, color=C_MUT).move_to(UP * 1.5)
        self.cap('القاعدة دورة من أربع خطوات: اقسم، اضرب، اطرح، كرّر.', hold=7.4)
        self.play(Write(rule), run_time=1.4)
        self.wait(1.0)

        # example 1 — textbook
        self.play(FadeOut(rule, shift=UP * 0.2))
        self.section_label('مثال من الكتاب')
        p = MathTex(r'(2x^{3} - 7x^{2} + 0x + 5) \div (x - 3)', font_size=28).move_to(UP * 1.7)
        self.fit(p, 4.5)
        self.play(Write(p), run_time=1.2)
        self.cap('نرتّب الحدود ونكمل أي حد ناقص بصفر.', hold=6.6)

        s1 = MathTex(r'2x^{3} \div x = 2x^{2}', font_size=28, color=C_COS).move_to(UP * 0.6)
        self.play(Write(s1), run_time=1.0)
        self.cap('نقسم الحد الأعلى على الحد الأعلى.', hold=5.7)

        s2 = MathTex(r'-7x^{2}+6x^{2} = -x^{2}\ \Rightarrow\ -x', font_size=26, color=C_MUT)
        s2.move_to(DOWN * 0.3)
        self.play(Write(s2), run_time=1.1)
        self.cap('نضرب ونطرح ثم ننزل الحد التالي ونكرّر.', hold=6.6)

        s3 = MathTex(r'\Rightarrow\ -3x + 5\ \Rightarrow\ -3', font_size=26, color=C_MUT)
        s3.move_to(DOWN * 1.1)
        self.play(Write(s3), run_time=1.0)
        self.cap('وهكذا حتى تصبح درجة الباقي أقل من درجة المقسوم عليه.', hold=7.1)

        r1 = MathTex(r'Q = 2x^{2} - x - 3,\quad R = -4', font_size=30, color=C_GREEN)
        r1.move_to(DOWN * 2.1)
        self.play(Write(r1), run_time=1.1)
        self.play(Flash(r1, color=C_GREEN, line_length=0.13, num_lines=12, flash_radius=1.4))
        self.wait(1.5)
        self.cap('الخارج تربيعي والباقي سالب أربعة.', hold=6.1)

        # example 2 — exam style
        self.clear_body(p, s1, s2, s3, r1)
        self.section_label('سؤال بنمط الامتحان')
        p2 = MathTex(r'(x^{3} - 2x^{2} + 3x - 1) \div (x - 1)', font_size=28).move_to(UP * 1.7)
        self.fit(p2, 4.5)
        self.play(Write(p2), run_time=1.2)
        self.cap('جرّب بنفسك أولًا ثم تابع الحل.', hold=6.1)

        s4 = MathTex(r'x^{3}\div x = x^{2},\quad -2x^{2}+x^{2}=-x^{2}', font_size=25, color=C_MUT)
        self.fit(s4, 4.4).move_to(UP * 0.5)
        self.play(Write(s4), run_time=1.2)
        self.cap('نفس الدورة: اقسم، اضرب، اطرح.', hold=5.7)

        s5 = MathTex(r'\Rightarrow\ -x^{2}+3x\ \Rightarrow\ 2x - 1\ \Rightarrow\ +1', font_size=25,
                     color=C_MUT).move_to(DOWN * 0.5)
        self.fit(s5, 4.4)
        self.play(Write(s5), run_time=1.2)
        self.cap('نكرّر حتى النهاية.', hold=4.9)

        r2 = MathTex(r'Q = x^{2} - x + 2,\quad R = 1', font_size=30, color=C_GREEN)
        r2.move_to(DOWN * 1.7)
        self.play(Write(r2), run_time=1.0)
        self.play(Flash(r2, color=C_GREEN, line_length=0.13, num_lines=12, flash_radius=1.3))
        self.wait(1.5)
        self.cap('تحقّق دائمًا: المقسوم يساوي الخارج ضرب المقسوم عليه زائد الباقي.', hold=7.4)

        # recap
        self.clear_body(p2, s4, s5, r2)
        self.section_label('الخلاصة')
        recap = MathTex(r'P = Q \cdot D + R', font_size=48, color=C_SIN).move_to(UP * 0.8)
        self.play(Write(recap), run_time=1.0)
        self.play(Flash(recap, color=C_SIN, line_length=0.14, num_lines=14, flash_radius=1.4))
        self.wait(1.5)
        self.cap('اقسم، اضرب، اطرح، كرّر؛ وتحقّق بالعلاقة الأساسية.', hold=7.4)
        self.wait(0.6)
        self.flush()
