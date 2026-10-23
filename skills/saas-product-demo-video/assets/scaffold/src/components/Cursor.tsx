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
// Keypoints need at least two entries with strictly increasing frame numbers,
// because Remotion's interpolate() rejects anything else. To hold a position,
// repeat it one frame later.
// See references/cursor-math.md for the full math.
// See references/click-positioning.md for how to derive the (x, y) targets.

import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { easings } from "../easings";
import { colors } from "../theme";

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
  fill = colors.accent,
  stroke = colors.surface,
  hidden = false,
}) => {
  const frame = useCurrentFrame();
  if (hidden || keypoints.length === 0) return null;

  const frames = keypoints.map((k) => k.frame);
  const xs = keypoints.map((k) => k.x);
  const ys = keypoints.map((k) => k.y);
  const scales = keypoints.map((k) => k.scale ?? 1);

  // interpolate() would throw on this input anyway; this says which keypoints are wrong.
  for (let i = 1; i < frames.length; i++) {
    if (frames[i] <= frames[i - 1]) {
      throw new Error(
        `[Cursor] keypoint frames must be strictly increasing, got ${frames[i - 1]} then ${frames[i]}.`,
      );
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
        // Paper-cutout drop shadow: a soft dark one plus a brand-tinted offset
        filter: `drop-shadow(0 3px 0 rgba(0,0,0,0.18)) drop-shadow(2px 2px 0 ${colors.shadowTint})`,
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
}> = ({ clickFrame, x, y, color = colors.accent, duration = 12 }) => {
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

export interface CursorClick {
  /** Frame of the click, taken from the beat grid in timing.ts. */
  frame: number;
  /** Where the tip should be. Aim at an empty part of the target, not its label. */
  x: number;
  y: number;
}

/**
 * Keypoints for a cursor that visits each click in turn, so they are not
 * written by hand. The cursor waits where it is, travels to the next target,
 * settles a few frames before the click, dips in scale on the click, and
 * recovers. Pass the result to <Cursor keypoints={...} />.
 *
 * - `travel`: frames a move takes (default 14).
 * - `settle`: frames the tip rests on the target before the click (default 3).
 * - `exit`: where to glide after the last click, if anywhere.
 */
export const clickPath = (
  start: { frame: number; x: number; y: number },
  clicks: CursorClick[],
  options: { travel?: number; settle?: number; exit?: { x: number; y: number } } = {},
): CursorKeypoint[] => {
  const { travel = 14, settle = 3, exit } = options;
  const points: CursorKeypoint[] = [{ ...start }];
  const last = () => points[points.length - 1];
  // Frames must strictly increase, so every new point lands after the previous one.
  const add = (frame: number, x: number, y: number, scale?: number) =>
    points.push({ frame: Math.max(frame, last().frame + 1), x, y, scale });

  for (const click of [...clicks].sort((a, b) => a.frame - b.frame)) {
    const from = last();
    add(click.frame - settle - travel, from.x, from.y); // wait in place until it is time to move
    add(click.frame - settle, click.x, click.y); // arrive and settle
    add(click.frame, click.x, click.y, 0.9); // press
    add(click.frame + 5, click.x, click.y); // release
  }
  if (exit) {
    add(last().frame + travel, exit.x, exit.y);
  }
  if (points.length < 2) {
    add(start.frame + 1, start.x, start.y);
  }
  return points;
};
