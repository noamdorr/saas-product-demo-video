// ZoomPunch - subtle hero scale accent.
//
// Tuning:
//   peakScale 1.04 = conservative
//   peakScale 1.06 = default (Goldilocks)
//   peakScale 1.08 = aggressive
//
// In VERTICAL (9:16) layouts, account for the scale expanding in the cramped
// direction. Use transformOrigin "top center" or "center top" so growth is
// downward only and doesn't push below the visible area.

import { interpolate, useCurrentFrame } from "remotion";
import { easings } from "../../anim/easings";

export interface ZoomPunchProps {
  start: number;
  peak: number;
  end: number;
  peakScale?: number;
  children: React.ReactNode;
  transformOrigin?: string;
  style?: React.CSSProperties;
}

export const ZoomPunch: React.FC<ZoomPunchProps> = ({
  start,
  peak,
  end,
  peakScale = 1.06,
  children,
  transformOrigin = "center",
  style,
}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [start, peak, end], [1, peakScale, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easings.slowInLand,
  });

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// BreathingPulse - subtle ±1.5% sin-driven scale, gives held UI elements "life"
export const BreathingPulse: React.FC<{
  startFrame: number;
  amplitude?: number; // default 0.015 (±1.5%)
  frequency?: number; // rad/frame, default 0.046 (~4.5s cycle at 30fps)
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({
  startFrame,
  amplitude = 0.015,
  frequency = 0.046,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const phase = Math.max(0, frame - startFrame);
  const scale = 1 + Math.sin(phase * frequency) * amplitude;

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "center",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
