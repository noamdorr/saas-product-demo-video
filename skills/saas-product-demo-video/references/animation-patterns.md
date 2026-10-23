# Animation patterns

The primitive patterns that account for most of what scenes need, plus the situational techniques that come up once you start polishing. Each has been proven in production and has a known-good code shape. Don't invent new primitives mid-build - compose these.

The core primitives ship as files in the scaffold (`src/components/`), and the optional ones in `assets/components/`. This page explains how to use and tune them; read the file for the code, because a second copy here would drift from it.

## TypedText - word-staggered type-on

`src/components/TypedText.tsx`. The secret to cinematic kinetic typography: **words overlap by ~40%**. A strict one-after-another type-on feels robotic. Each word starts when the previous one is 60% done (the `overlap` prop, default 0.6), fading in and rising `riseDistance` px.

```tsx
<TypedText text="47 companies in your ICP..." startFrame={6} perWord={8} />
```

Tuning: `perWord=10` with 40% overlap gives a brisk, confident read. `perWord=14` with the same overlap feels more editorial. Below 8, the overlap makes words collide visibly.

The same file exports `TypedChars`, a character-by-character variant for code and commands, with `pauseAt` for an "AI is thinking" hesitation.

## MaskReveal - clip-path directional reveals

`src/components/MaskReveal.tsx`, with `direction` one of `left-to-right`, `right-to-left`, `top-to-bottom`, `bottom-to-top`. The core of it, for a left-to-right wipe:

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

For radial (iris), the same file exports `IrisReveal` - see iris wipe pattern below.

**Gotcha**: don't apply `transform: scale(...)` to a MaskReveal child. The scale transforms the clip-path's coordinate space and produces visible seams. Scale the parent, or lift the scale out into a wrapper.

## PopIn - spring-style scale + fade

`src/components/PopIn.tsx`. For cards, chips, and UI elements snapping into place: a spring drives both scale and opacity from 0 to 1, starting at `startFrame`.

```tsx
<PopIn startFrame={landFrame} config={{ damping: 14, stiffness: 140 }}>
  <Card />
</PopIn>
```

Default config (damping 12, stiffness 180) gives a confident tap-in. For a softer settle: damping 14, stiffness 140. For a punchier snap: damping 10, stiffness 220.

The same file exports `SlidePopIn`, which adds a slide from `fromX` / `fromY`.

## Kinetic card entrance - the combo

Most "card landing on a snare" beats use three primitives stacked:

```tsx
<Sequence from={landFrame} durationInFrames={48}>
  <PopIn startFrame={0}>
    <MaskReveal startFrame={2} direction="top-to-bottom" duration={10}>
      <Card>
        <TypedText text="47 companies in your ICP..." startFrame={6} perWord={8} />
      </Card>
    </MaskReveal>
  </PopIn>
</Sequence>
```

Staggered starts (0, 2, 6 frames): the PopIn lands, the MaskReveal fills in 2 frames later, the text starts typing 4 frames after that. Reads as one smooth beat, not three separate events.

## ZoomPunch - subtle hero scale accent

`src/components/ZoomPunch.tsx`. Between two zoom states without a cut: scale goes 1 → `peakScale` → 1 across the frames `start`, `peak`, `end`.

```tsx
<ZoomPunch start={CLICK} peak={CLICK + 3} end={CLICK + 6} peakScale={1.05}>
  <Button />
</ZoomPunch>
```

Peak scale 1.04 is conservative; 1.08 is aggressive. 1.06 is the Goldilocks default. Timing sweet spot: 20% of scene spent entering, 20% holding the peak, 20% settling - the remaining 40% on either end stay at 1.0.

## FloatingElements - deterministic ambient motion

`assets/components/FloatingElements.tsx` (optional). Background pills, dots, floating cards. Must be deterministic (same frame always renders the same state) or the final MP4 will flicker.

```tsx
<FloatingElements count={12} seed={3} containerWidth={width} containerHeight={height} />
```

The key is `Math.sin` / `Math.cos` keyed on `frame`, not `Math.random()`. Never use `Math.random()` inside a component, because each frame renders on its own and gets a different value.

## Cursor - click-path with tip anchoring

`src/components/Cursor.tsx`. See `cursor-math.md` for the math. It takes keypoints and interpolates position and scale between them:

