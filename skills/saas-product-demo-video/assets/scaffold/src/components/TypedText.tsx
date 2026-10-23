// TypedText - word-staggered type-on. Each word takes `perWord` frames to
// appear, and the next word starts `perWord * overlap` frames after it. With
// the defaults (10 and 0.6) a new word starts every 6 frames, so neighbors
// overlap by 40%, which reads as one flowing line instead of a typewriter.

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
  /** Extra style for single words, for example to color the accent word of a headline. */
  wordStyle?: (word: string, index: number) => React.CSSProperties | undefined;
  /**
   * Start frame for each word, overriding the even stagger. Use it to put one
   * word on a beat: wordStarts[3] = the beat's frame. Words without an entry
   * keep their staggered start.
   */
  wordStarts?: (number | undefined)[];
}

export const TypedText: React.FC<TypedTextProps> = ({
  text,
  startFrame,
  perWord = 10,
  overlap = 0.6,
  className,
  style,
  riseDistance = 12,
  wordStyle,
  wordStarts,
}) => {
  const frame = useCurrentFrame();
  // "\n" in the text is a line break you chose. Without one, the line wraps
  // by container width, which moves when the font or the size changes.
  const lines = text.split("\n").map((line) => line.split(" ").filter(Boolean));
  const stepBetweenWords = perWord * overlap;

  let index = 0;
  return (
    <span className={className} style={style}>
      {lines.map((words, lineIndex) => (
        <span key={lineIndex} style={{ display: lines.length > 1 ? "block" : "inline" }}>
          {words.map((w, wordInLine) => {
            const i = index++;
            const start = wordStarts?.[i] ?? startFrame + i * stepBetweenWords;
            const p = interpolate(frame - start, [0, perWord], [0, 1], {
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
                  // No margin after a line's last word, or a centered line sits off-center by half a space.
                  marginRight: wordInLine === words.length - 1 ? 0 : "0.25em",
                  ...wordStyle?.(w, i),
                  whiteSpace: "pre",
                }}
              >
                {w}
              </span>
            );
          })}
        </span>
      ))}
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
