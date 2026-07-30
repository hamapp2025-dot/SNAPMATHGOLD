from __future__ import annotations

from manim import DOWN, UP, FadeOut, Flash, MathTex, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_MUT, C_SIN, C_TAN, Base3B1BScene


class FactorTheorem2Min(Base3B1BScene):
    lesson_id = 'u1-c1.5'

    def construct(self):
        # hook
        self.section_label('نظرية العامل')
        q = MathTex(r'(x+4)\ \mid\ x^{3} + 6x^{2} + 5x - 12\ ?', font_size=30, color=C_SIN)
        self.fit(q, 4.5).move_to(UP * 1.5)
        self.cap('هل هذا القوس عامل لكثير الحدود؟', hold=7.0)
        self.play(Write(q), run_time=1.3)
        self.cap('لا داعي للقسمة؛ يكفي اختبار واحد.', hold=7.0)
        self.play(FadeOut(q, shift=UP * 0.2))

        # rule
        rule = MathTex(r'P(c) = 0 \iff (x - c) \mid P(x)', font_size=34, color=C_SIN)
        rule.move_to(UP * 1.5)
        self.cap('نظرية العامل: القوس عامل إذا وفقط إذا كانت قيمة الدالة عند جذره صفرًا.',
                 hold=9.6)
        self.play(Write(rule), run_time=1.4)
        self.play(Flash(rule, color=C_SIN, line_length=0.12, num_lines=12, flash_radius=1.5))
        self.wait(1.5)
        self.cap('باقٍ صفري يعني قسمة تامة.', hold=6.4)

        # example 1 — textbook
        self.play(FadeOut(rule, shift=UP * 0.2))
        self.section_label('مثال من الكتاب')
        p = MathTex(r'P(x) = x^{3} + 6x^{2} + 5x - 12', font_size=30).move_to(UP * 1.7)
        self.play(Write(p), run_time=1.1)
        self.cap('نختبر القوس س زائد أربعة: جذره سالب أربعة.', hold=8.0)

        s1 = MathTex(r'P(-4) = -64 + 96 - 20 - 12', font_size=28, color=C_MUT).move_to(UP * 0.5)
        self.play(Write(s1), run_time=1.2)
        s2 = MathTex(r'= 0', font_size=36, color=C_GREEN).move_to(DOWN * 0.4)
        self.play(Write(s2), run_time=0.8)
        self.play(Flash(s2, color=C_GREEN, line_length=0.13, num_lines=12, flash_radius=0.9))
        self.wait(1.5)
        self.cap('النتيجة صفر، إذن القوس عامل فعلًا.', hold=7.4)

        fac = MathTex(r'P(x) = (x+4)(x+3)(x-1)', font_size=30, color=C_TAN).move_to(DOWN * 1.5)
        self.play(Write(fac), run_time=1.2)
        self.cap('ونكمل التحليل بقسمة تركيبية سريعة.', hold=7.4)

        # example 2 — exam style
        self.clear_body(p, s1, s2, fac)
        self.section_label('سؤال بنمط الامتحان')
        p2 = MathTex(r'P(x) = x^{3} + kx^{2} - 4', font_size=32).move_to(UP * 1.7)
        info = MathTex(r'(x - 2) \mid P(x)\ \Rightarrow\ k\ ?', font_size=28, color=C_COS)
        info.next_to(p2, DOWN, buff=0.4)
        self.play(Write(p2), run_time=1.1)
        self.play(Write(info), run_time=1.0)
        self.cap('القوس عامل معلوم والمطلوب قيمة الثابت.', hold=7.4)

        s3 = MathTex(r'P(2) = 8 + 4k - 4 = 0', font_size=30, color=C_MUT).move_to(DOWN * 0.2)
        self.play(Write(s3), run_time=1.2)
        self.cap('عامل يعني قيمة الدالة عند الجذر صفر.', hold=7.4)

        s4 = MathTex(r'4k = -4', font_size=30, color=C_MUT).move_to(DOWN * 1.1)
        self.play(Write(s4), run_time=0.9)
        r2 = MathTex(r'k = -1', font_size=38, color=C_GREEN).move_to(DOWN * 2.0)
        self.play(Write(r2), run_time=0.8)
        self.play(Flash(r2, color=C_GREEN, line_length=0.14, num_lines=14, flash_radius=1.0))
        self.wait(1.5)
        self.cap('قيمة الثابت سالب واحد.', hold=6.4)

        # recap
        self.clear_body(p2, info, s3, s4, r2)
        self.section_label('الخلاصة')
        recap = MathTex(r'P(c) = 0 \iff \text{factor}', font_size=40, color=C_SIN)
        recap.move_to(UP * 0.8)
        self.play(Write(recap), run_time=1.0)
        self.play(Flash(recap, color=C_SIN, line_length=0.14, num_lines=14, flash_radius=1.4))
        self.wait(1.5)
        self.cap('صفر عند الجذر يعني عامل؛ وعامل يعني صفرًا عند الجذر.', hold=8.6)
        self.wait(0.6)
        self.flush()
