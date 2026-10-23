#!/usr/bin/env bash
# verify-scaffold.sh - prove that assets/scaffold/ plus every optional
# component in assets/components/ installs and typechecks with no hand edits.
#
# Usage:
#   verify-scaffold.sh            copy, install, typecheck
#   verify-scaffold.sh --render   also render one still of the example scene
#
# Runs from any directory. Everything is written to a fresh temp directory,
# never into the skill folder. The temp directory is removed at the end,
# except with --render (so the still can be opened) or when a step fails
# (so the failure can be inspected).

set -euo pipefail

RENDER=0
for arg in "$@"; do
  case "$arg" in
    --render) RENDER=1 ;;
    *) echo "Usage: $0 [--render]" >&2; exit 2 ;;
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
else
  KEEP=0
fi

echo "OK: scaffold and all optional components verified"
