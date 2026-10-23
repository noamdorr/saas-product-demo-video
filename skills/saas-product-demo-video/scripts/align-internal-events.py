#!/usr/bin/env python3
"""
align-internal-events.py - given beats.json and a list of (scene_start, scene_local_frame, label)
events, find the nearest beat (backbeat or downbeat) for each event within ±tolerance frames.

Outputs a table of OLD local frame -> NEW local frame, one row per event.

scene_start_frame is the scene's start on the master timeline (SCENES.<name>.start in
src/timing.ts). If timing.ts sets AUDIO_TRIM, pass the same number as --audio-trim so the
beats here are shifted the same way.

Usage:
    python3 scripts/align-internal-events.py \
        --beats beats.json \
        --events events.json \
        [--tolerance 6] [--audio-trim 0]

events.json shape:
    [
      {"scene_start_frame": 0,   "scene_local_frame": 4,   "label": "scene 1 chip 1"},
      {"scene_start_frame": 0,   "scene_local_frame": 12,  "label": "scene 1 chip 2"},
      {"scene_start_frame": 165, "scene_local_frame": 44,  "label": "scene 3 archive click"},
      ...
    ]

Output (stdout, table):
    label                       scene_start  old_local  abs    nearest(B/D)  delta  new_local
    scene 1 chip 1                       0          4    4    6  (D)        +2     6
    ...

B = backbeat, D = downbeat. Either is fine for an event inside a scene.
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
    p.add_argument("--audio-trim", type=int, default=0, help="AUDIO_TRIM from src/timing.ts (default 0)")
    args = p.parse_args()

    beats = json.loads(args.beats.read_text())
    events = json.loads(args.events.read_text())

    if "backbeat_frames" not in beats or "downbeat_frames" not in beats:
        print(
            "ERROR: beats.json has no backbeat_frames / downbeat_frames. "
            "Re-run scripts/detect-beats.py to write the current format.",
            file=sys.stderr,
        )
        return 1

    def on_timeline(frames):
        return {f - args.audio_trim for f in frames if f - args.audio_trim >= 0}

    backbeats = on_timeline(beats["backbeat_frames"])
    downbeats = on_timeline(beats["downbeat_frames"])
    all_beats = sorted(backbeats | downbeats)

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
        kind = "B" if nearest in backbeats else "D"

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