```tsx
<Cursor
  keypoints={[
    { frame: 0, x: 200, y: 100 },
    { frame: CLICK - 8, x: target.x, y: target.y },
    { frame: CLICK, x: target.x, y: target.y, scale: 0.9 },
    { frame: CLICK + 6, x: target.x, y: target.y },
  ]}
/>
<ClickRipple clickFrame={CLICK} x={target.x} y={target.y} />
```

The tip is at SVG coordinates `(4, 3)` in a 24×24 viewBox. The component subtracts that offset, scaled, so `(x, y)` is where the tip lands and it stays locked there when the cursor scales (e.g. on click feedback).

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

## Iris wipe to a solid color

Used to transition into the finale. A circle in the next scene's background color grows from a focal point until it covers the frame on the outgoing scene's last frame, and the cut then lands on a full field of that color.

With one `<Sequence>` per scene, the iris is an overlay at the end of the outgoing scene:

```tsx
const MAX_IRIS_RADIUS = Math.hypot(width, height) + 100; // from any focal point, covers the whole canvas
const radius = interpolate(frame, [irisStart, lastFrame], [0, MAX_IRIS_RADIUS], {
  easing: Easing.in(Easing.cubic), // accelerate, and finish on the last frame
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});

{/* last child of the outgoing scene */}
<AbsoluteFill
  style={{
    background: nextSceneBackground,
    clipPath: `circle(${radius}px at ${focus.x}px ${focus.y}px)`,
    WebkitClipPath: `circle(${radius}px at ${focus.x}px ${focus.y}px)`,
  }}
/>
```

Let the circle finish growing on the scene's last frame. An ease that completes early leaves several frames of bare color before the cut, which reads as a blank.

The `+100` padding on `MAX_IRIS_RADIUS` prevents a visible ring when the expansion finishes: the circle should always exceed the canvas diagonal. `IrisReveal` in `src/components/MaskReveal.tsx` is the other form of the move: it reveals its children through a growing circle, for when the next content is rendered inside the current scene.

## blendHex - smooth hex-to-hex color interpolation

Exported from `src/theme.ts`. For background color shifts between scenes without a cut:

```tsx
const bg = blendHex(colors.background, colors.surface, sceneProgress);
```

## Breathing pulse - retired

`BreathingPulse` (a ±1.5% sine on a held card) is still exported from `ZoomPunch.tsx` for a live indicator whose point is being live, and for nothing else. On held UI it reads as a template: the owner of one film asked for "more premium" and the second thing they picked was "stop the bobbing" (gotcha 51). A stopped camera and settled cards read as confidence; drift, if any, comes from the Stage camera, which moves the whole frame together.

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
    stroke={colors.accent}
    strokeWidth="6"
    fill="none"
    strokeLinecap="round"
    strokeDasharray={totalLength}
    strokeDashoffset={totalLength * (1 - drawProgress)}
  />
