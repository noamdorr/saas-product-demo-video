#!/usr/bin/env bash
# build.sh - package skills/saas-product-demo-video/ as a .skill archive
# (a zip with a different extension) for upload to claude.ai.
# Coding agents do not need this file: install with
#   npx skills add noamdorr/saas-product-demo-video
# Run from the repo root.

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

SKILL=saas-product-demo-video

if [[ ! -f "skills/$SKILL/SKILL.md" ]]; then
  echo "ERROR: skills/$SKILL/SKILL.md not found" >&2
  exit 1
fi

OUT="$SCRIPT_DIR/$SKILL.skill"

rm -f "$OUT"
# The archive root must be the skill folder itself, so zip from inside skills/.
( cd skills && zip -rq "$OUT" "$SKILL/" -x '*/node_modules/*' -x '*.DS_Store' -x '*/__pycache__/*' -x '*.pyc' )

echo "Built $SKILL.skill ($(wc -c < "$OUT" | tr -d ' ') bytes)"
echo "To publish: attach this file to a GitHub release."
