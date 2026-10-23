#!/usr/bin/env python3
"""jerk.py - abrupt-change check on a rendered MP4, against the planned cuts.

    python3 tools/jerk.py out/master.mp4 [--cuts out/timing-dump.json | none] [--planned 84-101,240-243] [--thresh 18] [--window 3] [--fps 30]

The frame rate comes from the dump when it exists; --fps is the fallback.

Decodes the film at 192x108 grayscale through ffmpeg, measures the mean
absolute difference between consecutive frames, and reports:
  - every frame whose change is above --thresh (0..255), marked PLANNED when
    it sits within a frame of a scene boundary from the timing dump, else
    UNPLANNED;
  - the most abrupt changes inside any --window seconds;
  - per scene, the number of abrupt changes and the mean motion;
  - planned cuts with no abrupt change (soft cuts: a whip or a dissolve).

For a short test clip (a test bed, a sketch), pass `--cuts none`: the film's
timing dump would mark the wrong frames as cuts.

A film's intended moves (a dive into the map, a pull-back after a cut) flag
the same frames on every run. Once they are judged, pass them as --planned
frame ranges, and write the ranges in the project README next to this
command: they print as "PLANNED move" and leave the unplanned list, so what
remains is new.

How to read it: the whip and push frames right before and after a cut show
up as UNPLANNED a few frames from the boundary; that is the move, not a pop.
An UNPLANNED frame in the middle of a scene is a hard landing or a jump; look
at it. A film its owner called jerky had far more of those than the film it
replaced, so run this on an earlier cut or a reference film too and compare
the counts (the numbers are only comparable between runs of this script).
Needs ffmpeg and numpy.
"""
import argparse
import json
import os
import subprocess

import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("video")
ap.add_argument("--cuts", default="out/timing-dump.json")
ap.add_argument("--thresh", type=float, default=18.0)
ap.add_argument("--window", type=float, default=3.0)
ap.add_argument("--fps", type=int, default=30)
ap.add_argument("--planned", default="", help="Frame ranges of intended moves, e.g. 84-101,240-243 (inclusive).")
ap.add_argument("--stale-ok", action="store_true", help="use a timing dump older than src/timing.ts or beats.json")
a = ap.parse_args()
if a.cuts != "none":
    try:
        a.fps = json.load(open(a.cuts)).get("fps", a.fps)
    except FileNotFoundError:
        pass

W, H = 192, 108
raw = subprocess.run(
    ["ffmpeg", "-v", "error", "-i", a.video, "-vf", f"scale={W}:{H}", "-pix_fmt", "gray", "-f", "rawvideo", "-"],
    stdout=subprocess.PIPE,
    check=True,
).stdout
frames = np.frombuffer(raw, dtype=np.uint8).reshape(-1, H, W).astype(np.int16)
n = len(frames)
diff = np.abs(frames[1:] - frames[:-1]).mean(axis=(1, 2))  # diff[i] = change into frame i+1

cuts = {}
scenes = {}
try:
    if a.cuts == "none":
        raise FileNotFoundError
    # A dump older than src/timing.ts or beats.json marks the wrong frames as
    # planned cuts (it did, silently, for eight waves of one film).
    if not a.stale_ok:
        for src in ("src/timing.ts", "beats.json"):
            if os.path.exists(src) and os.path.getmtime(src) > os.path.getmtime(a.cuts):
                raise SystemExit(f"{a.cuts} is older than {src}: run `node tools/dump-timing.mjs` first (or pass --stale-ok)")
    dump = json.load(open(a.cuts))
    scenes = dump["scenes"]
    for name, s in scenes.items():
        if s["start"] > 0:
            cuts[s["start"]] = name
except FileNotFoundError:
    pass

abrupt = [(i + 1, float(d)) for i, d in enumerate(diff) if d >= a.thresh]
print(f"{a.video}: {n} frames, mean motion {diff.mean():.2f}, abrupt (>= {a.thresh}): {len(abrupt)}")
moves = []
for r in filter(None, a.planned.split(",")):
    lo, _, hi = r.partition("-")
    moves.append((int(lo), int(hi or lo)))
unplanned = []
for f, d in abrupt:
    planned = next((nm for c, nm in cuts.items() if abs(c - f) <= 1), None)
    move = any(lo <= f <= hi for lo, hi in moves)
    tag = f"PLANNED cut -> {planned}" if planned else "PLANNED move" if move else "UNPLANNED"
    if not planned and not move:
        unplanned.append(f)
    print(f"  frame {f:5d}  {f / a.fps:6.2f}s  change {d:5.1f}  {tag}")

win = int(a.window * a.fps)
best = 0
best_at = 0
marks = np.zeros(n, dtype=int)
for f, _ in abrupt:
    marks[f] = 1
for s in range(0, max(1, n - win)):
    c = int(marks[s : s + win].sum())
    if c > best:
        best, best_at = c, s
print(f"most abrupt changes in any {a.window:.0f}s: {best} (from {best_at / a.fps:.2f}s)")

if scenes:
    print("per scene: abrupt / mean motion")
    for name, s in scenes.items():
        lo, hi = s["start"], s["start"] + s["duration"]
        seg = diff[max(0, lo) : min(len(diff), hi - 1)]
        count = sum(1 for f, _ in abrupt if lo < f < hi)
        print(f"  {name:10s} {count:2d} / {seg.mean() if len(seg) else 0:5.2f}")

missing = [nm for c, nm in cuts.items() if c < n and not any(abs(c - f) <= 1 for f, _ in abrupt)]
if missing:
    print("planned cuts that read as soft (no abrupt change there):", ", ".join(missing))
print("unplanned abrupt frames:", unplanned if unplanned else "none")
# The count alone misleads: a longer exit move spreads one transition over
# more frames above the threshold while its peak drops. Report both.
if unplanned:
    peak_f = max(unplanned, key=lambda f: diff[f - 1])
    print(f"peak unplanned change: {diff[peak_f - 1]:.1f} at frame {peak_f} ({peak_f / a.fps:.2f}s)")
