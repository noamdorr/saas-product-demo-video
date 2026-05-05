// IceCrack - frost overlay that fractures and shatters away to reveal children.
//
// Renders 3 layers:
//   1. Frost overlay (white-ish translucent, animated noise via SVG filter)
//   2. Crack lines (SVG paths, drawn-on between [crackStart, crackEnd])
//   3. Shatter mask (clip-path falling away into shards between [shatterStart, shatterEnd])

import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { easings } from "../easings";
import { colors } from "../../theme";

export interface IceCrackProps {
  // Frame at which frost reaches full opacity (fades in from frame 0)
  frostUntil: number;
  // Frames where cracks draw on
  crackStart: number;
  crackEnd: number;
  // Frames where the frost shatters / melts
  shatterStart: number;
  shatterEnd: number;
  // Children render below the frost - revealed at shatter
  children: React.ReactNode;
}

export const IceCrack: React.FC<IceCrackProps> = ({
  frostUntil,
  crackStart,
  crackEnd,
  shatterStart,
  shatterEnd,
  children,
}) => {
  const frame = useCurrentFrame();

  // Crack draw-on (stroke-dashoffset interp)
  const crackP = interpolate(frame, [crackStart, crackEnd], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easings.violentPush,
  });

  // Frost fade-in: 0 → 1 over [0, frostUntil]
  const frostFadeIn = interpolate(frame, [0, frostUntil], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easings.standard,
  });

  // Final frost opacity = fade-in × shatter-decay
  const frostOpacity = frostFadeIn * interpolate(frame, [shatterStart, shatterEnd], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easings.violentPush,
  });

  // Vertical drop offset for the "melt drip" feel
  const dropY = interpolate(frame, [shatterStart, shatterEnd], [0, 80], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easings.slowInLand,
  });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* Reveal layer - child content underneath */}
      <div style={{ position: "absolute", inset: 0 }}>{children}</div>

      {/* Frost overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: colors.frost,
          opacity: frostOpacity,
          transform: `translateY(${dropY}px)`,
          filter: "blur(0.5px)",
        }}
      />

      {/* Crack SVG */}
      <svg
        viewBox="0 0 1920 1080"
        style={{
          position: "absolute",
          inset: 0,
          opacity: frostOpacity,
        }}
      >
        {/* Three radiating crack paths from center. Tweak as needed. */}
        <path
          d="M 960 540 L 200 100"
          stroke={colors.coral}
          strokeWidth="3"
          fill="none"
          strokeDasharray="1200"
          strokeDashoffset={crackP * 1200}
          strokeLinecap="round"
        />
        <path
          d="M 960 540 L 1820 200"
          stroke={colors.coral}
          strokeWidth="3"
          fill="none"
          strokeDasharray="1200"
          strokeDashoffset={crackP * 1200}
          strokeLinecap="round"
        />
        <path
          d="M 960 540 L 1100 1000"
          stroke={colors.coral}
          strokeWidth="3"
          fill="none"
          strokeDasharray="700"
          strokeDashoffset={crackP * 700}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
