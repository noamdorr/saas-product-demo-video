// MasterVertical - the 9:16 master, a parallel port of Master.tsx.
//
// Timing is shared: both masters read SCENES from timing.ts, because the beat
// grid does not depend on aspect ratio. Only layout and cursor paths differ,
// so each scene gets a vertical port. See references/vertical-port.md.
//
// Optional component: copy into src/components/, then register it in Root.tsx
// with the canvasVertical size from theme.ts:
//
//   <Composition id="MasterVertical" component={MasterVertical}
//     defaultProps={{ sfx: true }} durationInFrames={TOTAL_FRAMES} fps={FPS}
//     width={canvasVertical.width} height={canvasVertical.height} />
//
// The sound effects are the master's SoundLayer (one cue table for both cuts);
// `sfx` false renders the music only, as Master-NoSfx does for the 16:9.

import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
// Swap in the vertical port of each scene (e.g. ../scenes/vertical/HookVertical).
// The scaffold's example scene stands in so this file typechecks the moment it is copied.
import { SoundLayer } from "../Master";
import { ExampleScene } from "../scenes/ExampleScene";
import { colors } from "../theme";
import { AUDIO_TRIM, SCENES, SOUNDTRACK, TOTAL_FRAMES } from "../timing";

const MUSIC_VOLUME = 0.6;
const FADE_OUT_FRAMES = 18;

export const MasterVertical: React.FC<{ sfx?: boolean }> = ({ sfx = true }) => {
  const frame = useCurrentFrame();
  const volume = interpolate(
    frame,
    [TOTAL_FRAMES - FADE_OUT_FRAMES, TOTAL_FRAMES],
    [MUSIC_VOLUME, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ background: colors.background }}>
      {SOUNDTRACK && (
        <Audio src={staticFile(SOUNDTRACK)} trimBefore={AUDIO_TRIM} volume={volume} />
      )}
      <SoundLayer sfx={sfx} />

      <Sequence from={SCENES.example.start} durationInFrames={SCENES.example.duration}>
        <ExampleScene />
      </Sequence>
    </AbsoluteFill>
  );
};
