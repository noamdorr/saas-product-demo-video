// Cursor - paper-cutout style with tip-anchored scale-ratio transform.
//
// Defaults to svgWidth=72 (oversized) - absorbed from common reference videos
// that use "oversized cursor choreography" as a directorial signature. Smaller
// cursors don't read on social-platform plays. Override `svgWidth` if you want
// the default OS pointer scale.
//
// Tip is at SVG (4, 3) in a 24x24 viewBox. The scale-ratio transform keeps the
// tip locked at (cursorX, cursorY) regardless of the current scale.
//
// Keypoints must have strictly increasing frame numbers (Remotion invariant).
// See references/cursor-math.md for the full math.
// See references/click-positioning.md for how to derive the (x, y) targets.

import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { easings } from "../easings";
import { colors } from "../../theme";

export interface CursorKeypoint {
  frame: number;
  x: number;
  y: number;
  scale?: number;
}

export interface CursorProps {
  keypoints: CursorKeypoint[];
  svgWidth?: number;
  fill?: string;
  stroke?: string;
  hidden?: boolean;
}

export const Cursor: React.FC<CursorProps> = ({
  keypoints,
  svgWidth = 72, // oversized - absorbed from references' "cursor choreography" signature
  fill = colors.coral,
  stroke = colors.cream,
  hidden = false,
}) => {
  const frame = useCurrentFrame();
  if (hidden || keypoints.length === 0) return null;

  const frames = keypoints.map((k) => k.frame);
  const xs = keypoints.map((k) => k.x);
  const ys = keypoints.map((k) => k.y);
  const scales = keypoints.map((k) => k.scale ?? 1);

  if ((globalThis as any).process?.env?.NODE_ENV !== "production") {
    for (let i = 1; i < frames.length; i++) {
      if (frames[i] <= frames[i - 1]) {
        // eslint-disable-next-line no-console
        console.warn(
          `[Cursor] keypoint frames must be strictly increasing. Got ${frames[i - 1]} → ${frames[i]}`,
        );
      }
    }
  }

  const cursorX = interpolate(frame, frames, xs, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easings.whip,
  });
  const cursorY = interpolate(frame, frames, ys, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easings.whip,
  });
  const cursorScale = interpolate(frame, frames, scales, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const VIEWBOX_W = 24;
  const tipOffsetX = 4 * (svgWidth / VIEWBOX_W);
  const tipOffsetY = 3 * (svgWidth / VIEWBOX_W);
  const left = cursorX - tipOffsetX * cursorScale;
  const top = cursorY - tipOffsetY * cursorScale;

  return (
    <svg
      width={svgWidth}
      height={svgWidth}
      viewBox="0 0 24 24"
      style={{
        position: "absolute",
        left,
        top,
        transform: `scale(${cursorScale}) rotate(-4deg)`,
        transformOrigin: "0% 0%",
        pointerEvents: "none",
        // Paper-cutout drop shadow - softer + slight color shift
        filter: "drop-shadow(0 3px 0 rgba(0,0,0,0.18)) drop-shadow(2px 2px 0 rgba(255,176,156,0.7))",
      }}
    >
      <path
        d="M4,3 L4,17 L9,13 L12,19 L14,18 L11,12 L17,12 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const ClickRipple: React.FC<{
  clickFrame: number;
  x: number;
  y: number;
  color?: string;
  duration?: number;
}> = ({ clickFrame, x, y, color = colors.coral, duration = 18 }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [clickFrame, clickFrame + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (progress <= 0 || progress >= 1) return null;
  const radius = progress * 80;
  const opacity = 1 - progress;
  return (
    <svg
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <circle cx={x} cy={y} r={radius} fill="none" stroke={color} strokeWidth={3} opacity={opacity} />
    </svg>
  );
};
