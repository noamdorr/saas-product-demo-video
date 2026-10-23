#!/usr/bin/env bash
# sample-reference-frames.sh - turn a reference video into images an agent
# can read: overview contact sheets, a strip of frames around every cut, and
# an index with the cut times and shot lengths.
#
# Use this when Gemini is not available. The agent reads the images and
# writes the director's breakdown itself (see references/reference-video-vibe.md).
#
# Usage:
#   sample-reference-frames.sh <video-file-or-url> <short-name>
#
# Example:
#   sample-reference-frames.sh ~/Downloads/linear-launch.mp4 linear-launch
#   -> references/frames-linear-launch/{index.md,overview-*.jpg,cut-*.jpg}
#
# Requirements: ffmpeg and ffprobe. A URL also needs yt-dlp.
#
# Tunables (env vars):
#   MAX_SHEETS=12        cap on overview sheets (sampling rate adapts)
#   MAX_CUTS=24          cap on cut strips (spread evenly when there are more)
#   STRIP_WIDTH=320      width in pixels of each frame in a change strip (raise it to read small text)
#   CUT_FLOOR=0.03       lowest frame-difference score that can count as a cut
#   CUT_RATIO=8          how far a frame must stand out from its surroundings

set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <video-file-or-url> <short-name>" >&2
  exit 1
fi

SRC="$1"
NAME="$2"
MAX_SHEETS="${MAX_SHEETS:-12}"
MAX_CUTS="${MAX_CUTS:-24}"
STRIP_WIDTH="${STRIP_WIDTH:-320}"
CUT_FLOOR="${CUT_FLOOR:-0.03}"
CUT_RATIO="${CUT_RATIO:-8}"

for tool in ffmpeg ffprobe; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "ERROR: $tool not found. Install ffmpeg (brew install ffmpeg, apt install ffmpeg)." >&2
    exit 1
  fi
done

