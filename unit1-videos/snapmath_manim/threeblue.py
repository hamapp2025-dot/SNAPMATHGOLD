"""SnapMath 3Blue1Brown-style engine.

Shared base scene + palette + Arabic text helper for all SnapMath clips.
Portrait 1080x1920. Pure black canvas, color-as-meaning, calm pacing.

Font note: uses 'Noto Sans Arabic' as a stand-in for the brand font 'Cairo'.
When rendering on the Mac with Cairo installed, set AR_FONT = 'Cairo'
(single-line change) and re-render for the final brand look.
"""
from __future__ import annotations

import os

from manim import (
    BOLD,
    DOWN,
    UP,
    WHITE,
    FadeOut,
    Scene,
    Text,
    VGroup,
    config,
)

# ---- palette (3b1b color-as-meaning) ---------------------------------------
BG = '#000000'
C_SIN = '#F2D33C'     # yellow  — primary / "sine" role
C_COS = '#3B8CFF'     # blue    — secondary / "cosine" role
C_ONE = '#FFFFFF'     # white   — neutral / unity
C_GREEN = '#83C167'   # green   — result / correct
C_TAN = '#FF784F'     # orange  — factored form / tangent role
C_PURPLE = '#B58DF1'  # purple  — auxiliary
C_MUT = '#AEB8DC'     # muted   — candidates / secondary text
C_AXIS = '#48557f'    # faint   — axes / grid

# ---- fonts -----------------------------------------------------------------
AR_FONT = 'Cairo'   # SnapMath brand font (installed from node_modules/@expo-google-fonts)

config.background_color = BG


def ar(text, *, size=22, color=WHITE, weight=BOLD):
    """Arabic text mobject. Captions must stay PURE Arabic (no inline Latin/
    math variables) or bidi reordering scrambles the line."""
    return Text(text, font=AR_FONT, font_size=size, color=color, weight=weight)


class Base3B1BScene(Scene):
    """Base scene: black bg, section label at top, pure-Arabic caption at
    bottom, timing capture for downstream voiceover alignment."""

    lesson_id = 'unknown'

    def setup(self):
        self.camera.background_color = BG
        self._cap = None
        self._section = None
        self._timings = []
        self._t = 0.0

    # ---- layout helpers ----
    def fit(self, mob, width):
        """Scale mob down (never up) to fit a target width in scene units."""
        if mob.width > width:
            mob.scale(width / mob.width)
        return mob

    def section_label(self, text_ar):
        from manim import FadeIn
        lbl = ar(text_ar, size=24, color=C_MUT).to_edge(UP, buff=0.6)
        if self._section is not None:
            self.play(FadeOut(self._section), run_time=0.25)
        self._section = lbl
        self.play(FadeIn(lbl, shift=DOWN * 0.15))
        return lbl

    def _read(self, text):
        """Approximate calm narration time for an Arabic caption."""
        words = max(1, len(text.split()))
        return max(1.4, min(4.0, 0.42 * words + 0.6))

    def cap(self, text_ar, hold=None):
        """Show a pure-Arabic caption at the bottom; record its timing."""
        from manim import FadeIn
        dur = hold if hold is not None else self._read(text_ar)
        new = ar(text_ar, size=19, color=WHITE).to_edge(DOWN, buff=0.7)
        self.fit(new, 4.6)
        anims = [FadeIn(new, shift=UP * 0.12)]
        if self._cap is not None:
            anims.append(FadeOut(self._cap, shift=UP * 0.12))
        self.play(*anims, run_time=0.4)
        self._cap = new
        self._timings.append({'t': round(self._t, 2), 'text': text_ar, 'dur': round(dur, 2)})
        self._t += dur
        self.wait(dur)
        return new

    def clear_body(self, *groups):
        from manim import FadeOut as _FO
        mobs = []
        for g in groups:
            for m in (g if isinstance(g, (list, tuple, VGroup)) else [g]):
                try:
                    m.clear_updaters()
                except Exception:
                    pass
                mobs.append(m)
        if mobs:
            self.play(*[_FO(m) for m in mobs], run_time=0.4)

    def flush(self):
        """Write caption timings to the file named by SNAP_TIMINGS_OUT, if set."""
        out = os.environ.get('SNAP_TIMINGS_OUT')
        if out:
            import json
            payload = {'lesson_id': self.lesson_id, 'timings': self._timings}
            try:
                with open(out, 'w', encoding='utf-8') as f:
                    json.dump(payload, f, ensure_ascii=False, indent=2)
            except Exception:
                pass
