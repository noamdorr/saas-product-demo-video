// TestBed - a few seconds of film to judge one scene in context: the last
// `lead` frames of the scene before it, the scene (or a sketch of it), and
// the first `tail` frames of the scene after it, with the soundtrack trimmed
// to the same span. Register one composition per sketch and render each, so
// the directions for a scene being reinvented are compared as film with
// music, not as stills (`iteration-playbook.md`, "When a scene has to be
// reinvented").
//
// Optional component: copy into src/components/. It reads ../timing and
// ../theme.
//
//   // src/Root.tsx, at module scope (not inside RemotionRoot, which would
//   // make a new component on every render)
//   const bed = makeTestBed({ before: Intro, scene: "problem", sketch: ProblemCalendar, after: Reveal });
//   <Composition id="Test-HookB-Calendar" component={bed.component}
//     durationInFrames={bed.frames} fps={FPS} width={canvas.width} height={canvas.height} />

import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { colors } from "../theme";
import { AUDIO_TRIM, MUSIC_VOLUME, SCENES, SOUNDTRACK, type SceneName } from "../timing";

export const makeTestBed = ({
  before,
  scene,
  sketch,
  after,
  lead = 20,
  tail = 20,
}: {
  before?: React.FC;
  scene: SceneName;
  sketch: React.FC;
  after?: React.FC;
  lead?: number;
  tail?: number;
}) => {
  const names = Object.keys(SCENES) as SceneName[];
  const i = names.indexOf(scene);
  const prev = i > 0 ? SCENES[names[i - 1]] : null;
  const next = i >= 0 && i < names.length - 1 ? SCENES[names[i + 1]] : null;
  const s = SCENES[scene];
  const Before = before;
  const Sketch = sketch;
  const After = after;
  const lead_ = Before && prev ? Math.min(lead, prev.duration) : 0;
  const tail_ = After && next ? Math.min(tail, next.duration) : 0;
  const component: React.FC = () => (
    <AbsoluteFill style={{ background: colors.background }}>
      {SOUNDTRACK && <Audio src={staticFile(SOUNDTRACK)} trimBefore={AUDIO_TRIM + s.start - lead_} volume={MUSIC_VOLUME} />}
      {Before && prev && (
        <Sequence from={lead_ - prev.duration} durationInFrames={prev.duration} name="before">
          <Before />
        </Sequence>
      )}
      <Sequence from={lead_} durationInFrames={s.duration} name="scene">
        <Sketch />
      </Sequence>
      {After && (
        <Sequence from={lead_ + s.duration} durationInFrames={tail_} name="after">
          <After />
        </Sequence>
      )}
    </AbsoluteFill>
  );
  return { component, frames: lead_ + s.duration + tail_ };
};
