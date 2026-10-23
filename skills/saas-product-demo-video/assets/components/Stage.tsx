// Stage - the camera for a scene, plus its entrance and exit move.
//
// Optional component: copy into src/components/. It reads ../easings, and the
// composition's size from Remotion (so a 9:16 master resolves "50% 50%" to
// its own center). Title.tsx reads it through useStage().
//
// Give the scene's background color to the Stage's `background` prop, never
// as a child fill: a push entrance from 0.9 or a whip moves the whole stage
// layer, and a child fill would show its edge (and the master's background)
// on the cut frame.
//
// Wrap a scene's content in a Stage. The camera is a list of keyframes
// (scale, x, y), each segment with its own easing: an even drift during a
// hold, a slow-in landing for the pull-back from a detail to the whole, a
// ramp that gathers speed into a push exit. The entrance and exit are named
// moves that play over the first and last few frames of the scene, so a cut
// on the backbeat reads as a whip-pan, a push-through or a pull-back instead
// of a slide-deck cut. Both halves of a transition belong to the two scenes
// it joins: the outgoing scene plays its `exit`, the incoming one its `enter`,
// and the boundary between them stays a hard cut on the beat. The film's
// master needs no overlap and no transition component.
//
// Easing words, since two meanings collide: an exit that "eases in"
// accelerates (slow start, full speed at the end); `slowInLand` in easings.ts
// does the opposite, starting fast and settling long. A pull-back lands on
// `slowInLand`; an exit eases in.
//
// Moves:
//   cut        nothing (the default)
//   whip-left  the frame slides out to the left with motion blur (exit) /
//              slides in from the right (enter); whip-right is the mirror
//   push       the frame grows into the lens with blur (exit) / arrives from
//              `from` (default 0.9) and settles to 1 (enter): the camera
//              keeps going forward through the cut
//   pull-back  enter only: starts tight (scale `from`) about the Stage's
//              `origin` and pulls back to 1, for a match-cut zoom (the
//              outgoing scene pushed into a row, this one opens tight on the
//              same thing and reveals the whole); to open tight on an element
//              away from the center, add the camera translate described below
//   drop       enter only: the frame drops in from above and settles
//
// Depth: <Depth z> inside a Stage puts its children on a nearer (z > 1) or
// farther (z < 1) plane. The camera's scale change and travel are multiplied
// by z for that plane, so a headline at 1.1 drifts a little more than the
// card beside it and leaves a little ahead of it on a whip, and copy at 0.15
// barely moves while the camera glides past it.
//
// Learned the hard way:
// - Momentum across the cut. When both halves ease in and out, the move stops
//   dead on each side of the cut (move, stop, cut, move, stop), and the owner
//   of one film called that jerky. Here the exit accelerates into the cut with
//   its blur peaking on the last frame, the entrance leaves the cut at speed
//   and settles, and the cut hides inside the blur, the way a whip-pan is cut
//   on film. A push likewise continues forward: the next scene arrives from
//   0.9 and settles to 1. One that arrived from 1.15 and settled to 1 reversed
//   the zoom on every beat.
// - The entrance travels less than the exit (16% of the width and 4 px of
//   blur on the cut frame, against 30% and 8 px on the exit's last frame), so
//   the frame the beat lands on still reads. 60% of travel leaves the cut
//   frame empty; 30% with 8 px leaves it a smear.
// - A hold drifts at an even speed. A two-key camera with a slow-in easing
//   does three quarters of its move in the first fifth of the scene and then
//   sits still, which reads as static.
// - To open tight on an element that is not at the frame's center, do not
//   only set the transform-origin on it: the element stays where it is and
//   the zoom shows the corner of the layout. Add a camera translate of
//   (center - element) at the zoomed keyframe, easing to 0 as the pull-back
//   lands, so the element sits at the center while tight. And never switch
//   `origin` while the scale is not 1: the picture jumps by the origin's
//   move times (scale - 1). Interpolate the origin instead, or switch at 1.
//   (This is why a Move has no origin of its own: one origin per Stage.)
//
// The blur is applied only while a move is in progress, so held frames stay
// pixel sharp.

import React, { createContext, useContext } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { easings } from "../easings";

