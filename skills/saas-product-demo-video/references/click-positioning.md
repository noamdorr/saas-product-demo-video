# Click positioning - the #1 source of iteration churn

If your film has a cursor that clicks UI elements, this is the single most likely thing the user will flag. "The click missed the button" is the most common note across every production.

## Why it happens

Cursor keypoints are absolute pixel coordinates in the composition (e.g. `{ x: 1416, y: 318 }`). UI components are typically rendered with `<AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>` and inner padding/offsets. The click target's actual on-screen center is a function of:

1. Composition width/height (e.g. 1920x1080)
2. Card width (e.g. 1100)
3. Card vertical centering: `(compHeight - cardHeight) / 2`
4. Header height inside the card
5. Element offset within the header (`top: 24, right: 24`)
6. Element padding (`padding: 8px 18px`)
7. Inner content size (icon size + gap + text width)
8. Any wrapper transforms (SlidePopIn settle, BreathingPulse scale)

That's eight inputs to a manual mental calculation. The probability of being off by 30-60px in one direction is very high. And 30-60px is the difference between "lands on the button" and "clearly misses."

## Three approaches, in order of preference

### Approach 1 - Render-time targeting via refs (recommended)

Have the schematic UI component expose a ref to its clickable element, and have the cursor read the ref's bounding box at render time. This eliminates manual coordinate math entirely.

Sketch:

```tsx
// SchematicProfileCard.tsx
export interface SchematicProfileCardProps {
  // ...
  onBrandButtonRef?: (rect: { x: number; y: number; w: number; h: number }) => void;
}

export const SchematicProfileCard: React.FC<SchematicProfileCardProps> = ({ onBrandButtonRef, ... }) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (buttonRef.current && onBrandButtonRef) {
      const r = buttonRef.current.getBoundingClientRect();
      onBrandButtonRef({ x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height });
    }
  });
  return (
    <div>...
      <div ref={buttonRef} style={...}>YourBrand</div>
    </div>
  );
};

// Scene04Profile.tsx
const [target, setTarget] = useState<{ x: number; y: number } | null>(null);
return (
  <>
    <SchematicProfileCard onBrandButtonRef={(r) => setTarget(r)} />
    {target && <Cursor keypoints={[..., { frame: clickFrame, x: target.x, y: target.y }]} />}
  </>
);
```

Caveat: in Remotion's offthread renderer, `getBoundingClientRect` works during the first paint of each frame. For deterministic renders, prefer Approach 2 (computed) or Approach 3 (debug overlay) - but Approach 1 still works for Studio scrubbing and most renders.

### Approach 2 - Computed positions, exposed as constants

Have the schematic UI component export the math as constants. No measurement, just published positions.

`assets/components/SchematicProfileCard.tsx` does this: it exports `SCHEMATIC_PROFILE_CARD_LAYOUT` (header height, button offsets and padding) and a `brandButtonCenter(comp, cardWidth)` helper that returns the button's center for a card centered in the composition.

```tsx
const { width, height } = useVideoConfig();
const target = brandButtonCenter({ width, height });
// use target.x / target.y in every Cursor keypoint and in ClickRipple
```

Refactor-safe: change a layout constant in one place and all click targets update. Build the same pair (a layout object plus a center helper) into any card of your own that gets clicked.

### Approach 3 - Debug overlay (always available as a fallback)

Even with the above, misalignment is spotted fastest by eye. Copy `assets/components/DebugClickTargets.tsx` into `src/components/` and mount it in the scene with the same boxes your layout math produces:

```tsx
<DebugClickTargets targets={[{ name: "unlock", left: button.left, top: button.top, width: button.width, height: button.height }]} />
```

It draws only when the render is given the input prop `debugClicks`, so it shows up in the stills you check and cannot reach a normal render:

```bash
PROPS='{"debugClicks":true}' <skill>/scripts/render-stills.sh Scene-03 120
```

On the click frame the cursor tip should be inside its red box.

### Where inside the target to aim

Aim at an empty part of the target, not its center. The center of a button, a chip or a list row is where its words are, so a cursor that clicks there covers the label on the very frame the viewer is reading it. For a button, the end past the label works; for a row, a gap in its second line. Have the layout helper return a click point as well as the box.

## Pre-render checklist for click-bearing scenes

Before rendering, walk the scene:

1. List every `Cursor.keypoints` entry where `scale < 1` (the "press" frame).
2. For each one, write down what UI element it should land on.
3. Run the scene in Studio paused at the click frame. Visually confirm the cursor's tip is INSIDE the target.
4. If not, you have one of:
   - Wrong x or y - recompute using the layout constants.
   - Right x but wrong y (or vice versa) - partial mental-math error; double-check vertical centering.
   - The target itself moved (recent edit shifted layout) - re-compute from the layout constants.

A 30-second visual check at this gate saves a full re-render cycle.

## When the click doesn't matter

In some scenes the click is rhetorical, not functional - e.g. a cursor "clicks" on a card just to draw the eye, but the card doesn't actually have a button. In those cases, prefer to:

- Show the cursor hovering over the *visual center* of the card (less error-prone than a tiny button).
- Or skip the click entirely and use a `ClickRipple` on a generic point that reads as "interactive."

The user is far less likely to flag a click on a card center than a click that visibly misses a button.

## Past production note

In the Meltly demo, the click on the brand extension button required three attempts:

- v1: `(1380, 280)` - way off (above the button)
- v2: `(1421, 372)` - still off (below the button)
- v3: `(1416, 318)` - finally landed

The fix on attempt v3 came from re-deriving the math with all eight inputs explicit. The cost of the two earlier attempts was four full master renders. Using Approach 1 or 2 from the start would have avoided this entirely.
