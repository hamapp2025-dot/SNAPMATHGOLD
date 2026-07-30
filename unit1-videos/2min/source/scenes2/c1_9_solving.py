from __future__ import annotations

from manim import DOWN, UP, FadeOut, Flash, MathTex, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_MUT, C_SIN, C_TAN, Base3B1BScene


class Solving2Min(Base3B1BScene):
    lesson_id = 'u1-c1.9'

    def construct(self):
        # hook
        self.section_label('حل المعادلات كثيرة الحدود')
        q = MathTex(r'x^{3} + 6x^{2} + 5x - 12 = 0', font_size=32, color=C_SIN)
        self.fit(q, 4.5).move_to(UP * 1.5)
        self.cap('كل ما تعلمناه في هذا الدرس يلتقي هنا.', hold=9.0)
        self.play(Write(q), run_time=1.2)

        # rule
        rule = MathTex(r'ab = 0\ \Rightarrow\ a = 0\ \text{or}\ b = 0',
                       font_size=28, color=C_MUT).move_to(UP * 0.4)
        self.cap('السلاح الأساسي: حاصل ضرب يساوي صفرًا يعني أحد العوامل صفر.', hold=11.0)
        self.play(Write(rule), run_time=1.2)
        self.wait(1.0)
        self.play(FadeOut(q, shift=UP * 0.2), FadeOut(rule, shift=UP * 0.2))

        # example 1 — textbook
        self.section_label('مثال من الكتاب')
        p = MathTex(r'x^{3} + 6x^{2} + 5x - 12 = 0', font_size=30).move_to(UP * 1.7)
        self.fit(p, 4.5)
        self.play(Write(p), run_time=1.1)
        s1 = MathTex(r'(x-1)(x+3)(x+4) = 0', font_size=30, color=C_TAN).move_to(UP * 0.6)
        self.play(Write(s1), run_time=1.2)
        self.cap('نحلّل أولًا كما تعلمنا: جذر ثم قسمة ثم تحليل.', hold=10.5)

        s2 = MathTex(r'x-1=0\ \lor\ x+3=0\ \lor\ x+4=0', font_size=26, color=C_COS)
        self.fit(s2, 4.4).move_to(DOWN * 0.4)
        self.play(Write(s2), run_time=1.2)
        self.cap('نساوي كل عامل بالصفر.', hold=7.8)

        r1 = MathTex(r'x = 1,\ -3,\ -4', font_size=36, color=C_GREEN).move_to(DOWN * 1.5)
        self.play(Write(r1), run_time=1.0)
        self.play(Flash(r1, color=C_GREEN, line_length=0.14, num_lines=14, flash_radius=1.3))
        self.wait(1.5)
        self.cap('ثلاثة حلول لمعادلة من الدرجة الثالثة.', hold=9.0)

        # example 2 — exam style
        self.clear_body(p, s1, s2, r1)
        self.section_label('سؤال بنمط الامتحان')
        p2 = MathTex(r'x^{3} = 4x', font_size=34, color=C_SIN).move_to(UP * 1.7)
        self.play(Write(p2), run_time=1.0)
        self.cap('احذر: لا تقسم الطرفين على س فتفقد حلًّا.', hold=9.7)

        s3 = MathTex(r'x^{3} - 4x = 0\ \Rightarrow\ x(x-2)(x+2) = 0',
                     font_size=27, color=C_TAN)
        self.fit(s3, 4.4).move_to(UP * 0.5)
        self.play(Write(s3), run_time=1.3)
        self.cap('انقل كل شيء لطرف واحد ثم حلّل: عامل مشترك وفرق مربعين.', hold=11.0)

        r2 = MathTex(r'x = 0,\ 2,\ -2', font_size=36, color=C_GREEN).move_to(DOWN * 0.8)
        self.play(Write(r2), run_time=1.0)
        self.play(Flash(r2, color=C_GREEN, line_length=0.14, num_lines=14, flash_radius=1.3))
        self.wait(1.5)
        self.cap('الصفر حل أيضًا؛ القسمة المتسرّعة كانت ستضيّعه.', hold=9.7)

        # recap
        self.clear_body(p2, s3, r2)
        self.section_label('الخلاصة')
        recap = MathTex(r'= 0\ \to\ \text{factor}\ \to\ \text{solve}',
                        font_size=34, color=C_SIN).move_to(UP * 0.8)
        self.fit(recap, 4.4)
        self.play(Write(recap), run_time=1.0)
        self.play(Flash(recap, color=C_SIN, line_length=0.14, num_lines=14, flash_radius=1.4))
        self.wait(1.5)
        self.cap('صفّر الطرف، حلّل، ثم ساوِ كل عامل بالصفر.', hold=9.7)
        self.wait(0.6)
        self.flush()