</svg>
```

The slight quadratic bezier curve on the path (Q and T commands) makes the underline feel hand-drawn rather than ruler-straight. `drawProgress` is 0→1 over 12-15 frames. Stagger with the word it's underlining so the marker arrives ~3 frames after the word finishes typing in.

A marker highlight or underline drawn across a phrase ships as `assets/components/Marker.tsx`; the scene passes its progress, so the scene decides which beat it starts on.

## Beat-locked entrance: hard cut, not fade-in

This is for the two or three moments a film is built around: the main reveal on the music's lift, the logo. The scaffold's `LandIn` (in `components/PopIn.tsx`) does it.

It is the exception. Everywhere else, start the entrance on its beat and let it ease in (`PopIn`, a type-on, a mask reveal). One film built with a hard landing on nearly every element measured 24 abrupt one-frame changes against 15 in the film it was replacing, and its owner's first note was that it felt jerky against the music. Exact placement on the beat did not help; the amount of popping was the problem.

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
4. Cursor keypoints move to the button (30-60 frames), with tip stopping on a backbeat.
5. On the click frame, render a scale-punch on the button (1→1.05→1) + a ripple circle expanding from click point.

Each event gets its own Sequence or time window. They chain via frames looked up from `timing.ts` (see `beat-sync.md`), not magic numbers in components.

## Scene transitions as enter and exit moves (Stage)

`assets/components/Stage.tsx` (optional; copy into `src/components/`). The master keeps one `<Sequence>` per scene and hard cuts on the backbeat; the move lives in the two scenes the cut joins. The outgoing scene plays its `exit` over its last 8 to 12 frames (a whip out, a push into the lens), the incoming one its `enter` over its first 8 to 24 frames (a whip in, a push arriving, a pull-back from a detail). Between them the boundary is still one frame on the beat, so the beat-sync stays exact and no overlap or transition component is needed. The same component carries the scene's camera: keyframes of scale and translate, each segment with its own easing.

Two easing words collide here, so once: an exit that **eases in** accelerates (slow start, full speed at its end); `slowInLand` in `easings.ts` does the opposite, starting fast and settling long. Exits ease in; pull-backs land on `slowInLand`.

**Carry momentum across the cut.** The first version eased both halves in and out, so every transition moved, stopped dead on the last frame before the cut, cut, started from a standstill and moved again; the owner's note on that film was "less jerkiness". The fix that held: the exit eases *in* (it is at full speed on the cut, its blur peaking there), the entrance eases *out* (it leaves the cut at speed and settles), and the cut hides inside the blur the way a whip-pan is cut on film. On the same 55 s film this took the unplanned abrupt frames from 14 to 8 and the worst one from 73 to 34 (`self-check.md`), and every whip cut started reading as soft.

**A push continues forward.** A push exit grows into the lens; the next scene should arrive from slightly small (0.9) and settle to 1, still moving forward. Arriving from 1.15 and settling to 1 reverses the zoom on the beat, a small bounce at every push cut. The exception is the match-cut zoom, which reverses on purpose: push into a row, cut to the same element huge (`pull-back`, or a camera key at 1.6 to 1.7 with the translate below), reveal the whole.

**Pair and vary the halves:** a push exit meets a push enter; a crop toward a clicked row meets a pull-back that opens on the matching element; a whip-left exit meets a whip-left enter. Six hard cuts, three pull-backs, two push-throughs and one whip read as a film; the same whip on every cut reads as a tic.

Numbers that held up:

| Move | Numbers |
|---|---|
| Whip exit | 30% of the width, 8 px blur on the last frame (the ceiling), 9 frames, ease-in |
| Whip enter | 16% of the width and 4 px blur on the cut frame, 10 frames, ease-out. Less than the exit on purpose: the frame the beat lands on still reads. 60% left the cut frame empty; 30% with 8 px left it a smear |
| Push exit | ends at 1.4 to 2.0 (`exit.from`) with 6 px blur, 9 to 12 frames, ease-in. A detailed full-frame UI (a dashboard) trips the abrupt-change check on every frame above about 1.8x; longer than 12 frames only spreads it over more frames |
| Push enter | from 0.9 (`enter.from`) to 1 with 3 px blur, 10 frames, ease-out |
| Pull-back | from 1.6 over 24 frames (the default for a pull-back), `slowInLand` |

**Holds drift at an even speed.** A two-key camera (1.0 at the cut, 1.05 at the end) eased with `slowInLand` does three quarters of its move in the first fifth of the scene and then sits still, which reads as static. Leave hold segments linear (the default for a key without `ease`) and put `ease: "slowInLand"` on the key a pull-back lands on. For a crop that runs into a push exit, put the crop's last key on the scene's last frame (`duration`) with `ease: "rampIn"`, so the crop is still gathering speed under the exit; a crop that ends where the exit starts stops dead first, because the exit itself starts from zero speed.

## Depth planes

`<Depth z>` (in `Stage.tsx`) puts its children on a plane the camera moves more (z > 1) or less (z < 1) than the stage: inside the Stage it applies a scale of `(1 + z(s - 1)) / s` about the Stage's origin and a translate of `(z - 1) t / s`, where s and t are the camera's scale and travel this frame. That is the whole of the parallax; no blur, no glow.

- **Headlines at 1.1.** Beside a card, a headline on z 1.1 drifts a little more during a push and leaves a little ahead of the frame on a whip. It reads as depth without any effect being visible as such.
- **Copy that must keep its margin at well under 1.** A camera that pushes about a far origin scales every position away from that origin: copy 150 px from the left edge with the origin at 62% of the width moves about 80 px toward the edge in a 1.08 push, more if the camera also glides or the copy sits on a nearer plane (one film's copy ended 40 px from the edge that way). On z 0.15 it barely moves.

## Text moves through one primitive

`assets/components/Title.tsx` (optional; copy next to `Stage.tsx`). Every headline and proof line in a film goes through it:

- **Scope: display text.** Headlines, side headlines, proof lines, the closing line. Text inside the product's UI (a question typing into a box, rows landing in a card) keeps `TypedText`, `TypedChars` and `MaskReveal`, because it should behave like the product.
- **Entrance: words rise behind a line mask** on a frame the scene picks (`enterAt`): a beat, the landing of a pull-back, the settle of a whip. Two frames between words, four between lines, sixteen frames per word. Text the cut lands on (the poster line, the first proof line, a counter) has no `enterAt` and is simply there.
- **Exit: read from the Stage.** A whip exit carries the words off ahead of the frame, the lead word first; a push exit dissolves them a word at a time; a hard cut leaves them in place. Nothing in the scene has to time it.

Why: headlines that fade in and sit for the whole shot drew the note "text motion is boring", and the fix that was asked for was "one vocabulary across the film, not a different trick per scene". A single move, repeated, reads as the film's language; a different reveal per scene reads as an effects reel. Which move it is should come from the look breakdown of the references (`reference-video-vibe.md`); `Title` implements one that suits a quiet, editorial look, and its exits work with any entrance. Headline and side-headline helpers should wrap the chosen primitive rather than animate on their own, so a scene cannot drift from it.

How it fits the cut-frame rule: the cut frame needs one composed element. When the card (or the bar, or the field) is there on the cut, the headline beside it may rise on a beat; when the headline is the only thing on screen, give it no `enterAt`.

Things to know when using it:

- It does not wrap: each line is its own mask. Break lines with `"\n"`.
- The mask clips top and bottom only (a clip-path with a huge horizontal inset), so a word carried off by a whip is not cut at its line's side.
- On a push exit of 1.6x and up, a headline near the frame's edge leaves the frame before the default dissolve finishes: set `dissolveLead` to 14 to 16 there.
- When a card sits on the side a whip exit travels toward, the words slide behind it. Give that headline `exit="none"`; it still leaves with the camera.

## Open tight on an element: translate, not only origin

A pull-back that starts at 1.7 with `transform-origin` on a tab in the corner of a dashboard shows the corner of the window, because the origin keeps the tab where it is on the canvas and the zoom grows around it. To open with the element at the frame's center, add a camera translate of `(center - element)` at the tight keyframe and ease it to 0 as the pull-back lands:

```tsx
camera={[
  { frame: 0, scale: 1.7, x: 960 - tab.x, y: 540 - tab.y },
  { frame: PULL, scale: 1, x: 0, y: 0, ease: "slowInLand" },
]}
origin={`${tab.x}px ${tab.y}px`}
```

The same trick makes a zoom on a panel smaller than the frame read as a zoomed card instead of a panel edge mid-frame.

And never switch `transform-origin` while the scale is not 1: the picture jumps by the origin's move times (scale minus 1), ten pixels at 1.02 across half a frame. Interpolate the origin from the opening target to the exit target across the hold, or switch it at scale 1.

## The cut frame is composed

`LandIn` and the poster frame are about the two or three hero moments; this is about every cut. The frame the beat lands on has to carry a picture: the card with its title and first row, the bar, the headline, a field already a third full of chips. Rows after the first take the beats; the first one is placed before frame 0 (`ROW_AT[0] = -12`) so it is simply there. Agents and first drafts put the first row on the first beat after the cut, and the film then lands six cuts in a row on empty white rectangles. A counter that starts at the cut reads "$0B" on the beat; start it one frame early with a fast-start easing so the cut reads a value (one frame gave $7B of $45B; six frames gave $33B, too far).

Three more ways the cut frame went empty, and the fixes:

- **A question typing into an empty bubble.** Start the typing before the cut (a negative start frame) so the cut lands on a few typed words; keep the answer on its beat.
- **A cursor parked on the empty background**, waiting two seconds under the card for its glide. Bring it in from the frame's edge on the beat its glide starts.
- **A whip entrance that starts too far out.** See the table above: 16% and 4 px on the cut frame.

A rain of elements (chips filling a field) starts before the cut too: give each element an arrival frame drawn from a skewed distribution (`-6 + pow(hash, 2.2) * window`) so a third are already there on frame 0 and the rest keep arriving.

## Product UI in perspective

Asked what would make a finished film "more premium", the owner picked the product UI as an object in space over every addition: the dashboard panel turned a few degrees (`perspective(2400px) rotateX(8deg) rotateY(-12deg)` about its center), the headline flat on its nearer plane in front of it. Flat on the cut (so a camera that opens tight on a laid-out target still finds it), swung in as the pull-back lands, turning a further 3 degrees through the hold, straightened across the push, so a push that ends in a match-cut lands flat and the match stays exact. The near side grows with the turn: give back about 3.5% of scale while turned, or the panel's corner runs to the frame's edge. Text stays sharp in the render; the abrupt-change check flagged nothing new. The finish pass later halved the angles to `rotateX(4deg) rotateY(-6deg)`: at 8 and -12 the first read of the product was "small skewed text". A perspective layer is rasterized at device scale, so lay it out larger and scale it down for any push (gotcha 60). One sheen of light, a narrow "/" band crossing the panel on its lift, reads as a real screen when it shows on the panel's own blue and ink and not on the window's white.

## Cards that grow with their rows

Grow a card only where the product grows it. One owner, asked, kept a chat card growing (a chat does get longer) and fixed an alerts list at its full size with rows landing inside it (an inbox does not resize; its edge moving on four beats in a row was one more thing popping on every beat). The same owner later fixed the chat window too ("the Claude UI should enter the screen with fixed size, not growing with the content"), and a wave ten versions on that built a well-made collapse-then-open window was reverted the same day. Once an owner has said a window is fixed, it is fixed in every later wave; never grow chrome mid-scene, zoom the camera. Draw the empty slots' row dividers from the cut so the fixed card reads as a list filling in, not a blank block; a full-size card on the cut also left a match-cut into it closer in brightness to the white frame before (the cut's abrupt-change value 123 to 95).

A card sized for all its rows is an empty white block until they land. Size it to the rows that have landed (`product-ui-from-site.md`, "Cards that grow"); it grows a row per beat and the cut lands on a one-row card. The same for a record card made of stacked sections (its title and first section on the cut, a section per beat) and a chat card (the bubble and the input while the question types, then the answer and each table row, the input riding the card's bottom). Ease each row's share of the height in over about ten frames with a slow-in landing, the same frames its row rises on.

Grow it about its center line when a headline beside it is centered on that line: put the card's top at `center - liveHeight * scale / 2` every frame. A card that grows only downward from a fixed top sits high and lopsided beside its headline for the first second. The content inside slides a few pixels as the card grows, which reads as a chat scrolling, not as a jump.

## A one-color headline

Emphasis in a headline comes from size, weight and the line break. Setting a phrase in the accent color ("3 that matter" in steel blue on a white line) reads as the color sibling of the single-word-emphasis tell (`writing-style.md`, "Emphasis in headlines") and was dropped by the reviewer. Keep `wordStyle` for a counter or a single word that is the whole point, and even then prefer weight.

## A camera through space, in code (a pinhole projection)

When a scene needs a camera that travels (along a timeline, over a floor), project it yourself rather than reaching for CSS 3D: one function, `screen = center + f * (world - camera) / (z - cameraZ)`, places every element, so lines, ticks, cards and labels cannot disagree. Scale a flat card by `f / dz` and draw it as a billboard. What a film that tried it learned:

- **Sort by depth for the z-index**, not by list order, or a far card draws over a near one.
- **Do not put objects on the camera's path.** Cards that hung toward the camera's axis were passed *through* and filled the frame. Stand them on the far side of the line, so the camera passes beside them.
- **Objects passing the lens pop.** Screen speed grows as 1/dz², so a white card goes from readable to gone in three frames, and the abrupt-change check flags it. Take objects out of the frame before dz drops under about 1.5 (sink them into the floor, clipped at their base line), and ease the camera down near each object it should be read on: to about half speed, never to a stop.
- **Do not fade a large white object over ink.** At half opacity it reads as a gray ghost with the next object showing through. Move it out instead.
- **A perspective floor of dots** gives the travel its speed, but above about 0.3 opacity it reads as a retro grid floor. Keep it a texture.
- **A new camera does not change the object.** White cards on a timeline, flown through in 3D, were still "the same object the owner rejected, now in 3D" to the reviewer. When a look is rejected, change what the things are made of, not only how the camera sees them.

## Time passing: a calendar that runs

The owner of one film picked this over every other treatment of a line like "the warning signs were there months earlier": a dark month grid; each event lands on its day with the calendar at rest and the camera leaned in (about 1.3x on the cell); between events the months run, a few months in a third of a second, braking onto the next month; the last day fills the theme's alert or accent color. It works because everyone reads a calendar instantly, and the runs give the beat its energy.

- Build the months from the real year, deterministically: `new Date(Date.UTC(year, m, 1)).getUTCDay()` for the first weekday and `new Date(Date.UTC(year, m + 1, 0)).getUTCDate()` for the length. A dated `Date.UTC` call is deterministic; an argless `new Date()` is not.
- Scroll the month stack with keyed positions: at rest on each event's row, a run between them eased to gather speed and brake (`bezier(0.55, 0, 0.25, 1)`). Blur the stack by its speed, only above a threshold and capped (`min(4, max(0, speed - 25) / 30)` px), or the runs turn to mush.
- Light the event's cell *on* the beat (finish the fill on the beat frame), then let its words rise.
- The days are the film's choice when the copy only says "N months earlier": log them as assumptions.
- Faint bars in some other cells (one in three) read as the noise the events sat in, at no cost in words.

## A calendar that rewinds

For a line like "the signals were there months earlier", running the calendar backwards reads better than forwards, because it is a reveal: here is the bad day, now look what was already there. It is clear only if the bad day comes first. What held:

- **Land on today first.** Open inside today's cell, in the alert color, with its label ("Sponsor reported it"), and pull back to the month before anything moves.
- **Move the stack the other way.** Earlier months come in from the top; the month names count down as they pass. Gather speed and brake, the same run curve as the forward calendar.
- **Put the headline on the rewind**, so the words explain the motion as it happens.
- **Pan the stack sideways with the run** so the cell in focus stays at the frame's center (today was a Thursday, the lien a Monday): `panX = 960 - cellCenterX(focus)`, interpolated across the run, and the camera origin stays at 960. Without it the landing cell sits at the frame's edge and the lean-in pushes it further out.
- **Compute the dates.** "192 days before 22 October 2026" is 13 April; derive it, do not eyeball it, and log it.
- **Brake late, not long.** A bezier with y1 0 and y2 1 cannot cruise and then stop firmly: `bezier(0.55, 0, 0.25, 1)` over a 53-frame run peaked at 0.4 of it and braked for a second, its last 20 frames still carrying 14% of the travel, so the stack crept through the month before the landing. Write the run as a speed profile and integrate it (sin² up for about 60%, flat for about 14%, cos² down over the last quarter, about 14 frames): the month before passes at speed and the landing month brakes in, still easing to zero speed. Keep the run's end frame, so the event cell lights on the same beat.
- **Blur along the travel only.** CSS `blur()` softens both axes, so the running stack goes soft sideways too. An inline SVG filter, `<filter id="shutter"><feGaussianBlur stdDeviation="0 N"/></filter>` with `filter: url(#shutter)` on the stack, blurs vertically like a shutter: day numbers streak and the column gaps stay sharp, and one axis takes about 8 px before the run turns to mush (two axes, about 4).

## A match cut on a color

A red dot on a map that opens to fill the frame, cut to the inside of a red calendar cell pulling back, joins two unrelated scenes in one move. The outgoing scene grows a circle of the alert color over its last 14 frames while the camera dives (`rampIn`), so the cut frame is solid color; the incoming one starts in a `pull-back` from inside the matching element (gotcha 37 for the scale). Keep the element's text out of the first frames (rise it in as the pull-back lands), or the cut lands on a huge clipped word.

## A match cut on an object

The same thing in two scenes, carried across the cut: the calendar's "Mechanic's lien" cell, pushed into the lens, cut to the map's "Mechanic's lien" chip pulling back onto its city; the dashboard's red legend dot, zoomed into, cut to the alert row's red dot pulling back to the card. It reads on a second viewing as one object travelling through the product, and it removes the frame of unrelated texture a pull-back from a city usually opens on (on one film the cut's abrupt-change run went from 72 to 81 over six frames to a single 20).

