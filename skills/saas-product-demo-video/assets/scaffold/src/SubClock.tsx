// SubClock - a film at arbitrary times, the clock behind real motion blur.
//
// Frame i of a composition wrapped in SubClock shows the film at times[i], which
// may fall between frames: every scene is a pure function of its frame, so a
// fractional frame is a sub-frame. tools/mb renders the samples inside each
// frame's shutter and averages them, which is what a camera does: everything
// that moves blurs along its own path (a zoom radially, a cursor along its arc)
// and a hard cut stays hard. With `times` null it plays the film as it is, so the
// composition can be checked in Studio.
//
// useRealBlur() is true inside it. A blur that fakes motion switches itself off
// there (Stage does) and stays on in the ordinary one-sample render.
// Commands: references/render-export.md. Pitfalls: gotchas.md 81 to 88 and 90.
// A SubClock composition's length has to reach past the film's last frame: see Root.tsx.

import React, { createContext, useContext } from "react";
import { Freeze, useCurrentFrame } from "remotion";

const RealBlurContext = createContext(false);

/** True while the film renders through a shutter, so a blur that fakes motion should stay off. */
export const useRealBlur = (): boolean => useContext(RealBlurContext);

export const SubClock: React.FC<{ times: number[] | null; children: React.ReactNode }> = ({ times, children }) => {
  const frame = useCurrentFrame();
  const t = times ? times[Math.min(frame, times.length - 1)] : frame;
  return (
    <RealBlurContext.Provider value={true}>
      <Freeze frame={t}>{children}</Freeze>
    </RealBlurContext.Provider>
  );
};
