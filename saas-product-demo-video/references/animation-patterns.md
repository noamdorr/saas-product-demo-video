# Animation patterns

The 8-10 primitive patterns that account for ~90% of what scenes need. Each has been proven in production and has a known-good code shape. Don't invent new primitives mid-build - compose these.

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

## Composing patterns - the rule

When a scene needs "card appears with text + cursor clicks it + ripple fires":

1. `<PopIn>` the card (0-12 frames).
2. `<MaskReveal>` the text inside the card (6-20 frames).
3. `<TypedText>` the copy inside (10-40 frames).
4. Cursor keypoints move to the button (30-60 frames), with tip stopping on a snare.
5. On the click frame, render a scale-punch on the button (1→1.05→1) + a ripple circle expanding from click point.

Each event gets its own Sequence or time window. They chain via shared timing constants from `V2`, not magic numbers in components.