export type Ease = keyof typeof easings | "linear";
/** `ease` is the curve of the segment that ends on this key (default: linear, an even drift). */
export type CameraKey = { frame: number; scale?: number; x?: number; y?: number; ease?: Ease };
export type MoveKind = "cut" | "whip-left" | "whip-right" | "push" | "pull-back" | "drop";
export type Move = {
  kind: MoveKind;
  /** Length of the move. Defaults: 9 for an exit, 10 for an entrance, 24 for a pull-back. */
  frames?: number;
  /**
   * The scale at the far end of the move: a push exit ends at it (default 1.5,
   * use 1.4 to 2.0); a push entrance starts at it (default 0.9); a pull-back
   * starts at it (default 1.6). Ignored by whips, drop and cut.
   */
  from?: number;
  /**
   * Pull-back only: px of blur on the cut, falling off as the move leaves it
   * (default 0). A match-cut that opens on the object the last scene pushed
   * into with blur should land soft too, so the cut stays inside the blur.
   */
  blur?: number;
};

export interface StageProps {
  /** Scene length in frames (local). Needed to place the exit move. */
  duration: number;
  /** Camera keyframes in local frames. Scale 1 = the frame as laid out. */
  camera?: CameraKey[];
  enter?: Move;
  exit?: Move;
  /** CSS transform-origin for the camera scale, e.g. "50% 50%" or "640px 420px". */
  origin?: string;
  background?: string;
  children: React.ReactNode;
}

/** What a Stage is doing this frame, for primitives that move with it (Title, Depth). */
export type StageState = {
  frame: number;
  duration: number;
  /** The camera as applied this frame: keys, enter and exit combined. */
  scale: number;
  x: number;
  y: number;
  /** The transform origin in canvas px. */
  ox: number;
  oy: number;
  enter: { kind: MoveKind; frames: number; p: number }; // p: 0 on the cut, 1 settled
  exit: { kind: MoveKind; frames: number; start: number; p: number }; // p: 0 before the move, 1 on the last frame
};

// The two halves of a move: the exit eases in (full speed on the cut), the
// entrance eases out (leaves the cut at speed, then settles).
const EXIT_EASE = Easing.bezier(0.5, 0, 0.9, 0.55);
const ENTER_EASE = Easing.bezier(0.12, 0.6, 0.3, 1);
const WHIP_TRAVEL_OUT = 0.3; // of the frame width, on the exit's last frame
const WHIP_BLUR_OUT = 8; // px on the exit's last frame: the ceiling
const WHIP_TRAVEL_IN = 0.16; // on the entrance's first frame (the cut frame)
const WHIP_BLUR_IN = 4;
const PUSH_BLUR_OUT = 6;
const PUSH_BLUR_IN = 3;

const curve = (e: Ease | undefined) => (e && e !== "linear" ? easings[e] : (t: number) => t);

const track = (frame: number, keys: CameraKey[], pick: (k: CameraKey) => number | undefined, fallback: number) => {
  if (keys.length === 0) return fallback;
  if (keys.length === 1 || frame <= keys[0].frame) return pick(keys[0]) ?? fallback;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (frame <= b.frame || i === keys.length - 1) {
      return interpolate(frame, [a.frame, b.frame], [pick(a) ?? fallback, pick(b) ?? fallback], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: curve(b.ease),
      });
    }
  }
  return fallback;
};

/** "62% 50%" or "640px 420.5px" to px of a width x height composition. */
const parseOrigin = (origin: string, width: number, height: number): { ox: number; oy: number } => {
  const [a = "50%", b = "50%"] = origin.trim().split(/\s+/);
  const one = (t: string, size: number) => (t.endsWith("%") ? (parseFloat(t) / 100) * size : parseFloat(t));
  return { ox: one(a, width), oy: one(b, height) };
};

const StageContext = createContext<StageState | null>(null);

/** The Stage this component sits in, or null outside one. */
export const useStage = (): StageState | null => useContext(StageContext);

