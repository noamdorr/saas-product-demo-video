# Render + export

The render step is deceptively fiddly. Wrong flag, wrong codec, wrong scale, and the file is unusable. These commands are the known-good defaults.

## HD master (1920×1080)

```bash
npx remotion render Master out/master.mp4 --crf=14 --image-format=png --concurrency=8 --color-space=bt709
ffmpeg -i out/master.mp4 -map 0 -c copy \
  -bsf:v h264_metadata=transfer_characteristics=13 -color_trc iec61966-2-1 \
  -movflags +write_colr+faststart out/master-tagged.mp4
```

- `--crf=14` - close to visually lossless. Default of 18 is noticeably softer on typography.
- `--image-format=png` - lossless intermediate frames. JPEG intermediates introduce color banding on flat cream backgrounds.
- `--concurrency=8` - sweet spot on M1/M2/M3 MacBook Pro. Bump to 12-16 on Linux render box with 32+ cores.
- `--color-space=bt709` and the remux - without them the file carries no color tags, every player guesses, and the brand red is a different red in QuickTime, Chrome and ffmpeg (gotcha 61). The remux is lossless and takes a second; the tagged file is the deliverable. Measure the delivered color in the player the owner uses, not only through ffmpeg.
- Spell the flags out on every command. A shell variable holding them is passed as one argument under zsh and the render stops while the next log tail looks like success (gotcha 58). Put the exact line in the README and in every handoff, and render every candidate with it: a candidate made with the defaults is softer and smaller and compares the flags, not the change (gotcha 64).
- A render that takes minutes runs in the background; wait for its exit, then check the output's timestamp. Judge a render by its exit, never by the file's size or the progress bar (gotcha 76 has the orphan cleanup when one crashes).

File size: about 3 MB for 28 seconds of flat-color motion graphics, 12-18 MB with b-roll or gradients. Upload-ready for LinkedIn, YouTube, Loom.

## 4K master (3840×2160)

Remotion's `--scale=2` renders the 1080p composition at 2× pixel density (3840×2160) with NO layout or coordinate changes. Vector-source elements stay sharp:

```bash
npx remotion render Master out/master-4k.mp4 \
  --crf=15 \
  --image-format=png \
  --scale=2 \
  --concurrency=8
```

- `--crf=15` because 4K at CRF 14 produces 200+ MB files. 15 is still visually lossless at the higher resolution.
- `--scale=2` multiplies both dimensions. Composition stays at 1920×1080 logically but renders at 3840×2160. Because the video is vector/CSS/SVG it stays crisp, and because nothing about the layout changes, beat-sync and any positioning rig are untouched - keep the same quality flags, and `--color-space=bt709` plus the remux above. Never `--width=3840 --height=2160`: that keeps the layout at 1920x1080 inside a canvas four times the area (gotcha 68).
- Expect 2-3× the render time. Render the 4K only after the owner has accepted the HD; it is the archival copy, not the review copy.
- **The 4K takes the HD's audio.** A second render of the same film can carry different audio, one-second stretches at -26 to -56 dB where the HD had none (gotcha 57; it happened on ten of one film's versions). So the standard step is to mux the accepted HD's audio into the 4K and confirm the decoded audio is identical:

```bash
ffmpeg -i out/master-4k.mp4 -i out/master-tagged.mp4 -map 0:v -map 1:a -c copy -movflags +write_colr+faststart out/master-4k-final.mp4
for f in out/master-tagged.mp4 out/master-4k-final.mp4; do ffmpeg -v error -i "$f" -map 0:a -f s16le - | md5; done   # the two hashes match
```

Then check the picture against the HD once: downscale every 4K frame and compare (a mean SSIM of 0.99 and a worst frame of 0.98 was the number on one film); a raster drawn above 1x of its source is what fails here (gotcha 79).

File size: ~45-90 MB for 28s.

## Copies for review and for the web

