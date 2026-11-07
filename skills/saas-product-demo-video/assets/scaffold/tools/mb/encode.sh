#!/usr/bin/env bash
# encode.sh <frames_dir> <audio_source.mp4|-> <out.mp4> [crf=14] [fps=30]
#
# The blended frames to H.264 with the color tags of references/render-export.md
# (bt709 matrix, sRGB transfer). The audio is copied from a master, so the sound
# stays byte-for-byte; "-" makes a silent file, for a test stretch whose frames
# do not start where the master's audio does.
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "usage: $0 <frames_dir> <audio_source.mp4|-> <out.mp4> [crf=14] [fps=30]" >&2
  exit 2
fi
DIR="$1"; AUDIO="$2"; OUT="$3"; CRF="${4:-14}"; FPS="${5:-30}"

# ffmpeg's image reader stops at the first missing number, which would quietly
# make a shorter film, so a gap is an error here.
FRAMES="$(ls "$DIR" | grep -E '^f[0-9]{5}\.png$' | sort || true)"
if [[ -z "$FRAMES" ]]; then
  echo "ERROR: no f00000.png-style frames in $DIR" >&2
  exit 1
fi
FIRST="$(echo "$FRAMES" | head -1)"; FIRST=$((10#${FIRST:1:5}))
LAST="$(echo "$FRAMES" | tail -1)"; LAST=$((10#${LAST:1:5}))
COUNT="$(echo "$FRAMES" | wc -l | tr -d ' ')"
if [[ "$COUNT" -ne $((LAST - FIRST + 1)) ]]; then
  echo "ERROR: $DIR has $COUNT frames between $FIRST and $LAST: some are missing" >&2
  exit 1
fi

AUDIO_IN=(); AUDIO_MAP=()
if [[ "$AUDIO" != "-" ]]; then
  AUDIO_IN=(-i "$AUDIO"); AUDIO_MAP=(-map 1:a -c:a copy)
fi

TMP="$OUT.tmp.mp4"
ffmpeg -v error -y -framerate "$FPS" -start_number "$FIRST" -i "$DIR/f%05d.png" ${AUDIO_IN[@]+"${AUDIO_IN[@]}"} -map 0:v ${AUDIO_MAP[@]+"${AUDIO_MAP[@]}"} \
  -vf "scale=in_range=pc:out_range=tv:out_color_matrix=bt709:flags=accurate_rnd+full_chroma_int+lanczos,format=yuv420p" \
  -c:v libx264 -preset slow -crf "$CRF" -profile:v high -colorspace bt709 -color_primaries bt709 -color_trc iec61966-2-1 -color_range tv \
  -movflags +faststart "$TMP"
# x264 alone leaves the bitstream's transfer unknown: the same remux as the render's.
ffmpeg -v error -y -i "$TMP" -map 0 -c copy -bsf:v h264_metadata=transfer_characteristics=13:colour_primaries=1 -color_trc iec61966-2-1 -color_primaries bt709 -movflags +write_colr+faststart "$OUT"
rm -f "$TMP"
ffprobe -v error -show_entries stream=codec_name,width,height,nb_frames,duration,color_space,color_transfer,color_primaries,color_range -of compact "$OUT"
ls -la "$OUT"
