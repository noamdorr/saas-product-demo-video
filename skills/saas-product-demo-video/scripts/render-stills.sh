#!/usr/bin/env bash
# render-stills.sh - render single frames of a composition so they can be
# looked at before anyone watches the video.
#
# Usage (from the Remotion project root):
#   render-stills.sh <composition-id> <frame> [<frame> ...]
#
# Example:
#   render-stills.sh Scene-03 45 88 119
#   -> out/check/Scene-03-f0045.png, -f0088.png, -f0119.png
#
# Several frames that sit close together are rendered in one pass as an image
# sequence, which is much faster than starting the renderer once per frame.
#
# Env: SCALE=0.5 renders at half size, which is faster and still readable.
#      PROPS='{"debugClicks":true}' passes input props, for example to switch
#      on the click-target overlay (assets/components/DebugClickTargets.tsx).

set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <composition-id> <frame> [<frame> ...]" >&2
  exit 1
fi

if [[ ! -f package.json ]]; then
  echo "ERROR: run this from the Remotion project root (no package.json here)." >&2
  exit 1
fi

COMP="$1"; shift
SCALE="${SCALE:-1}"
PROPS="${PROPS:-}"
if [[ -z "$PROPS" ]]; then PROPS='{}'; fi
OUT_DIR="out/check"
mkdir -p "$OUT_DIR"

MIN=""; MAX=""
for FRAME in "$@"; do
  if ! [[ "$FRAME" =~ ^[0-9]+$ ]]; then
    echo "ERROR: frame must be a whole number, got '$FRAME'" >&2
    exit 1
  fi
  if [[ -z "$MIN" || "$FRAME" -lt "$MIN" ]]; then MIN="$FRAME"; fi
  if [[ -z "$MAX" || "$FRAME" -gt "$MAX" ]]; then MAX="$FRAME"; fi
done

out_path() { echo "$OUT_DIR/$COMP-f$(printf '%04d' "$1").png"; }

COUNT=$#
SPAN=$(( MAX - MIN + 1 ))
FAILED=0

# One pass over the range pays off when the frames are close together.
if [[ "$COUNT" -gt 3 && "$SPAN" -le $(( COUNT * 30 )) ]]; then
  SEQ_DIR="$OUT_DIR/seq-$COMP-$$"
  if npx remotion render "$COMP" "$SEQ_DIR" --sequence --image-format=png \
       --frames="$MIN-$MAX" --scale="$SCALE" --props="$PROPS" --log=error; then
    for FRAME in "$@"; do
      FOUND=""
      for FILE in "$SEQ_DIR"/element-*.png; do
        NUM="${FILE##*element-}"; NUM="${NUM%.png}"
        if [[ "$((10#$NUM))" -eq "$FRAME" ]]; then FOUND="$FILE"; break; fi
      done
      if [[ -n "$FOUND" ]]; then
        cp "$FOUND" "$(out_path "$FRAME")"
        echo "$(out_path "$FRAME")"
      else
        echo "FAILED: $COMP frame $FRAME (not in the rendered range)" >&2
        FAILED=1
      fi
    done
  else
    echo "FAILED: $COMP frames $MIN-$MAX" >&2
    FAILED=1
  fi
  rm -rf "$SEQ_DIR"
  exit "$FAILED"
fi

for FRAME in "$@"; do
  OUT="$(out_path "$FRAME")"
  if npx remotion still "$COMP" "$OUT" --frame="$FRAME" --scale="$SCALE" --props="$PROPS" --log=error; then
    echo "$OUT"
  else
    echo "FAILED: $COMP frame $FRAME" >&2
    FAILED=1
  fi
done

exit "$FAILED"
