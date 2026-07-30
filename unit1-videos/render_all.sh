#!/usr/bin/env bash
# SnapMath Unit 1 — render all clips (portrait 1080x1920 @ 30fps).
#
# Usage:
#   ./render_all.sh            # render every clip to ./out/
#   ./render_all.sh preview    # low-res 480p quick preview
#
# On the Mac (brand build), first edit snapmath_manim/threeblue.py:
#     AR_FONT = 'Cairo'
# so the captions use the SnapMath brand font instead of the Noto stand-in.

set -u
cd "$(dirname "$0")"
export PYTHONPATH="$PWD"

QUALITY="--resolution 1080,1920 --fps 30"
[ "${1:-}" = "preview" ] && QUALITY="--resolution 540,960 --fps 15"

mkdir -p out

# clip file : ClassName : output-name
CLIPS=(
  "scenes/clip_u1_1_1_longdiv.py:LongDivisionClip:u1-c1_1-longdiv"
  "scenes/clip_u1_1_2_synthetic.py:SyntheticDivisionClip:u1-c1_2-synthetic"
  "scenes/clip_u1_1_3_remainder.py:RemainderTheoremClip:u1-c1_3-remainder"
  "scenes/clip_u1_1_4_axminusb.py:AxMinusBClip:u1-c1_4-axminusb"
  "scenes/clip_u1_1_5_factor.py:FactorTheoremClip:u1-c1_5-factor"
  "scenes/clip_u1_1_6_fullfactor.py:FullFactorClip:u1-c1_6-fullfactor"
  "scenes/clip_u1_1_7_zeros_graph.py:ZerosGraphClip:u1-c1_7-zeros"
  "scenes/clip_u1_1_8_rational_zeros.py:RationalZerosClip:u1-c1_8-rationalzeros"
  "scenes/clip_u1_1_9_solving.py:SolvingEquationsClip:u1-c1_9-solving"
  "scenes/clip_u1_2_1_idea.py:PartialFractionsIdeaClip:u1-c2_1-idea"
  "scenes/clip_u1_2_2_distinct.py:DistinctLinearClip:u1-c2_2-distinct"
  "scenes/clip_u1_2_3_repeated.py:RepeatedFactorClip:u1-c2_3-repeated"
  "scenes/clip_u1_2_4_quadratic.py:QuadraticFactorClip:u1-c2_4-quadratic"
  "scenes/clip_u1_2_5_coverup.py:CoverUpClip:u1-c2_5-coverup"
  "scenes/clip_u1_2_6_improper.py:ImproperFractionClip:u1-c2_6-improper"
)

for entry in "${CLIPS[@]}"; do
  IFS=':' read -r file cls name <<< "$entry"
  echo ">>> rendering $name"
  SNAP_TIMINGS_OUT="out/${name}.timings.json" \
    manim $QUALITY --format mp4 -o "$name" "$file" "$cls" \
    && cp -f media/videos/*/*/"$name".mp4 "out/${name}.mp4" 2>/dev/null
done

echo "All done. Clips in ./out/"
