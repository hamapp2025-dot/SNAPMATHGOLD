from manim import (
  DOWN,
  LEFT,
  RIGHT,
  Circle,
  Create,
  Dot,
  FadeIn,
  Indicate,
  Line,
  ValueTracker,
  Write,
  always_redraw,
)

from snapmath_manim.base_scene import SnapMathLessonScene
from snapmath_manim.theme import (
  SNAP_BLUE,
  SNAP_BLUE_SOFT,
  SNAP_GOLD,
  SNAP_MUTED,
  make_ar_text,
  make_label_chip,
  make_math,
)


class TrigIdentitiesIntroScene(SnapMathLessonScene):
  lesson_id = 'u2-l1'
  title_en = 'Trig Identities (1)'
  title_ar = 'المتطابقات المثلثية (1)'
  unit_en = 'Unit 2 - Trig Identities & Equations'
  unit_ar = 'الوحدة 2 - المتطابقات والمعادلات المثلثية'
  eyebrow_en = 'Unit circle core'
  eyebrow_ar = 'دائرة الوحدة'

  def construct(self):
    stage = self.build_stage()
    header = self.build_header()
    footer = self.build_footer_note(
      'Let the unit circle explain the identity before algebra.',
      'دع دائرة الوحدة تشرح المتطابقة قبل الجبر.',
    )

    self.add(stage)
    self.reveal_scaffold(header, footer)

    circle_center = LEFT * 1.05 + DOWN * 0.1
    circle = Circle(radius=0.95, color=SNAP_BLUE, stroke_width=4).move_to(circle_center)
    x_axis = Line(circle_center + LEFT * 1.08, circle_center + RIGHT * 1.08, color=SNAP_MUTED, stroke_width=2)
    y_axis = Line(circle_center + DOWN * 1.08, circle_center + (-DOWN) * 1.08, color=SNAP_MUTED, stroke_width=2)

    theta = ValueTracker(0.92)

    point = always_redraw(lambda: Dot(circle.point_at_angle(theta.get_value()), color=SNAP_GOLD, radius=0.06))
    radius = always_redraw(lambda: Line(circle_center, circle.point_at_angle(theta.get_value()), color=SNAP_GOLD, stroke_width=3))
    x_proj = always_redraw(
      lambda: Line(
        circle_center,
        [circle.point_at_angle(theta.get_value())[0], circle_center[1], 0],
        color=SNAP_BLUE_SOFT,
        stroke_width=3,
      )
    )
    y_proj = always_redraw(
      lambda: Line(
        [circle.point_at_angle(theta.get_value())[0], circle_center[1], 0],
        circle.point_at_angle(theta.get_value()),
        color=SNAP_GOLD,
        stroke_width=3,
      )
    )

    identity_chip = make_label_chip('المتطابقة الأساسية', is_ar=True).move_to(RIGHT * 1.05 + DOWN * 0.15)
    identity = make_math(r'\sin^2\theta + \cos^2\theta = 1', font_size=24)
    identity.next_to(identity_chip, DOWN, buff=0.18)
    double_angle = make_math(r'\sin 2\theta = 2\sin\theta \cos\theta', font_size=20)
    double_angle.next_to(identity, DOWN, buff=0.22)
    note = make_ar_text('الصورة أولاً، ثم البرهان، ثم التبسيط.', font_size=18, color=SNAP_MUTED)
    note.next_to(double_angle, DOWN, buff=0.18)

    example_chip = make_label_chip('تبسيط سريع', is_ar=True, chip_color=SNAP_GOLD).move_to(DOWN * 2.0)
    example = make_math(r'\frac{1-\cos 2\theta}{\sin 2\theta} = \tan \theta', font_size=18)
    example.next_to(example_chip, DOWN, buff=0.18)

    self.play(Create(circle), FadeIn(x_axis), FadeIn(y_axis))
    self.play(FadeIn(point), FadeIn(radius), FadeIn(x_proj), FadeIn(y_proj))
    self.play(theta.animate.set_value(1.22), run_time=1.4)
    self.play(FadeIn(identity_chip, shift=DOWN * 0.05))
    self.play(Write(identity))
    self.play(Indicate(identity, color=SNAP_GOLD))
    self.play(Write(double_angle))
    self.play(FadeIn(note, shift=DOWN * 0.05))
    self.play(FadeIn(example_chip, shift=DOWN * 0.05))
    self.play(Write(example))
    self.wait(1.2)