- **A phone preview.** The owner reviews on a phone at night; a messaging app bounces files over about 30 MB. Render a `-preview` copy at `--crf=24`, name it as such, and say it is for viewing only. Never ship it.
- **The homepage copy** is its own deliverable: a web encode at CRF 23 (about 2 MB for 26 s), a poster frame and an `og.jpg` that is a byte copy of the same frame, all regenerated together from the master whenever the film changes. Keep the recipe in the project README.
- **Proving a localized change.** When a wave changed one scene, render the old and the new master and compare decoded frames per scene: report the minimum PSNR and the share of pixels off by more than 12 levels, expect frames up to the next keyframe before the edit to differ at 43 to 51 dB (x264's lookahead, not pixels; gotcha 66), and look at the worst frames (gotcha 52).
- **Deliver the exact file the owner watched.** Keep every accepted master under its version name (`film-v14.mp4`, never overwritten) and a snapshot of its source (`backups/src-v14/`); a candidate re-rendered over itself before acceptance refreshes its snapshot.

## 9:16 vertical (1080×1920)

```bash
npx remotion render MasterVertical out/master-vertical.mp4 \
  --crf=14 \
  --image-format=png \
  --concurrency=8
```

For 4K vertical (2160×3840), add `--scale=2`.

## Per-scene debug renders

Much faster feedback loop than re-rendering the master every time:

```bash
npx remotion render Scene-05 out/scene-05.mp4 --crf=18 --concurrency=8
```

- `--crf=18` is fine for debug - you're checking motion, not archival quality.
- IDs must be hyphenated (see `gotchas.md`).

Render time depends heavily on the content. A flat-color, type-and-cards film of 840 frames rendered in 15 to 20 seconds on a recent laptop; a film with b-roll video layers and heavy blur took about 3 minutes. Use debug renders during iteration, master renders only at wave boundaries.

## Verify frames cheaply with ffmpeg

There's no test runner for a video - you verify visually. Render the full mp4 ONCE (one bundle), then pull any frame instantly:

```bash
ffmpeg -y -i out/video.mp4 -vf "select=eq(n\,FRAME)" -vframes 1 out/f.png
```

For more than a handful of frames this is quicker than calling `npx remotion still <Comp> out.png --frame=N` once per frame. For the few frames of a self-check, `scripts/render-stills.sh` is simpler. To diagnose a motion artifact (ghost / jolt / shrink), extract a DENSE sequence of frames around the suspect frame and step through them:

```bash
for n in $(seq 70 90); do
  ffmpeg -y -i out/video.mp4 -vf "select=eq(n\,$n)" -vframes 1 out/f_$n.png
done
```

## Outro hold so the CTA lingers

Viewers need the URL/CTA on screen ~2s. If the cut ends right on the last beat, extend the final scene by moving its end to a later beat in `SCENE_ENDS` (`timing.ts`); the composition length follows. Check the soundtrack length first:

```bash
ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 music.mp3
```

A track longer than the cut means you can extend INTO it - the audio fade-out is keyed to `TOTAL_FRAMES`, so it moves to the new end by itself. A slow-blooming brand-color glow behind the CTA warms the hold.

## Thumbnail / poster frame

For LinkedIn previews and social shares:

```bash
npx remotion still Master out/thumbnail.png \
  --frame=45 \
  --scale=2
```

- Pick a frame from the middle of Scene 1 or the start of Scene 2 - avoid motion-heavy frames that will blur in the still.
- `--scale=2` gives a 4K poster. LinkedIn's preview cards compress it anyway, but the high-res source is handy for other uses.

## Frame 0 is the autoplay poster

This is about the first frame of the film, not the first frame of each scene.

The literal first frame is the thumbnail and poster most players show before playback - the still that sits under a paused or not-yet-autoplayed video. Never open on a blank fade-up: a fade-in from black or empty means frame 0 is a near-empty frame, so the poster the audience sees is a dead screen, and the file looks broken before it has played a frame. Make frame 0 a complete establishing image - the scene fully composed, type already legible - and let the motion come from within it (a counter ticking up, a card settling, a glow blooming) rather than from the whole frame materializing out of nothing.

(This is the thumbnail reason to keep full presence at frame 0; the beat-sync reason - that a fade-in has no transient to land on the first beat - is in `animation-patterns.md` -> "Beat-locked entrance: hard cut, not fade-in".)

## LinkedIn requirements

LinkedIn compresses uploads heavily. To minimize re-compression damage:

- Upload at 1920×1080 (not 4K - LinkedIn will downsample).
- H.264, AAC audio, MP4 container (Remotion's default).
- File size under 200 MB.
- Under 10 minutes.
- 16:9 for feed posts; 9:16 works for LinkedIn Reels.

CRF 14 at 1080p produces 3-18 MB for 28s depending on content, well under LinkedIn's limit. No need to downgrade.

## Instagram / TikTok / YouTube Shorts (9:16)

All three accept 1080×1920 H.264 MP4. Max duration constraints:

- Instagram Reels: 90 seconds.
- TikTok: up to 10 minutes, but 60s is the sweet spot.
- YouTube Shorts: 60 seconds.

For a 20-30s demo, the 1080×1920 CRF 14 render from the `MasterVertical` composition is plug-and-play.

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
  -of default=noprint_wrappers=1 out/master.mp4
```

Expected output:

```
codec_name=h264
width=1920
height=1080
r_frame_rate=30/1
duration=28.000000
```

If width/height don't match, check `canvas` in `src/theme.ts` and the `--scale` flag.

## Partial-MP4 gotcha

If a render is killed mid-way (Ctrl+C, OOM), the output file is a partial MP4 - it often plays, but the timeline ends early. Remotion's progress bar reports percent of frames, not percent of encoded video.

**Prevention:** always let renders finish. If you need to abort, delete the output file and start fresh:

```bash
rm out/master.mp4
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
- [ ] Click audit passes (all `CLICK_` constants derived from the beat grid, see `beat-sync.md`).
- [ ] Fonts load with no `delayRender` warnings in render logs.
- [ ] Master render prints `✅ Render done` banner, and the output's timestamp is from this run.
- [ ] `ffprobe` confirms expected resolution + duration, an audio stream, and `color_transfer=iec61966-2-1` on the tagged file.
- [ ] `node tools/dump-timing.mjs`, then `tools/sheets.py`, `tools/jerk.py --planned <the README's ranges>` and `scripts/check-copy.mjs` ran on this render (`self-check.md`).
- [ ] 4K, if made, carries the HD's audio (hashes match) and was made after the owner's yes.
- [ ] Watched in the target platform's player (not just Studio), by a person; the notes say nobody has watched it until they do.

Then hand off.
