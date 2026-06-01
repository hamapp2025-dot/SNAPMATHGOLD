from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class LessonRenderTarget:
  lesson_id: str
  title_en: str
  title_ar: str
  scene_file: str
  scene_class: str
  output_name: str
  asset_target: str


LESSON_RENDER_TARGETS = {
  'u1-l1': LessonRenderTarget(
    lesson_id='u1-l1',
    title_en='Remainder & Factor Theorems',
    title_ar='نظريتا الباقي والعامل',
    scene_file='scenes/grade12/u1_l1_remainder_factor.py',
    scene_class='RemainderFactorTheoremsScene',
    output_name='u1-l1-hero',
    asset_target='assets/media/lessons/u1-l1-hero.mp4',
  ),
  'u2-l1': LessonRenderTarget(
    lesson_id='u2-l1',
    title_en='Trig Identities (1)',
    title_ar='المتطابقات المثلثية (1)',
    scene_file='scenes/grade12/u2_l1_trig_identities.py',
    scene_class='TrigIdentitiesIntroScene',
    output_name='u2-l1-hero',
    asset_target='assets/media/lessons/u2-l1-hero.mp4',
  ),
}


def get_render_target(lesson_id: str) -> LessonRenderTarget | None:
  return LESSON_RENDER_TARGETS.get(lesson_id)


def list_render_targets() -> list[LessonRenderTarget]:
  return list(LESSON_RENDER_TARGETS.values())
