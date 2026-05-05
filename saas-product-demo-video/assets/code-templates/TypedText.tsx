// TypedText - word-staggered type-on with 60% overlap (overlap = 1 - perWord*overlap step).
// Words overlap so type-on feels cinematic, not robotic.

import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { easings } from "../easings";

export interface TypedTextProps {
  text: string;
  startFrame: number;
  perWord?: number;
  overlap?: number;
  className?: string;
  style?: React.CSSProperties;
  riseDistance?: number;
}

export const TypedText: React.FC<TypedTextProps> = ({
  text,
  startFrame,
  perWord = 10,
  overlap = 0.6,
  className,
  style,
  riseDistance = 12,
}) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  const stepBetweenWords = perWord * overlap;

  return (
    <span className={className} style={style}>
      {words.map((w, i) => {
        const local = frame - startFrame - i * stepBetweenWords;
        const p = interpolate(local, [0, perWord], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: easings.maskReveal,
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p,
              transform: `translateY(${(1 - p) * riseDistance}px)`,
              marginRight: "0.25em",
              whiteSpace: "pre",
            }}
          >
            {w}
          </span>
        );
      })}
    </span>
  );
};

// Character-by-character variant - for code/commands.
// Supports `pauseAt` for variable-speed AI-thinking effect:
// pauses are { atChar: <0-indexed char position>, frames: <how many frames to hold> }
// Each pause is inserted BEFORE the given character - the timeline before that
// position runs at perChar; after the pause, perChar resumes.
export interface TypedCharsProps {
  text: string;
  startFrame: number;
  perChar?: number;
  className?: string;
  style?: React.CSSProperties;
  cursor?: boolean;
  pauseAt?: Array<{ atChar: number; frames: number }>;
}

export const TypedChars: React.FC<TypedCharsProps> = ({
  text,
  startFrame,
  perChar = 2,
  className,
  style,
  cursor = false,
  pauseAt = [],
}) => {
  const frame = useCurrentFrame();
  const elapsed = frame - startFrame;

  // Walk forward, accounting for accumulated pauses, to find chars-shown.
  let charsShown = 0;
  let consumed = 0; // frames consumed so far
  // Sort pauses by atChar ascending
  const pauses = [...pauseAt].sort((a, b) => a.atChar - b.atChar);
  let pauseIdx = 0;
  for (let i = 0; i < text.length; i++) {
    // Apply any pauses scheduled BEFORE this char
    while (pauseIdx < pauses.length && pauses[pauseIdx].atChar === i) {
      consumed += pauses[pauseIdx].frames;
      pauseIdx++;
    }
    if (elapsed < consumed + perChar) {
      // Still typing - interpolate within current char window
      charsShown = i;
      break;
    }
    consumed += perChar;
    charsShown = i + 1;
  }

  const cursorVisible = cursor && Math.floor(elapsed / 15) % 2 === 0;
  return (
    <span className={className} style={style}>
      {text.slice(0, charsShown)}
      {cursorVisible && (
        <span style={{ display: "inline-block", width: "0.4em" }}>|</span>
      )}
    </span>
  );
};
