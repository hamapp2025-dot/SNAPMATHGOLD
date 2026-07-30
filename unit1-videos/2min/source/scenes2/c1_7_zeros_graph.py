from __future__ import annotations

from manim import (
    DOWN,
    UP,
    Axes,
    Create,
    Dot,
    FadeIn,
    FadeOut,
    Flash,
    MathTex,
    VGroup,
    Write,
)

from snapmath_manim.threeblue import C_AXIS, C_COS, C_GREEN, C_SIN, Base3B1BScene


class ZerosGraph2Min(Base3B1BScene):
    lesson_id = 'u1-c1.7'

    def construct(self):
        # hook
        self.section_label('الأصفار ورسم المنحنى')
        self.cap('ما علاقة جذور كثير الحدود بشكل منحناه؟', hold=10.7)

        # rule + example 1 — textbook cubic
        ax = Axes(
            x_range=[-5, 2.5, 1], y_range=[-3, 3, 1],
            x_length=4.8, y_length=4.6,
            axis_config={'color': C_AXIS, 'stroke_width': 2},
            tips=False,
        ).move_to(UP * 0.4)

        def f(x):
            return (x - 1) * (x + 3) * (x + 4) / 6.0

        curve = ax.plot(f, x_range=[-4.7, 2.1], color=C_SIN, stroke_width=4)
        self.play(Create(ax), run_time=1.0)
        self.cap('كل صفر هو نقطة يقطع فيها المنحنى محور السينات.', hold=11.6)
        self.play(Create(curve), run_time=1.8)

        lbl = MathTex(r'y = (x-1)(x+3)(x+4)', font_size=26, color=C_SIN).move_to(DOWN * 2.3)
        self.fit(lbl, 4.4)
        self.play(Write(lbl), run_time=1.0)
        self.cap('هذا منحنى مثالنا المألوف من الدرس السابق.', hold=10.7)

        dots = VGroup(*[Dot(ax.c2p(z, 0), color=C_GREEN, radius=0.09) for z in (-4, -3, 1)])
        self.play(FadeIn(dots, scale=0.5), run_time=0.8)
        for d in dots:
            self.play(Flash(d, color=C_GREEN, line_length=0.12, num_lines=10, flash_radius=0.5),
                      run_time=0.4)
        self.cap('ثلاثة عوامل خطية تعني ثلاث نقاط تقاطع.', hold=11.6)
        z1 = MathTex(r'x = -4,\ -3,\ 1', font_size=30, color=C_GREEN).move_to(DOWN * 3.1)
        self.play(Write(z1), run_time=1.0)
        self.wait(1.0)

        # example 2 — exam style: from factored form with GCF
        self.clear_body(ax, curve, lbl, dots, z1)
        self.section_label('سؤال بنمط الامتحان')
        p2 = MathTex(r'y = x^{3} - 4x = x(x-2)(x+2)', font_size=28, color=C_SIN).move_to(UP * 2.6)
        self.fit(p2, 4.5)
        self.play(Write(p2), run_time=1.2)
        self.cap('حلّل أولًا: عامل مشترك ثم فرق مربعين.', hold=11.6)

        ax2 = Axes(
            x_range=[-3, 3, 1], y_range=[-3.5, 3.5, 1],
            x_length=4.8, y_length=4.6,
            axis_config={'color': C_AXIS, 'stroke_width': 2},
            tips=False,
        ).move_to(DOWN * 0.4)

        def g(x):
            return (x ** 3 - 4 * x) / 2.2

        curve2 = ax2.plot(g, x_range=[-2.55, 2.55], color=C_COS, stroke_width=4)
        self.play(Create(ax2), run_time=1.0)
        self.play(Create(curve2), run_time=1.8)
        self.cap('المنحنى يقطع المحور عند الجذور الثلاثة.', hold=10.7)

        dots2 = VGroup(*[Dot(ax2.c2p(z, 0), color=C_GREEN, radius=0.09) for z in (-2, 0, 2)])
        self.play(FadeIn(dots2, scale=0.5), run_time=0.8)
        for d in dots2:
            self.play(Flash(d, color=C_GREEN, line_length=0.12, num_lines=10, flash_radius=0.5),
                      run_time=0.4)
        z2 = MathTex(r'x = -2,\ 0,\ 2', font_size=30, color=C_GREEN).move_to(DOWN * 3.2)
        self.play(Write(z2), run_time=1.0)
        self.cap('سالب اثنين وصفر واثنان: التماثل واضح في الرسم.', hold=11.6)

        # recap
        self.clear_body(p2, ax2, curve2, dots2, z2)
        self.section_label('الخلاصة')
        recap = MathTex(r'\text{zeros} = x\text{-intercepts}', font_size=36, color=C_SIN)
        recap.move_to(UP * 0.8)
        self.fit(recap, 4.4)
        self.play(Write(recap), run_time=1.0)
        self.play(Flash(recap, color=C_SIN, line_length=0.14, num_lines=14, flash_radius=1.4))
        self.wait(1.5)
        self.cap('الجذور جبرًا هي نقاط التقاطع هندسيًا: وجهان لفكرة واحدة.', hold=13.1)
        self.wait(0.6)
        self.flush()
