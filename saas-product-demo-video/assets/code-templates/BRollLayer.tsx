// BRollLayer - wraps <OffthreadVideo> with opacity/blend/trim controls.
// Use OffthreadVideo (not Video) for renders - it doesn't drop frames at high concurrency.
//
// Trim: the source clip plays from `startFrom` seconds to `endAt` seconds (translated
// to frames at the composition's actual fps via useVideoConfig).

import React from "react";
import {
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface BRollLayerProps {
  src: string; // relative path under /public, e.g. "b-rolls/speech-bubble.mp4"
  // Frame where b-roll becomes visible inside the scene's local frame range
  startFrame?: number;
  // Total opacity ceiling
  opacity?: number;
  // Mix-blend-mode for the layer (default: normal)
  blend?: React.CSSProperties["mixBlendMode"];
  // Source-clip trim (seconds) - pick the most expressive segment
  startFrom?: number;
  endAt?: number;
  // Optional fade-in/out (frames)
  fadeIn?: number;
  fadeOut?: number;
  // Visible window (frames, relative to scene). If omitted, visible the whole scene.
  windowEnd?: number;
}

export const BRollLayer: React.FC<BRollLayerProps> = ({
  src,
  startFrame = 0,
  opacity = 1,
  blend,
  startFrom = 0,
  endAt,
  fadeIn = 6,
  fadeOut = 6,
  windowEnd,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeInP = interpolate(frame, [startFrame, startFrame + fadeIn], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOutP = windowEnd
    ? interpolate(frame, [windowEnd - fadeOut, windowEnd], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;
  const visibleOpacity = opacity * fadeInP * fadeOutP;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: visibleOpacity,
        mixBlendMode: blend,
        pointerEvents: "none",
      }}
    >
      <OffthreadVideo
        src={staticFile(src)}
        startFrom={startFrom * fps}
        endAt={endAt ? endAt * fps : undefined}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
};