- **Compute it from the outgoing scene's last frame.** Export the element's screen position and size on that frame from the outgoing scene, derived from its own zoom, camera and exit (`LIEN_OUT = { x, y, size }`), never read off a still. The incoming pull-back starts at `s = size_out / size_in`. With `Stage` (one origin per scene), set the scene's `origin` on A, the matching point in the incoming layout, and add the camera translate that puts A on T, its spot on the outgoing frame, easing to 0 as the pull-back lands (the same trick as "Open tight on an element", above):

```tsx
camera={[
  { frame: 0, scale: 1, x: OUT.x - A.x, y: OUT.y - A.y },
  { frame: PULL, scale: 1, x: 0, y: 0, ease: "slowInLand" },
  // ...the scene's hold keys
]}
origin={`${A.x}px ${A.y}px`}
enter={{ kind: "pull-back", frames: PULL, from: OUT.size / SIZE_IN, blur: 3 }}
```

A Stage that gives the pull-back its own origin can use one point instead, `O = (s A - T) / (s - 1)`, so that `O + s (A - O) = T`; it then switches to the scene's origin when the pull-back lands (next-but-one bullet). Match the words (left edge and line center) when the object carries text, the dot when it is a dot.
- **Check it with an overlay.** Blend the two cut frames 50/50: the matched words or dot should print once, not twice.
- **The shapes may differ if the words match.** A 232 x 118 cell collapsing into a 34 px chip reads as the cell becoming the chip, inside the push's blur, as long as the words keep their size and place. Give the pull-back a little blur on the cut (`blur` on the Stage's pull-back, half the push exit's) so a soft frame does not cut to a sharp one.
- **Dim what surrounds it on the cut.** A pull-back from 3.6x on a dot map opens on a field of big bright dots; let them rise from about 12% opacity with the pull-back so the cut frame is ink and the one object, like the frame it leaves.
- **Camera at scale 1 until the pull-back lands** if your Stage switches from the pull-back's origin to the scene's there (a far match origin makes the switch jump by the origin's move times the camera's scale above 1, gotcha 22). With the translate recipe there is no switch, but the scene's hold then drifts about the matched element; move the hold's origin to where the scene needs it only while the scale is 1.
- **A pull-back from 3x is a big move.** From 3.3 over 20 frames it flagged three frames at 30 in the abrupt-change check; 28 frames gave five at 22 to 25. Expect to list it as a judged move.

