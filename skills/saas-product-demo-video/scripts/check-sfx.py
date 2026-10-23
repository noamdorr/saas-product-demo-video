#!/usr/bin/env python3
"""
check-sfx.py - find where the sound effects land in a rendered film.

Sound cannot be seen in a still, but it can be measured. Render the film twice,
once with the effects and once without, and this script subtracts one
soundtrack from the other. What is left is the effects alone, and the loudest
point of each one is where the viewer hears it.

Usage:
    python3 check-sfx.py with-effects.mp4 without-effects.mp4 --fps 30
    python3 check-sfx.py a.mp4 b.mp4 --fps 30 --events 301,361,376,391,481,631

With --events (the frames the visuals use, from the timing file), each effect
is matched to its nearest event and the script exits 1 if any is more than
--tolerance frames away (default 1.5). Each line also says how loud the effect
is against the music under it (dB, over 100 ms around its loudest point), and
the last line how much the effects raise the film's mean level.

Needs ffmpeg on the PATH, plus numpy, scipy and soundfile (all installed with librosa).
"""

import argparse
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import find_peaks

SR = 44100


def audio_of(video: Path, workdir: Path) -> np.ndarray:
    wav = workdir / (video.stem + ".wav")
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(video), "-vn", "-ac", "1", "-ar", str(SR), str(wav)],
        check=True,
    )
    samples, _ = sf.read(wav)
    return samples


def main() -> int:
    ap = argparse.ArgumentParser(description="Find where sound effects land in a rendered film.")
    ap.add_argument("with_effects", type=Path)
    ap.add_argument("without_effects", type=Path)
    ap.add_argument("--fps", type=float, default=30)
    ap.add_argument("--events", help="Comma-separated frames the effects are meant to land on.")
    ap.add_argument("--tolerance", type=float, default=1.5, help="Frames an effect may sit from its event.")
    args = ap.parse_args()

    for f in (args.with_effects, args.without_effects):
        if not f.exists():
            print(f"ERROR: {f} not found", file=sys.stderr)
            return 2

    with tempfile.TemporaryDirectory() as tmp:
        a = audio_of(args.with_effects, Path(tmp))
        b = audio_of(args.without_effects, Path(tmp))

    n = min(len(a), len(b))
    signed = a[:n] - b[:n]
    diff = np.abs(signed)
    window = max(1, int(SR * 0.01))
    envelope = np.convolve(diff, np.ones(window) / window, mode="same")

    if envelope.max() < 1e-4:
        print("The two soundtracks are the same: no effects found. Check that the effects layer was on in the first render.")
        return 1

    # Effects differ a lot in level (a click is far quieter than a whoosh), so
    # the floor is low; the distance keeps one effect from counting twice.
    peaks, _ = find_peaks(envelope, height=envelope.max() * 0.03, distance=int(SR * 0.25))
    frames = [p / SR * args.fps for p in peaks]

    levels = envelope[peaks] / envelope.max()
    events = [float(x) for x in args.events.split(",")] if args.events else []

    # How loud each effect is against the music under it: the RMS of the
    # effect alone over 100 ms around its loudest point, relative to the RMS of
    # the music-only track in the same window, in dB. The ear judges presence,
    # not these numbers, but they say whether an effect could be heard at all.
    half = int(SR * 0.05)

    def against_music(sample: int) -> float:
        lo, hi = max(0, sample - half), min(n, sample + half)
        fx = float(np.sqrt(np.mean(signed[lo:hi] ** 2)))
        music = float(np.sqrt(np.mean(b[lo:hi] ** 2)))
        if fx <= 0:
            return float("-inf")
        return 20 * np.log10(fx / max(music, 1e-9))

    def dbfs(x: np.ndarray) -> float:
        r = float(np.sqrt(np.mean(x[:n] ** 2)))
        return 20 * np.log10(r) if r > 0 else float("-inf")

    overall = f"Mean level with effects {dbfs(a):.1f} dBFS, without {dbfs(b):.1f} dBFS ({dbfs(a) - dbfs(b):+.2f} dB)."

    if not events:
        print(f"{len(frames)} difference(s) between the two soundtracks:")
        for frame, level, p in zip(frames, levels, peaks):
            faint = "   (faint: may be encoding noise, not an effect)" if level < 0.06 else ""
            print(f"  loudest at frame {frame:7.1f} ({frame / args.fps:6.2f}s)  level {level:.2f}  {against_music(p):+.1f} dB vs the music{faint}")
        print(overall)
        return 0

    # Two lossy encodes of almost the same audio also differ slightly on loud
    # music, so judge each planned event by its nearest difference and list
    # whatever is left over without failing on it.
    bad = 0
    used = set()
    print(f"{len(events)} planned event(s):")
    for event in events:
        if not frames:
            print(f"  event {event:g}: no effect found")
            bad += 1
            continue
        i = min(range(len(frames)), key=lambda k: abs(frames[k] - event))
        off = frames[i] - event
        if abs(off) <= args.tolerance:
            used.add(i)
            print(f"  event {event:g}: effect loudest at frame {frames[i]:.1f} ({off:+.1f}), {against_music(peaks[i]):+.1f} dB vs the music there")
        else:
            bad += 1
            print(f"  event {event:g}: nearest effect is at frame {frames[i]:.1f} ({off:+.1f}), outside {args.tolerance:g} frames")
    extra = [k for k in range(len(frames)) if k not in used]
    if extra:
        print("Other differences (an effect not in --events, or encoding noise if faint):")
        for k in extra:
            print(f"  frame {frames[k]:.1f}  level {levels[k]:.2f}")
    print(overall)
    if bad:
        print(f"\nNOT ALIGNED: {bad} event(s) have no effect within {args.tolerance:g} frames.")
        return 1
    print(f"\nAll {len(events)} events have an effect within {args.tolerance:g} frames.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
