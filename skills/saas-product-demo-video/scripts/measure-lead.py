#!/usr/bin/env python3
"""measure-lead.py - a sound file's lead: seconds from its start to its loudest 10 ms.

    python3 measure-lead.py public/sfx/*.wav [--fps 30] [--window 0.01]

Prints, per file: its length, peak and RMS level in dBFS, and the lead in
seconds and frames, as the `lead:` value for the cue table. <Sfx> starts the
file that early so the loudest point lands on the visual event.

Why measure instead of guessing: a hit synthesized with ffmpeg peaks on its
first sample (lead 0), a swell peaks at its end (lead = its length), and a
recorded click has a lead-in (the library's mouse-click: 0.22 s). A hit
started "two frames early, to be safe" landed two frames early on one film
(gotchas.md 45). Needs ffmpeg on the PATH; no Python packages.
"""

import argparse
import array
import math
import subprocess
import sys
from pathlib import Path

SR = 48000


def decode(path: Path) -> array.array:
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
        capture_output=True,
        check=True,
    ).stdout
    return array.array("h", raw)


def measure(samples: array.array, window_s: float) -> dict:
    n = len(samples)
    if n == 0:
        return {"length": 0.0, "peak_db": -math.inf, "rms_db": -math.inf, "lead": 0.0}
    peak = max(abs(s) for s in samples) / 32768.0
    rms = math.sqrt(sum(s * s for s in samples) / n) / 32768.0
    win = max(1, int(SR * window_s))
    step = max(1, win // 2)
    # Energy per window by a running sum, so a 2 s file is instant.
    sq = [s * s for s in samples]
    best_e, best_i = -1, 0
    e = sum(sq[:win])
    i = 0
    while True:
        if e > best_e:
            best_e, best_i = e, i
        j = i + step
        if j + win > n:
            break
        e += sum(sq[i + win : j + win]) - sum(sq[i:j])
        i = j
    to_db = lambda x: 20 * math.log10(x) if x > 0 else -math.inf
    return {"length": n / SR, "peak_db": to_db(peak), "rms_db": to_db(rms), "lead": best_i / SR}


def main() -> int:
    ap = argparse.ArgumentParser(description="Lead (start to loudest point) of sound files.")
    ap.add_argument("files", nargs="+", type=Path)
    ap.add_argument("--fps", type=float, default=30)
    ap.add_argument("--window", type=float, default=0.01, help="Seconds of the loudest window (default 10 ms).")
    args = ap.parse_args()

    print(f"{'file':<28} {'length':>7} {'peak':>8} {'rms':>8} {'lead':>7} {'frames':>7}   cue")
    for f in args.files:
        if not f.exists():
            print(f"{f}: not found", file=sys.stderr)
            continue
        m = measure(decode(f), args.window)
        lead = round(m["lead"] + args.window / 2, 3)  # the window's center
        print(
            f"{f.name:<28} {m['length']:6.2f}s {m['peak_db']:7.1f} {m['rms_db']:7.1f} {lead:6.3f}s {lead * args.fps:6.1f}   "
            f'{{ src: staticFile("sfx/{f.name}"), lead: {lead:g} }}'
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
