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

Have the schematic UI component export the math as exported constants. No measurement, just published positions.

```tsx
// SchematicProfileCard.tsx
export const SCHEMATIC_PROFILE_CARD_LAYOUT = {
  cardWidth: 1100,
  cardHeight: 534,
  headerHeight: 180,
  brandButton: { topInHeader: 24, rightInHeader: 24, width: 140, height: 42 },
};

// Helper to compute button center given composition size and card position
export function brandButtonCenter(comp: { width: number; height: number }) {
  const L = SCHEMATIC_PROFILE_CARD_LAYOUT;
  const cardLeft = (comp.width - L.cardWidth) / 2;
  const cardTop = (comp.height - L.cardHeight) / 2;
  return {
    x: cardLeft + L.cardWidth - L.brandButton.rightInHeader - L.brandButton.width / 2,
    y: cardTop + L.brandButton.topInHeader + L.brandButton.height / 2,
  };
}
```

Scene calls `brandButtonCenter({width: 1920, height: 1080})` once and uses the result for all keypoints. Refactor-safe: change `cardWidth` in one place, all click targets update.

### Approach 3 - Debug overlay (always available as a fallback)

Even with the above, the user will spot misalignment fastest visually. Provide a `<DebugClickTargets />` component that renders red rectangles + crosshairs over every clickable target while the `DEBUG_CLICKS` flag is set:

```tsx
// anim/primitives/DebugClickTargets.tsx
export const DebugClickTargets: React.FC<{
  targets: Array<{ name: string; x: number; y: number; w?: number; h?: number }>;
}> = ({ targets }) => {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <>
      {targets.map((t) => (
        <div key={t.name} style={{
          position: "absolute",
          left: t.x - (t.w ?? 100) / 2, top: t.y - (t.h ?? 60) / 2,
          width: t.w ?? 100, height: t.h ?? 60,
          border: "2px solid red", pointerEvents: "none",
        }}>
          <div style={{ position: "absolute", left: -1, top: -1, width: 2, height: 2, background: "red" }} />
        </div>
      ))}
    </>
  );
};
```

Toggle this on while authoring scenes; ship with it off (or removed entirely).

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
