// BRollLayer - a muted video layer with opacity, blend and trim controls.
//
// Uses <Video> from @remotion/media, the component Remotion recommends for new
// code: it is frame-accurate, and falls back to <OffthreadVideo> by itself
// when a file's container or codec is not supported.
//
// Trim is given in seconds of the source clip and converted with the
// composition's own fps, so changing fps does not break the trim.
//
// Optional component: copy into src/components/.

import { Video } from "@remotion/media";
import React from "react";
import { interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export interface BRollLayerProps {
  src: string; // path under public/, e.g. "b-rolls/speech-bubble.mp4"
  // Scene-local frame where the layer appears and the clip starts playing
  startFrame?: number;
  // Total opacity ceiling
  opacity?: number;
  // Mix-blend-mode for the layer (default: normal)
  blend?: React.CSSProperties["mixBlendMode"];
  // The part of the source clip to play, in seconds. Pick the most expressive segment.
  clipStart?: number;
  clipEnd?: number; // omit to play to the end of the file
  // Fade-in/out (frames)
  fadeIn?: number;
  fadeOut?: number;
  // Scene-local frame where the layer has fully faded out. Omit to stay visible.
  windowEnd?: number;
}

export const BRollLayer: React.FC<BRollLayerProps> = ({
  src,
  startFrame = 0,
  opacity = 1,
  blend,
  clipStart = 0,
  clipEnd,
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

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: opacity * fadeInP * fadeOutP,
        mixBlendMode: blend,
        pointerEvents: "none",
      }}
    >
      <Video
        src={staticFile(src)}
        from={startFrame}
        // trimBefore skips into the source; durationInFrames counts source frames from there.
        trimBefore={Math.round(clipStart * fps)}
        durationInFrames={
          clipEnd === undefined ? undefined : Math.round((clipEnd - clipStart) * fps)
        }
        muted
        // <Video> draws to a canvas, where the CSS object-fit property has no effect.
        objectFit="cover"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};
