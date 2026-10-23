#!/usr/bin/env python3
"""
detect-beats.py - find a soundtrack's beat grid and which beats are the backbeats.

Writes beats.json, which the scaffold's src/timing.ts imports.

Usage:
    python3 detect-beats.py public/soundtrack.mp3 --fps 30 --out beats.json

What the output can and cannot be trusted for:

  beat_frames      The beat grid, from librosa's beat tracker, as video frames.
                   Reliable on music with a steady pulse. The tracker marks
                   each beat a few hundredths of a second after the hit, so
                   the script measures that lag on the waveform and removes it.

  backbeat_frames  Every other beat: the half of the grid where the snare or
  downbeat_frames  clap usually sits (beats 2 and 4), and the other half.
                   Which half is the backbeat is decided by one test over the
                   whole track (see backbeat_parity below), not hit by hit.
                   This script does not classify individual drum hits.

  backbeat_confidence
                   0 = coin flip, 1 = every bar agrees. Below 0.5 the script
                   says so in its output and in "warnings". Ask the human to
                   listen, then re-run with --confirm keep or --confirm swap.

Requires:
    pip install librosa numpy soundfile
"""

from __future__ import annotations  # keeps the type hints below valid on Python 3.8 and 3.9

import argparse
import json
import sys
import warnings
from pathlib import Path

try:
    import librosa
    import numpy as np
except ImportError:
    print(
        "ERROR: librosa / numpy not installed.\n"
        "Install with: pip install librosa numpy soundfile",
        file=sys.stderr,
    )
    sys.exit(1)

SR = 22050  # analysis sample rate; beats do not need more
HOP = 256  # ~12 ms per analysis frame, about a third of a video frame at 30 fps
HIGH_BAND_HZ = 1500.0  # snares and claps carry energy up here, kicks mostly do not
LOW_CONFIDENCE = 0.5  # below this, fewer than 3 bars in 4 agree


def lag_behind_hits(y: np.ndarray, sr: int, beat_times: np.ndarray) -> float | None:
    """
    Seconds by which the tracker's beat marks trail the hits themselves.

    The tracker works on a coarse onset envelope and lands a little after each
    attack. Here the attack is the steepest rise of a fine-grained loudness
    envelope near each beat; the lag is the median gap over the clearer half of
    the hits. Returns None when the gaps do not agree with each other (soft
    attacks, no drums), because a correction would then be a guess.
    """
    hop = 32  # ~1.5 ms
    loudness = librosa.feature.rms(y=y, frame_length=256, hop_length=hop, center=True)[0]
    rise = np.diff(loudness)
    rise_times = (np.arange(len(rise)) + 0.5) * hop / sr
    # Search a quarter beat either side, which cannot reach the off-beat.
    reach = 0.25 * float(np.median(np.diff(beat_times)))
    lags, strengths = [], []
    for b in beat_times:
        near = (rise_times >= b - reach) & (rise_times <= b + reach)
        if not near.any():
            continue
        k = int(np.argmax(rise[near]))
        lags.append(b - rise_times[near][k])
        strengths.append(rise[near][k])
    if not lags:
        return None
    lags, strengths = np.array(lags), np.array(strengths)
    clear = lags[strengths >= np.median(strengths)]
    lag = float(np.median(clear))
    agree = float(np.mean(np.abs(clear - lag) <= 0.02))
    return lag if agree >= 0.5 else None


def tempo_in_short_windows(y: np.ndarray, sr: int) -> float:
    """Median tempo measured window by window, without the beat tracker.

    A second opinion on the tempo. On a track with a steady drum pattern it
    agrees with the tracked grid. When the two disagree, the tracker has
    usually locked onto something other than the pulse a listener taps to.
    """
    envelope = librosa.onset.onset_strength(y=y, sr=sr, hop_length=HOP)
    local = librosa.feature.tempo(onset_envelope=envelope, sr=sr, hop_length=HOP, aggregate=None)
    return float(np.median(local))


def first_audible_time(y: np.ndarray, sr: int) -> float:
    """When the track first becomes clearly audible, in seconds.

    The beat grid is extended back to time zero, so a track that opens with
    silence has beats before any sound. An event placed on one lands on nothing.
    """
    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=HOP)[0]
    threshold = 0.1 * float(np.percentile(rms, 90))
    above = np.nonzero(rms > threshold)[0]
    return float(above[0] * HOP / sr) if len(above) else 0.0


def loudness_by_beat(y: np.ndarray, sr: int, beat_times: np.ndarray, duration: float) -> np.ndarray:
    """Average loudness of the stretch from each beat to the next, scaled so the loudest is 1."""
    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=HOP)[0]
    times = np.arange(len(rms)) * HOP / sr
    edges = np.append(beat_times, duration)
    levels = np.array([
        float(rms[(times >= a) & (times < b)].mean()) if np.any((times >= a) & (times < b)) else 0.0
        for a, b in zip(edges, edges[1:])
    ])
    peak = levels.max()
    return levels / peak if peak > 0 else levels


