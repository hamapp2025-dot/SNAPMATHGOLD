from __future__ import annotations

from manim import DOWN, UP, FadeOut, Flash, MathTex, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_MUT, C_SIN, Base3B1BScene


class PartialFractionsIdea2Min(Base3B1BScene):
    lesson_id = 'u1-c2.1'

    def construct(self):
        # hook
        self.section_label('فكرة الكسور الجزئية')
        q = MathTex(r'\dfrac{2}{x(x+2)}\ =\ ?', font_size=36, color=C_SIN).move_to(UP * 1.5)
        self.cap('كسر واحد معقّد المقام؛ هل يمكن تبسيطه؟', hold=9.1)
        self.play(Write(q), run_time=1.2)
        self.cap('الفكرة: نفكّكه إلى كسور أبسط تُجمع لتعطيه.', hold=9.8)
        self.play(FadeOut(q, shift=UP * 0.2))

        # rule
        rule = MathTex(r'\dfrac{2}{x(x+2)} = \dfrac{1}{x} - \dfrac{1}{x+2}',
                       font_size=34, color=C_SIN).move_to(UP * 1.5)
        self.cap('هذا هو التفكيك: فرق كسرين بسيطين.', hold=9.1)
        self.play(Write(rule), run_time=1.4)
        self.play(Flash(rule, color=C_SIN, line_length=0.12, num_lines=12, flash_radius=1.5))
        self.wait(1.5)

        # example 1 — verify (textbook)
        self.section_label('لنتحقّق')
        s1 = MathTex(r'\dfrac{1}{x} - \dfrac{1}{x+2} = \dfrac{(x+2) - x}{x(x+2)}',
                     font_size=28, color=C_MUT).move_to(UP * 0.1)
        self.fit(s1, 4.4)
        self.play(Write(s1), run_time=1.4)
        self.cap('نوحّد المقامات ونطرح.', hold=8.5)

        s2 = MathTex(r'= \dfrac{2}{x(x+2)}\ \checkmark', font_size=30, color=C_GREEN)
        s2.move_to(DOWN * 1.1)
        self.play(Write(s2), run_time=1.0)
        self.play(Flash(s2, color=C_GREEN, line_length=0.13, num_lines=12, flash_radius=1.2))
        self.wait(1.5)
        self.cap('البسط يساوي اثنين تمامًا: التفكيك صحيح.', hold=9.1)

        # example 2 — telescoping power (exam style)
        self.clear_body(rule, s1, s2)
        self.section_label('قوة الفكرة')
        total = MathTex(r'\dfrac{2}{1\cdot 3} + \dfrac{2}{3\cdot 5} + \dots + \dfrac{2}{11\cdot 13}',
                        font_size=26, color=C_SIN)
        self.fit(total, 4.5).move_to(UP * 1.5)
        self.play(Write(total), run_time=1.4)
        self.cap('مجموع طويل من الكسور؛ جرّب جمعه مباشرة وسترى التعب.', hold=10.5)

        tele = MathTex(r'\left(1-\tfrac{1}{3}\right)+\left(\tfrac{1}{3}-\tfrac{1}{5}\right)+\dots+\left(\tfrac{1}{11}-\tfrac{1}{13}\right)',
                       font_size=23, color=C_MUT)
        self.fit(tele, 4.6).move_to(UP * 0.2)
        self.play(Write(tele), run_time=1.5)
        self.cap('نفكّك كل حد بنفس الفكرة فتتجاور الحدود المتضادة.', hold=10.5)

        res = MathTex(r'= 1 - \tfrac{1}{13} = \tfrac{12}{13}', font_size=32, color=C_GREEN)
        res.move_to(DOWN * 1.2)
        self.play(Write(res), run_time=1.0)
        self.play(Flash(res, color=C_GREEN, line_length=0.14, num_lines=14, flash_radius=1.2))
        self.wait(1.5)
        self.cap('كل شيء في المنتصف يتلاشى ويبقى الطرفان فقط.', hold=9.8)

        # recap
        self.clear_body(total, tele, res)
        self.section_label('الخلاصة')
        recap = MathTex(r'\text{hard} = \text{simple} + \text{simple}',
                        font_size=32, color=C_SIN).move_to(UP * 0.8)
        self.fit(recap, 4.4)
        self.play(Write(recap), run_time=1.0)
        self.play(Flash(recap, color=C_SIN, line_length=0.14, num_lines=14, flash_radius=1.4))
        self.wait(1.5)
        self.cap('التجزئة تحوّل المعقّد إلى بسيطين، وهذا مفتاح الوحدة كلها.', hold=11.0)
        self.wait(0.6)
        self.flush()
