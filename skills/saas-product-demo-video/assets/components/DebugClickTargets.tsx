// DebugClickTargets - red boxes over the things a cursor is supposed to click.
//
// It shows only when the render is given the input prop `debugClicks`, so it
// works in stills (where the self-check happens) and cannot reach a normal
// render:
//
//   PROPS='{"debugClicks":true}' <skill>/scripts/render-stills.sh Scene-03 120
//
// Mount it in a scene with the same boxes the layout math produces, then look
// at the click frame: the cursor tip should be inside its box.

import { getInputProps } from "remotion";

export interface ClickTarget {
  name: string;
  /** Top-left corner and size of the clickable element, in scene pixels. */
  left: number;
  top: number;
  width: number;
  height: number;
}

export const DebugClickTargets: React.FC<{ targets: ClickTarget[] }> = ({ targets }) => {
  if (!getInputProps().debugClicks) return null;
  return (
    <>
      {targets.map((t) => (
        <div
          key={t.name}
          style={{
            position: "absolute",
            left: t.left,
            top: t.top,
            width: t.width,
            height: t.height,
            border: "2px solid red",
            pointerEvents: "none",
            boxSizing: "border-box",
          }}
        >
          <span style={{ position: "absolute", left: 4, top: -22, color: "red", font: "14px sans-serif" }}>
            {t.name}
          </span>
        </div>
      ))}
    </>
  );
};