## A big push: keys in log space

A camera push past about 2x is where linear scale interpolation shows: zoom is perceived logarithmically, and a 1x to 4.6x push with its scale interpolated linearly did most of the visible zoom in the first eight frames and crawled after. Generate one camera key per frame, with the scale interpolated in log space about the move's fixed point (the element the push is into), eased with `easings.even` (a sine in-out whose peak speed is 1.6x the average), and let the translate follow the fixed point so it stays put:

```ts
const logPush = (from: number, to: number, frames: number, fixed: { x: number; y: number }) =>
  Array.from({ length: frames + 1 }, (_, i) => {
    const t = easings.even(i / frames);
    const scale = Math.exp(Math.log(from) + (Math.log(to) - Math.log(from)) * t);
    // keep `fixed` on the same screen point as the scale grows
    return { frame: i, scale, x: (CX - fixed.x) * (scale - 1), y: (CY - fixed.y) * (scale - 1) };
  });
```

Cap how large a perspective layer is laid out (`RAS_MAX`, gotcha 60) and straighten any tilt over the push's first frames rather than its last. A push ends composed on something that matters (the card with the number the scene is about), never on cropped white; the track's biggest lift (`beats.json`'s `biggest_lift_beat`) deserves the biggest reveal.

## The thread: hand an object across by dissolving its container

A match cut carries an object between scenes (above). A thread carries it without a cut: the clicked sponsor's name stayed on its own pixels while the alerts card dissolved around it, turned white on ink, glided to the center and grew into the graph's chip, and the graph drew from there. The cut's abrupt-change value went from 151 to 22, and the viewer follows one thing through the product. The rule: the object keeps its words, size and place for the first frames; what changes first is everything around it; its own move starts once the container is gone. Export its position from the scene's own constants (`THREAD_OUT`), the way a match cut does.

## Scene endings

A scene that ends by diving into one of its rows to cut to the next was rejected ("should go away with some different animation"). What worked: a pull-back to about 0.55 with the window fading over the next scene's own entrance, and the next scene arriving with its own pull-back, so two camera moves hand off instead of one move reversing on the beat. A scene can also tail over the next one's opening (`TAILS` in the master, stacked above) while its cut stays on the beat. Keep a dive for the one moment the story dives (into a city, into a record), not as a way to leave a scene.

## Numbers

- A product's facts never count up from zero on the cut: a legend that read "Deals 0" on the cut frame was a bug, not a build. Static numbers on the cut; only the arcs draw.
- A story number (the headline figure, days elapsed, a count of flags) counts with a one-frame pre-roll so the cut frame already shows a value, and lands on its beat (`Counter`, `LandIn` only if it is one of the film's two or three hard landings).
- A counter sits where the eye already is. A date spinning at the top of the frame while the calendar runs in the middle made the eye bounce; the counter moved next to the number it describes. A legend counting 1,000 px from the ring it labels split attention the same way; it holds still while the ring sweeps.
- A counter's curve is the curve of the thing it describes (`Counter` takes `easing`): a number easing one way beside a bar filling another reads as two events.

## Entities as objects, in the film's own language

A graph of companies drawn as a hub with chip spokes read "too claude-ish"; generic building glyphs (a rectangle with dot windows) read "cheap, lazy and claude-ish"; one axonometric property per entity, drawn the way the film's opening drew its city (ink faces, hairline edges, windows that are the map's dots lighting a floor at a time, each at the end of a dashed edge, rising three frames after its chip) read "wonderful". Reuse the film's best object; invent nothing in a different vocabulary.

- One shape and one color for every leaf. A node drawn differently from its siblings needs a reason the viewer can see on screen ("why is Northgate Ridge not highlighted? If there was some logic, I don't see it, and neither will a person watching").
- A trace along an edge (a red head with a tapering tail) runs at even speed, not eased (eased, it dawdled under the chips), lights the edge, reaches the parent on the beat, then lights the siblings one by one two frames apart, each taking its outline as the trace arrives; all at once reads as a switch.
- Status marks on the ground plane: a risk ring radiates as an ellipse under a standing property (the walls hide its back) on the row's own frame; information rows pulse the neutral, risk rows the accent, and the accent is for risk only. If a fourth red appears, cut one.

## Tags in palette colors

A case line with "·" separators became three tags in three palette colors (risk red tint, information blue, neutral ink), rising three frames apart behind a line mask, and read at once. Numbers over their words stack. The tag colors are semantic, and the accent is reserved for risk, so a viewer learns the code in one scene.

## Client logos on the close

A single strip running at 90 px/s showed eleven of eighteen logos in its 3.3 s and the owner wanted all of them. Two counter-moving rows at 3 px per frame, 22 px apart, the second row six frames behind, showed all eighteen, with two more backbeats added to the close (the track was longer than the cut, so the fade moved). Not one logo per beat: "a mark on every beat reads busy". Every logo at or below 1x of its file, none visibly smaller than its neighbors (a 52 px mark in a 48 px strip was the last note), and the full list read from the site's component, not from one screenshot of a rotating strip (gotcha 59).

## A document that unfolds into the real page

A row that is "one click away" from its recorded document can open the page itself: a typeset notice in a paper face, written for the film and logged as sample data, slides out from under the bar on the click, a stamp lands on the next backbeat, the page scrolls under the bar, and marks sweep under the amount. Gray placeholder bars for the text "admit it is a mock"; real-looking sample text does not. A card shadow built for ink (0 24px 60px at 45%) hazes white paper; that scene gets a tight contact shadow of its own.

## The whole country, by acceleration

To say "everywhere" on a dot map: 321 real cities light their dots at an exponentially rising rate (eleven frames per e-fold, largest first), the first sixteen with rings and the flood without, the map's resting dots darkened a step so lit cities read, and a dozen named chips arriving faster and faster in size order, each placed on a free corner of its pin so no chip covers another or a word. The owner: "looks fantastic". The city list comes from a public top-cities table projected with the same fit as the map and thinned so no city sits within nine grid units of a larger one; the generator is a project tool, forty lines of Python, worth writing once per map.

## A dot map that carries the story

A dot-grid country (one SVG of circles, a dot per grid point inside the outline) gave one film its opening, its noise scene and its bookend. Keep one `UsMap`-style component that only places dots and lets each scene decide each dot's look through a callback (`dot(x, y) => { fill, r }`), so a wave, a dim around a focus city and a fade are all the scene's.

- **The wave**: dots lit once a vertical front has passed them, with a short white band at the front. Owners like it; it is a good reason to bring the map back.
- **Noise on the map**: put the scene's record chips on pins across the map (pins picked from a jittered grid, the nearest dot to each grid point, kept clear of the picks) and the three that matter on real cities from the product's own case studies. A scanline crossing west to east dims the rest.
- **A dive and a bookend**: the closing proof dives back to the opening's city (dim the rest of the country, keep the pin), tells the number in screen space beside it (gotcha 40), then pulls back while the wave re-lights the dots and the coverage lines rise.
- **The asset at the pin, standing up.** When the subject is a place (a property, a site, a store), draw it at the pin while the camera is in, and draw it standing, not from above. A street grid, a parcel line and building footprints seen top-down drew "not clear at all that this is a real estate object, just some schematics"; the same idea as a building drawn in elevation, or as an axonometric with its walls extruding from the parcel, read at once. Make its windows the map's own dots (same radius, lit a floor at a time from the bottom) so it is built from the map and not pasted on, keep it flat (hairline edges, no shaded faces), put the pin at its front door, fade the map's dots round it, and clear it before the pull-back. The owner picked the axonometric ("more 3D, built of dots"); sized for the dive (about 200 px wide at 2.3x), not to geographic scale.

