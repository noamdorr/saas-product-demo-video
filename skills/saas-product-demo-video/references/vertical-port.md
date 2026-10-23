# 9:16 vertical port

If the user wants both 16:9 horizontal and 9:16 vertical, build them as parallel compositions sharing an animation vocabulary but with independent layout math. Horizontal is the source of truth; vertical is the port.

## Why parallel, not responsive

Responsive (one composition that reflows based on aspect ratio) sounds elegant but ends up a mess:
- Kinetic typography that looks great in 1920×1080 looks cramped or ghostly at 1080×1920.
- Scenes that fit 3 cards in a row horizontally want 3 cards stacked vertically.
- Cursor paths differ meaningfully - a horizontal swipe becomes a vertical scroll.
- Signature moves (iris wipes, phrase lifts) need different focal points in each aspect.

Parallel compositions let each form do what it does best. The shared vocabulary is the easings, the theme tokens, and the scene timing in `timing.ts`.

## Directory structure

```
src/
├── Master.tsx               # horizontal master
├── timing.ts                # one scene list, shared by both masters
├── components/
│   ├── MasterVertical.tsx   # copied from assets/components/
│   └── ...                  # shared primitives (TypedText, MaskReveal, PopIn, Cursor)
└── scenes/
    ├── Hook.tsx             # horizontal scenes
    ├── ...
    └── vertical/            # parallel 9:16 ports
        ├── HookVertical.tsx
        └── ...
```

## Timing is shared

There is no second set of timing constants. Both masters read `SCENES`, `TOTAL_FRAMES` and `FPS` from `timing.ts`, because the beat grid does not depend on aspect ratio, and two copies of the scene list would drift apart the first time one of them is retimed.

Copy `assets/components/MasterVertical.tsx` into `src/components/`, replace its scene imports with the vertical ports, and register it in `Root.tsx`:

```tsx
import { MasterVertical } from "./components/MasterVertical";
import { canvasVertical } from "./theme";

<Composition id="MasterVertical" component={MasterVertical} durationInFrames={TOTAL_FRAMES}
  fps={FPS} width={canvasVertical.width} height={canvasVertical.height} />
```

Plus per-scene vertical debug compositions (`Scene-Hook-Vertical`, ...), registered with the same `canvasVertical` size.

## Horizontal-as-source-of-truth workflow

During initial build: write horizontal, lock horizontal, port to vertical. Never attempt to write both in parallel - divergence accumulates invisibly.

During iteration: the user may give notes on the vertical cut. Fix vertical first, then **check whether the fix applies to horizontal**. Most do. The port syncs routinely using git diff.

### Sync script

After horizontal receives a batch of fixes, port them to vertical:

```bash
# Get changes since last vertical sync:
git log --oneline <last-vertical-sync-commit>..HEAD -- src/scenes/

# Skip Revert-X pairs - they cancel out.
# For each remaining commit, check whether vertical equivalent needs the same fix.
```

Commit vertical syncs with message `sync: pull horizontal fixes for wave N`.

## Centered + offset coordinate system

In horizontal (16:9), layouts tend to be left-right with decorative vertical elements. Every scene uses its own origin.

In vertical (9:16), layouts are stacked vertically. Use a consistent center-based coord system:

```typescript
import { canvasVertical } from "../../theme";

const CENTER_X = canvasVertical.width / 2;  // 540
const CENTER_Y = canvasVertical.height / 2; // 960

// Card positions relative to center
const CARD_TOP_Y = CENTER_Y - 500;   // 460
const CARD_MID_Y = CENTER_Y;          // 960
const CARD_BOT_Y = CENTER_Y + 500;   // 1460
```

This makes it easy to eyeball which card is in the visually active zone (typically ±400px from center is "hero zone" on mobile; anything beyond that bleeds into thumb zones).

## Flex-center vs transform-origin

Horizontal scenes often use:

```tsx
<div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
  <ScaledElement style={{ transform: `scale(${s})` }} />
</div>
```

The flex-center plus scale works horizontally because a 4% scale on a 400px card expands 16px on each side - invisible drift.

