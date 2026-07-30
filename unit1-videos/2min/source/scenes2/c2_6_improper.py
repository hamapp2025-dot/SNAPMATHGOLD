from __future__ import annotations

from manim import DOWN, UP, FadeOut, Flash, MathTex, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_MUT, C_SIN, C_TAN, Base3B1BScene


class ImproperFraction2Min(Base3B1BScene):
    lesson_id = 'u1-c2.6'

    def construct(self):
        # hook
        self.section_label('الكسور غير الحقيقية')
        q = MathTex(r'\dfrac{x^{2}+2}{x+1}\ =\ ?', font_size=36, color=C_SIN).move_to(UP * 1.5)
        self.cap('درجة البسط أكبر من درجة المقام؛ هل نجزّئ مباشرة؟', hold=8.9)
        self.play(Write(q), run_time=1.2)
        self.cap('لا: التجزئة تحتاج كسرًا حقيقيًا أولًا.', hold=7.8)
        self.play(FadeOut(q, shift=UP * 0.2))

        # rule
        rule = MathTex(r'\deg N \geq \deg D\ \Rightarrow\ \text{divide first}',
                       font_size=28, color=C_SIN)
        self.fit(rule, 4.5).move_to(UP * 1.5)
        self.cap('القاعدة: إن لم يكن البسط أصغر درجة فاقسم أولًا.', hold=8.9)
        self.play(Write(rule), run_time=1.3)
        self.play(Flash(rule, color=C_SIN, line_length=0.12, num_lines=12, flash_radius=1.5))
        self.wait(1.5)

        # example 1 — textbook
        self.play(FadeOut(rule, shift=UP * 0.2))
        self.section_label('مثال من الكتاب')
        s1 = MathTex(r'\dfrac{x^{2}+2}{x+1} = (x-1) + \dfrac{3}{x+1}',
                     font_size=30, color=C_TAN)
        self.fit(s1, 4.5).move_to(UP * 1.2)
        self.cap('نقسم قسمة مطوّلة: الخارج س ناقص واحد والباقي ثلاثة.', hold=9.6)
        self.play(Write(s1), run_time=1.4)

        chk = MathTex(r'(x+1)(x-1) + 3 = x^{2} + 2\ \checkmark', font_size=26, color=C_MUT)
        self.fit(chk, 4.4).move_to(DOWN * 0.2)
        self.play(Write(chk), run_time=1.2)
        self.cap('تحقّق سريع بإعادة الضرب.', hold=7.1)

        r1 = MathTex(r'x - 1 + \dfrac{3}{x+1}', font_size=32, color=C_GREEN).move_to(DOWN * 1.4)
        self.play(Write(r1), run_time=1.0)
        self.play(Flash(r1, color=C_GREEN, line_length=0.14, num_lines=14, flash_radius=1.3))
        self.wait(1.5)
        self.cap('كثير حدود زائد كسر حقيقي: هذا الشكل النهائي.', hold=8.9)

        # example 2 — exam style
        self.clear_body(s1, chk, r1)
        self.section_label('سؤال بنمط الامتحان')
        p2 = MathTex(r'\dfrac{x^{2}+3x+5}{x+2}', font_size=34, color=C_SIN).move_to(UP * 1.6)
        self.play(Write(p2), run_time=1.1)
        self.cap('اقسم أولًا ثم اكتب الشكل النهائي.', hold=7.8)

        s2 = MathTex(r'x^{2}+3x+5 = (x+2)(x+1) + 3', font_size=27, color=C_MUT)
        self.fit(s2, 4.5).move_to(UP * 0.4)
        self.play(Write(s2), run_time=1.3)
        self.cap('الخارج س زائد واحد والباقي ثلاثة.', hold=7.8)

        r2 = MathTex(r'= x + 1 + \dfrac{3}{x+2}', font_size=32, color=C_GREEN).move_to(DOWN * 0.8)
        self.play(Write(r2), run_time=1.1)
        self.play(Flash(r2, color=C_GREEN, line_length=0.14, num_lines=14, flash_radius=1.3))
        self.wait(1.5)
        self.cap('ولو كان المقام مركّبًا لجزّأنا الكسر المتبقي بعد القسمة.', hold=9.6)

        # recap
        self.clear_body(p2, s2, r2)
        self.section_label('الخلاصة')
        recap = MathTex(r'\text{divide} \to \text{then decompose}',
                        font_size=32, color=C_SIN).move_to(UP * 0.8)
        self.fit(recap, 4.4)
        self.play(Write(recap), run_time=1.0)
        self.play(Flash(recap, color=C_SIN, line_length=0.14, num_lines=14, flash_radius=1.4))
        self.wait(1.5)
        self.cap('قارن الدرجات أولًا دائمًا: قسمة ثم تجزئة.', hold=8.9)
        self.wait(0.6)
        self.flush()
