#!/usr/bin/env python3
"""plan.py <lowres_dir> <out.json> [--from 0] [--to last]: how many shutter samples each frame needs.

Reads a quarter-size pass with one sample per frame:

    node tools/mb/sample.mjs --out out/mb/base --n 1 --scale 0.25

A frame that does not differ from the next needs one sample; slow drift a few, so
slow type and camera moves do not shimmer; a local fast move (a cursor) more; a
whole-frame camera move the most. A sample count is only about hiding the steps
between samples, so the thresholds below are in 8-bit levels per pixel. The frame
before a hard cut reads as the busiest of all and gets the most samples; that
costs a few seconds per cut and changes nothing in the picture.
"""
import argparse, json, os, re
import numpy as np
from PIL import Image

a = argparse.ArgumentParser()
a.add_argument("dir")
a.add_argument("out")
a.add_argument("--from", dest="fr", type=int)
a.add_argument("--to", type=int)
o = a.parse_args()

found = sorted(int(m.group(1)) for m in (re.fullmatch(r"f(\d{5})\.png", f) for f in os.listdir(o.dir)) if m)
if not found:
    raise SystemExit(f"plan.py: no f00000.png-style frames in {o.dir}")
fr = found[0] if o.fr is None else o.fr
to = found[-1] if o.to is None else o.to


def load(f):
    return np.asarray(Image.open(f"{o.dir}/f{f:05d}.png").convert("L"), dtype=np.float32)


plan = {}
counts = {}
prev = load(fr)
for F in range(fr, to):
    cur = load(F + 1)
    d = np.abs(cur - prev)
    H, W = d.shape
    th, tw = H // 9, W // 16
    tiles = d[: th * 9, : tw * 16].reshape(9, th, 16, tw).mean(axis=(1, 3))
    peak = float(tiles.max())
    mean = float(d.mean())
    # The busier of two readings: the fastest local spot (a cursor, a line of text in a zoom) and the whole frame.
    by_peak = 1 if peak < 0.04 else 4 if peak < 0.6 else 8 if peak < 4 else 12 if peak < 10 else 16 if peak < 20 else 24
    by_mean = 8 if mean < 0.4 else 12 if mean < 1.5 else 16 if mean < 5 else 24
    n = by_peak if peak < 0.6 else max(by_peak, by_mean)
    plan[F] = n
    counts[n] = counts.get(n, 0) + 1
    prev = cur
plan[to] = plan.get(to - 1, 1)
json.dump(plan, open(o.out, "w"))
print("frames per sample count", dict(sorted(counts.items())), "total samples", sum(plan.values()))
