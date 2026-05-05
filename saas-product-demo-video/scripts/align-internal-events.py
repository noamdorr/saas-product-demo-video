#!/usr/bin/env python3
"""
align-internal-events.py - given beats.json and a list of (scene_id, scene_local_frame, label)
events, find the nearest beat (snare or kick) for each event within ±tolerance frames.

Outputs a table the human can paste into a fix-wave plan: OLD local frame -> NEW local frame.

Usage:
    python3 scripts/align-internal-events.py \
        --beats beats.json \
        --events events.json \
        [--tolerance 6]

events.json shape:
    [
      {"scene_start_frame": 0,   "scene_local_frame": 4,   "label": "scene 1 chip 1"},
      {"scene_start_frame": 0,   "scene_local_frame": 12,  "label": "scene 1 chip 2"},
      {"scene_start_frame": 165, "scene_local_frame": 44,  "label": "scene 3 archive click"},
      ...
    ]

Output (stdout, table):
    label                       scene_start  old_local  abs    nearest(K/S)  delta  new_local
    scene 1 chip 1                       0          4    4    6  (K)        +2     6
    ...
"""

import argparse
import json
import sys
from pathlib import Path


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--beats", required=True, type=Path, help="beats.json from detect-beats.py")
    p.add_argument("--events", required=True, type=Path, help="events.json - see docstring")
    p.add_argument("--tolerance", type=int, default=6, help="max frame delta to align (default 6)")
    args = p.parse_args()

    beats = json.loads(args.beats.read_text())
    events = json.loads(args.events.read_text())

    snares = set(beats.get("snare_frames", []))
    kicks = set(beats.get("kick_frames", []))
    all_beats = sorted(snares | kicks)

    if not all_beats:
        print("ERROR: no beats found in beats.json", file=sys.stderr)
        return 1

    # Header
    print(f"{'label':<35} {'scene_start':>11} {'old_local':>9} {'abs':>5} "
          f"{'nearest':>10} {'delta':>6} {'new_local':>9}")
    print("-" * 95)

    aligned = 0
    untouched = 0
    for e in events:
        scene_start = e["scene_start_frame"]
        old_local = e["scene_local_frame"]
        label = e["label"]
        abs_frame = scene_start + old_local

        nearest = min(all_beats, key=lambda x: abs(x - abs_frame))
        delta = nearest - abs_frame
        kind = "S" if nearest in snares else "K"

        if abs(delta) <= args.tolerance:
            new_local = old_local + delta
            print(f"{label:<35} {scene_start:>11} {old_local:>9} {abs_frame:>5} "
                  f"{nearest:>5} ({kind})  {delta:+5d}  {new_local:>9}")
            aligned += 1
        else:
            print(f"{label:<35} {scene_start:>11} {old_local:>9} {abs_frame:>5} "
                  f"{nearest:>5} ({kind})  {delta:+5d}    --keep-- (outside tolerance)")
            untouched += 1

    print()
    print(f"Aligned: {aligned}    Kept (outside tolerance): {untouched}")
    print()
    print("To apply: edit each scene file, replace old scene-local frame with new.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
