from __future__ import annotations

from manim import (
  DOWN,
  LEFT,
  RIGHT,
  UP,
  Create,
  FadeIn,
  Flash,
  MathTex,
  Rectangle,
  Text,
  VGroup,
  Write,
)

from snapmath_manim.threeblue import C_COS, C_GREEN, C_SIN, C_TAN, Base3B1BScene, ar


class DistributionsScene(Base3B1BScene):
  lesson_id = 'u7-l1'

  def construct(self):
    self.s_binomial()
    self.s_chart()
    self.s_example()
    self.s_geometric()
    self.s_recap()
    self.flush()

  def s_binomial(self):
    self.section_label('التوزيع الثنائي')
    f = MathTex(r'P(X=k) = \binom{n}{k}\,p^{k}\,(1-p)^{\,n-k}', font_size=38)
    self.fit(f, 4.3).move_to(UP * 0.8)
    note = ar('احتمال نجاح k مرة من n محاولة.', size=24, color='#AEB8DC')
    self.fit(note, 4.3).next_to(f, DOWN, buff=0.8)
    self.cap('التوزيع الثنائي يعدّ النجاحات في n محاولة.')
    self.play(Write(f), run_time=1.3)
    self.play(FadeIn(note, shift=UP * 0.08))
    self.cap('لكل عدد نجاحات احتمال محدد.')
    self._f = VGroup(f, note)

  def s_chart(self):
    self.clear_body(self._f)
    self.section_label('توزيع B(5, 0.4)')
    probs = [0.078, 0.259, 0.346, 0.230, 0.077, 0.010]
    bars = VGroup()
    labels = VGroup()
    base_y = -1.6
    x0 = -1.9
    bw = 0.55
    gap = 0.12
    for k, pval in enumerate(probs):
      h = pval * 6.0
      color = C_GREEN if k == 2 else C_COS
      rect = Rectangle(width=bw, height=max(h, 0.05), fill_color=color, fill_opacity=0.85, stroke_width=0)
      rect.move_to([x0 + k * (bw + gap), base_y + h / 2, 0])
      bars.add(rect)
      lab = MathTex(str(k), font_size=26, color='#AEB8DC').next_to(rect, DOWN, buff=0.12)
      labels.add(lab)
    self.cap('نرسم احتمال كل عدد نجاحات كعمود.')
    self.play(Create(bars, lag_ratio=0.15), FadeIn(labels), run_time=2.0)
    self.play(Flash(bars[2], color=C_GREEN, line_length=0.14, num_lines=10, flash_radius=0.9))
    self.cap('العمود الأعلى عند k = 2 هو الأكثر احتمالاً.')
    self._c = VGroup(bars, labels)

  def s_example(self):
    self.clear_body(self._c)
    self.section_label('مثال محلول')
    e0 = MathTex(r'P(X=2),\quad B(5,\,0.4)', font_size=36).move_to(UP * 1.4)
    e1 = MathTex(r'= \binom{5}{2}(0.4)^{2}(0.6)^{3}', font_size=36).next_to(e0, DOWN, buff=0.6)
    e2 = MathTex(r'= 10 \cdot 0.16 \cdot 0.216', font_size=36).next_to(e1, DOWN, buff=0.5)
    e3 = MathTex(r'\approx 0.346', font_size=48, color=C_GREEN).next_to(e2, DOWN, buff=0.5)
    self.cap('عوّض n و k و p في الصيغة.')
    self.play(Write(e0), run_time=1.0)
    self.play(Write(e1), run_time=1.1)
    self.play(Write(e2), run_time=0.9)
    self.play(Write(e3), run_time=0.8)
    self.play(Flash(e3, color=C_GREEN, line_length=0.14, num_lines=12, flash_radius=1.4))
    self.cap('فيكون الاحتمال حوالي ٠٫٣٤٦.')
    self._e = VGroup(e0, e1, e2, e3)

  def s_geometric(self):
    self.clear_body(self._e)
    self.section_label('التوزيع الهندسي')
    g = MathTex(r'P(X=k) = (1-p)^{k-1}\,p', font_size=40).move_to(UP * 0.9)
    ex = MathTex(r'E(X) = np', font_size=44, color=C_GREEN).next_to(g, DOWN, buff=0.8)
    self.cap('التوزيع الهندسي يعدّ المحاولات حتى أول نجاح.')
    self.play(Write(g), run_time=1.2)
    self.cap('وتوقع التوزيع الثنائي يساوي n في p.')
    self.play(Write(ex), run_time=1.0)
    self.play(Flash(ex, color=C_GREEN, line_length=0.14, num_lines=12, flash_radius=1.3))
    self._g = VGroup(g, ex)

  def s_recap(self):
    self.clear_body(self._g)
    self.section_label('الخلاصة')
    t1 = ar('ثنائي الحد', size=22, color=C_COS)
    r1 = MathTex(r'\binom{n}{k}p^{k}(1-p)^{n-k}', font_size=34)
    t2 = ar('هندسي', size=22, color=C_SIN)
    r2 = MathTex(r'(1-p)^{k-1}p', font_size=34)
    r3 = MathTex(r'E(X)=np', font_size=40, color=C_GREEN)
    stack = VGroup(t1, self.fit(r1, 4.3), t2, self.fit(r2, 4.3), r3).arrange(DOWN, buff=0.4).move_to(UP * 0.2)
    self.cap('توزيعان أساسيان لعدّ النجاحات.')
    self.play(Write(r1), run_time=1.0)
    self.play(Write(r2), run_time=1.0)
    self.play(Write(r3), run_time=0.9)
    self.wait(1.6)
