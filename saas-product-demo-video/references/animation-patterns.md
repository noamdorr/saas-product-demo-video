# Animation patterns

The primitive patterns that account for most of what scenes need, plus the situational techniques that come up once you start polishing. Each has been proven in production and has a known-good code shape. Don't invent new primitives mid-build - compose these.

## TypedText - word-staggered type-on

The secret to cinematic kinetic typography: **words overlap by ~40%**. A strict one-after-another type-on feels robotic.

```tsx
import { useCurrentFrame, interpolate } from "remotion";
import { easings } from "../../anim/easings";

export const TypedText: React.FC<{
  text: string;
  startFrame: number;
  perWord?: number;     // frames each word takes to fully appear
  className?: string;
  style?: React.CSSProperties;
}> = ({ text, startFrame, perWord = 10, className, style }) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  const overlap = perWord * 0.6;  // each word starts 60% before prev ends

  return (
    <span className={className} style={style}>
      {words.map((w, i) => {
        const local = frame - startFrame - i * overlap;
        const p = interpolate(local, [0, perWord], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: easings.maskReveal,
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p,
              transform: `translateY(${(1 - p) * 12}px)`,
              marginRight: "0.25em",
            }}
          >
            {w}
          </span>
        );
      })}
    </span>
  );
};
```

Tuning: `perWord=10` with 40% overlap gives a brisk, confident read. `perWord=14` with the same overlap feels more editorial. Below 8, the overlap makes words collide visibly.

## MaskReveal - clip-path directional reveals

For horizontal reveal (left-to-right wipe):

```tsx
const p = interpolate(local, [0, duration], [0, 1], {
  easing: easings.maskReveal,
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});

<div
  style={{
    clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
    WebkitClipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
  }}
>
  {children}
</div>
```

For vertical (top-to-bottom): swap to `inset(${(1-p)*100}% 0 0 0)`.
For radial (iris): use `clip-path: circle(...)` - see iris wipe pattern below.

**Gotcha**: don't apply `transform: scale(...)` to a MaskReveal child. The scale transforms the clip-path's coordinate space and produces visible seams. Scale the parent, or lift the scale out into a wrapper.

## PopIn - spring-style scale + fade

For cards, chips, and UI elements snapping into place:

```tsx
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

export const PopIn: React.FC<{
  startFrame: number;
  children: React.ReactNode;
  config?: { damping?: number; stiffness?: number; mass?: number };
}> = ({ startFrame, children, config = {} }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.7, ...config },
  });

  return (
    <div
      style={{
        transform: `scale(${s})`,
        opacity: s,
        transformOrigin: "center",
      }}
    >
      {children}
    </div>
  );
};
```

Default config (damping 12, stiffness 180) gives a confident tap-in. For a softer settle: damping 14, stiffness 140. For a punchier snap: damping 10, stiffness 220.

## Kinetic card entrance - the combo

Most "card landing on a snare" beats use three primitives stacked:

```tsx
<Sequence from={landFrame} durationInFrames={48}>
  <PopIn startFrame={0}>
    <MaskReveal startFrame={2} direction="vertical" duration={10}>
      <Card>
        <TypedText text="47 companies in your ICP..." startFrame={6} perWord={8} />
      </Card>
    </MaskReveal>
  </PopIn>
</Sequence>
```

Staggered starts (0, 2, 6 frames): the PopIn lands, the MaskReveal fills in 2 frames later, the text starts typing 4 frames after that. Reads as one smooth beat, not three separate events.

## ZoomPunch - subtle hero scale accent

Between two zoom states without a cut:

```tsx
export const ZoomPunch: React.FC<{
  start: number;
  peak: number;
  end: number;
  peakScale?: number;
  children: React.ReactNode;
}> = ({ start, peak, end, peakScale = 1.06, children }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(
    frame,
    [start, peak, end],
    [1, peakScale, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easings.slowInLand,
    }
  );

  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: "center" }}>
      {children}
    </div>
  );
};
```

Peak scale 1.04 is conservative; 1.08 is aggressive. 1.06 is the Goldilocks default. Timing sweet spot: 20% of scene spent entering, 20% holding the peak, 20% settling - the remaining 40% on either end stay at 1.0.

