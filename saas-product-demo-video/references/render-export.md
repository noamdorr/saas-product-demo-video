# Render + export

The render step is deceptively fiddly. Wrong flag, wrong codec, wrong scale, and the file is unusable. These commands are the known-good defaults.

## HD master (1920×1080)

```bash
npx remotion render Act2Master out/Act2Master.mp4 \
  --crf=14 \
  --image-format=png \
  --concurrency=8
```

- `--crf=14` - close to visually lossless. Default of 18 is noticeably softer on typography.
- `--image-format=png` - lossless intermediate frames. JPEG intermediates introduce color banding on flat cream backgrounds.
- `--concurrency=8` - sweet spot on M1/M2/M3 MacBook Pro. Bump to 12-16 on Linux render box with 32+ cores.

File size: ~12-18 MB for 28s. Upload-ready for LinkedIn, YouTube, Loom.

## 4K master (3840×2160)

Remotion's `--scale=2` upscales the composition. Vector-source elements stay sharp:

```bash
npx remotion render Act2Master out/Act2Master_4K.mp4 \
  --crf=15 \
  --image-format=png \
  --scale=2 \
  --concurrency=8
```

- `--crf=15` because 4K at CRF 14 produces 200+ MB files. 15 is still visually lossless at the higher resolution.
- `--scale=2` multiplies both dimensions. Composition stays at 1920×1080 logically but renders at 3840×2160.
- Expect 2-3× the render time.

File size: ~45-90 MB for 28s.

## 9:16 vertical (1080×1920)

```bash
npx remotion render Act2MasterVertical out/Act2Master_Vertical.mp4 \
  --crf=14 \
  --image-format=png \
  --concurrency=8
```

For 4K vertical (2160×3840), add `--scale=2`.

## Per-scene debug renders

Much faster feedback loop than re-rendering the master every time:

```bash
npx remotion render v2-Scene05 out/scene05.mp4 --crf=18 --concurrency=8
```

- `--crf=18` is fine for debug - you're checking motion, not archival quality.
- IDs must be hyphenated (see `gotchas.md`).

A single-scene render on a 150-frame scene takes 15-30s. The full 840-frame master takes ~3 minutes. Use debug renders during iteration, master renders only at wave boundaries.

## Thumbnail / poster frame

For LinkedIn previews and social shares:

```bash
npx remotion still Act2Master out/thumbnail.png \
  --frame=45 \
  --scale=2
```

- Pick a frame from the middle of Scene 1 or the start of Scene 2 - avoid motion-heavy frames that will blur in the still.
- `--scale=2` gives a 4K poster. LinkedIn's preview cards compress it anyway, but the high-res source is handy for other uses.

## LinkedIn requirements

LinkedIn compresses uploads heavily. To minimize re-compression damage:

- Upload at 1920×1080 (not 4K - LinkedIn will downsample).
- H.264, AAC audio, MP4 container (Remotion's default).
- File size under 200 MB.
- Under 10 minutes.
- 16:9 for feed posts; 9:16 works for LinkedIn Reels.

CRF 14 at 1080p produces ~12-18 MB for 28s, well under LinkedIn's limit. No need to downgrade.

## Instagram / TikTok / YouTube Shorts (9:16)

All three accept 1080×1920 H.264 MP4. Max duration constraints:

- Instagram Reels: 90 seconds.
- TikTok: up to 10 minutes, but 60s is the sweet spot.
- YouTube Shorts: 60 seconds.

For a 20-30s demo, the 1080×1920 CRF 14 render from `Act2MasterVertical` composition is plug-and-play.

## X (Twitter) video

- 16:9 at 1920×1080 works.
- Max 2:20 for standard accounts, 10 min for verified.
- H.264 MP4, AAC audio.
- Upload at the target resolution - X transcodes aggressively.

## Verifying the render spec

Use `ffprobe` to check the file:

```bash
ffprobe -v error -select_streams v:0 \
  -show_entries stream=codec_name,width,height,r_frame_rate,duration \
  -of default=noprint_wrappers=1 out/Act2Master.mp4
```

Expected output:

```
codec_name=h264
width=1920
height=1080
r_frame_rate=30/1
duration=28.000000
```

If width/height don't match, check `V2.width` / `V2.height` in `theme-v2.ts` and the `--scale` flag.

## Partial-MP4 gotcha

If a render is killed mid-way (Ctrl+C, OOM), the output file is a partial MP4 - it often plays, but the timeline ends early. Remotion's progress bar reports percent of frames, not percent of encoded video.

**Prevention:** always let renders finish. If you need to abort, delete the output file and start fresh:

```bash
rm out/Act2Master.mp4
# then re-render
```

Don't trust a file if the render didn't print the final `✅ Render done` banner.

## Two renders at once - the deadlock

Running two `remotion render` commands in parallel (e.g. horizontal + vertical) can deadlock on Apple Silicon at concurrency=8 each, because they both try to use 8 cores of a 10-core machine and fight over memory.

**Fix 1:** run them serially.
**Fix 2:** drop each to `--concurrency=4` and accept ~40% longer render time per job.
**Fix 3:** render one, then the other, freeing the GPU/CPU between.

## Audio specs

Remotion encodes audio at AAC 192 kbps by default. Override:

```bash
--audio-bitrate=256k
```

192 kbps is more than adequate for a soundtrack behind kinetic typography. Going to 320 kbps adds ~1 MB and is inaudible in platform players.

If the user provided a voiceover, verify it's at the expected level. Remotion doesn't normalize - if the VO is quiet in the source, it'll be quiet in the output. Pre-process with `ffmpeg` or Audacity:

```bash
ffmpeg -i vo_raw.mp3 -filter:a "loudnorm=I=-16:TP=-1.5:LRA=11" vo_normalized.mp3
```

`-16 LUFS` is the broadcast-standard loudness for online video.

## Disk hygiene

PNG intermediates eat disk fast:

```bash
du -sh out/       # check output size
du -sh node_modules/.cache/remotion/  # check cache size
```

Remotion caches intermediates across renders - this speeds up iteration but hoards disk. On a long project, `rm -rf node_modules/.cache/remotion` between major iteration waves reclaims 5-20 GB.

## The render checklist

Before calling the render "final":

- [ ] `npm run typecheck` passes.
- [ ] Studio loads the composition without console errors.
- [ ] Click-on-snare audit passes (all `CLICK_` constants verified).
- [ ] Fonts load with no `delayRender` warnings in render logs.
- [ ] Master render prints `✅ Render done` banner.
- [ ] `ffprobe` confirms expected resolution + duration.
- [ ] Watched in the target platform's player (not just Studio).

Then hand off.
