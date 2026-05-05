# B-roll integration - collage and live-action layers in Remotion

Many product demos benefit from collage-style or stock-footage b-roll layered behind motion graphics. This is supported via the `BRollLayer` primitive (in `assets/code-templates/BRollLayer.tsx`).

This is a different mode of work than pure motion graphics. The previous version of this skill recommended sending live-action work to Premiere/DaVinci. That recommendation is wrong when the b-roll is being used as a *background layer* under typography and motion graphics - Remotion handles this well, and keeping the whole production in one tool is a big productivity win.

## When to use b-roll layers

Good signals:

- The user has stock or original collage footage (cutout-style, paper-cutout, mixed-media).
- The "pain side" of the film benefits from human emotional anchor (frustration, overwhelm, joy).
- You want a unifying texture across multiple scenes without inventing scene-specific motion graphics.

Bad signals (don't use b-roll layers here):

- The b-roll is the *subject* of the scene (a talking head, a product unbox). That's a documentary cut - it belongs in a different tool or workflow.
- The b-roll has audio you need to preserve (interviews). `BRollLayer` mutes by default.
- The b-roll is rapidly cut for narrative purpose. Remotion's `<OffthreadVideo>` is for slow-moving backgrounds, not montage cuts.

## The BRollLayer primitive

```tsx
// assets/code-templates/BRollLayer.tsx
import {
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import React from "react";

export interface BRollLayerProps {
  // Path under public/, e.g. "b-rolls/speech-bubble.mp4"
  src: string;
  startFrame?: number;
  opacity?: number;
  blend?: React.CSSProperties["mixBlendMode"];
  startFrom?: number;
  endAt?: number;
  fadeIn?: number;
  fadeOut?: number;
  windowEnd?: number;
}

export const BRollLayer: React.FC<BRollLayerProps> = ({
  src, startFrame = 0, opacity = 1, blend, startFrom = 0, endAt,
  fadeIn = 6, fadeOut = 6, windowEnd,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeInP = interpolate(frame, [startFrame, startFrame + fadeIn], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const fadeOutP = windowEnd
    ? interpolate(frame, [windowEnd - fadeOut, windowEnd], [1, 0], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
      })
    : 1;
  const visibleOpacity = opacity * fadeInP * fadeOutP;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: visibleOpacity, mixBlendMode: blend, pointerEvents: "none" }}>
      <OffthreadVideo
        src={staticFile(src)}
        startFrom={startFrom * fps}
        endAt={endAt ? endAt * fps : undefined}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
};
```

Key choices:

- **`<OffthreadVideo>` not `<Video>`.** Offthread doesn't drop frames at high concurrency.
- **`startFrom`/`endAt` use `useVideoConfig().fps`** - fps changes don't break trim math.
- **Always muted.** B-roll is a layer, not the audio source.
- **`pointerEvents: "none"`** so any clickable layer above receives events.

## Common patterns

### 1. Full-opacity backdrop

```tsx
<BRollLayer src="b-rolls/speech-bubble.mp4" startFrom={1} endAt={4} windowEnd={D.scene1} fadeOut={10} />
```

### 2. Atmospheric low-opacity

```tsx
<BRollLayer src="b-rolls/typewriter.mp4" opacity={0.08} windowEnd={D.scene3} />
```

### 3. Blend-mode integration

```tsx
<BRollLayer src="b-rolls/light-bulb.mp4" opacity={0.4} blend="multiply" windowEnd={D.scene9} />
```

Multiply darkens; screen lightens; overlay does both. Test in Studio - the right blend depends on the b-roll's color profile against your background.

## Asset-side considerations

### Native resolution must match composition or exceed it

For a 1920x1080 composition, every b-roll should be at least 1920x1080. Verify with `ffprobe`:

```bash
for f in remotion-video/public/b-rolls/*.mp4; do
  ffprobe -v error -show_entries stream=width,height,duration -of default=noprint_wrappers=1 "$f"
done
```

Upscaling a 720p b-roll to 1080p inside Remotion produces visible blur.

### Codec and container

Prefer h.264 in mp4. Other codecs (h.265, VP9) work but render slower. ProRes / DNxHD are oversized for this use case.

### Length budget per scene

For a 3s scene with a 2s b-roll window (1s in, 1s out fades), the source clip needs ~3s of usable footage starting from `startFrom`. Pick the segment of the source that's most expressive - that's a craft decision per b-roll.

## Naming hygiene on copy-in

Source filenames often have spaces, typos, and version markers. Canonicalize on copy:

```bash
cp "speech bubble (2) FINAL.mp4" "remotion-video/public/b-rolls/speech-bubble.mp4"
cp "congitive_overload_FullHD_Wide.mp4" "remotion-video/public/b-rolls/cognitive-overload.mp4"
```

Use kebab-case, no spaces, no version markers.

## Scenes are not montages

Two heuristics that hold:

- **At most one b-roll per scene** (foreground motion graphics handle the variety).
- **Pain side gets b-rolls; payoff side stays clean motion graphics.**

These are heuristics, not rules. Break them with intent.

## Studio renders b-rolls slowly the first time

The first time Studio renders a scene with `<OffthreadVideo>`, the video is decoded and cached. First scrub is slow. Subsequent scrubs are fast. Don't panic at 30fps initial load - refresh once the cache warms.

## Render performance

`<OffthreadVideo>` is faster than `<Video>` for renders, but b-rolls still cost render time:

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
