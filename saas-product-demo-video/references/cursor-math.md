# Cursor math

The cursor is the most fiddly part of any product demo. Get it wrong and the whole film feels amateur. Three things matter: the hotspot (where the click registers), the keypoints (the path), and the scale-ratio transform (so the tip stays locked when scaling).

## The hotspot - where the tip is

The standard macOS-style arrow cursor SVG, drawn inside a 24×24 viewBox, has its tip at **(4, 3)** - not at (0, 0) and not at the center.

```
┌──────────── viewBox 24×24 ────────────┐
│                                        │
│    ·   ← tip at (4, 3)                 │
│    ╲                                   │
│     ╲                                  │
│      ╲                                 │
│       ╲                                │
│        ·                               │
│       ╱                                │
│      ·  ← tail                         │
│                                        │
└────────────────────────────────────────┘
```

If you render this SVG with `width={48}` and position it via `left: cursorX; top: cursorY`, the tip appears **`4 * (48/24) = 8px` right** and **`3 * (48/24) = 6px` down** from where you'd expect. Which means clicks will register 8-6px off target. Which looks jarring even if the user can't explain why.

**The fix:** subtract the tip offset when positioning, factoring in the current render scale:

```tsx
const SVG_WIDTH = 48;  // actual rendered width
const VIEWBOX_WIDTH = 24;
const tipOffsetX = 4 * (SVG_WIDTH / VIEWBOX_WIDTH);  // = 8
const tipOffsetY = 3 * (SVG_WIDTH / VIEWBOX_WIDTH);  // = 6

<svg
  width={SVG_WIDTH}
  style={{
    position: "absolute",
    left: cursorX - tipOffsetX,
    top:  cursorY - tipOffsetY,
    // ...
  }}
/>
```

Now `(cursorX, cursorY)` is where the tip lives in canvas coordinates.

## Keypoints - the cursor path

The cursor's path is expressed as an array of `{ frame, x, y, scale? }` entries. Remotion's `interpolate` blends between them:

```typescript
const cursorKeypoints = [
  { frame: 0,   x: 200,  y: 100, scale: 1   },   // enters scene
  { frame: 30,  x: 800,  y: 500, scale: 1   },   // slides to card
  { frame: 45,  x: 800,  y: 500, scale: 1.15 },  // hovers - slight grow
  { frame: 60,  x: 800,  y: 500, scale: 0.9  },  // click down
  { frame: 66,  x: 800,  y: 500, scale: 1   },   // click release
];

const frames = cursorKeypoints.map((k) => k.frame);
const xs =     cursorKeypoints.map((k) => k.x);
const ys =     cursorKeypoints.map((k) => k.y);
const scales = cursorKeypoints.map((k) => k.scale ?? 1);

const cursorX = interpolate(frame, frames, xs, {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: easings.whip,
});
const cursorY = interpolate(frame, frames, ys, { /* same */ });
const cursorScale = interpolate(frame, frames, scales, { /* same */ });
```

**Invariant: frames must be strictly increasing.** Remotion's `interpolate` throws if you pass duplicate or decreasing frame numbers. If you want two keypoints at the "same" moment (e.g. arrive and start scaling), use frame N and N+1.

## Click-target derivation - don't hard-code positions

Bad: `{ frame: 60, x: 800, y: 500 }` - what if the card moves during iteration?

Good: compute click targets from layout math:

```typescript
const CARD_X = 720;
const CARD_Y = 400;
const CARD_W = 360;
const CARD_H = 220;
const BUTTON_MARGIN_BOTTOM = 24;
const BUTTON_H = 44;
const BUTTON_W = 160;

const clickTargetX = CARD_X + CARD_W / 2;  // centered horizontally
const clickTargetY = CARD_Y + CARD_H - BUTTON_MARGIN_BOTTOM - BUTTON_H / 2;

const cursorKeypoints = [
  { frame: 0,  x: 200, y: 100 },
  { frame: 45, x: clickTargetX, y: clickTargetY },
  { frame: 60, x: clickTargetX, y: clickTargetY, scale: 0.9 },
];
```

When you move the card during iteration, click targets follow. This is the single biggest time-saver during iteration waves.

