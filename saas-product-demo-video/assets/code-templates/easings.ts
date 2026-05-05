// Named easings - use these instead of raw Easing.bezier(...) inline.
// Remotion's default is Easing.bezier(0.4, 0, 0.2, 1), which feels too
// digital for cinematic work. Authored-by-hand curves are essential.

import { Easing } from "remotion";

export const easings = {
  // Fast middle, hard end - for portal pushes, marker sweeps, violent accents
  violentPush: Easing.bezier(0.7, 0, 0.1, 1),

  // Anticipation + settle - for cards landing, hero settling, phrase lifts
  slowInLand: Easing.bezier(0.2, 0.9, 0.1, 1),

  // Default material - safe everywhere
  standard: Easing.bezier(0.4, 0, 0.2, 1),

  // Gentle - for subtle moves, ambient drift, breathing
  soft: Easing.bezier(0.25, 0.46, 0.45, 0.94),

  // Deliberate snap - for whip pans, cursor acceleration between targets
  whip: Easing.bezier(0.85, 0, 0.15, 1),

  // Quick + smooth - for clip-path reveals, type-in, mask wipes
  maskReveal: Easing.bezier(0.33, 1, 0.68, 1),
};
