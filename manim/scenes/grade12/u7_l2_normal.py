from __future__ import annotations

import numpy as np
from manim import (
  DOWN,
  UP,
  Axes,
  Create,
  DashedLine,
  FadeIn,
  Flash,
  MathTex,
  VGroup,
  Write,
)

from snapmath_manim.threeblue import C_AXIS, C_COS, C_GREEN, C_SIN, C_TAN, Base3B1BScene, ar


def gauss(x):
  return np.exp(-x * x / 2) / np.sqrt(2 * np.pi)


class NormalDistributionScene(Base3B1BScene):
  lesson_id = 'u7-l2'

  def construct(self):
    self.s_bell()
    self.s_zscore()
    self.s_example()
    self.s_recap()
    self.flush()

  def s_bell(self):
    self.section_label('التوزيع الطبيعي')
    axes = Axes(
      x_range=[-3.2, 3.2, 1], y_range=[0, 0.5, 0.25],
      x_length=4.4, y_length=2.6,
      axis_config={'stroke_color': C_AXIS, 'stroke_width': 2, 'include_ticks': False, 'tip_length': 0.14},
    ).move_to(UP * 0.9)
    curve = axes.plot(gauss, x_range=[-3.1, 3.1], color=C_SIN, stroke_width=4)
    area = axes.get_area(curve, x_range=[-1, 1], color=C_COS, opacity=0.5)
    mu = DashedLine(axes.c2p(0, 0), axes.c2p(0, gauss(0)), color=C_GREEN, stroke_width=3)
    mulbl = MathTex(r'\mu', font_size=30, color=C_GREEN).next_to(axes.c2p(0, 0), DOWN, buff=0.15)
    pct = MathTex(r'68\%', font_size=32, color=C_COS).move_to(axes.c2p(0, 0.18))
    self.cap('التوزيع الطبيعي منحنى جرسي متماثل.')
    self.play(Create(axes), run_time=0.8)
    self.play(Create(curve), run_time=1.4)
    self.play(Create(mu), FadeIn(mulbl))
    self.play(FadeIn(area), FadeIn(pct))
    self.cap('نحو ٦٨٪ من القيم ضمن انحراف واحد عن المتوسط.')
    self._b = VGroup(axes, curve, area, mu, mulbl, pct)

  def s_zscore(self):
    self.clear_body(self._b)
    self.section_label('الدرجة المعيارية')
    z = MathTex(r'Z = \dfrac{X - \mu}{\sigma}', font_size=52).move_to(UP * 0.9)
    note = ar('الدرجة المعيارية تقيس البعد عن المتوسط بوحدات σ.', size=22, color='#AEB8DC')
    self.fit(note, 4.3).next_to(z, DOWN, buff=0.8)
    self.cap('نحوّل أي قيمة إلى درجة معيارية Z.')
    self.play(Write(z), run_time=1.2)
    self.play(FadeIn(note, shift=UP * 0.08))
    self.cap('فنقارن توزيعات مختلفة على مقياس واحد.')
    self._z = VGroup(z, note)

  def s_example(self):
    self.clear_body(self._z)
    self.section_label('مثال محلول')
    e0 = MathTex(r'X \sim N(50,\,10^{2}),\quad P(X<60)', font_size=34).move_to(UP * 1.4)
    e1 = MathTex(r'Z = \dfrac{60-50}{10} = 1', font_size=40).next_to(e0, DOWN, buff=0.7)
    e2 = MathTex(r'P(Z<1) \approx 0.8413', font_size=44, color=C_GREEN).next_to(e1, DOWN, buff=0.7)
    self.cap('احسب الدرجة المعيارية للقيمة ٦٠.')
    self.play(Write(e0), run_time=1.1)
    self.play(Write(e1), run_time=1.1)
    self.cap('ثم اقرأ الاحتمال من جدول Z.')
    self.play(Write(e2), run_time=1.0)
    self.play(Flash(e2, color=C_GREEN, line_length=0.16, num_lines=14, flash_radius=1.4))
    self.cap('فيكون الاحتمال حوالي ٠٫٨٤.')
    self._e = VGroup(e0, e1, e2)

  def s_recap(self):
    self.clear_body(self._e)
    self.section_label('الخلاصة')
    r1 = MathTex(r'Z = \dfrac{X-\mu}{\sigma}', font_size=46)
    r2 = MathTex(r'\mu\pm\sigma \approx 68\%,\quad \mu\pm2\sigma \approx 95\%', font_size=30, color=C_GREEN)
    stack = VGroup(self.fit(r1, 4.2), self.fit(r2, 4.4)).arrange(DOWN, buff=0.9).move_to(UP * 0.2)
    self.cap('حوّل إلى Z، ثم اقرأ الاحتمال من المنحنى.')
    self.play(Write(r1), run_time=1.1)
    self.play(Write(r2), run_time=1.2)
    self.wait(1.6)
