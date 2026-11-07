#!/usr/bin/env bash
# verify-scaffold.sh - prove that assets/scaffold/ plus every optional
# component in assets/components/ installs and typechecks with no hand edits.
#
# Usage:
#   verify-scaffold.sh            copy, install, typecheck
#   verify-scaffold.sh --render   also render one still of the example scene
#   verify-scaffold.sh --motion-blur
#                                 also take the example film through tools/mb end to
#                                 end (needs python3 with numpy and Pillow, and ffmpeg)
#
# Runs from any directory. Everything is written to a fresh temp directory,
# never into the skill folder. The temp directory is removed at the end,
# except with --render or --motion-blur (so the output can be opened) or when a
# step fails (so the failure can be inspected).

set -euo pipefail

RENDER=0
MOTION_BLUR=0
for arg in "$@"; do
  case "$arg" in
    --render) RENDER=1 ;;
    --motion-blur) MOTION_BLUR=1 ;;
    *) echo "Usage: $0 [--render] [--motion-blur]" >&2; exit 2 ;;
  esac
done

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCAFFOLD="$SKILL_DIR/assets/scaffold"
COMPONENTS="$SKILL_DIR/assets/components"

for dir in "$SCAFFOLD" "$COMPONENTS"; do
  if [[ ! -d "$dir" ]]; then
    echo "ERROR: $dir not found" >&2
    exit 1
  fi
done

WORK="$(mktemp -d "${TMPDIR:-/tmp}/scaffold-verify.XXXXXX")"
KEEP=1
cleanup() {
  if [[ "$KEEP" -eq 0 ]]; then
    rm -rf "$WORK"
  else
    echo "Left in place: $WORK"
  fi
}
trap cleanup EXIT

echo "==> Copying scaffold to $WORK"
cp -R "$SCAFFOLD/." "$WORK/"
# A scaffold someone installed in place would drag its node_modules along.
rm -rf "$WORK/node_modules" "$WORK/out"

echo "==> Adding every optional component"
cp -R "$COMPONENTS/." "$WORK/src/components/"

cd "$WORK"

echo "==> npm install"
npm install --no-audit --no-fund --loglevel=error

echo "==> Typecheck"
npx tsc --noEmit

if [[ "$RENDER" -eq 1 ]]; then
  echo "==> Rendering one still of the example scene"
  STILL="$WORK/out/scene-example.png"
  npx remotion still Scene-Example "$STILL" --frame=-1
  if [[ ! -s "$STILL" ]]; then
    echo "ERROR: the render finished but $STILL is missing or empty" >&2
    exit 1
  fi
  echo "Still: $STILL"
fi

if [[ "$MOTION_BLUR" -eq 1 ]]; then
  echo "==> Real motion blur, end to end"
  node tools/mb/sample.mjs --out out/mb/base --n 1 --scale 0.25
  python3 tools/mb/plan.py out/mb/base out/mb/plan.json
  node tools/mb/sample.mjs --out out/mb/final --plan out/mb/plan.json --no-bundle
  bash tools/mb/encode.sh out/mb/final - out/master-mb.mp4
  FRAMES_IN="$(ls out/mb/final | grep -c '^f[0-9]*\.png$')"
  FRAMES_OUT="$(ffprobe -v error -select_streams v:0 -show_entries stream=nb_frames -of csv=p=0 out/master-mb.mp4)"
  if [[ "$FRAMES_IN" -lt 2 || "$FRAMES_IN" != "$FRAMES_OUT" ]]; then
    echo "ERROR: $FRAMES_IN blended frames but $FRAMES_OUT encoded" >&2
    exit 1
  fi
  echo "Motion blur: $WORK/out/master-mb.mp4 ($FRAMES_OUT frames)"

  echo "==> Real motion blur in segments, as for 4K"
  node tools/mb/sample.mjs --out out/mb/seg-frames --segments out/mb/segs --from 40 --to 70 --n 4 --chunk 40 --crf 18 --no-bundle
  bash tools/mb/join.sh out/mb/segs - out/master-mb-joined.mp4
fi

if [[ "$RENDER" -eq 0 && "$MOTION_BLUR" -eq 0 ]]; then
  KEEP=0
fi

echo "OK: scaffold and all optional components verified"
