// Master - the 16:9 film: the soundtrack plus one <Sequence> per scene.
//
// Every `from` and `durationInFrames` comes from SCENES in timing.ts. Add a
// scene by adding it to the scene list there, importing it here, and giving it
// a <Sequence> below and a debug composition in Root.tsx.

import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { SOUNDS, Sfx } from "./components/Sfx";
import { ExampleScene } from "./scenes/ExampleScene";
import { colors } from "./theme";
import { MUSIC_VOLUME, AUDIO_TRIM, SCENES, SOUNDTRACK, TOTAL_FRAMES } from "./timing";

const FADE_OUT_FRAMES = 18; // 0.6 s at 30 fps: reads as an outro without wasting the last beat

// Sound effects, optional (references/sound-effects.md): one row per event,
// four to eight in a film. `at` is the frame the visual uses, from timing.ts;
// `sound` is one of the library's (SOUNDS), or `src` a file in public/sfx with
// the lead measured by scripts/measure-lead.py. <Sfx> starts each file early
// by its lead so the loudest point lands on the event. The `sfx` prop turns
// the layer off; Root.tsx registers that as Master-NoSfx, so the user can
// compare the two renders by ear. Most feeds play muted: the film has to
// work with CUES empty.
type Cue = { at: number; volume?: number } & ({ sound: keyof typeof SOUNDS } | { src: string; lead: number });
const CUES: Cue[] = [
  // { at: SCENES.example.start, sound: "whoosh", volume: 0.35 },
  // { at: SCENES.example.start + 20, src: "sfx/thump.wav", lead: 0, volume: 0.5 },
];

/** The sound effects, one layer both masters share (MasterVertical renders it too). */
export const SoundLayer: React.FC<{ sfx?: boolean }> = ({ sfx = true }) =>
  !sfx ? null : (
    <>
      {CUES.map((c, i) =>
        "sound" in c ? (
          <Sfx key={i} at={c.at} sound={c.sound} volume={c.volume} />
        ) : (
          <Sfx key={i} at={c.at} src={staticFile(c.src)} lead={c.lead} volume={c.volume} />
        ),
      )}
    </>
  );

export const Master: React.FC<{ sfx?: boolean }> = ({ sfx = true }) => {
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
