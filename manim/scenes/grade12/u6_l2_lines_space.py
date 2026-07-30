from __future__ import annotations

import numpy as np
from manim import (
  DOWN,
  UP,
  Arrow,
  Create,
  Dot,
  FadeIn,
  Flash,
  Line,
  MathTex,
  VGroup,
  Write,
)

from snapmath_manim.threeblue import C_COS, C_GREEN, C_SIN, C_TAN, Base3B1BScene, ar


class LinesSpaceScene(Base3B1BScene):
  lesson_id = 'u6-l2'

  def construct(self):
    self.s_idea()
    self.s_example()
    self.s_parametric()
    self.s_recap()
    self.flush()

  def s_idea(self):
    self.section_label('المستقيمات في الفراغ')
    eq = MathTex(r'\vec{r} = ', r'\vec{a}', r' + t\,', r'\vec{d}', font_size=48).move_to(UP * 1.6)
    eq.set_color_by_tex(r'\vec{a}', C_SIN)
    eq.set_color_by_tex(r'\vec{d}', C_COS)
    # a point + direction visual
    origin = DOWN * 0.6
    a = origin + np.array([-1.2, -0.2, 0])
    dvec = np.array([1.7, 0.9, 0])
    line = Line(a - 0.4 * dvec, a + 2.0 * dvec, color=C_GREEN, stroke_width=4)
    pt = Dot(a, color=C_SIN, radius=0.09)
    arrow = Arrow(a, a + dvec, color=C_COS, stroke_width=5, buff=0)
    al = MathTex(r'\vec{a}', font_size=28, color=C_SIN).next_to(pt, DOWN, buff=0.12)
    dl = MathTex(r'\vec{d}', font_size=28, color=C_COS).next_to(arrow.get_end(), UP, buff=0.1)
    self.cap('نحتاج نقطة على المستقيم واتجاهه.')
    self.play(Write(eq), run_time=1.3)
    self.play(FadeIn(pt), Write(al))
    self.play(Create(arrow), Write(dl))
    self.play(Create(line), run_time=1.3)
    self.cap('نقطة a زائد مضاعفات المتجه d ترسم المستقيم.')
    self._i = VGroup(eq, line, pt, arrow, al, dl)

  def s_example(self):
    self.clear_body(self._i)
    self.section_label('مثال محلول')
    e0 = ar('مستقيم يمر بالنقطة (١، ٢، ٣) باتجاه (٤، ٥، ٦)', size=22, color='#AEB8DC')
    self.fit(e0, 4.3).move_to(UP * 1.3)
    e1 = MathTex(r'\vec{r} = (1,2,3) + t\,(4,5,6)', font_size=40, color=C_GREEN).next_to(e0, DOWN, buff=0.9)
    self.cap('عوّض النقطة والاتجاه في الصيغة.')
    self.play(FadeIn(e0, shift=UP * 0.08))
    self.play(Write(e1), run_time=1.3)
    self.play(Flash(e1, color=C_GREEN, line_length=0.14, num_lines=12, flash_radius=1.4))
    self.cap('فتكون هذه هي معادلة المستقيم المتجهة.')
    self._e = VGroup(e0, e1)

  def s_parametric(self):
    self.clear_body(self._e)
    self.section_label('الصورة البارامترية')
    px = MathTex(r'x = x_{0} + t\,d_{1}', font_size=40, color=C_SIN)
    py = MathTex(r'y = y_{0} + t\,d_{2}', font_size=40, color=C_COS)
    pz = MathTex(r'z = z_{0} + t\,d_{3}', font_size=40, color=C_GREEN)
    p = VGroup(px, py, pz).arrange(DOWN, buff=0.55).move_to(UP * 0.3)
    self.cap('يمكن فصل المعادلة إلى ثلاث مركبات.')
    self.play(Write(px), Write(py), Write(pz), lag_ratio=0.3, run_time=1.6)
    self.cap('كل مركبة معادلة خطية في البارامتر t.')
    self._p = p

  def s_recap(self):
    self.clear_body(self._p)
    self.section_label('الخلاصة')
    r1 = MathTex(r'\vec{r} = \vec{a} + t\,\vec{d}', font_size=46)
    r2 = ar('نقطة + اتجاه = مستقيم في الفراغ.', size=25, color='#AEB8DC')
    stack = VGroup(self.fit(r1, 4.2), self.fit(r2, 4.2)).arrange(DOWN, buff=0.9).move_to(UP * 0.2)
    self.cap('احفظ الصيغة: نقطة زائد t في الاتجاه.')
    self.play(Write(r1), run_time=1.1)
    self.play(FadeIn(r2, shift=UP * 0.08))
    self.wait(1.6)