def biggest_lift(levels: np.ndarray, span: int = 4) -> int | None:
    """The beat where the music steps up the most and stays up: the drop or swell.

    Compares the average of the next `span` beats with the previous `span`.
    """
    best, best_gain = None, 0.0
    for i in range(span, len(levels) - span + 1):
        gain = float(levels[i : i + span].mean() - levels[i - span : i].mean())
        if gain > best_gain:
            best, best_gain = i, gain
    return best if best_gain >= 0.1 else None


def even_grid(beat_times: np.ndarray, fps: float) -> tuple[np.ndarray, float] | None:
    """Fit one steady tempo through the tracked beats, if the track has one.

    The tracker places each beat on its own, a few milliseconds early or late.
    Rounded to frames one by one, that turns an even pulse into gaps of 14, 15
    and 16 frames, and events on consecutive beats then land unevenly against
    music that is perfectly even. When every tracked beat sits close to a
    single straight line, the line is the truth and the wobble is noise.

    Returns (beat times on the even grid, largest deviation in seconds), or
    None when the tempo really drifts and the tracked beats should be kept.
    """
    n = np.arange(len(beat_times))
    period, start = np.polyfit(n, beat_times, 1)
    bpm = 60.0 / period
    # Produced music almost always sits on a whole-number tempo.
    if abs(bpm - round(bpm)) <= 0.05:
        period = 60.0 / round(bpm)
        start = float(np.mean(beat_times - n * period))
    fitted = start + n * period
    worst = float(np.max(np.abs(beat_times - fitted)))
    # Up to one video frame of wobble counts as noise around a steady pulse.
    if worst > 1.0 / fps:
        return None
    return fitted, worst


def simple_ratio(a: float, b: float) -> str | None:
    """Name the ratio between two tempos when it is close to a simple one."""
    hi, lo = max(a, b), min(a, b)
    for name, value in (("2:1", 2.0), ("3:2", 1.5), ("4:3", 4 / 3), ("3:1", 3.0)):
        if abs(hi / lo - value) / value <= 0.04:
            return name
    return None


def high_band_energy_at(y: np.ndarray, sr: int, beat_times: np.ndarray) -> np.ndarray:
    """Percussive energy above HIGH_BAND_HZ around each beat."""
    _, percussive = librosa.effects.hpss(y)
    power = np.abs(librosa.stft(percussive, n_fft=2048, hop_length=HOP)) ** 2
    freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
    band = power[freqs >= HIGH_BAND_HZ].sum(axis=0)
    energies = []
    for t in beat_times:
        # Take the peak from just before the beat to shortly after it, so a hit
        # that sits slightly off the mark still counts.
        lo, hi = librosa.time_to_frames([t - 0.03, t + 0.09], sr=sr, hop_length=HOP)
        lo, hi = max(0, int(lo)), min(len(band), int(hi))
        energies.append(float(band[lo:hi].max()) if hi > lo else 0.0)
    return np.array(energies)