## FloatingElements - deterministic ambient motion

Background pills, dots, floating cards. Must be deterministic (same frame always renders the same state) or the final MP4 will flicker:

```tsx
export const FloatingElements: React.FC<{ count: number; seed: number }> = ({
  count,
  seed,
}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        // Deterministic pseudo-random using frame + seed + i
        const baseX = ((seed * 9301 + i * 49297) % 233280) / 2332.8;  // 0-100
        const baseY = ((seed * 1103 + i * 12345) % 233280) / 2332.8;
        const driftX = Math.sin((frame + i * 7) * 0.01) * 20;
        const driftY = Math.cos((frame + i * 13) * 0.013) * 20;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${baseX + driftX / 10}%`,
              top: `${baseY + driftY / 10}%`,
              width: 24, height: 24,
              borderRadius: "50%",
              background: "rgba(238,46,127,0.2)",
            }}
          />
        );
      })}
    </>
  );
};
```

The key is `Math.sin` / `Math.cos` keyed on `frame`, not `Math.random()`. Never use `Math.random()` inside a component - it re-seeds on every frame.

## Cursor - click-path with tip anchoring

See `cursor-math.md` for the math. The component shape:

```tsx
<svg width={48} height={48} viewBox="0 0 24 24"
  style={{
    position: "absolute",
    left: cursorX - 4 * (48/24),   // subtract tip offset at current scale
    top:  cursorY - 3 * (48/24),
    transform: `scale(${cursorScale})`,
    transformOrigin: "0% 0%",       // anchor at tip, not center
    pointerEvents: "none",
  }}
>
  <path d="M4,3 L4,17 L9,13 L12,19 L14,18 L11,12 L17,12 Z"
    fill="#390854" stroke="white" strokeWidth="1.5" />
</svg>
```

The tip is at SVG coordinates `(4, 3)` in a 24×24 viewBox. `transformOrigin: "0% 0%"` keeps the tip locked when the cursor scales (e.g. on click feedback).

## Phrase-lift-from-center → resting-at-top

Scene 5 opening / Scene 9 finale pattern: a phrase appears at screen center, holds, then lifts to the top.

```tsx
// At render time, compute the lift delta once:
const CANVAS_HEIGHT = 1080;
const PHRASE_BLOCK_TOP_Y = 120;       // where it rests at top of screen
const PHRASE_BLOCK_HEIGHT = 180;
const PHRASE_TOP_SHIFT = Math.round(
  PHRASE_BLOCK_TOP_Y + PHRASE_BLOCK_HEIGHT / 2 - CANVAS_HEIGHT / 2
);

