#!/usr/bin/env bash
# make-sfx.sh - synthesize a neutral set of interface sounds with ffmpeg, then
# measure each file's lead so the cue table can be typed from the output.
#
#   make-sfx.sh [out-dir] [--swell SECONDS]      default: public/sfx, 1.75
#
# For the events Remotion's library does not cover (sound-effects.md): a low
# hit on a cut into a color field (thump), a swell that peaks on a reveal
# (swell: a rewind, a riser), a chime on the payoff (ping), a tick on a row
# landing, a click. Also two alternates to audition against the first two:
# thump-drop (a pitch drop, 110 to 45 Hz) and ping-bell (three partials).
# The plain set shipped in one film whose owner picked the version with the
# effects over the one without; the alternates have not been judged by ear.
# No third-party audio: everything here is arithmetic. 48 kHz, 16-bit mono.

set -euo pipefail

OUT="public/sfx"
SWELL="1.75"
while [ $# -gt 0 ]; do
  case "$1" in
    --swell) SWELL="$2"; shift 2 ;;
    -h|--help) sed -n 2,15p "$0"; exit 0 ;;
    *) OUT="$1"; shift ;;
  esac
done
mkdir -p "$OUT"
gen() { # name, aevalsrc expression, duration, filters
  ffmpeg -v error -y -f lavfi -i "aevalsrc='$2':s=48000:d=$3" -af "$4" -ac 1 -sample_fmt s16 "$OUT/$1.wav"
  echo "wrote $OUT/$1.wav"
}
# A low hit: 52 Hz under a fast decay, a short noise burst on top.
gen thump "0.9*sin(2*PI*52*t)*exp(-8*t)+0.35*(random(0)*2-1)*exp(-35*t)" 0.7 "lowpass=f=900,afade=t=out:st=0.55:d=0.15"
# A pitch drop (alternate): 110 Hz falling to 45 Hz over the first tenth of a second.
gen thump-drop "0.9*sin(2*PI*(45*t+65*(1-exp(-12*t))/12))*exp(-7*t)+0.25*(random(0)*2-1)*exp(-40*t)" 0.7 "lowpass=f=700,afade=t=out:st=0.55:d=0.15"
# A swell that peaks on its last frame: band-limited noise rising as t cubed.
gen swell "(random(0)*2-1)*pow(t/$SWELL,3)" "$SWELL" "highpass=f=500,lowpass=f=5000,afade=t=in:d=0.3"
# A chime: one partial and its fifth, decaying.
gen ping "0.55*sin(2*PI*1760*t)*exp(-5*t)+0.25*sin(2*PI*2637*t)*exp(-8*t)" 0.9 "afade=t=out:st=0.6:d=0.3"
# A bell (alternate): three inharmonic partials.
gen ping-bell "0.5*sin(2*PI*1320*t)*exp(-4*t)+0.3*sin(2*PI*3643*t)*exp(-7*t)+0.15*sin(2*PI*7128*t)*exp(-12*t)" 1.0 "afade=t=out:st=0.7:d=0.3"
# A tick for a row landing; a click for a button.
gen tick "0.6*sin(2*PI*2200*t)*exp(-110*t)+0.2*(random(0)*2-1)*exp(-300*t)" 0.08 "highpass=f=900"
gen click "0.7*(random(0)*2-1)*exp(-260*t)+0.4*sin(2*PI*1400*t)*exp(-90*t)" 0.1 "highpass=f=1200"
echo
python3 "$(dirname "$0")/measure-lead.py" "$OUT"/thump.wav "$OUT"/thump-drop.wav "$OUT"/swell.wav "$OUT"/ping.wav "$OUT"/ping-bell.wav "$OUT"/tick.wav "$OUT"/click.wav
