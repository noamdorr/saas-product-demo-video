#!/usr/bin/env python3
"""
check-typing-budget.py - verify that every TypedText / TypedChars in the project
fits within its scene's frame budget. Catches the "icebreaker types beyond scene end"
class of bug at plan-time.

Usage:
    python3 scripts/check-typing-budget.py \
        --typing-budgets typing.json

typing.json shape - one entry per TypedText/TypedChars usage:
    [
      {
        "scene": "Scene05Icebreaker",
        "scene_duration_frames": 55,
        "kind": "chars",                # "chars" or "words"
        "text": "Saw your half-marathon split last Sunday - that 7:42 final mile is criminal.",
        "start_frame": 4,               # scene-local
        "per_unit": 0.6,                # perChar or perWord
        "overlap": 0.0,                 # for word mode only; ignored for chars
        "pause_frames_total": 0         # extra pauses scheduled mid-string (chars mode)
      },
      ...
    ]

Output: a table of OK / OVER for each entry. Exit code 0 if all OK, 1 if any over budget.
"""

import argparse
import json
import sys
from pathlib import Path


def chars_budget(text: str, per_char: float, pause_total: float) -> float:
    return len(text) * per_char + pause_total


def words_budget(text: str, per_word: float, overlap_fraction: float) -> float:
    words = text.split()
    if not words:
        return 0.0
    # First word: full per_word. Each subsequent: per_word * (1 - overlap_fraction) added.
    return per_word + (len(words) - 1) * per_word * (1 - overlap_fraction)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--typing-budgets", required=True, type=Path, help="typing.json (see docstring)")
    args = p.parse_args()

    entries = json.loads(args.typing_budgets.read_text())

    print(f"{'scene':<28} {'kind':<6} {'len':>4} {'budget':>7} {'window':>7} {'tail':>5}  status")
    print("-" * 78)

    over = 0
    for e in entries:
        scene = e["scene"]
        scene_dur = e["scene_duration_frames"]
        kind = e["kind"]
        text = e["text"]
        start = e["start_frame"]
        per_unit = e["per_unit"]
        overlap = e.get("overlap", 0.0)
        pauses = e.get("pause_frames_total", 0.0)

        if kind == "chars":
            b = chars_budget(text, per_unit, pauses)
        elif kind == "words":
            b = words_budget(text, per_unit, overlap)
        else:
            print(f"{scene:<28} ERROR: unknown kind '{kind}'", file=sys.stderr)
            return 2

        # Available window from start_frame to scene end
        window = scene_dur - start
        tail = window - b

        status = "OK" if tail >= 0 else "OVER"
        if status == "OVER":
            over += 1
        print(f"{scene:<28} {kind:<6} {len(text):>4} {b:>7.1f} {window:>7} {tail:>5.1f}  {status}")

    print()
    if over:
        print(f"WARNING: {over} typing block(s) over budget. Reduce per_unit, drop pauses, or extend scene.")
        return 1
    print("All typing fits within scene budgets.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
