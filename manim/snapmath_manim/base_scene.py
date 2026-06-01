from manim import DOWN, LEFT, RIGHT, UP, FadeIn, Line, Scene, VGroup

from .theme import (
  SNAP_BG,
  SNAP_BLUE,
  SNAP_GOLD,
  SNAP_MUTED,
  make_ar_text,
  make_ar_title_text,
  make_en_text,
  make_label_chip,
  make_stage_shell,
)


class SnapMathLessonScene(Scene):
  lesson_id = 'lesson-id'
  title_en = 'Lesson Title'
  title_ar = 'عنوان الدرس'
  unit_en = 'Grade 12'
  unit_ar = 'الصف 12'
  eyebrow_en = 'Manim core'
  eyebrow_ar = 'شرح Manim'
  show_english_title = True
  show_english_footer = True
  header_max_width = 3.45
  footer_max_width = 3.7

  def setup(self):
    self.camera.background_color = SNAP_BG

  def build_stage(self) -> VGroup:
    shell = make_stage_shell()
    shell.move_to(DOWN * 0.25)

    accent_line = Line(
      shell.get_corner(UP + LEFT) + RIGHT * 0.35 + DOWN * 0.16,
      shell.get_corner(UP + RIGHT) + LEFT * 0.35 + DOWN * 0.16,
      stroke_width=4,
    )
    accent_line.set_color_by_gradient(SNAP_BLUE, SNAP_GOLD)

    return VGroup(shell, accent_line)

  def fit_to_width(self, mob, max_width: float):
    if mob.width > max_width:
      mob.scale_to_fit_width(max_width)
    return mob

  def build_header(self) -> VGroup:
    eyebrow = make_label_chip(self.eyebrow_ar, is_ar=True, chip_color=SNAP_BLUE, font_size=16)
    lesson_chip = make_label_chip(
      self.lesson_id.upper(),
      chip_color=SNAP_GOLD,
      text_color=SNAP_BG,
      font_size=16,
    )
    top_row = self.fit_to_width(VGroup(eyebrow, lesson_chip).arrange(RIGHT, buff=0.12), self.header_max_width)

    stack_items = [top_row, self.fit_to_width(make_ar_title_text(self.title_ar, font_size=24), self.header_max_width)]
    if self.show_english_title and self.title_en:
      stack_items.append(
        self.fit_to_width(make_en_text(self.title_en, font_size=15, color=SNAP_MUTED), self.header_max_width)
      )

    stack = VGroup(*stack_items).arrange(DOWN, buff=0.08)
    stack.to_edge(UP, buff=0.22)
    return stack

  def build_footer_note(self, note_en: str, note_ar: str) -> VGroup:
    footer_items = [self.fit_to_width(make_ar_text(note_ar, font_size=20, color=SNAP_MUTED), self.footer_max_width)]
    if self.show_english_footer and note_en:
      footer_items.append(
        self.fit_to_width(make_en_text(note_en, font_size=12, color=SNAP_MUTED), self.footer_max_width)
      )

    footer = VGroup(*footer_items).arrange(DOWN, buff=0.08)
    footer.to_edge(DOWN, buff=0.25)
    return footer

  def reveal_scaffold(self, *mobjects):
    animations = [FadeIn(mob, shift=DOWN * 0.08) for mob in mobjects]
    self.play(*animations)