In vertical (1080×1920), the same 4% on a 600px-tall card expands 24px vertically. Combined with flex-center, the card "grows downward" visibly because the flex parent can't constrain it - the scaled child still occupies its pre-scale layout space, but painted pixels extend beyond.

**Fix:** for vertical, use explicit positioning with `transform-origin: center top`:

```tsx
<div style={{
  position: "absolute",
  top: CARD_TOP_Y,
  left: CENTER_X,
  transform: `translate(-50%, 0) scale(${s})`,
  transformOrigin: "center top",
}}>
  <Card />
</div>
```

Now the card grows downward without displacing surrounding layout.

## CSS scale expansion math

For any ZoomPunch at `peakScale = 1.06`, plan for the 6% growth in the cramped direction:

- In horizontal (width 1920), a 400px card scales to 424px - 12px per side.
- In vertical (height 1920, widths tend to be smaller), a 200px-wide card scales to 212px.
- In vertical height-wise, a 600px card scales to 636px - 18px per side, 36px total.

If the card's bottom edge is already 100px from the viewport bottom, a 6% ZoomPunch will push it to 82px - fine. If the edge is 20px from the bottom, ZoomPunch will collide.

**Rule:** leave ≥`cardHeight * 0.05` padding around any element that will ZoomPunch.

## Cursor scale-ratio in vertical

The cursor scale-ratio transform (see `cursor-math.md`) works identically in vertical. Click targets re-derived from the vertical layout math:

```typescript
const CLICK_TARGET_X = CENTER_X;                       // horizontal center
const CLICK_TARGET_Y = CARD_MID_Y + CARD_H / 2 - 60;   // inside the card
```

The only cursor-specific vertical concern: cursor paths that swept horizontally in 16:9 should become vertical sweeps in 9:16. Don't just mirror positions - re-choreograph.

## Where platforms draw over the video

Every vertical feed lays its own interface over the video: the account name and caption along the bottom, a column of action buttons down the right edge, and often a header at the top. Anything important placed there is hidden for most viewers.

Sizes differ by platform and change over time, so treat these as a working rule for a 1080x1920 frame, not a spec:

- keep text, logos and click targets out of roughly the top 250 px,
- out of roughly the bottom 450 px (paid placements on some platforms ask for about a third of the height),
- and out of a strip about 130 px wide on the right.

Backgrounds and decorative motion can run through these zones. Before the final render, check the current safe-zone guidance of the platform the film is going to, and look at a still of each scene with those zones in mind (`self-check.md`).

## Scene-by-scene porting checklist

For each horizontal scene, port to vertical by:

1. **Compute vertical layout coordinates** from `canvasVertical` and the center-based system.
2. **Reflow content**: horizontal rows become vertical stacks. "Three cards in a row" becomes "three cards top-to-bottom with slight stagger".
3. **Adjust typography size**: vertical mobile viewers are closer to the screen, so text can be smaller (in px) but the visual balance changes. Typical shift: horizontal 56px display type → vertical 72px display type (visually the same).
4. **Re-choreograph motion**: horizontal sweeps → vertical scrolls. Cursor paths re-drawn.
5. **Verify beat-sync**: clicks land on the same beats as in the horizontal cut. If a click's click-target-X shifted due to layout, the click frame doesn't change - just the cursor path.
6. **Render at low CRF** to preview, then full render at 1080×1920 CRF 14.

## Finale scene - vertical composition

The finale (CTA + logo + tagline) is often the scene that diverges most. In horizontal, a wide single-line CTA works. In vertical:

- Logo stacks above the CTA (not beside).
- CTA button is full-width (minus ~80px gutters) instead of content-width.
- Tagline wraps to 2-3 lines instead of 1.
- Marker underline or accent sweep follows the new line-break geometry.

Budget 30+ minutes for the finale port - it's usually the longest.

## When NOT to port vertical

If the user says "I just need the horizontal for a homepage hero", don't build vertical. The parallel port doubles build and iteration time. Ask explicitly.

Sometimes the right answer is: build horizontal in v1, watch it perform, decide if vertical is worth it, then port after sign-off on horizontal.
