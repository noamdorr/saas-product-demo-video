#!/usr/bin/env python3
"""tile.py <dir> <from> <to> <out.png> [--cols 8] [--w 480] [--step 1]: a contact sheet of blended frames.

For the frames themselves, at full rate: tools/sheets.py reads an encoded film and
samples it, and a streak or a flash on one frame needs every frame. Needs Pillow.
"""
import argparse, os
from PIL import Image

a = argparse.ArgumentParser()
a.add_argument("dir")
a.add_argument("fr", type=int)
a.add_argument("to", type=int)
a.add_argument("out")
a.add_argument("--cols", type=int, default=8)
a.add_argument("--w", type=int, default=480)
a.add_argument("--step", type=int, default=1)
o = a.parse_args()

frames = [f for f in range(o.fr, o.to + 1, o.step) if os.path.exists(f"{o.dir}/f{f:05d}.png")]
if not frames:
    raise SystemExit(f"tile.py: no frames {o.fr} to {o.to} in {o.dir}")
fw, fh = Image.open(f"{o.dir}/f{frames[0]:05d}.png").size
h = round(o.w * fh / fw)
rows = (len(frames) + o.cols - 1) // o.cols
sheet = Image.new("RGB", (o.cols * (o.w + 3), rows * (h + 3)), (255, 255, 255))
for i, f in enumerate(frames):
    tile = Image.open(f"{o.dir}/f{f:05d}.png").convert("RGB").resize((o.w, h), Image.LANCZOS)
    sheet.paste(tile, ((i % o.cols) * (o.w + 3), (i // o.cols) * (h + 3)))
sheet.save(o.out)
print(o.out, len(frames))
