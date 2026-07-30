#!/usr/bin/env bash
# Render all Unit 1 two-minute clips (portrait 1080x1920 @ 30fps, Cairo font).
set -u
cd "$(dirname "$0")"
export PYTHONPATH="$PWD"
mkdir -p out2

CLIPS=(
  "scenes2/c1_1_longdiv.py:LongDivision2Min:u1-c1_1-longdiv-2min"
  "scenes2/c1_2_synthetic.py:SyntheticDivision2Min:u1-c1_2-synthetic-2min"
  "scenes2/c1_3_remainder.py:RemainderTheorem2Min:u1-c1_3-remainder-2min"
  "scenes2/c1_4_axminusb.py:AxMinusB2Min:u1-c1_4-axminusb-2min"
  "scenes2/c1_5_factor.py:FactorTheorem2Min:u1-c1_5-factor-2min"
  "scenes2/c1_6_fullfactor.py:FullFactor2Min:u1-c1_6-fullfactor-2min"
  "scenes2/c1_7_zeros_graph.py:ZerosGraph2Min:u1-c1_7-zeros-2min"
  "scenes2/c1_8_rational_zeros.py:RationalZeros2Min:u1-c1_8-rationalzeros-2min"
  "scenes2/c1_9_solving.py:Solving2Min:u1-c1_9-solving-2min"
  "scenes2/c2_1_idea.py:PartialFractionsIdea2Min:u1-c2_1-idea-2min"
  "scenes2/c2_2_distinct.py:DistinctLinear2Min:u1-c2_2-distinct-2min"
  "scenes2/c2_3_repeated.py:RepeatedFactor2Min:u1-c2_3-repeated-2min"
  "scenes2/c2_4_quadratic.py:QuadraticFactor2Min:u1-c2_4-quadratic-2min"
  "scenes2/c2_5_coverup.py:CoverUp2Min:u1-c2_5-coverup-2min"
  "scenes2/c2_6_improper.py:ImproperFraction2Min:u1-c2_6-improper-2min"
)

for entry in "${CLIPS[@]}"; do
  IFS=':' read -r file cls name <<< "$entry"
  if [ -f "out2/${name}.mp4" ]; then echo ">>> skip $name (exists)"; continue; fi
  echo ">>> rendering $name"
  SNAP_TIMINGS_OUT="out2/${name}.timings.json" \
    manim --resolution 1080,1920 --fps 30 --format mp4 -o "$name" "$file" "$cls" \
    && cp -f media/videos/*/*/"$name".mp4 "out2/${name}.mp4" 2>/dev/null
done
echo "BATCH_DONE"
