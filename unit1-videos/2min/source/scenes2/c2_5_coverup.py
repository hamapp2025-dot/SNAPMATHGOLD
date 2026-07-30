from __future__ import annotations

from manim import DOWN, UP, FadeOut, Flash, MathTex, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_MUT, C_SIN, Base3B1BScene


class CoverUp2Min(Base3B1BScene):
    lesson_id = 'u1-c2.5'

    def construct(self):
        # hook
        self.section_label('طريقة التغطية')
        q = MathTex(r'\dfrac{8x+3}{x(x-3)} = \dfrac{A}{x} + \dfrac{B}{x-3}',
                    font_size=30, color=C_SIN)
        self.fit(q, 4.4).move_to(UP * 1.5)
        self.cap('هل يمكن إيجاد البسوط دون فك الأقواس أصلًا؟', hold=9.1)
        self.play(Write(q), run_time=1.3)
        self.cap('نعم: طريقة التغطية تختصر كل الخطوات.', hold=7.9)

        # rule
        rule = MathTex(r'A = \left.\dfrac{N(x)}{\text{rest}}\right|_{x=\text{root}}',
                       font_size=30, color=C_MUT).move_to(UP * 0.1)
        self.cap('القاعدة: غطِّ العامل بيدك وعوّض جذره فيما تبقّى.', hold=9.8)
        self.play(Write(rule), run_time=1.3)
        self.wait(1.2)
        self.play(FadeOut(rule, shift=UP * 0.2))

        # example 1 — textbook
        self.section_label('مثال من الكتاب')
        a = MathTex(r'A = \dfrac{8(0)+3}{0-3} = \dfrac{3}{-3} = -1',
                    font_size=28, color=C_COS).move_to(UP * 0.7)
        self.fit(a, 4.4)
        self.cap('نغطّي س ونعوّض صفرًا في الباقي.', hold=8.4)
        self.play(Write(a), run_time=1.3)

        b = MathTex(r'B = \dfrac{8(3)+3}{3} = \dfrac{27}{3} = 9',
                    font_size=28, color=C_COS).move_to(DOWN * 0.4)
        self.fit(b, 4.4)
        self.cap('ثم نغطّي القوس الآخر ونعوّض ثلاثة.', hold=8.4)
        self.play(Write(b), run_time=1.3)

        r1 = MathTex(r'= \dfrac{-1}{x} + \dfrac{9}{x-3}', font_size=32, color=C_GREEN)
        r1.move_to(DOWN * 1.6)
        self.play(Write(r1), run_time=1.1)
        self.play(Flash(r1, color=C_GREEN, line_length=0.14, num_lines=14, flash_radius=1.3))
        self.wait(1.5)
        self.cap('خطوة واحدة لكل بسط: هذه سرعة التغطية.', hold=8.4)

        # example 2 — exam style
        self.clear_body(a, b, r1)
        self.section_label('سؤال بنمط الامتحان')
        st2 = MathTex(r'\dfrac{5x-7}{(x-1)(x-2)}', font_size=32, color=C_SIN).move_to(UP * 1.6)
        self.play(Write(st2), run_time=1.2)
        self.cap('جرّبها بنفسك قبل متابعة الحل.', hold=7.9)

        a2 = MathTex(r'A = \dfrac{5(1)-7}{1-2} = \dfrac{-2}{-1} = 2',
                     font_size=27, color=C_COS).move_to(UP * 0.4)
        self.fit(a2, 4.4)
        self.play(Write(a2), run_time=1.3)
        b2 = MathTex(r'B = \dfrac{5(2)-7}{2-1} = \dfrac{3}{1} = 3',
                     font_size=27, color=C_COS).move_to(DOWN * 0.6)
        self.fit(b2, 4.4)
        self.play(Write(b2), run_time=1.3)
        self.cap('غطِّ وعوّض مرتين فقط.', hold=7.2)

        r2 = MathTex(r'= \dfrac{2}{x-1} + \dfrac{3}{x-2}', font_size=32, color=C_GREEN)
        r2.move_to(DOWN * 1.8)
        self.play(Write(r2), run_time=1.1)
        self.play(Flash(r2, color=C_GREEN, line_length=0.14, num_lines=14, flash_radius=1.3))
        self.wait(1.5)
        self.cap('انتهينا في سطرين؛ وهذا وقت ثمين في الامتحان.', hold=9.1)

        # recap
        self.clear_body(st2, a2, b2, r2)
        self.section_label('الخلاصة')
        recap = MathTex(r'\text{cover} \to \text{substitute} \to \text{done}',
                        font_size=32, color=C_SIN).move_to(UP * 0.8)
        self.fit(recap, 4.4)
        self.play(Write(recap), run_time=1.0)
        self.play(Flash(recap, color=C_SIN, line_length=0.14, num_lines=14, flash_radius=1.4))
        self.wait(1.5)
        self.cap('تعمل مع العوامل الخطية المختلفة فقط، فاختر أسلحتك بحكمة.', hold=9.8)
        self.wait(0.6)
        self.flush()
