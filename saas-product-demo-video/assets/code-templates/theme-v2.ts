// V2 timing + color constants. Adapt scene names, durations, and hex values
// to the current project. Keep the sum-check comment at the bottom.
//
// If building a 9:16 parallel port, add V2V with the same keys.

export const v2Colors = {
  // Primary palette - replace with user's brand hex values
  pink: "#EE2E7F",
  deepPurple: "#390854",
  darkPurple: "#590D82",

  // Scene backgrounds
  cream: "#FAFAF7",
  blush: "#FDEEF1",
  lavender: "#E8DDF0",
  peach: "#FCE5D4",

  // Utility
  mutedInk: "#6B5878",
  cardBorder: "rgba(57,8,84,0.06)",
} as const;

export const V2 = {
  width: 1920,
  height: 1080,
  fps: 30,
  totalFrames: 840,

  // Scene starts and durations - every start on a snare.
  scene1Start: 0,   scene1Dur: 120,   // hook (4s)
  scene2Start: 120, scene2Dur: 60,    // pivot (2s)
  scene5Start: 180, scene5Dur: 150,   // proof A (5s)
  scene6Start: 330, scene6Dur: 120,   // proof B (4s)
  scene8Start: 450, scene8Dur: 180,   // proof C (6s)
  scene9Start: 630, scene9Dur: 210,   // finale (7s)

  // Sum: 120 + 60 + 150 + 120 + 180 + 210 = 840 ✓
} as const;

// Beat-sync helpers - useful for dev-time assertions
export const FRAMES_PER_BEAT = 15;
export const SNARE_PHASE = 30;
export const KICK_PHASE = 15;

export const isSnare = (masterFrame: number): boolean =>
  masterFrame >= SNARE_PHASE &&
  (masterFrame - SNARE_PHASE) % (FRAMES_PER_BEAT * 2) === 0;

export const isKick = (masterFrame: number): boolean =>
  masterFrame >= KICK_PHASE &&
  (masterFrame - KICK_PHASE) % (FRAMES_PER_BEAT * 2) === 0;

// Dev-time assertion - warns if a scene start is not on a snare.
if (process.env.NODE_ENV !== "production") {
  const boundaries = [
    V2.scene1Start,
    V2.scene2Start,
    V2.scene5Start,
    V2.scene6Start,
    V2.scene8Start,
    V2.scene9Start,
    V2.totalFrames,
  ];
  for (const b of boundaries) {
    if (b === 0) continue; // first boundary is always 0
    if (!isSnare(b)) {
      console.warn(`[theme-v2] Scene boundary ${b} is not on a snare.`);
    }
  }
}

// For 9:16 parallel port - uncomment and mirror V2 keys.
// export const V2V = {
//   width: 1080,
//   height: 1920,
//   fps: 30,
//   totalFrames: 840,
//   scene1Start: 0,   scene1Dur: 120,
//   scene2Start: 120, scene2Dur: 60,
//   scene5Start: 180, scene5Dur: 150,
//   scene6Start: 330, scene6Dur: 120,
//   scene8Start: 450, scene8Dur: 180,
//   scene9Start: 630, scene9Dur: 210,
// } as const;

// Color blending - useful for smooth scene-bg transitions
export const blendHex = (a: string, b: string, t: number): string => {
  const [ar, ag, ab] = [a.slice(1, 3), a.slice(3, 5), a.slice(5, 7)].map((h) =>
    parseInt(h, 16)
  );
  const [br, bg, bb] = [b.slice(1, 3), b.slice(3, 5), b.slice(5, 7)].map((h) =>
    parseInt(h, 16)
  );
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${[r, g, bl]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")}`;
};
