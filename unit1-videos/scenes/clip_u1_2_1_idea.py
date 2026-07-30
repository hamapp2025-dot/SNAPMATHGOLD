from __future__ import annotations

from manim import DOWN, UP, FadeIn, FadeOut, Flash, MathTex, VGroup, Write

from snapmath_manim.threeblue import C_COS, C_GREEN, C_MUT, C_SIN, Base3B1BScene, ar


class PartialFractionsIdeaClip(Base3B1BScene):
  lesson_id = 'u1-c2.1'

  def construct(self):
    self.section_label('فكرة الكسور الجزئية')
    whole = MathTex(r'\dfrac{2}{x(x+2)}', r'=', r'\dfrac{1}{x}', r'-', r'\dfrac{1}{x+2}', font_size=38)
    whole[2].set_color(C_SIN)
    whole[4].set_color(C_COS)
    self.fit(whole, 4.0).move_to(UP * 1.4)
    self.cap('كسر واحد صعب نحوّله إلى فرق كسرين بسيطين.')
    self.play(Write(whole), run_time=1.4)
    self.play(Flash(whole, color=C_GREEN, line_length=0.12, num_lines=12, flash_radius=1.4))
    self.cap('لماذا هذا مفيد؟ لنرَ قوّته في مجموع.')

    total = MathTex(r'\dfrac{2}{1\cdot 3} + \dfrac{2}{3\cdot 5} + \dots + \dfrac{2}{11\cdot 13}', font_size=28)
    self.fit(total, 4.2).move_to(UP * 0.1)
    self.play(Write(total), run_time=1.4)
    self.cap('نستبدل كل حد بفرق كسرين.')

    tele = MathTex(r'\left(1 - \tfrac{1}{3}\right) + \left(\tfrac{1}{3} - \tfrac{1}{5}\right) + \dots + \left(\tfrac{1}{11} - \tfrac{1}{13}\right)', font_size=24)
    self.fit(tele, 4.3).move_to(DOWN * 0.9)
    self.play(Write(tele), run_time=1.5)
    self.cap('فتتلاشى الحدود المتوسطة تباعًا.')

    res = MathTex(r'= 1 - \tfrac{1}{13} = \tfrac{12}{13}', font_size=36, color=C_GREEN).move_to(DOWN * 2.0)
    self.play(Write(res), run_time=1.0)
    self.play(Flash(res, color=C_GREEN, line_length=0.14, num_lines=14, flash_radius=1.3))
    self.cap('التجزئة حوّلت مجموعًا طويلًا إلى ناتج واحد بسيط.', hold=2.2)
    self.wait(0.5)
    self.flush()
