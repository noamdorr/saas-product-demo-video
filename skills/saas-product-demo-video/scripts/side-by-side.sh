#!/usr/bin/env bash
# side-by-side.sh - two clips at half size, side by side, with the first
# clip's audio: the way to put two directions for one scene in front of the
# user at once (render each as a test bed first; iteration-playbook.md).
#
# Usage: side-by-side.sh left.mp4 right.mp4 out.mp4
#
# Name the output after its order (hookB-compare-track-left-calendar-right.mp4):
# Homebrew's ffmpeg is built without the drawtext filter, so the clips cannot
# be labeled in the picture.
#
# Color: each input is converted to RGB through its own matrix (an untagged
# Remotion render decodes as BT.601, a `--color-space=bt709` one as BT.709)
# and the output is tagged BT.709 with an sRGB transfer, like a finished
# deliverable (render-export.md). Without this, stacking a tagged and an
# untagged file converts one of them and the comparison shows a color shift
# that is not in either film (gotchas.md 61). The comparison is still half
# size: a pick that hangs on a detail needs full-size stills beside it.

set -euo pipefail
if [[ $# -ne 3 ]]; then
  echo "Usage: $0 left.mp4 right.mp4 out.mp4" >&2
  exit 2
fi
fit="scale=960:540:force_original_aspect_ratio=decrease:in_color_matrix=auto:out_color_matrix=bt709,pad=960:540:(ow-iw)/2:(oh-ih)/2"
ffmpeg -y -v error -i "$1" -i "$2" \
  -filter_complex "[0:v]${fit}[a];[1:v]${fit}[b];[a][b]hstack=inputs=2[v]" \
  -map "[v]" -map "0:a?" -c:v libx264 -crf 18 -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc iec61966-2-1 -movflags +write_colr+faststart \
  -c:a aac "$3"
echo "$3"
