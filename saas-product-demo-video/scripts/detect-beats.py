#!/usr/bin/env python3
"""
detect-beats.py - extract kick/snare/beat timestamps from an audio file.

Emits a JSON file suitable for driving Remotion scene timing.

Usage:
    python3 detect-beats.py soundtrack.mp3 --fps 30 --out beats.json

Requires:
    pip install --break-system-packages librosa numpy soundfile
"""

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
        "Install with: pip install --break-system-packages librosa numpy soundfile",
        file=sys.stderr,
    )
    sys.exit(1)


def seconds_to_frames(seconds: float, fps: int) -> int:
    return int(round(seconds * fps))


def classify_onsets(y: np.ndarray, sr: int, onset_frames: np.ndarray):
    """Classify each onset as 'kick' (low-freq dominant) or 'snare' (mid/high-freq)."""
    # Compute spectral centroid at each onset frame.
    # Low centroid → kick. High centroid → snare.
    centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    # Map audio-frame indices to centroid-frame indices (librosa uses frame_length=2048, hop=512)
    centroid_hop = 512
    onset_centroids = []
    for of in onset_frames:
        sample_idx = librosa.frames_to_samples([of])[0]
        centroid_idx = sample_idx // centroid_hop
        if centroid_idx < len(centroids):
            onset_centroids.append(centroids[centroid_idx])
        else:
            onset_centroids.append(centroids[-1])

    # Threshold: median. Below → kick. Above → snare.
    median_centroid = np.median(onset_centroids)
    kicks = []
    snares = []
    for of, c in zip(onset_frames, onset_centroids):
        if c < median_centroid:
            kicks.append(of)
        else:
            snares.append(of)

    return np.array(kicks), np.array(snares)


def main():
    parser = argparse.ArgumentParser(description="Extract beat timing from audio")
    parser.add_argument("input", type=Path, help="audio file (mp3, wav, etc.)")
    parser.add_argument("--fps", type=int, default=30, help="video frame rate")
    parser.add_argument("--out", type=Path, default=Path("beats.json"))
    parser.add_argument(
        "--bpm",
        type=float,
        default=None,
        help="override auto-detected BPM (useful for ambient tracks)",
    )
    args = parser.parse_args()

    if not args.input.exists():
        print(f"ERROR: {args.input} not found", file=sys.stderr)
        sys.exit(1)

    warnings.filterwarnings("ignore")

    print(f"Loading {args.input}...", file=sys.stderr)
    y, sr = librosa.load(str(args.input), sr=None, mono=True)
    duration = librosa.get_duration(y=y, sr=sr)
    total_frames = seconds_to_frames(duration, args.fps)

    warnings_list = []

    # Beat tracking
    if args.bpm:
        bpm = args.bpm
        print(f"Using user-provided BPM: {bpm}", file=sys.stderr)
        # Generate synthetic beat times from BPM
        first_beat_time = librosa.onset.onset_detect(
            y=y, sr=sr, units="time", backtrack=True
        )[0] if len(librosa.onset.onset_detect(y=y, sr=sr, units="time")) > 0 else 0.0
        beat_interval = 60.0 / bpm
        beat_times = np.arange(first_beat_time, duration, beat_interval)
    else:
        print("Detecting tempo...", file=sys.stderr)
        tempo_result, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
        bpm = float(tempo_result) if np.isscalar(tempo_result) else float(tempo_result[0])
        beat_times = librosa.frames_to_time(beat_frames, sr=sr)
        print(f"Detected BPM: {bpm:.1f}", file=sys.stderr)

    if bpm < 60 or bpm > 200:
        warnings_list.append(f"unusual BPM {bpm:.1f} - verify manually")

    # Onset detection (finds all percussive hits - kicks, snares, hi-hats)
    print("Detecting onsets...", file=sys.stderr)
    onset_frames = librosa.onset.onset_detect(y=y, sr=sr, units="frames")
    onset_times = librosa.frames_to_time(onset_frames, sr=sr)

    if len(onset_frames) < 8:
        warnings_list.append(
            "low onset count - librosa struggled on this track. Verify by ear in Audacity."
        )

    # Classify onsets into kicks/snares
    kicks, snares = classify_onsets(y, sr, onset_frames)
    kick_times = librosa.frames_to_time(kicks, sr=sr) if len(kicks) > 0 else np.array([])
    snare_times = librosa.frames_to_time(snares, sr=sr) if len(snares) > 0 else np.array([])

    # Convert to video frames
    frames_per_beat = round(args.fps * 60 / bpm)
    beat_frames_video = [seconds_to_frames(t, args.fps) for t in beat_times]
    kick_frames_video = sorted(set(seconds_to_frames(t, args.fps) for t in kick_times))
    snare_frames_video = sorted(set(seconds_to_frames(t, args.fps) for t in snare_times))

    first_kick_frame = kick_frames_video[0] if kick_frames_video else (
        beat_frames_video[0] if beat_frames_video else 0
    )

    # Suggested scene boundaries: every 2 bars (8 beats) starting from first kick
    frames_per_bar = frames_per_beat * 4
    scene_spacing_frames = frames_per_bar * 2
    recommended_boundaries = [0]
    cur = first_kick_frame
    while cur < total_frames:
        recommended_boundaries.append(cur)
        cur += scene_spacing_frames
    if recommended_boundaries[-1] != total_frames:
        recommended_boundaries.append(total_frames)

    # Emit JSON
    output = {
        "bpm": round(bpm, 2),
        "fps": args.fps,
        "frames_per_beat": frames_per_beat,
        "first_kick_frame": first_kick_frame,
        "duration_seconds": round(duration, 3),
        "total_frames": total_frames,
        "snare_frames": snare_frames_video,
        "kick_frames": kick_frames_video,
        "beat_frames": beat_frames_video,
        "recommended_scene_boundaries": recommended_boundaries,
        "warnings": warnings_list,
    }

    args.out.write_text(json.dumps(output, indent=2))
    print(f"\nWrote {args.out}", file=sys.stderr)
    print(
        f"BPM: {bpm:.1f} | fps: {args.fps} | frames/beat: {frames_per_beat} | "
        f"first kick: frame {first_kick_frame} | duration: {duration:.2f}s ({total_frames} frames)",
        file=sys.stderr,
    )
    print(f"Kicks: {len(kick_frames_video)} | Snares: {len(snare_frames_video)}", file=sys.stderr)
    if warnings_list:
        print("\nWARNINGS:", file=sys.stderr)
        for w in warnings_list:
            print(f"  - {w}", file=sys.stderr)


if __name__ == "__main__":
    main()