## Scale-ratio transform - the tip stays locked

When the cursor scales (click feedback = scale to 0.9), the tip must stay locked to the click position. CSS's default `transform-origin: center` scales *around the cursor's center*, which moves the tip.

**Fix 1: anchor at tip via transformOrigin**

```tsx
<svg
  style={{
    left: cursorX - tipOffsetX,
    top:  cursorY - tipOffsetY,
    transform: `scale(${cursorScale})`,
    transformOrigin: "0% 0%",  // scale from top-left - aligns with tip after the offset subtraction
  }}
/>
```

Wait - `(0, 0)` in the SVG is not the tip. The tip is at `(4, 3)`. So this scales around the *image's* top-left corner, which approximates the tip but drifts slightly as scale changes.

**Fix 2: scale-ratio transform (cleaner)**

Compute the cursor's on-screen position so that after scaling, the tip ends up at `(cursorX, cursorY)` regardless of current scale:

```typescript
const leftAtScale1 = cursorX - tipOffsetX;
const topAtScale1  = cursorY - tipOffsetY;

// As scale changes, the tip would shift by (tipOffset * (scale - 1)) from scale=1 position.
// Compensate by shifting left/top in the opposite direction:
const left = leftAtScale1 - tipOffsetX * (cursorScale - 1);
const top  = topAtScale1  - tipOffsetY * (cursorScale - 1);
```

This keeps the tip pinned to `(cursorX, cursorY)` in canvas coordinates at any scale. Works with `transformOrigin: "0% 0%"` on the SVG.

Put it together:

```tsx
const tipOffsetX = 4 * (SVG_WIDTH / VIEWBOX_WIDTH);
const tipOffsetY = 3 * (SVG_WIDTH / VIEWBOX_WIDTH);

const left = cursorX - tipOffsetX * cursorScale;
const top  = cursorY - tipOffsetY * cursorScale;

<svg
  width={SVG_WIDTH}
  style={{
    position: "absolute",
    left, top,
    transform: `scale(${cursorScale})`,
    transformOrigin: "0% 0%",
    pointerEvents: "none",
  }}
/>
```

## Click feedback - ripple + punch

On the exact click frame, fire two things in parallel:

**1. Button punch**: the clicked element scales to 1.05 then back to 1.0 over 6 frames.

```tsx
const punchScale = interpolate(frame, [clickFrame, clickFrame + 3, clickFrame + 6], [1, 1.05, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
```

**2. Ripple**: a translucent circle expands and fades from the click point.

```tsx
const ripp = interpolate(frame, [clickFrame, clickFrame + 18], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
const rippleRadius = ripp * 80;
const rippleOpacity = 1 - ripp;

<circle cx={clickTargetX} cy={clickTargetY} r={rippleRadius}
  fill="none" stroke="#EE2E7F" strokeWidth={2} opacity={rippleOpacity} />
```

**Critical**: button punch + ripple + click-down cursor scale = three things on the same frame. That's the climax beat. Don't chain them. They fire simultaneously.

## Multi-click choreography

For sequences with multiple clicks (e.g. typing into a field, clicking submit, clicking confirm):

1. Define every click target from layout math.
2. Array of click events: `[{ frame: 60, target: "input" }, { frame: 120, target: "submit" }, ...]`.
3. Generate the cursor keypoints by walking the click events + adding glide-in/glide-out keypoints around each.
4. Verify every click frame lands on a snare. If not, shift ±15 frames (see `beat-sync.md`).

Don't hand-author 30 keypoints. Let a helper function do it.

## Debug overlay

During iteration, render a small debug overlay that shows: cursor frame, (x, y), scale, distance from nearest click target. Saves hours when the cursor "feels off" but you can't articulate why.

```tsx
{process.env.NODE_ENV !== "production" && (
  <div style={{ position: "absolute", top: 8, right: 8, fontSize: 11, color: "white", background: "rgba(0,0,0,0.7)", padding: 6 }}>
    f={frame} ({Math.round(cursorX)}, {Math.round(cursorY)}) s={cursorScale.toFixed(2)}
  </div>
)}
```

Strip before final render.
