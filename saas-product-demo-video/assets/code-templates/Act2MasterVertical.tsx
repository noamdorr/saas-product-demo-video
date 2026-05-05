// Act2MasterVertical - 9:16 parallel port master.
//
// Uses V2V constants (mirror of V2, with width=1080, height=1920).
// Each scene has its own vertical port at src/v2/vertical/scenes/*Vertical.tsx.
//
// Keep timings identical to V2 - beat-sync is aspect-independent. The only
// differences from horizontal are layout + cursor choreography per scene.

import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from "remotion";
import { V2V } from "../theme-v2"; // V2V exported alongside V2

// Vertical scene imports
import { Scene01SaturatedHellVertical } from "./scenes/Scene01SaturatedHellVertical";
import { Scene02GoodThingVertical } from "./scenes/Scene02GoodThingVertical";
import { Scene05EmailAlertVertical } from "./scenes/Scene05EmailAlertVertical";
import { Scene06ReviewerCardVertical } from "./scenes/Scene06ReviewerCardVertical";
import { Scene08PitchCopilotVertical } from "./scenes/Scene08PitchCopilotVertical";
import { Scene09FinaleVertical } from "./scenes/Scene09FinaleVertical";

export const Act2MasterVertical: React.FC = () => (
  <AbsoluteFill style={{ background: "#FAFAF7" }}>
    <Audio
      src={staticFile("soundtrack.mp3")}
      volume={(f) =>
        interpolate(f, [V2V.totalFrames - 18, V2V.totalFrames], [0.6, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      }
    />

    <Sequence from={V2V.scene1Start} durationInFrames={V2V.scene1Dur}>
      <Scene01SaturatedHellVertical />
    </Sequence>

    <Sequence from={V2V.scene2Start} durationInFrames={V2V.scene2Dur}>
      <Scene02GoodThingVertical />
    </Sequence>

    <Sequence from={V2V.scene5Start} durationInFrames={V2V.scene5Dur}>
      <Scene05EmailAlertVertical />
    </Sequence>

    <Sequence from={V2V.scene6Start} durationInFrames={V2V.scene6Dur}>
      <Scene06ReviewerCardVertical />
    </Sequence>

    <Sequence from={V2V.scene8Start} durationInFrames={V2V.scene8Dur}>
      <Scene08PitchCopilotVertical />
    </Sequence>

    <Sequence from={V2V.scene9Start} durationInFrames={V2V.scene9Dur}>
      <Scene09FinaleVertical />
    </Sequence>
  </AbsoluteFill>
);
