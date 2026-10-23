// Counter - number ramp with optional overshoot.
//
// Optional component: copy into src/components/.

import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { easings } from "../easings";

export interface CounterProps {
  startFrame: number;
  duration: number; // frames
  from: number;
  to: number;
  // If true, ramps with elastic overshoot (peaks at to*overshootMag then settles to `to`)
  overshoot?: boolean;
  overshootMag?: number; // fraction beyond `to`, default 0.04
  // The ramp's curve when there is no overshoot (default slowInLand). Pass the
  // curve of whatever the number describes (a bar filling, a calendar running)
  // so the two stay in step; a number on its own curve beside a moving thing
  // reads as two events.
  easing?: (t: number) => number;
  format?: (n: number) => string; // e.g. (n) => n.toLocaleString()
  className?: string;
  style?: React.CSSProperties;
}

export const Counter: React.FC<CounterProps> = ({
  startFrame,
  duration,
  from,
  to,
  overshoot = false,
  overshootMag = 0.04,
  easing = easings.slowInLand,
  format = (n) => Math.round(n).toLocaleString(),
  className,
  style,
}) => {
  const frame = useCurrentFrame();
  const t = (frame - startFrame) / duration; // 0 → 1

  let value: number;
  if (overshoot) {
    // Two-phase: 0..0.85 ramp to to*(1+overshootMag), 0.85..1 settle to to.
    if (t <= 0.85) {
      const local = interpolate(t, [0, 0.85], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: easings.slowInLand,
      });
      value = from + (to * (1 + overshootMag) - from) * local;
    } else {
      const local = interpolate(t, [0.85, 1], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: easings.soft,
      });
      value = to * (1 + overshootMag) + (to - to * (1 + overshootMag)) * local;
    }
  } else {
    const local = interpolate(t, [0, 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing,
    });
    value = from + (to - from) * local;
  }

  return (
    <span className={className} style={style}>
      {format(value)}
    </span>
  );
};
