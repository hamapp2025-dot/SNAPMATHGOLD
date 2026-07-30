from __future__ import annotations

from manim import (
    DOWN,
    UP,
    Axes,
    Create,
    Dot,
    FadeIn,
    Flash,
    MathTex,
    VGroup,
    Write,
)

from snapmath_manim.threeblue import C_AXIS, C_GREEN, C_SIN, Base3B1BScene


class ZerosGraphClip(Base3B1BScene):
    lesson_id = 'u1-c1.7'

    def construct(self):
        self.section_label('الأصفار ورسم المنحنى')

        ax = Axes(
            x_range=[-5, 2.5, 1],
            y_range=[-3, 3, 1],
            x_length=5.0,
            y_length=5.2,
            axis_config={'color': C_AXIS, 'stroke_width': 2, 'include_ticks': True},
            tips=False,
        ).move_to(UP * 0.2)

        def f(x):
            return (x - 1) * (x + 3) * (x + 4) / 6.0

        curve = ax.plot(f, x_range=[-4.7, 2.1], color=C_SIN, stroke_width=4)

        self.cap('أصفار كثير الحدود هي نقاط تقاطعه مع محور السينات.')
        self.play(Create(ax), run_time=1.0)
        self.play(Create(curve), run_time=1.6)

        zeros = [-4, -3, 1]
        dots = VGroup(*[Dot(ax.c2p(z, 0), color=C_GREEN, radius=0.08) for z in zeros])
        self.play(FadeIn(dots, scale=0.5), run_time=0.8)
        for d in dots:
            self.play(Flash(d, color=C_GREEN, line_length=0.12, num_lines=10, flash_radius=0.5),
                      run_time=0.4)
        self.cap('هنا ثلاثة أصفار حيث يعبر المنحنى المحور.')

        label = MathTex(r'x = 1,\ -3,\ -4', font_size=32, color=C_GREEN).to_edge(DOWN, buff=1.5)
        self.play(Write(label), run_time=1.0)
        self.cap('فالجذور والرسم وجهان لنفس الفكرة.', hold=2.0)
        self.wait(0.4)
        self.flush()