def backbeat_parity(energies: np.ndarray) -> tuple[int, float, int]:
    """
    Decide which half of the beat grid is the backbeat.

    Beats are paired (0,1), (2,3), ... Each pair votes for whichever of its two
    beats has more high-band percussive energy. Hi-hats play on both and cancel
    out; a snare or clap on one of them tips the vote. Pairs far quieter than
    the loud ones (an intro before the drums enter) do not vote.

    Returns (parity, confidence, voting_pairs). parity 1 means the odd-indexed
    beats are the backbeats; 0 means the even-indexed ones are. confidence is
    2 * (share of votes for the winner) - 1, so 0 is a coin flip and 1 is unanimous.
    """
    pairs = len(energies) // 2
    even = energies[0 : 2 * pairs : 2]
    odd = energies[1 : 2 * pairs : 2]
    if pairs == 0:
        return 1, 0.0, 0
    loudest = np.maximum(even, odd)
    voting = loudest >= 0.1 * np.percentile(loudest, 90)
    votes_odd = int(np.sum(odd[voting] > even[voting]))
    votes_even = int(np.sum(even[voting] > odd[voting]))
    total = votes_odd + votes_even
    if total == 0:
        return 1, 0.0, 0
    parity = 1 if votes_odd >= votes_even else 0
    confidence = 2 * max(votes_odd, votes_even) / total - 1
    return parity, float(confidence), total


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract the beat grid from a soundtrack")
    parser.add_argument("input", type=Path, help="audio file (mp3, wav, ...)")
    parser.add_argument("--fps", type=int, default=30, help="video frame rate (default 30)")
    parser.add_argument("--out", type=Path, default=Path("beats.json"))
    parser.add_argument(
        "--bpm",
        type=float,
        default=None,
        help="use this tempo instead of estimating it (when the estimate is double or half the real one)",
    )
    parser.add_argument(
        "--confirm",
        choices=["keep", "swap"],
        default=None,
        help="after a human has checked the backbeats by ear: keep the detected half, or swap it with the downbeats",
    )
    args = parser.parse_args()

    if not args.input.exists():
        print(f"ERROR: {args.input} not found", file=sys.stderr)
        return 1

    warnings.filterwarnings("ignore")

    print(f"Loading {args.input} ...", file=sys.stderr)
    y, sr = librosa.load(str(args.input), sr=SR, mono=True)
    duration = float(librosa.get_duration(y=y, sr=sr))

    print("Tracking beats ...", file=sys.stderr)
    # trim=False keeps the grid running through a quiet intro and outro, so a
    # scene can still be cut there.
    _, beat_idx = librosa.beat.beat_track(y=y, sr=sr, hop_length=HOP, bpm=args.bpm, trim=False)
    beat_times = librosa.frames_to_time(beat_idx, sr=sr, hop_length=HOP)

    if len(beat_times) < 4:
        print(
            "ERROR: no steady beat found in this track. Place scenes by hand instead "
            "(see beat-sync.md, 'When beat-sync fights VO').",
            file=sys.stderr,
        )
        return 1

    # Tempo from the grid itself. librosa's own estimate is quantised to coarse
    # bins and can sit a few BPM off the grid it returns.
    bpm = 60.0 * (len(beat_times) - 1) / float(beat_times[-1] - beat_times[0])

    notes = []

    # Does a second, independent tempo estimate agree with the grid? When the
    # human supplied a tempo, that number is the reference instead.
    measured_bpm = tempo_in_short_windows(y, sr)
    reference_bpm = args.bpm if args.bpm else measured_bpm
    tempo_agrees = abs(reference_bpm - bpm) / bpm <= 0.08
    if not tempo_agrees:
        if args.bpm:
            notes.append(
                f"the tracker settled on {bpm:.1f} BPM although --bpm {args.bpm:g} was given: "
                "it cannot hold a steady grid on this track."
            )
        else:
            ratio = simple_ratio(bpm, measured_bpm)
            hint = (
                f" The two are about {ratio} apart, which often means a dotted or swung rhythm, "
                "so the tracked grid may still be the real pulse."
                if ratio
                else ""
            )
            notes.append(
                f"tempo is ambiguous: the beat tracker settled on {bpm:.1f} BPM, but measured in "
                f"short windows the track runs at {measured_bpm:.1f} BPM.{hint} Only a listener "
                "can settle it: ask the human to tap the tempo and re-run with --bpm, or pick a "
                "track with a steadier drum pattern."
            )

    if args.bpm:
        # --bpm is for a tempo a human tapped. Passing the tracker's own number
        # back in changes nothing and must not read as a confirmation.
        _, plain_idx = librosa.beat.beat_track(y=y, sr=sr, hop_length=HOP, trim=False)
        if len(plain_idx) == len(beat_idx) and np.array_equal(plain_idx, beat_idx):
            notes.append(
                f"--bpm {args.bpm:g} did not change the grid: the beats are identical to a run "
                "without it. That confirms the tempo only if a human tapped that number. An "
                "estimate fed back in proves nothing."
            )

    lag = lag_behind_hits(y, sr, beat_times)
    if lag is None:
        notes.append(
            "could not line the beats up with the hits (soft attacks or no drums), so "
            "beat_frames are the tracker's own marks and may sit a frame or two late."
        )
    else:
        beat_times = np.clip(beat_times - lag, 0.0, None)

    steady = even_grid(beat_times, args.fps)
    if steady is not None:
        beat_times, wobble = steady
        bpm = 60.0 * (len(beat_times) - 1) / float(beat_times[-1] - beat_times[0])
    else:
        wobble = None
        notes.append(
            "the tempo is not steady enough for an even grid, so beats are placed where the "
            "tracker heard them and the gaps between them vary by a frame or more. Events on "
            "consecutive beats will not be evenly spaced."
        )

    print("Finding the backbeat ...", file=sys.stderr)
    energies = high_band_energy_at(y, sr, beat_times)
    parity, confidence, voting_pairs = backbeat_parity(energies)

    if bpm < 60 or bpm > 200:
        notes.append(
            f"unusual tempo {bpm:.1f} BPM: the tracker may have locked onto double or half "
            "the real tempo. Check by ear and re-run with --bpm if so."
        )

    low = confidence < LOW_CONFIDENCE
    if args.confirm == "swap":
        parity = 1 - parity
    if args.confirm:
        source = "confirmed by ear" if args.confirm == "keep" else "swapped by ear"
    else:
        source = "detected"
        if low:
            notes.append(
                f"backbeat confidence is low ({confidence:.2f}): the script could not tell which "
                "half of the beats carries the snare. Ask the human to confirm by ear before "
                "cutting scenes on backbeat_frames, then re-run with --confirm keep or --confirm swap."
            )

    # One verdict the caller can act on, from the three independent signals:
    # beats sit on audible hits, two tempo estimates agree, backbeat is clear.
    backbeat_settled = bool(args.confirm) or not low
    if lag is not None and tempo_agrees and backbeat_settled:
        reliability = "good"
    elif lag is None and not tempo_agrees:
        reliability = "poor"
    else:
        reliability = "check"

    audible_from = first_audible_time(y, sr)
    levels = loudness_by_beat(y, sr, beat_times, duration)
    lift = biggest_lift(levels)
    # A beat counts as silent when the music starts more than a third of a beat after it.
    beat_gap = 60.0 / bpm
    silent_beats = int(np.sum(beat_times < audible_from - beat_gap / 3))
    if silent_beats:
        notes.append(
            f"the track is silent until {audible_from:.2f}s, so the first {silent_beats} beat(s) "
            f"fall before any sound. Put the first event that should land with the music on "
            f"beat {silent_beats} or later."
        )

    # A beat belongs to the frame that is on screen while it sounds, so take the
    # frame it falls in. Rounding to the nearest frame would show some events a
    # fraction of a frame after their beat, and the eye forgives early far more
    # than late.
    beat_frames = sorted({int(np.floor(t * args.fps + 1e-6)) for t in np.clip(beat_times, 0.0, None)})
    backbeat_frames = beat_frames[parity::2]
    downbeat_frames = beat_frames[1 - parity :: 2]

    output = {
        "audio_file": args.input.name,
        "fps": args.fps,
        "bpm": round(bpm, 2),
        "frames_per_beat": round(args.fps * 60 / bpm, 3),
        "duration_seconds": round(duration, 3),
        "total_frames": int(round(duration * args.fps)),
        "first_beat_frame": beat_frames[0],
        "tempo_second_opinion": round(measured_bpm, 2),
        "grid_reliability": reliability,
        "grid": "even" if steady is not None else "as tracked",
        "first_audible_seconds": round(audible_from, 2),
        "first_audible_beat": silent_beats,
        "biggest_lift_beat": lift,
        "loudness_by_beat": [round(float(v), 2) for v in levels],
        "tracker_lag_ms": None if lag is None else round(lag * 1000, 1),
        "beat_frames": beat_frames,
        "backbeat_frames": backbeat_frames,
        "downbeat_frames": downbeat_frames,
        "backbeat_parity": "odd" if parity == 1 else "even",
        "backbeat_confidence": round(confidence, 2),
        "backbeat_source": source,
        "warnings": notes,
    }
    # One key per line, arrays inline, so the file stays short enough to read.
    lines = [f"  {json.dumps(k)}: {json.dumps(v)}" for k, v in output.items()]
    args.out.write_text("{\n" + ",\n".join(lines) + "\n}\n")

    first = backbeat_frames[:10]
    seconds = ", ".join(f"{f / args.fps:.2f}s" for f in first[:5])
    print(f"Wrote {args.out}")
    print(
        f"Tempo {bpm:.1f} BPM | {args.fps} fps | {output['frames_per_beat']} frames per beat | "
        f"{len(beat_frames)} beats, first at frame {beat_frames[0]}"
    )
    if lag is not None:
        direction = "earlier" if lag >= 0 else "later"
        print(f"Beats moved {abs(lag) * 1000:.0f} ms {direction} to sit on the hits")
    if steady is not None:
        print(f"Steady tempo: beats placed on an even grid (tracked beats were within {wobble * 1000:.0f} ms of it)")
    if lift is not None:
        print(
            f"Biggest lift in the music: beat {lift} ({beat_times[lift]:.2f}s). "
            "A good place for the film's main reveal."
        )
    print(f"Backbeats = beat_frames[{parity}::2] ({source}): frames {first} ...")
    print(f"  in seconds: {seconds} ...")
    level = "low" if low else "ok"
    checked = f", {source}" if args.confirm else ""
    print(f"Backbeat confidence: {confidence:.2f} ({level}; {voting_pairs} beat pairs voted{checked})")
    for note in notes:
        print(f"NOTE: {note}")
    advice = {
        "good": "beats sit on audible hits, the tempo is steady, and the backbeat is clear.",
        "check": "usable, but have the human listen against the frame numbers before you cut on it.",
        "poor": "do not cut this film on the beat grid. Get the tempo from a human, use a track "
        "with a steady drum pattern, or place the cuts by time (BEAT_SYNCED = false in timing.ts) "
        "and tell the human the film is not beat-synced.",
    }[reliability]
    print(f"Grid reliability: {reliability} - {advice}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
