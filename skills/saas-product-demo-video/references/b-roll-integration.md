# B-roll integration - collage and live-action layers in Remotion

Many product demos benefit from collage-style or stock-footage b-roll layered behind motion graphics. This is supported via the `BRollLayer` component (`assets/components/BRollLayer.tsx`, copied into `src/components/` when a film needs it).

This is a different mode of work than pure motion graphics. The previous version of this skill recommended sending live-action work to Premiere/DaVinci. That recommendation is wrong when the b-roll is being used as a *background layer* under typography and motion graphics - Remotion handles this well, and keeping the whole production in one tool is a big productivity win.

## When to use b-roll layers

Good signals:

- The user has stock or original collage footage (cutout-style, paper-cutout, mixed-media).
- The "pain side" of the film benefits from human emotional anchor (frustration, overwhelm, joy).
- You want a unifying texture across multiple scenes without inventing scene-specific motion graphics.

Bad signals (don't use b-roll layers here):

- The b-roll is the *subject* of the scene (a talking head, a product unbox). That's a documentary cut - it belongs in a different tool or workflow.
- The b-roll has audio you need to preserve (interviews). `BRollLayer` mutes by default.
- The b-roll is rapidly cut for narrative purpose. `BRollLayer` is for slow-moving backgrounds, not montage cuts.

## Before using a stock library

When the owner offers footage they already have ("from the times when I was a premium customer of promo.com"), look at every clip end to end before judging it: one frame strip per clip (`ffmpeg -i clip.mp4 -vf "fps=8/<duration>,scale=480:-1,tile=8x1" -frames:v 1 strip.png`). What that turned up on one film, worth checking on any:

- **Template exports, not raw footage.** Each clip from a template service ended on its placeholder card ("YOUR TEXT GOES HERE") over a tint, and one had the service's mail icon baked in; only the first few seconds were usable.
- **The license.** Stock bundled with a template editor is often licensed for videos made in that editor, and the owner may no longer subscribe. Unverified is not usable: check the service's terms before a clip goes in, and say so if you could not.
- **Where else it runs.** The clips sat in another of the owner's product projects; the same stock shot in two of their companies' films is worth naming.
- **The trope.** A frustrated person at a laptop, someone screaming at a desk, hands typing under a notification icon: the most common images in SaaS ads. In a film whose look has no live action (none of its references used any), they read as a template.

That film used none of it. The owner's underlying idea ("real estate... something subtle") went in as a drawing in the film's own language instead (`animation-patterns.md`, "A dot map that carries the story", the asset at the pin). A green-screen clip of a person at a monitor was the one candidate with a real use (the product keyed onto the screen) and is the shape to look for if footage is wanted.

## The BRollLayer component

Read `assets/components/BRollLayer.tsx` for the code; it is short. Its props:

| Prop | Meaning |
|---|---|
| `src` | Path under `public/`, e.g. `"b-rolls/speech-bubble.mp4"` |
| `startFrame` | Scene-local frame where the layer appears and the clip starts playing (default 0) |
| `clipStart`, `clipEnd` | The part of the source clip to play, in seconds. Omit `clipEnd` to play to the end of the file |
| `opacity`, `blend` | Opacity ceiling and `mix-blend-mode` |
| `fadeIn`, `fadeOut` | Fade lengths in frames (default 6) |
| `windowEnd` | Scene-local frame where the layer has fully faded out |

Key choices:

- **`<Video>` from `@remotion/media`.** It is the video component Remotion recommends for new code: frame-accurate, and it falls back to `<OffthreadVideo>` by itself when it cannot decode a file (the render log says so).
- **Trim in seconds, converted with `useVideoConfig().fps`** - fps changes don't break trim math. Underneath, it sets Remotion's `trimBefore` (frames skipped at the start of the source) and `durationInFrames` (source frames to play from there). These are the current names; `gotchas.md` #5 lists the ones they replaced.
- **`objectFit="cover"` is a prop, not a style.** `<Video>` draws to a canvas, where the CSS `object-fit` property has no effect.
- **Always muted.** B-roll is a layer, not the audio source.
- **`pointerEvents: "none"`** so any clickable layer above receives events.

## Common patterns

### 1. Full-opacity backdrop

```tsx
<BRollLayer src="b-rolls/speech-bubble.mp4" clipStart={1} clipEnd={4} windowEnd={SCENES.hook.duration} fadeOut={10} />
```

### 2. Atmospheric low-opacity

```tsx
<BRollLayer src="b-rolls/typewriter.mp4" opacity={0.08} windowEnd={SCENES.problem.duration} />
```

### 3. Blend-mode integration

```tsx
<BRollLayer src="b-rolls/light-bulb.mp4" opacity={0.4} blend="multiply" windowEnd={SCENES.finale.duration} />
```

Multiply darkens; screen lightens; overlay does both. Test in Studio - the right blend depends on the b-roll's color profile against your background.

## Asset-side considerations

### Native resolution must match composition or exceed it

For a 1920x1080 composition, every b-roll should be at least 1920x1080. Verify with `ffprobe`:

```bash
for f in public/b-rolls/*.mp4; do
  ffprobe -v error -show_entries stream=width,height,duration -of default=noprint_wrappers=1 "$f"
done
```

Upscaling a 720p b-roll to 1080p inside Remotion produces visible blur.

### Codec and container

Prefer h.264 in mp4. VP9 also decodes directly. h.265 makes `<Video>` fall back to `<OffthreadVideo>`, which works but renders slower. ProRes / DNxHD are oversized for this use case.

### Length budget per scene

For a 3s scene with a 2s b-roll window (1s in, 1s out fades), the source clip needs ~3s of usable footage starting from `clipStart`. Pick the segment of the source that's most expressive - that's a craft decision per b-roll.

## Naming hygiene on copy-in

Source filenames often have spaces, typos, and version markers. Canonicalize on copy:

```bash
cp "speech bubble (2) FINAL.mp4" "public/b-rolls/speech-bubble.mp4"
cp "congitive_overload_FullHD_Wide.mp4" "public/b-rolls/cognitive-overload.mp4"
```

Use kebab-case, no spaces, no version markers.

## Scenes are not montages

Two heuristics that hold:

- **At most one b-roll per scene** (foreground motion graphics handle the variety).
- **Pain side gets b-rolls; payoff side stays clean motion graphics.**

These are heuristics, not rules. Break them with intent.

## Studio renders b-rolls slowly the first time

The first time Studio shows a scene with a b-roll, the video has to be fetched and decoded. First scrub is slow. Subsequent scrubs are fast. Don't panic at 30fps initial load - refresh once the cache warms.

## Render performance

B-rolls cost render time. Numbers from a past production:

- A 2s b-roll at 1080p adds ~5-10 seconds to the master render.
- 5 b-rolls in a 30s film: render time goes from ~60s (motion graphics only) to ~120s (with b-rolls).
- Heavy use of `mixBlendMode` adds another 10-30%.

Use `--crf=18` for previews; `--crf=14` for the final ship render.

## When b-rolls fail in renders

If the master renders without a b-roll, but the b-roll appears in Studio scrubbing:

- **`staticFile()` resolution** - `staticFile("b-rolls/x.mp4")` resolves to `/b-rolls/x.mp4` from the public dir. Check the path.
- **Relative file paths** - Remotion needs files in `public/`, not in `src/`.
- **Codec mismatch** - re-encode to h.264 yuv420p:
  ```bash
  ffmpeg -i input.mp4 -c:v libx264 -pix_fmt yuv420p -an output.mp4
  ```

## Past production note

The Meltly demo used five b-rolls (speech-bubble, cognitive-overload, typewriter, target, light-bulb) at varying opacities (8% to 100%). Total render time impact: master rendered in ~3 minutes vs ~2 minutes without b-rolls. The atmospheric cost was negligible compared to the visual lift the collage style provided.
