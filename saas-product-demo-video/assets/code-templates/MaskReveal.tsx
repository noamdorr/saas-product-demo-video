// MaskReveal - clip-path directional reveals.
//
// Gotcha: do NOT apply transform: scale(...) to children.
// Scale transforms the clip-path's coordinate space and produces visible seams.
// If you need a scale effect, wrap MaskReveal in the scaling element, not inside it.

import { interpolate, useCurrentFrame } from "remotion";
import { easings } from "../../anim/easings";

export type MaskDirection = "left-to-right" | "right-to-left" | "top-to-bottom" | "bottom-to-top";

export interface MaskRevealProps {
  startFrame: number;
  duration?: number;
  direction?: MaskDirection;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const MaskReveal: React.FC<MaskRevealProps> = ({
  startFrame,
  duration = 14,
  direction = "left-to-right",
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - startFrame, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easings.maskReveal,
  });

  let clipPath: string;
  switch (direction) {
    case "left-to-right":
      clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;
      break;
    case "right-to-left":
      clipPath = `inset(0 0 0 ${(1 - p) * 100}%)`;
      break;
    case "top-to-bottom":
      clipPath = `inset(0 0 ${(1 - p) * 100}% 0)`;
      break;
    case "bottom-to-top":
      clipPath = `inset(${(1 - p) * 100}% 0 0 0)`;
      break;
  }

  return (
    <div
      style={{
        clipPath,
        WebkitClipPath: clipPath,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Radial iris reveal - useful for scene-to-scene transitions to a finale color
export const IrisReveal: React.FC<{
  startFrame: number;
  duration?: number;
  centerX?: string; // CSS % e.g. "50%"
  centerY?: string;
  viewportWidth: number;
  viewportHeight: number;
  children: React.ReactNode;
}> = ({
  startFrame,
  duration = 24,
  centerX = "50%",
  centerY = "50%",
  viewportWidth,
  viewportHeight,
  children,
}) => {
  const frame = useCurrentFrame();
  const maxRadius = Math.hypot(viewportWidth, viewportHeight) / 2 + 100;
  const radius = interpolate(frame - startFrame, [0, duration], [0, maxRadius], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easings.violentPush,
  });

  const clipPath = `circle(${radius}px at ${centerX} ${centerY})`;

  return (
    <div
      style={{
        clipPath,
        WebkitClipPath: clipPath,
        width: "100%",
        height: "100%",
      }}
    >
      {children}
    </div>
  );
};
