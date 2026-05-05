#!/usr/bin/env bash
# build.sh - repackage saas-product-demo-video/ as a .skill archive
# (a zip with a different extension). Run from the repo root.

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

if [[ ! -d saas-product-demo-video ]]; then
  echo "ERROR: saas-product-demo-video/ not found in repo root" >&2
  exit 1
fi

OUT=saas-product-demo-video.skill

rm -f "$OUT"
zip -rq "$OUT" saas-product-demo-video/

echo "Built $OUT ($(wc -c < "$OUT" | tr -d ' ') bytes)"
echo "To publish: attach this file to a GitHub release."