export const Stage: React.FC<StageProps> = ({
  duration,
  camera = [],
  enter = { kind: "cut" },
  exit = { kind: "cut" },
  origin = "50% 50%",
  background,
  children,
}) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();

  const camScale = track(frame, camera, (k) => k.scale, 1);
  const camX = track(frame, camera, (k) => k.x, 0);
  const camY = track(frame, camera, (k) => k.y, 0);

  let enterScale = 1;
  let enterX = 0;
  let enterY = 0;
  let enterBlur = 0;
  const ef = enter.frames ?? (enter.kind === "pull-back" ? 24 : 10);
  const enterP = enter.kind === "cut" ? 1 : interpolate(frame, [0, ef], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (enter.kind !== "cut" && frame < ef) {
    const e = ENTER_EASE(enterP);
    const v = 1 - e; // 1 on the cut, 0 when settled
    if (enter.kind === "whip-left") {
      enterX = W * WHIP_TRAVEL_IN * v; // comes in from the right (the frame moved left)
      enterBlur = WHIP_BLUR_IN * v;
    } else if (enter.kind === "whip-right") {
      enterX = -W * WHIP_TRAVEL_IN * v;
      enterBlur = WHIP_BLUR_IN * v;
    } else if (enter.kind === "push") {
      const from = enter.from ?? 0.9;
      enterScale = from + (1 - from) * e;
      enterBlur = PUSH_BLUR_IN * v;
    } else if (enter.kind === "pull-back") {
      const from = enter.from ?? 1.6;
      enterScale = from + (1 - from) * easings.slowInLand(enterP);
      enterBlur = (enter.blur ?? 0) * v;
    } else if (enter.kind === "drop") {
      enterY = -140 * v; // no fade: the cut frame keeps full opacity
    }
  }

  let exitScale = 1;
  let exitX = 0;
  let exitBlur = 0;
  const xf = exit.frames ?? 9;
  const exitStart = duration - xf;
  const exitP =
    exit.kind === "cut" ? 0 : interpolate(frame, [exitStart, duration - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (exit.kind !== "cut" && exitP > 0) {
    const e = EXIT_EASE(exitP);
    if (exit.kind === "whip-left") {
      exitX = -W * WHIP_TRAVEL_OUT * e;
      exitBlur = WHIP_BLUR_OUT * e;
    } else if (exit.kind === "whip-right") {
      exitX = W * WHIP_TRAVEL_OUT * e;
      exitBlur = WHIP_BLUR_OUT * e;
    } else if (exit.kind === "push") {
      exitScale = 1 + ((exit.from ?? 1.5) - 1) * e;
      exitBlur = PUSH_BLUR_OUT * e;
    }
  }

  const scale = camScale * enterScale * exitScale;
  const x = camX + enterX + exitX;
  const y = camY + enterY;
  const blur = Math.max(enterBlur, exitBlur);
  const { ox, oy } = parseOrigin(origin, W, H);

  const state: StageState = {
    frame,
    duration,
    scale,
    x,
    y,
    ox,
    oy,
    enter: { kind: enter.kind, frames: ef, p: enterP },
    exit: { kind: exit.kind, frames: xf, start: exitStart, p: exitP },
  };

  return (
    <AbsoluteFill style={{ background, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${scale.toFixed(4)})`,
          transformOrigin: `${ox.toFixed(2)}px ${oy.toFixed(2)}px`,
          filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined,
        }}
      >
        <StageContext.Provider value={state}>{children}</StageContext.Provider>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * A plane at depth z inside a Stage: the camera's scale change and travel are
 * multiplied by z for its children. z 1 is the stage itself; 1.1 to 1.15 for
 * a headline beside a card; well under 1 for copy that must keep its margin
 * while the camera glides or pushes about a far origin.
 */
export const Depth: React.FC<{ z: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ z, style, children }) => {
  const st = useStage();
  if (!st || z === 1) return <AbsoluteFill style={{ pointerEvents: "none", ...style }}>{children}</AbsoluteFill>;
  // The stage maps p to O + t + s(p - O). This plane should map p to
  // O + z t + (1 + z (s - 1))(p - O), so inside the stage it adds a scale of
  // r about the same origin and a translate of (z - 1) t / s.
  const s = st.scale;
  const r = (1 + z * (s - 1)) / s;
  const u = ((z - 1) * st.x) / s;
  const v = ((z - 1) * st.y) / s;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        transform: `translate(${u.toFixed(2)}px, ${v.toFixed(2)}px) scale(${r.toFixed(5)})`,
        transformOrigin: `${st.ox.toFixed(2)}px ${st.oy.toFixed(2)}px`,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
