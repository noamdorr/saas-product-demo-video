// scene-frames.ts - convert between master (global) frames and scene-local frames.
//
// Inside a <Series>, each child's useCurrentFrame() resets to 0 at that child's
// start, so the frame is scene-local. But beats from beats.json (and every
// constant in theme-v2.ts) are master frames. Mixing the two slides every
// beat-snapped event off by the scene's start offset, silently - nothing throws.
// Route every cross-boundary frame through these helpers instead of scattering
// raw `- sceneStart` math across scenes.

/** A scene's place on the master timeline (master frames). */
export type Scene = { start: number; duration: number };

/** Master (global) frame -> scene-local frame. */
export const toLocal = (masterFrame: number, sceneStart: number): number =>
  masterFrame - sceneStart;

/** Scene-local frame -> master (global) frame. */
export const toMaster = (localFrame: number, sceneStart: number): number =>
  localFrame + sceneStart;

/** Does a master frame fall inside the scene's half-open span [start, start+duration)? */
export const inScene = (masterFrame: number, scene: Scene): boolean =>
  masterFrame >= scene.start && masterFrame < scene.start + scene.duration;

/**
 * The global beats that land inside a scene, returned as SCENE-LOCAL frames -
 * ready to drop straight into a child's useCurrentFrame() comparisons.
 * Pass snare_frames, kick_frames, or the two merged, from beats.json.
 */
export const sceneBeats = (beats: number[], scene: Scene): number[] =>
  beats.filter((b) => inScene(b, scene)).map((b) => toLocal(b, scene.start));

/**
 * Nearest beat to a target master frame. Returns the beat, or null if none is
 * within `within` frames. Use it to snap an RMS-swell frame onto the grid only
 * when it is already close (otherwise trust the RMS peak).
 */
export const nearestBeat = (
  target: number,
  beats: number[],
  within = Infinity
): number | null => {
  let best: number | null = null;
  let bestDist = Infinity;
  for (const b of beats) {
    const d = Math.abs(b - target);
    if (d < bestDist) {
      bestDist = d;
      best = b;
    }
  }
  return best !== null && bestDist <= within ? best : null;
};
