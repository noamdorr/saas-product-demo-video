#!/usr/bin/env bash
# join.sh <segments_dir> <audio_source.mp4|-> <out.mp4>
#
# The chunks from sample.mjs --segments into one film, with the color tags of
# references/render-export.md and the audio copied from a master ("-" for none).
# The picture is not re-encoded, and each chunk's timestamps are snapped to the
# frame grid on the way: gotchas.md 90 has what the other ways of joining do.
set -euo pipefail

if [[ $# -ne 3 ]]; then
  echo "usage: $0 <segments_dir> <audio_source.mp4|-> <out.mp4>" >&2
  exit 2
fi
SEG="$1"; AUDIO="$2"; OUT="$3"

SEGMENTS="$(ls "$SEG" | grep -E '^seg-[0-9]{5}-[0-9]{5}\.mp4$' | sort || true)"
if [[ -z "$SEGMENTS" ]]; then
  echo "ERROR: no seg-00000-00099.mp4-style segments in $SEG" >&2
  exit 1
fi
# A gap would make a shorter film and an overlap (--chunk changed between runs)
# would play frames twice, so both are errors here.
FIRST=""; NEXT=""
while read -r f; do
  A=$((10#${f:4:5})); B=$((10#${f:10:5}))
  if [[ -n "$NEXT" && "$A" -ne "$NEXT" ]]; then
    echo "ERROR: $f should start at frame $NEXT: a segment is missing, or --chunk changed between runs" >&2
    exit 1
  fi
  [[ -n "$FIRST" ]] || FIRST="$A"
  NEXT=$((B + 1))
done <<< "$SEGMENTS"
EXPECTED=$((NEXT - FIRST))

LIST="$SEG/list.txt"
echo "$SEGMENTS" | sed "s/.*/file '&'/" > "$LIST"

# One frame in the segments' timebase: 512 ticks of 1/15360 at 30 fps.
HEAD="$SEG/$(echo "$SEGMENTS" | head -1)"
RATE="$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$HEAD")"
BASE="$(ffprobe -v error -select_streams v:0 -show_entries stream=time_base -of csv=p=0 "$HEAD")"
TICKS="${BASE#*/}"; NUM="${RATE%/*}"; DEN="${RATE#*/}"
if (( TICKS * DEN % NUM != 0 )); then
  echo "ERROR: a frame at $RATE fps is not a whole number of ticks of $BASE" >&2
  exit 1
fi
TICK=$((TICKS * DEN / NUM))

AUDIO_IN=(); AUDIO_MAP=()
if [[ "$AUDIO" != "-" ]]; then
  AUDIO_IN=(-i "$AUDIO"); AUDIO_MAP=(-map 1:a)
fi

ffmpeg -v error -y -f concat -safe 0 -i "$LIST" ${AUDIO_IN[@]+"${AUDIO_IN[@]}"} -map 0:v ${AUDIO_MAP[@]+"${AUDIO_MAP[@]}"} -c copy \
  -bsf:v "setts=pts=round(PTS/$TICK)*$TICK:dts=round(DTS/$TICK)*$TICK,h264_metadata=transfer_characteristics=13:colour_primaries=1:matrix_coefficients=1" \
  -color_trc iec61966-2-1 -color_primaries bt709 -colorspace bt709 -color_range tv \
  -video_track_timescale "$TICKS" -movflags +write_colr+faststart "$OUT"
rm -f "$LIST"

ffprobe -v error -show_entries stream=codec_name,width,height,nb_frames,duration,color_space,color_transfer,color_primaries,color_range -of compact "$OUT"
ls -la "$OUT"
GOT="$(ffprobe -v error -select_streams v:0 -show_entries stream=nb_frames -of csv=p=0 "$OUT")"
if [[ "$GOT" != "$EXPECTED" ]]; then
  echo "ERROR: $OUT has $GOT frames, the segments hold $EXPECTED" >&2
  exit 1
fi
