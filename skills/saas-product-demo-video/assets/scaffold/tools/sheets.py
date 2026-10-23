#!/usr/bin/env python3
"""sheets.py - a contact sheet and cut strips from a rendered MP4.

    python3 tools/sheets.py out/master.mp4 [--step 15] [--out out/check] [--dump out/timing-dump.json | none] [--fps 30]

The frame rate comes from the dump when it exists; --fps is the fallback.

Writes <out>/contact-<name>.png (every --step frames, 8 per row, each labeled
with its frame and seconds) and <out>/cuts-<name>.png (five frames around every
scene boundary from out/timing-dump.json: cut-4, cut-2, cut, cut+2, cut+6, one
row per boundary). Needs ffmpeg and Pillow.

Read the contact sheet as the film's rhythm: a run of identical thumbnails is
a hold with nothing moving, two neighboring scenes that look alike are a
flat stretch, a dark thumbnail is a blank frame. Read the cut strips for the
handoffs: the "cut" column is the frame the beat lands on and has to carry a
composed picture; the columns beside it show whether the move (whip, push,
pull-back) reads.
"""
import argparse
import glob
import json
import os
import subprocess

from PIL import Image, ImageDraw

ap = argparse.ArgumentParser()
ap.add_argument("video")
ap.add_argument("--step", type=int, default=15)
ap.add_argument("--out", default="out/check")
ap.add_argument("--dump", default="out/timing-dump.json")
ap.add_argument("--fps", type=int, default=30)
ap.add_argument("--stale-ok", action="store_true", help="use a timing dump older than src/timing.ts or beats.json")
a = ap.parse_args()


def refuse_stale_dump(dump):
    """A dump older than src/timing.ts or beats.json puts the cut strips on the
    wrong frames (it did, silently, for eight waves of one film)."""
    if a.stale_ok:
        return
    dump_at = os.path.getmtime(dump)
    for src in ("src/timing.ts", "beats.json"):
        if os.path.exists(src) and os.path.getmtime(src) > dump_at:
            raise SystemExit(f"{dump} is older than {src}: run `node tools/dump-timing.mjs` first (or pass --stale-ok)")


if a.dump != "none" and os.path.exists(a.dump):
    refuse_stale_dump(a.dump)
# `--dump none` skips the cut strips (a short test clip has no cuts of the film's).
if a.dump != "none" and os.path.exists(a.dump):
    a.fps = json.load(open(a.dump)).get("fps", a.fps)
name = os.path.splitext(os.path.basename(a.video))[0]
tmp = os.path.join(a.out, "strips")
os.makedirs(tmp, exist_ok=True)
for f in glob.glob(os.path.join(tmp, "cs_*.png")) + glob.glob(os.path.join(tmp, "cut_*.png")):
    os.remove(f)

# One ffmpeg pass with a modulo select: a long chain of eq(n, k) terms fails to
# parse past a hundred frames.
w, h, cols = 320, 180, 8
subprocess.run(
    ["ffmpeg", "-y", "-v", "error", "-i", a.video, "-vf", f"select='not(mod(n\\,{a.step}))',scale={w}:{h}", "-vsync", "0", os.path.join(tmp, "cs_%03d.png")],
    check=True,
)
files = sorted(glob.glob(os.path.join(tmp, "cs_*.png")))
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w, rows * (h + 18)), (24, 24, 24))
dr = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    fr = i * a.step
    im = Image.open(f).convert("RGB")
    x, y = (i % cols) * w, (i // cols) * (h + 18)
    sheet.paste(im, (x, y + 18))
    dr.text((x + 4, y + 3), f"f{fr} {fr / a.fps:.1f}s", fill=(220, 220, 220))
contact = os.path.join(a.out, f"contact-{name}.png")
sheet.save(contact)
print("contact", contact, sheet.size, len(files), "frames")

if a.dump == "none":
    raise SystemExit(0)
if not os.path.exists(a.dump):
    print(f"no {a.dump}: run `node tools/dump-timing.mjs` for the cut strips")
    raise SystemExit(0)
d = json.load(open(a.dump))
# Only the cuts this video contains: a clip shorter than the film would
# otherwise ask ffmpeg for frames past its end and crash on the missing still.
probe = subprocess.run(
    ["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", a.video],
    stdout=subprocess.PIPE, text=True,
).stdout.strip()
n_frames = int(probe) if probe.isdigit() else 10**9
cuts = [(n, s["start"]) for n, s in d["scenes"].items() if 0 < s["start"] and s["start"] + 6 < n_frames]
if not cuts:
    print("one scene, no cuts: no cut strips")
    raise SystemExit(0)
cw, ch = 240, 135
sheet = Image.new("RGB", (5 * cw, len(cuts) * (ch + 16)), (24, 24, 24))
dr = ImageDraw.Draw(sheet)
for r, (nm, c) in enumerate(cuts):
    for k, f in enumerate([c - 4, c - 2, c, c + 2, c + 6]):
        p = os.path.join(tmp, f"cut_{r}_{k}.png")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", a.video, "-vf", f"select=eq(n\\,{f}),scale={cw}:{ch}", "-vframes", "1", p], check=True)
        if not os.path.exists(p):
            continue
        im = Image.open(p).convert("RGB")
        x, y = k * cw, r * (ch + 16)
        sheet.paste(im, (x, y + 16))
        dr.text((x + 4, y + 2), f"{nm} f{f}" if k == 2 else f"f{f}", fill=(220, 220, 220))
cutsheet = os.path.join(a.out, f"cuts-{name}.png")
sheet.save(cutsheet)
print("cuts", cutsheet, sheet.size)
