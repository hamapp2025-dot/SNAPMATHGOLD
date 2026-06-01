from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

from snapmath_manim import get_render_target, list_render_targets

ROOT = Path(__file__).resolve().parent
QUALITY_FLAGS = {
  'preview': '-ql',
  'standard': '-qm',
  'production': '-qh',
}
RESOLUTION_FLAGS = {
  'preview': '540,960',
  'standard': '720,1280',
  'production': '1080,1920',
}


def build_parser() -> argparse.ArgumentParser:
  parser = argparse.ArgumentParser(description='Render a SnapMath lesson scene with Manim.')
  parser.add_argument('--lesson', help='Lesson ID, for example u1-l1 or u2-l1.')
  parser.add_argument(
    '--quality',
    choices=sorted(QUALITY_FLAGS),
    default='preview',
    help='Render quality preset.',
  )
  parser.add_argument('--open', action='store_true', help='Open the rendered video after export.')
  parser.add_argument('--list', action='store_true', help='List the registered lesson targets.')
  return parser


def print_targets() -> None:
  print('Registered SnapMath Manim targets:\n')
  for target in list_render_targets():
    print(f'- {target.lesson_id}: {target.title_en} / {target.title_ar}')
    print(f'  scene: {target.scene_file}:{target.scene_class}')
    print(f'  app asset target: {target.asset_target}')


def main() -> int:
  parser = build_parser()
  args = parser.parse_args()

  if args.list:
    print_targets()
    return 0

  if not args.lesson:
    parser.error('--lesson is required unless --list is used.')

  target = get_render_target(args.lesson)
  if target is None:
    parser.error(f'Unknown lesson "{args.lesson}". Run with --list to see available targets.')

  command = [
    sys.executable,
    '-m',
    'manim',
    QUALITY_FLAGS[args.quality],
    '-r',
    RESOLUTION_FLAGS[args.quality],
    '--config_file',
    str(ROOT / 'manim.cfg'),
  ]

  if args.open:
    command.append('-p')

  command.extend(
    [
      '-o',
      target.output_name,
      str(ROOT / target.scene_file),
      target.scene_class,
    ]
  )

  print(f'Rendering {target.lesson_id} -> {target.output_name}.mp4')
  print(f'Target app asset: {target.asset_target}')
  print('Command:')
  print(' '.join(command))

  completed = subprocess.run(command, cwd=ROOT, check=False)
  return completed.returncode


if __name__ == '__main__':
  raise SystemExit(main())
