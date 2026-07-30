from __future__ import annotations

from manim import DOWN, UP, Flash, MathTex, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_SIN, C_TAN, Base3B1BScene


class ImproperFractionClip(Base3B1BScene):
    lesson_id = 'u1-c2.6'

    def construct(self):
        self.section_label('الكسور غير الحقيقية')
        whole = MathTex(r'\dfrac{x^{2}+2}{x+1}', font_size=42, color=C_SIN).move_to(UP * 1.7)
        self.cap('إذا كانت درجة البسط أكبر أو تساوي درجة المقام نقسم أولًا.')
        self.play(Write(whole), run_time=1.1)

        div = MathTex(r'\dfrac{x^{2}+2}{x+1} = (x-1) + \dfrac{3}{x+1}',
                      font_size=32, color=C_TAN).move_to(UP * 0.1)
        self.play(Write(div), run_time=1.4)
        self.cap('نجري القسمة المطوّلة فنحصل على خارج وباقٍ.')

        res = MathTex(r'x - 1 + \dfrac{3}{x+1}', font_size=36, color=C_GREEN).move_to(DOWN * 1.4)
        self.play(Write(res), run_time=1.0)
        self.play(Flash(res, color=C_GREEN, line_length=0.14, num_lines=14, flash_radius=1.3))
        self.cap('ثم نجزّئ الكسر المتبقّي إن لزم.', hold=2.0)
        self.wait(0.4)
        self.flush()
