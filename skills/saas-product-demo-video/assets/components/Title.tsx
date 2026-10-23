// Title - one way of moving display text for a whole film.
//
// Optional component: copy into src/components/ next to Stage.tsx, which it
// reads through useStage() to time its exit. It also reads ../easings.
//
// Entrance: each line sits behind a mask the height of the line; its words
// rise into it from below, a few frames apart, with the maskReveal curve. It
// starts on a frame the scene picks (`enterAt`: a beat, the landing of a
// pull-back, the settle of a whip); without one the text is simply there on
// frame 0 (the poster, or a headline the cut lands on).
//
// Exit: read from the Stage the title sits in, so text leaves the way the
// camera leaves. A whip carries the words off ahead of the frame, the lead
// word first; a push dissolves them a word at a time as the camera passes
// them; a hard cut leaves them where they are.
//
// Why one primitive: text that fades in and sits for the whole shot is what
// an owner calls "boring", and a different trick per scene reads as a demo
// reel of effects. One move, used everywhere, reads as a film's language.
//
// Notes from the film it was built for:
// - Each line is its own mask, so the text does not wrap: break lines with
//   "\n" where you want them.
// - The mask clips top and bottom only (a clip-path with a huge horizontal
//   inset), so a word carried off by a whip is not cut at the line's side.
//   The padding and negative margin keep descenders inside the mask without
//   moving the layout.
// - A big push exit (1.6x and up) carries a headline near the frame's edge
//   out of the frame before the default dissolve finishes: raise
//   `dissolveLead` to 14 to 16 for those scenes.
// - When a card sits on the side a whip exit travels toward, the words slide
//   behind it: give that title `exit="none"` and let it leave with the camera.
//
// Emphasis is size, weight and the line break only: no italic word, no
// colored word, no gradient, no tracking animation.

import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { easings } from "../easings";
import { useStage } from "./Stage";

export interface TitleProps {
  /** "\n" is a line break you chose. */
  text: string;
  /** Scene-local frame the first word starts rising. Omit: present from frame 0. */
  enterAt?: number;
  /** "auto" follows the Stage's exit move; "none" keeps the text to the cut. */
  exit?: "auto" | "none";
  /** Frames between lines, and between words in a line. */
  lineStagger?: number;
  wordStagger?: number;
  /** Frames one word takes to rise. */
  rise?: number;
  /** Frames before the cut the push dissolve starts (push exits only). */
  dissolveLead?: number;
  /** Scene-local frame the push dissolve starts instead, for a push that
   * begins well before the cut and would carry the words off the frame first
   * (gotchas.md 43). Overrides dissolveLead. */
  dissolveAt?: number;
  style?: React.CSSProperties;
  align?: "left" | "center";
}

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Title: React.FC<TitleProps> = ({
  text,
  enterAt,
  exit = "auto",
  lineStagger = 4,
  wordStagger = 2,
  rise = 16,
  dissolveLead = 10,
  dissolveAt,
  style,
  align = "left",
}) => {
  const frame = useCurrentFrame();
  const st = useStage();
  const lines = text.split("\n").map((l) => l.split(" ").filter(Boolean));
  const total = lines.reduce((n, l) => n + l.length, 0);

  const exitKind = exit === "auto" && st ? st.exit.kind : "cut";
  const duration = st?.duration ?? Infinity;

  let index = 0;
  return (
    <div style={{ textAlign: align, ...style }}>
      {lines.map((words, li) => (
        // The mask: a band the height of the line, padded so ascenders and
        // descenders are not clipped once the word has landed.
        // Clipped top and bottom only, so a word carried off by a whip is not
        // cut at the line's sides.
        <div
          key={li}
          style={{
            clipPath: "inset(0 -4000px 0 -4000px)",
            padding: "0.1em 0 0.22em",
            margin: "-0.1em 0 -0.22em",
            whiteSpace: "nowrap",
          }}
        >
          {words.map((w, wi) => {
            const i = index++;
            // Entrance.
            let y = 0;
            let opacity = 1;
            if (enterAt !== undefined) {
              const start = enterAt + li * lineStagger + wi * wordStagger;
              const p = easings.maskReveal(interpolate(frame, [start, start + rise], [0, 1], clamp));
              y = (1 - p) * 1.05; // em
              opacity = interpolate(p, [0, 0.45], [0, 1], clamp);
            }
            // Exit.
            let x = 0;
            let scale = 1;
            if (exitKind === "whip-left" || exitKind === "whip-right") {
              const dir = exitKind === "whip-left" ? -1 : 1;
              const order = dir < 0 ? i : total - 1 - i; // the lead word leaves first
              // Clamped so a long line's last words still have two frames to move
              // (an input range that collapses makes interpolate throw).
              const start = Math.min(duration - (st?.exit.frames ?? 9) - 5 + order * 0.6, duration - 3);
              const q = interpolate(frame, [start, duration - 1], [0, 1], clamp);
              const e = q * q;
              x = dir * e * 1.4; // em, on top of the camera's own travel
              opacity *= 1 - e * 0.85;
            } else if (exitKind === "push") {
              const start = (dissolveAt ?? duration - dissolveLead) + i * 1.2;
              const q = interpolate(frame, [start, start + 8], [0, 1], clamp);
              opacity *= 1 - easings.soft(q);
              scale = 1 + 0.08 * q;
              y -= 0.12 * q;
            }
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  marginRight: wi === words.length - 1 ? 0 : "0.25em",
                  transform: `translate(${x.toFixed(3)}em, ${y.toFixed(3)}em) scale(${scale.toFixed(4)})`,
                  opacity,
                  whiteSpace: "pre",
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
