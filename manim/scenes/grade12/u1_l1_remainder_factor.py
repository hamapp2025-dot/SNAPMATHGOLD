from manim import DOWN, FadeIn, FadeOut, Indicate, RIGHT, TransformMatchingTex, UP, VGroup, Write

from snapmath_manim.base_scene import SnapMathLessonScene
from snapmath_manim.theme import (
  SNAP_BG,
  SNAP_GOLD,
  SNAP_MUTED,
  SNAP_SUCCESS,
  make_ar_text,
  make_ar_title_text,
  make_label_chip,
  make_math,
)


class RemainderFactorTheoremsScene(SnapMathLessonScene):
  lesson_id = 'u1-l1'
  title_en = 'Remainder & Factor Theorems'
  title_ar = 'نظريتا الباقي والعامل'
  unit_en = 'Unit 1 - Functions & Algebraic Expressions'
  unit_ar = 'الوحدة 1 - الدوال والتعابير الجبرية'
  eyebrow_en = 'Remainder core'
  eyebrow_ar = 'نظرية الباقي'
  show_english_title = False
  show_english_footer = False
  body_copy_max_width = 3.6

  def build_header(self) -> VGroup:
    lesson_chip = make_label_chip(
      self.lesson_id.upper(),
      chip_color=SNAP_GOLD,
      text_color=SNAP_BG,
      font_size=16,
    )
    title = self.fit_to_width(make_ar_title_text(self.title_ar, font_size=24), self.header_max_width)
    stack = VGroup(lesson_chip, title).arrange(DOWN, buff=0.1)
    stack.to_edge(UP, buff=0.22)
    return stack

  def make_section_header(self, ar_label: str, *, is_core: bool = False):
    return make_ar_title_text(
      ar_label,
      font_size=18,
      color=SNAP_GOLD if is_core else SNAP_SUCCESS,
    )

  def make_copy(self, ar_text: str, y: float, *, font_size: int = 20, color=SNAP_MUTED):
    copy = self.fit_to_width(
      make_ar_text(ar_text, font_size=font_size, color=color),
      self.body_copy_max_width,
    )
    copy.move_to(DOWN * y)
    return copy

  def make_tag(self, label: str, y: float, *, color=SNAP_GOLD, font_size: int = 20):
    tag = make_ar_text(label, font_size=font_size, color=color)
    tag.move_to(DOWN * y)
    return tag

  def construct(self):
    stage = self.build_stage()
    stage.shift(DOWN * 0.18)
    header = self.build_header()

    self.add(stage)
    self.reveal_scaffold(header)

    overview_header = self.make_section_header('الباقي مباشرة', is_core=True)
    overview_header.next_to(header, DOWN, buff=0.2)
    division_rule = make_math(r'P(x) = (x-a)Q(x) + R', font_size=30).move_to(UP * 0.6)
    division_rule.set_color_by_tex('R', SNAP_GOLD)
    remainder_focus = make_math(r'R', font_size=54, color=SNAP_GOLD).move_to(DOWN * 0.1)
    remainder_label = self.make_tag('الباقي', 0.72, color=SNAP_GOLD, font_size=28)
    shortcut = make_math(r'P(a) = R', font_size=46, color=SNAP_GOLD).move_to(DOWN * 1.45)
    shortcut_tag = self.make_tag('عوّض أولاً', 2.08, color=SNAP_SUCCESS, font_size=25)
    overview_group = VGroup(
      overview_header,
      division_rule,
      remainder_focus,
      remainder_label,
      shortcut,
      shortcut_tag,
    )

    self.play(FadeIn(overview_header, shift=DOWN * 0.08))
    self.play(Write(division_rule))
    self.play(FadeIn(remainder_focus, shift=DOWN * 0.05), FadeIn(remainder_label, shift=DOWN * 0.05))
    self.play(Write(shortcut))
    self.play(FadeIn(shortcut_tag, shift=DOWN * 0.05))
    self.play(Indicate(shortcut, color=SNAP_GOLD), Indicate(remainder_focus, color=SNAP_GOLD))
    self.wait(18)

    derivation_header = self.make_section_header('لماذا P(a)', is_core=True)
    derivation_header.next_to(header, DOWN, buff=0.2)
    step1 = make_math(r'P(x) = (x-a)Q(x) + R', font_size=28).move_to(UP * 0.55)
    step1.set_color_by_tex('R', SNAP_GOLD)
    step2 = make_math(r'P(a) = (a-a)Q(a) + R', font_size=28).move_to(DOWN * 0.05)
    step2.set_color_by_tex('(a-a)', SNAP_GOLD)
    step2.set_color_by_tex('R', SNAP_SUCCESS)
    step3 = make_math(r'P(a) = 0 \cdot Q(a) + R', font_size=28).move_to(DOWN * 0.75)
    step3.set_color_by_tex('0', SNAP_GOLD)
    step3.set_color_by_tex('R', SNAP_SUCCESS)
    step4 = make_math(r'P(a) = R', font_size=44, color=SNAP_GOLD).move_to(DOWN * 1.55)
    zero_tag = self.make_tag('يصير صفراً', 1.42, color=SNAP_GOLD, font_size=24)
    remain_tag = self.make_tag('يبقى R', 2.18, color=SNAP_SUCCESS, font_size=24)
    derivation_group = VGroup(derivation_header, step1, step2, step3, step4, zero_tag, remain_tag)

    self.play(FadeOut(overview_group, shift=DOWN * 0.08))
    self.play(FadeIn(derivation_header, shift=DOWN * 0.08), Write(step1))
    self.wait(8)
    self.play(TransformMatchingTex(step1.copy(), step2))
    self.wait(8)
    self.play(TransformMatchingTex(step2.copy(), step3))
    self.play(FadeIn(zero_tag, shift=DOWN * 0.05))
    self.play(TransformMatchingTex(step3.copy(), step4), FadeOut(zero_tag, shift=DOWN * 0.05))
    self.play(FadeIn(remain_tag, shift=DOWN * 0.05))
    self.play(Indicate(step4, color=SNAP_GOLD))
    self.wait(10)

    factor_header = self.make_section_header('نظرية العامل', is_core=True)
    factor_header.next_to(header, DOWN, buff=0.2)
    factor_step1 = make_math(r'P(a)=0 \Rightarrow R=0', font_size=32).move_to(UP * 0.6)
    factor_step1.set_color_by_tex('0', SNAP_GOLD)
    factor_step1.set_color_by_tex('R', SNAP_SUCCESS)
    factor_step2 = make_math(r'R=0 \Rightarrow P(x) = (x-a)Q(x)', font_size=28).move_to(DOWN * 0.15)
    factor_step2.set_color_by_tex('R', SNAP_GOLD)
    factor_factor = make_math(r'(x-a)', font_size=34, color=SNAP_SUCCESS)
    factor_badge = make_ar_text('عامل', font_size=24, color=SNAP_SUCCESS)
    factor_step3 = VGroup(factor_factor, factor_badge).arrange(DOWN, buff=0.16).move_to(DOWN * 1.18)
    factor_group = VGroup(factor_header, factor_step1, factor_step2, factor_step3)

    self.play(FadeOut(derivation_group, shift=DOWN * 0.08))
    self.play(FadeIn(factor_header, shift=DOWN * 0.08))
    self.play(Write(factor_step1))
    self.wait(8)
    self.play(Write(factor_step2))
    self.wait(8)
    self.play(FadeIn(factor_step3, shift=DOWN * 0.05))
    self.play(Indicate(factor_step3, color=SNAP_SUCCESS))
    self.wait(16)

    example_header = self.make_section_header('مثال أردني محلول')
    example_header.next_to(header, DOWN, buff=0.2)
    example_prompt_factor = make_math(r'(x+2)', font_size=34, color=SNAP_GOLD)
    example_prompt_badge = make_label_chip('عامل؟', is_ar=True, chip_color=SNAP_GOLD, text_color=SNAP_BG, font_size=18)
    example_prompt = VGroup(example_prompt_factor, example_prompt_badge).arrange(DOWN, buff=0.14)
    example_prompt.next_to(example_header, DOWN, buff=0.28)
    example_poly = make_math(r'P(x)=x^3+2x^2-x-2', font_size=26).move_to(UP * 0.45)
    example_eval1 = make_math(r'P(-2)=(-2)^3+2(-2)^2-(-2)-2', font_size=22).move_to(DOWN * 0.35)
    example_eval2 = make_math(r'P(-2)=-8+8+2-2', font_size=26).move_to(DOWN * 0.95)
    example_eval3 = make_math(r'P(-2)=0', font_size=38, color=SNAP_SUCCESS).move_to(DOWN * 1.55)
    example_factor = make_math(r'(x+2)', font_size=34, color=SNAP_GOLD)
    example_badge = make_ar_text('عامل', font_size=24, color=SNAP_GOLD)
    example_result = VGroup(example_factor, example_badge).arrange(DOWN, buff=0.16).move_to(DOWN * 2.05)
    example_group = VGroup(
      example_header,
      example_prompt,
      example_poly,
      example_eval1,
      example_eval2,
      example_eval3,
      example_result,
    )

    self.play(FadeOut(factor_group, shift=DOWN * 0.08))
    self.play(FadeIn(example_header, shift=DOWN * 0.08))
    self.play(Write(example_poly))
    self.play(FadeIn(example_prompt, shift=DOWN * 0.05))
    self.wait(8)
    self.play(Write(example_eval1))
    self.wait(10)
    self.play(Write(example_eval2))
    self.wait(10)
    self.play(Write(example_eval3))
    self.play(Indicate(example_eval3, color=SNAP_SUCCESS))
    self.wait(10)
    self.play(FadeIn(example_result, shift=DOWN * 0.05))
    self.wait(12)

    check_header = self.make_section_header('تحقق سريع')
    check_header.next_to(header, DOWN, buff=0.2)
    check1_prompt = self.make_copy(
      'ما قيمة P(2) إذا كانت P(x)=x^2-3x+2؟',
      0.1,
    )
    check1_math = make_math(r'P(2)=2^2-3(2)+2=0', font_size=32, color=SNAP_SUCCESS).move_to(DOWN * 0.85)
    check1_answer = self.make_copy(
      'الإجابة الصحيحة: 0',
      1.75,
    )
    check1_group = VGroup(check_header, check1_prompt, check1_math, check1_answer)

    check2_prompt = self.make_copy(
      'إذا كانت P(a)=0 فإن (x-a) هو عامل وليس باقياً.',
      0.1,
    )
    check2_math = self.make_copy(
      'إذا كانت P(a)=0 فهذا يعني أن (x-a) عامل.',
      0.85,
      font_size=22,
      color=SNAP_SUCCESS,
    )
    check2_answer = self.make_copy(
      'هذه هي أسرع خطوة لحل أسئلة العامل في الامتحان.',
      1.75,
    )
    check2_group = VGroup(check_header, check2_prompt, check2_math, check2_answer)

    self.play(FadeOut(example_group, shift=DOWN * 0.08))
    self.play(FadeIn(check_header, shift=DOWN * 0.08))
    self.play(FadeIn(check1_prompt, shift=DOWN * 0.05), Write(check1_math))
    self.play(FadeIn(check1_answer, shift=DOWN * 0.05))
    self.wait(18)
    self.play(FadeOut(VGroup(check1_prompt, check1_math, check1_answer), shift=DOWN * 0.05))
    self.play(FadeIn(check2_prompt, shift=DOWN * 0.05), Write(check2_math))
    self.play(FadeIn(check2_answer, shift=DOWN * 0.05))
    self.wait(18)

    recap_header = self.make_section_header('الخلاصة الامتحانية')
    recap_header.next_to(header, DOWN, buff=0.2)
    recap_step1 = self.make_copy(
      '1. عوّض أولاً',
      0.45,
    )
    recap_step2 = self.make_copy(
      '2. اقرأ P(a)',
      1.1,
    )
    recap_step3 = self.make_copy(
      '3. الصفر يعني عامل',
      1.75,
    )
    recap_rule = make_math(r'P(a)=0', font_size=40, color=SNAP_GOLD)
    recap_meaning = make_ar_text('يعني', font_size=22, color=SNAP_MUTED)
    recap_factor = make_math(r'(x-a)', font_size=34, color=SNAP_GOLD)
    recap_badge = make_ar_text('عامل', font_size=24, color=SNAP_GOLD)
    recap_result = VGroup(recap_factor, recap_badge).arrange(DOWN, buff=0.1)
    recap_formula = VGroup(recap_rule, recap_meaning, recap_result).arrange(DOWN, buff=0.16).move_to(DOWN * 2.35)
    recap_group = VGroup(recap_header, recap_step1, recap_step2, recap_step3, recap_formula)

    self.play(FadeOut(VGroup(check_header, check2_prompt, check2_math, check2_answer), shift=DOWN * 0.08))
    self.play(FadeIn(recap_header, shift=DOWN * 0.08))
    self.play(FadeIn(recap_step1, shift=DOWN * 0.05))
    self.play(FadeIn(recap_step2, shift=DOWN * 0.05))
    self.play(FadeIn(recap_step3, shift=DOWN * 0.05))
    self.play(FadeIn(recap_formula, shift=DOWN * 0.05))
    self.play(Indicate(recap_result, color=SNAP_GOLD))
    self.wait(30)