OUT_DIR="$(pwd)/references/frames-$NAME"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# --- Resolve the input to a local file ---
if [[ "$SRC" =~ ^https?:// ]]; then
  if ! command -v yt-dlp >/dev/null 2>&1; then
    echo "ERROR: the input is a URL and yt-dlp is not installed." >&2
    echo "Install it (brew install yt-dlp, pip install yt-dlp), or download the video yourself and pass the file path." >&2
    exit 1
  fi
  echo "Downloading $SRC ..."
  yt-dlp -q -f "bv*[height<=720]+ba/b[height<=720]/b" --merge-output-format mp4 -o "$WORK/source.mp4" "$SRC"
  VIDEO="$WORK/source.mp4"
else
  VIDEO="$SRC"
fi

if [[ ! -s "$VIDEO" ]]; then
  echo "ERROR: no video at $VIDEO" >&2
  exit 1
fi

DURATION="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VIDEO")"
if [[ -z "$DURATION" ]]; then
  echo "ERROR: could not read the duration of $VIDEO" >&2
  exit 1
fi

# --- Everything is built in WORK and moved into place only on success, so a
#     failed run never leaves a half-written reference folder behind. ---
STAGE="$WORK/out"
mkdir -p "$STAGE"

# --- Overview sheets: 12 frames each (4x3), at most MAX_SHEETS sheets ---
FPS="$(python3 -c "
d=float('$DURATION'); m=int('$MAX_SHEETS')
print(f'{min(2.0, (m*12)/max(d,1.0)):.4f}')")"
ffmpeg -v error -i "$VIDEO" -vf "fps=$FPS,scale=480:-2,tile=4x3" -q:v 4 "$STAGE/overview-%03d.jpg"

# --- Cut detection ---
# A fixed threshold tuned for live action misses motion graphics entirely:
# a cut between two flat pastel scenes scores around 0.05, where a live-action
# cut scores 0.3 or more. So score every frame and keep the ones that stand
# out from their own surroundings.
ffmpeg -v error -i "$VIDEO" -vf "scale=320:-2,select='gte(scene,0)',metadata=print:file=$WORK/scores.txt" -an -f null - || true
python3 - "$WORK/scores.txt" "$CUT_FLOOR" "$CUT_RATIO" "$WORK/pops.txt" > "$WORK/cuts.txt" <<'PY'
import re, sys, statistics
floor=float(sys.argv[2]); ratio=float(sys.argv[3])
rows=[]; t=None
try:
    for line in open(sys.argv[1]):
        m=re.search(r'pts_time:([0-9.]+)', line)
        if m: t=float(m.group(1))
        m=re.search(r'scene_score=([0-9.]+)', line)
        if m and t is not None: rows.append((t, float(m.group(1))))
except FileNotFoundError:
    pass
# Abrupt one-frame changes, counted with a lower floor than the change list:
# every pop, landing and cut. Their number is a rough measure of how busy and
# how jerky a film is, and is only meaningful next to another film's number.
pops=[]
for i,(t,s) in enumerate(rows):
    near=[x for (_,x) in rows[max(0,i-6):i+7] if x is not s]
    base=statistics.median(near) if near else 0.0
    if s >= 0.004 and s >= 6*max(base, 0.0003):
        pops.append(t)
busiest=max((sum(1 for u in pops if t <= u < t+3.0) for t in pops), default=0)
open(sys.argv[4],"w").write(f"{len(pops)} {busiest}")

candidates=[]
for i,(t,s) in enumerate(rows):
    if s < floor: continue
    near=[x for (u,x) in rows if abs(u-t)<=1.0 and u!=t]
    base=statistics.median(near) if near else 0.0
    if s < ratio*base: continue
    candidates.append((t,s))
# One transition can spike on several frames (a wipe crossing the screen),
# so keep the strongest change and drop any other within half a second of it.
kept=[]
for t,s in sorted(candidates, key=lambda c: -c[1]):
    if all(abs(t-u) >= 0.5 for u,_ in kept):
        kept.append((t,s))
for t,_ in sorted(kept):
    print(f"{t:.3f}")
PY

# --- A strip of 8 frames across 0.4s around each cut ---
python3 - "$WORK/cuts.txt" "$MAX_CUTS" > "$WORK/picked.txt" <<'PY'
import sys
cuts=[float(x) for x in open(sys.argv[1]).read().split()]
cap=int(sys.argv[2])
if len(cuts)>cap:
    step=len(cuts)/cap
    cuts=[cuts[int(i*step)] for i in range(cap)]
for c in cuts: print(f"{c:.3f}")
PY

i=0
while read -r T; do
  i=$((i+1))
  START="$(python3 -c "print(f'{max(0.0, $T-0.2):.3f}')")"
  ffmpeg -v error -ss "$START" -t 0.4 -i "$VIDEO" -vf "fps=20,scale=$STRIP_WIDTH:-2,tile=8x1" -frames:v 1 -q:v 4 \
    "$STAGE/cut-$(printf '%02d' "$i").jpg" || true
done < "$WORK/picked.txt"

# --- Index ---
python3 - "$SRC" "$DURATION" "$FPS" "$WORK/cuts.txt" "$WORK/picked.txt" "$STAGE" "$CUT_FLOOR" "$WORK/pops.txt" > "$STAGE/index.md" <<'PY'
import sys, os, glob, statistics, datetime
src, dur, fps, cuts_f, picked_f, stage, thr = sys.argv[1:8]
try:
    pop_total, pop_busiest = open(sys.argv[8]).read().split()
except Exception:
    pop_total, pop_busiest = "?", "?"
dur=float(dur); fps=float(fps)
cuts=[float(x) for x in open(cuts_f).read().split()]
picked=[float(x) for x in open(picked_f).read().split()]
def ts(t): return f"{int(t//60)}:{t%60:05.2f}"
sheets=sorted(glob.glob(os.path.join(stage,'overview-*.jpg')))
print("---")
print(f"source: {src}")
print("method: sampled frames (no audio, no continuous motion)")
print(f"generated: {datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}")
print("---\n")
print(f"# Frame samples\n\nDuration {ts(dur)}. Overview sampled at {fps:.2f} frames per second.\n")
print("## Overview sheets\n\nEach sheet is 4 columns by 3 rows, read left to right, top to bottom. Cell times are approximate: a cell can show the picture a few frames after its nominal time, so use the change strips, not the sheets, to judge an exact frame.\n")
per=12/fps
for n,s in enumerate(sheets):
    a=n*per; b=min(dur,(n+1)*per)
    print(f"- `{os.path.basename(s)}`: {ts(a)} to {ts(b)}, one frame every {1/fps:.2f}s")
print(f"\n## How busy it is\n\n{pop_total} abrupt one-frame changes (cuts, pops and hard landings), at most {pop_busiest} in any three seconds. On its own the number means little; compare it between a reference video and your own film. Many more than the reference means a busier, jerkier film.")
print(f"\n## Changes\n\n{len(cuts)} sharp visual changes found (frames that differ sharply from their surroundings, floor {thr}). Most are cuts; a large in-scene event can also register, so judge each one from its strip. Dissolves and continuous camera moves change gradually and are usually NOT in this list; find those in the overview sheets.\n")
if cuts:
    bounds=[0.0]+cuts+[dur]
    shots=[b-a for a,b in zip(bounds,bounds[1:]) if b-a>0.05]
    print(f"Time between changes: average {statistics.mean(shots):.2f}s, median {statistics.median(shots):.2f}s, shortest {min(shots):.2f}s, longest {max(shots):.2f}s.\n")
    print("All change times: " + ", ".join(ts(c) for c in cuts) + "\n")
    print("## Change strips\n\nEach strip is 8 frames across 0.4 seconds centered on the change, left to right. Read the motion from frame to frame: blur direction, what slides or scales, what carries over.\n")
    for n,c in enumerate(picked,1):
        print(f"- `cut-{n:02d}.jpg`: change at {ts(c)}")
else:
    print("No sharp changes found. The video may be one continuous move, or cut with dissolves. Work from the overview sheets.")
PY

rm -rf "$OUT_DIR"
mkdir -p "$(dirname "$OUT_DIR")"
mv "$STAGE" "$OUT_DIR"

echo "Wrote $(ls "$OUT_DIR" | wc -l | tr -d ' ') files to $OUT_DIR"
echo "Next: read index.md, then the overview sheets in order, then the cut strips."
