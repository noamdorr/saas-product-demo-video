// Act2Master - horizontal (16:9) master composition.
//
// Wires the soundtrack with fade-out + sequences each scene at its V2 start.
// If a scene import is missing, TypeScript will fail at npm run typecheck -
// fix before rendering.

import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from "remotion";
import { V2 } from "./theme-v2";

// Import each scene component
import { Scene01SaturatedHell } from "./scenes/Scene01SaturatedHell";
import { Scene02GoodThing } from "./scenes/Scene02GoodThing";
import { Scene05EmailAlert } from "./scenes/Scene05EmailAlert";
import { Scene06ReviewerCard } from "./scenes/Scene06ReviewerCard";
import { Scene08PitchCopilot } from "./scenes/Scene08PitchCopilot";
import { Scene09Finale } from "./scenes/Scene09Finale";

export const Act2Master: React.FC = () => (
  <AbsoluteFill style={{ background: "#FAFAF7" }}>
    {/* Soundtrack - volume 0.6 held, 18-frame fade-out */}
    <Audio
      src={staticFile("soundtrack.mp3")}
      volume={(f) =>
        interpolate(f, [V2.totalFrames - 18, V2.totalFrames], [0.6, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      }
    />

    <Sequence from={V2.scene1Start} durationInFrames={V2.scene1Dur}>
      <Scene01SaturatedHell />
    </Sequence>

    <Sequence from={V2.scene2Start} durationInFrames={V2.scene2Dur}>
      <Scene02GoodThing />
    </Sequence>

    <Sequence from={V2.scene5Start} durationInFrames={V2.scene5Dur}>
      <Scene05EmailAlert />
    </Sequence>

    <Sequence from={V2.scene6Start} durationInFrames={V2.scene6Dur}>
      <Scene06ReviewerCard />
    </Sequence>

    <Sequence from={V2.scene8Start} durationInFrames={V2.scene8Dur}>
      <Scene08PitchCopilot />
    </Sequence>

    <Sequence from={V2.scene9Start} durationInFrames={V2.scene9Dur}>
      <Scene09Finale />
    </Sequence>
  </AbsoluteFill>
);
