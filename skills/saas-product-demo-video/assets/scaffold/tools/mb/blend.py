#!/usr/bin/env python3
"""blend.py - average each frame's shutter samples in linear light.

    python3 tools/mb/blend.py <manifest.json> <samples_dir> <out_dir> [--gamma]

manifest: a list of {"frame": F, "first": index of its first sample, "n": count}.
Samples are <samples_dir>/element-<index>.png; output is <out_dir>/f<F:05d>.png.
sample.mjs runs this. Needs numpy and Pillow.

Averaging in linear light is what film does: a dark edge moving over white thins
rather than greys out. --gamma averages the stored values instead, to compare.

A pixel every sample agrees on is copied as it is, so held frames and held parts
of a frame stay byte-exact and cost the encoder nothing. Only pixels where samples
differ are dithered: their average has more depth than 8 bits, and dithering under
the rounding keeps it.
"""
import json, os, sys
from multiprocessing import Pool
import numpy as np
from PIL import Image

man_path, samples, out = sys.argv[1:4]
GAMMA = "--gamma" in sys.argv
os.makedirs(out, exist_ok=True)
man = json.load(open(man_path))
names = sorted(f for f in os.listdir(samples) if f.endswith(".png"))
if not names:
    sys.exit(f"blend.py: no samples in {samples}")
# Remotion pads the sequence's numbers to fit its length.
PREFIX, first_number = names[0].rsplit("-", 1)
PAD = len(first_number.split(".")[0])

x = np.arange(256) / 255.0
TO_LIN = np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4).astype(np.float32)


def to_srgb(a):
    return np.where(a <= 0.0031308, a * 12.92, 1.055 * np.power(np.maximum(a, 1e-8), 1 / 2.4) - 0.055)


def job(e):
    first = acc = differs = None
    for k in range(e["n"]):
        path = os.path.join(samples, f"{PREFIX}-{str(e['first'] + k).zfill(PAD)}.png")
        im = np.asarray(Image.open(path).convert("RGB"))
        lin = (im / 255.0).astype(np.float32) if GAMMA else TO_LIN[im]
        if first is None:
            first, acc, differs = im, lin, np.zeros(im.shape[:2], dtype=bool)
        else:
            acc = acc + lin
            differs |= (im != first).any(axis=2)
    avg = acc / e["n"]
    srgb = avg if GAMMA else to_srgb(avg)
    rng = np.random.default_rng(e["frame"])
    arr = first.copy()
    dithered = srgb[differs] * 255.0 + rng.random((int(differs.sum()), 3), dtype=np.float32) - 0.5
    arr[differs] = np.clip(dithered, 0, 255).round().astype(np.uint8)
    # Written under another name first, so a run killed mid-write leaves no half
    # a PNG for the next run to skip as done.
    dest = os.path.join(out, f"f{e['frame']:05d}.png")
    Image.fromarray(arr).save(dest + ".tmp", format="PNG", compress_level=1)
    os.replace(dest + ".tmp", dest)
    return e["frame"]


if __name__ == "__main__":
    with Pool(min(8, os.cpu_count() or 1)) as pool:
        for _ in pool.imap_unordered(job, man):
            pass
    print(f"blended {len(man)} frames")
