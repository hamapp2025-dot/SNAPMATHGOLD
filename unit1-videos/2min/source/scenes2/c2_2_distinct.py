from __future__ import annotations

from manim import DOWN, UP, FadeOut, Flash, MathTex, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_MUT, C_SIN, Base3B1BScene


class DistinctLinear2Min(Base3B1BScene):
    lesson_id = 'u1-c2.2'

    def construct(self):
        # hook
        self.section_label('عوامل خطية مختلفة')
        q = MathTex(r'\dfrac{3x+5}{(x+1)(x+2)}\ =\ ?', font_size=32, color=C_SIN)
        self.fit(q, 4.4).move_to(UP * 1.5)
        self.cap('مقام من عاملين خطيين مختلفين؛ كيف نفكّكه؟', hold=8.7)
        self.play(Write(q), run_time=1.2)
        self.play(FadeOut(q, shift=UP * 0.2))

        # rule
        rule = MathTex(r'\dfrac{N(x)}{(x-a)(x-b)} = \dfrac{A}{x-a} + \dfrac{B}{x-b}',
                       font_size=28, color=C_SIN)
        self.fit(rule, 4.5).move_to(UP * 1.5)
        self.cap('القاعدة: لكل عامل خطي كسر ببسط ثابت مجهول.', hold=9.4)
        self.play(Write(rule), run_time=1.4)
        self.play(Flash(rule, color=C_SIN, line_length=0.12, num_lines=12, flash_radius=1.5))
        self.wait(1.5)

        # example 1 — textbook
        self.play(FadeOut(rule, shift=UP * 0.2))
        self.section_label('مثال من الكتاب')
        st = MathTex(r'\dfrac{3x+5}{(x+1)(x+2)} = \dfrac{A}{x+1} + \dfrac{B}{x+2}',
                     font_size=26, color=C_SIN)
        self.fit(st, 4.5).move_to(UP * 1.6)
        self.play(Write(st), run_time=1.4)
        m = MathTex(r'3x+5 = A(x+2) + B(x+1)', font_size=27, color=C_MUT).move_to(UP * 0.4)
        self.fit(m, 4.4)
        self.play(Write(m), run_time=1.2)
        self.cap('نضرب الطرفين في المقام لنتخلّص من الكسور.', hold=8.7)

        v1 = MathTex(r'x=-1:\ 2 = A', font_size=28, color=C_COS).move_to(DOWN * 0.5)
        self.play(Write(v1), run_time=1.0)
        self.cap('نعوّض جذر العامل الأول فيختفي المجهول الآخر.', hold=8.7)
        v2 = MathTex(r'x=-2:\ -1 = -B\ \Rightarrow\ B = 1', font_size=28, color=C_COS)
        self.fit(v2, 4.4).move_to(DOWN * 1.3)
        self.play(Write(v2), run_time=1.1)
        self.cap('ثم جذر العامل الثاني.', hold=6.5)

        r1 = MathTex(r'= \dfrac{2}{x+1} + \dfrac{1}{x+2}', font_size=30, color=C_GREEN)
        r1.move_to(DOWN * 2.3)
        self.play(Write(r1), run_time=1.1)
        self.play(Flash(r1, color=C_GREEN, line_length=0.13, num_lines=12, flash_radius=1.3))
        self.wait(1.5)
        self.cap('اكتمل التفكيك.', hold=5.8)

        # example 2 — exam style
        self.clear_body(st, m, v1, v2, r1)
        self.section_label('سؤال بنمط الامتحان')
        st2 = MathTex(r'\dfrac{x+7}{(x-1)(x+3)} = \dfrac{A}{x-1} + \dfrac{B}{x+3}',
                      font_size=26, color=C_SIN)
        self.fit(st2, 4.5).move_to(UP * 1.6)
        self.play(Write(st2), run_time=1.4)
        self.cap('نفس البنية: عاملان مختلفان ومجهولان.', hold=7.6)

        v3 = MathTex(r'x=1:\ \dfrac{8}{4} = A = 2', font_size=28, color=C_COS).move_to(UP * 0.3)
        self.play(Write(v3), run_time=1.1)
        v4 = MathTex(r'x=-3:\ \dfrac{4}{-4} = B = -1', font_size=28, color=C_COS)
        v4.move_to(DOWN * 0.6)
        self.play(Write(v4), run_time=1.1)
        self.cap('عوّض كل جذر مباشرة واقرأ قيمة المجهول.', hold=8.7)

        r2 = MathTex(r'= \dfrac{2}{x-1} - \dfrac{1}{x+3}', font_size=30, color=C_GREEN)
        r2.move_to(DOWN * 1.8)
        self.play(Write(r2), run_time=1.1)
        self.play(Flash(r2, color=C_GREEN, line_length=0.13, num_lines=12, flash_radius=1.3))
        self.wait(1.5)
        self.cap('انتبه للإشارة السالبة في الكسر الثاني.', hold=8.1)

        # recap
        self.clear_body(st2, v3, v4, r2)
        self.section_label('الخلاصة')
        recap = MathTex(r'\dfrac{A}{x-a} + \dfrac{B}{x-b}', font_size=38, color=C_SIN)
        recap.move_to(UP * 0.8)
        self.play(Write(recap), run_time=1.0)
        self.play(Flash(recap, color=C_SIN, line_length=0.14, num_lines=14, flash_radius=1.4))
        self.wait(1.5)
        self.cap('عامل مختلف يعني كسرًا ببسط ثابت؛ والجذور تكشف البسوط.', hold=9.4)
        self.wait(0.6)
        self.flush()