// In the component:
const liftProgress = interpolate(frame, [liftStart, liftEnd], [0, 1], {
  easing: easings.slowInLand,
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
const translateY = liftProgress * PHRASE_TOP_SHIFT;  // negative - moves up

<div style={{
  position: "absolute",
  top: "50%", left: "50%",
  transform: `translate(-50%, calc(-50% + ${translateY}px))`,
}}>
  {phrase}
</div>
```

The magic: phrase never reflows. It animates its own position, preserving kerning and line breaks. Looks like the camera pulled up.

## Iris wipe to dark color

Used to transition to the finale scene. Circular reveal of the next scene, expanding from a focal point:

```tsx
const MAX_IRIS_RADIUS = Math.hypot(width, height) / 2 + 100;  // Pythagoras - covers entire canvas
const radius = interpolate(frame, [irisStart, irisEnd], [0, MAX_IRIS_RADIUS], {
  easing: easings.violentPush,
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});

<AbsoluteFill style={{ background: "#390854" }}>
  {/* finale content */}
</AbsoluteFill>
<AbsoluteFill style={{
  clipPath: `circle(${radius}px at 50% 50%)`,
  WebkitClipPath: `circle(${radius}px at 50% 50%)`,
  background: "transparent",
}} />
```

The `+100` padding on `MAX_IRIS_RADIUS` prevents a visible black ring when the expansion finishes - the circle should always exceed the canvas diagonal.

## blendHex - smooth hex-to-hex color interpolation

For background color shifts between scenes without a cut:

```typescript
export const blendHex = (a: string, b: string, t: number): string => {
  const [ar, ag, ab] = [a.slice(1, 3), a.slice(3, 5), a.slice(5, 7)].map((h) => parseInt(h, 16));
  const [br, bg, bb] = [b.slice(1, 3), b.slice(3, 5), b.slice(5, 7)].map((h) => parseInt(h, 16));
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${[r, g, bl].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
};
```

Use case:
```tsx
const bg = blendHex(v2Colors.cream, v2Colors.blush, sceneProgress);
```

## Breathing pulse - subtle life on static UI

For held UI elements (the hero card, a CTA button) that shouldn't feel dead:

```typescript
const pulsePhase = frame - pulseStart;
const pulseScale = 1 + Math.sin(pulsePhase * 0.046) * 0.015;  // ±1.5%
```

`0.046` rad/frame = one cycle per ~136 frames (~4.5s at 30 fps). `±1.5%` is imperceptible per frame but cumulatively signals "breathing". Tuning:
- Sin multiplier `0.015` = amplitude. `0.025` is the upper limit before it looks like nervous jitter.
- Phase `0.046` = frequency. `0.02` is a slow meditative breath; `0.08` is anxious.

## Marker underline - draws under last word

Overlay SVG that animates a stroke-draw:

```tsx
<svg
  width={underlineWidth}
  height={20}
  style={{ position: "absolute", left: underlineX, top: underlineY }}
>
  <path
    d={`M 0 10 Q ${underlineWidth / 4} 6 ${underlineWidth / 2} 10 T ${underlineWidth} 10`}
    stroke="#EE2E7F"
    strokeWidth="6"
    fill="none"
    strokeLinecap="round"
    strokeDasharray={totalLength}
    strokeDashoffset={totalLength * (1 - drawProgress)}
  />
</svg>
```

The slight quadratic bezier curve on the path (Q and T commands) makes the underline feel hand-drawn rather than ruler-straight. `drawProgress` is 0→1 over 12-15 frames. Stagger with the word it's underlining so the marker arrives ~3 frames after the word finishes typing in.

## Beat-locked entrance: hard cut, not fade-in

An element that must LAND on a beat needs full presence at frame 0. A spring-from-0 (opacity 0→1 / scale 0.9→1) leaves the **cut frame blank**, so the beat lands on an empty screen and the impact arrives ~5 frames late. For burst/reveal moments, hard-cut at full opacity and add a quick scale punch-and-settle for energy - the hard cut IS the impact.

```tsx
// ❌ fades up from nothing - the cut frame (the beat) is blank
const p = spring({ frame, fps, config: { damping: 13 } })
style={{ opacity: p, transform: `scale(${interpolate(p, [0,1], [0.9,1])})` }}
// ✅ full opacity on frame 0; a scale punch settles for the "burst"
const punch = spring({ frame, fps, config: { damping: 12, mass: 0.5, stiffness: 130 } })
style={{ transform: `scale(${interpolate(punch, [0,1], [0.94,1])})` }} // opacity stays 1
```

## Source → hero handoff (no ghost, no shrink)

When a source element (a grid/marquee tile) hands off to a hero element that then flies/grows: at the handoff frame the hero must MATCH the source's footprint (width, height, AND screen position), HOLD still through a short crossfade, then start moving. A hero that is already moving/growing as it crossfades over the fading source produces an offset **double-card ghost**. If the hero's height is content-driven it can be shorter than the source → a visible **shrink**. Give the hero a fixed height (`boxSizing: 'border-box'`) + centered content (`justifyContent: 'center'`) so it matches the source and scales UNIFORMLY.

```tsx
const S0 = TILE_W / CARD_W               // start scale so hero width == source width
const p = interpolate(frame, [HANDOFF + 5, MORPH_END], [0, 1], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic),
}) // holds at 0 through the crossfade, then morphs
// hero: { width: CARD_W, height: FIXED, boxSizing: 'border-box', justifyContent: 'center',
//         transform: `scale(${interpolate(p, [0,1], [S0, 1])})` }  // pick FIXED so FIXED*S0 ≈ source height
```

## Meter/bar → big number (drain first)

Morphing a progress bar into a big number: **drain the bar's fill to 0 first**, then fade the number in. A simultaneous crossfade leaves the bar's colored stub beside the digits and it reads as a **minus sign** (e.g. "-83"). Sequence the fill width 6%→0, then start the number's opacity only after the fill is gone.

## Ease into a freeze (no jolt)

A hard velocity stop - a scrolling marquee that freezes instantly on a beat - reads as a **jolt**. Decelerate the last ~15 frames into rest while still landing the freeze ON the beat by easing the "effective time" you drive the scroll with:

```tsx
const te = frame < ff - DECEL ? frame
  : interpolate(frame, [ff - DECEL, ff], [ff - DECEL, ff], {
      easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp' })
const scrollX = BASE - SPEED * te   // decelerates to rest at ff, still on the beat
```

## Punchy kicker: reveal as one unit

Word-by-word reveal is the default for kinetic captions. For a punchline/kicker that should HIT, reveal the whole line at once (set the word stagger / `wordDelay` to 0) using the SAME spring as the rest - punchy but consistent. Switching one line to a different animation (a hard pop) feels off.

## Deterministic variation (never Math.random)

Remotion renders each frame independently and re-renders on resume; `Math.random()`, `Date.now()`, and argless `new Date()` give different values per frame → **flicker** (and break caching/determinism). For per-element variation (jitter, per-tile speeds, sparklines) seed a stable hash by index:

```tsx
const rand = (seed: number, k: number) => {
  const v = Math.sin(seed * 53.17 + k * 29.83) * 6151.79
  return v - Math.floor(v) // 0..1, stable across frames
}
```

## Reveal a filled chart by clipping, not dashing

To draw a filled area/line chart in, animate a `clipPath` rect's width (a left-to-right reveal) with a thin playhead at its leading edge. Cleaner than `stroke-dashoffset` for FILLED areas - dashoffset only animates the stroke, not the fill, so the shaded region under the line pops in all at once.

```tsx
<clipPath id="r"><rect width={progress * W} height={H} /></clipPath>
<g clipPath="url(#r)">{/* area + line */}</g>
<line x1={progress * W} x2={progress * W} y1={0} y2={H} /> {/* playhead at the edge */}
```

The playhead at the clip's leading edge sells the "drawing now" read; without it the reveal looks like a static wipe.

## Kinetic text: mind the whitespace

Word-by-word reveal means each word is an `inline-block` with a staggered spring. `inline-block` collapses the whitespace between words, so add a `marginRight` for the space - and drop it on the last word (and on centered lines) or the trailing space pushes the line off-center.

```tsx
marginRight: i === words.length - 1 ? 0 : "0.25em"
```

## Group the focal card with its caption

Center a focal card and its caption as ONE vertical unit rather than card-pinned-top + caption-pinned-bottom, which ping-pongs the viewer's eye between the two anchors. Reserve the caption's slot with a `minHeight` so swapping caption lines does not reflow and jump the whole group.

```tsx
<div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
  <Card />
  <div style={{ minHeight: CAPTION_SLOT }}>{caption}</div>
</div>
```

## One persistent scrim, dissolve only the text

For captions over busy footage, use ONE persistent readability band (scrim) and cross-dissolve only the text inside it. A per-caption scrim flickers on every swap as bands fade in and out over each other; a single held band keeps the contrast floor steady while the words change.

## Composing patterns - the rule

When a scene needs "card appears with text + cursor clicks it + ripple fires":

1. `<PopIn>` the card (0-12 frames).
2. `<MaskReveal>` the text inside the card (6-20 frames).
3. `<TypedText>` the copy inside (10-40 frames).
4. Cursor keypoints move to the button (30-60 frames), with tip stopping on a snare.
5. On the click frame, render a scale-punch on the button (1→1.05→1) + a ripple circle expanding from click point.

Each event gets its own Sequence or time window. They chain via shared timing constants from `V2`, not magic numbers in components.
