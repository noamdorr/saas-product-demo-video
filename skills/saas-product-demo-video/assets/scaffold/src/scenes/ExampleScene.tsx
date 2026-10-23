// ExampleScene - a placeholder that proves the scaffold renders. Replace it.
//
// It shows the habit every scene should keep: event frames are looked up from
// the beat grid, never typed. `hits` holds the backbeats that fall inside this
// scene as scene-local frames, so the card lands and the click fires with the snare.
// The headline is fully there on frame 0, because frame 0 is the poster a
// player shows before playback and a fade-up would leave it blank.

import { AbsoluteFill, useVideoConfig } from "remotion";
import { ClickRipple, Cursor, clickPath } from "../components/Cursor";
import { PopIn } from "../components/PopIn";
import { TypedText } from "../components/TypedText";
import { ZoomPunch } from "../components/ZoomPunch";
import { sceneBeats } from "../scene-frames";
import { colors, fonts } from "../theme";
import { BACKBEATS, SCENES } from "../timing";

const hits = sceneBeats(BACKBEATS, SCENES.example);
const SUBLINE_STARTS = hits[0];
const CARD_LANDS = hits[1];
const CLICK = hits[3];

const CARD = { width: 640, height: 250, padding: 40 };
const BUTTON = { width: 220, height: 64 };

export const ExampleScene: React.FC = () => {
  const { width, height } = useVideoConfig();

  // Layout math, so the click target follows the card if the layout changes.
  const cardLeft = (width - CARD.width) / 2;
  const cardTop = height / 2;
  const button = {
    // The right end of the button, past its label, so the cursor covers no words.
    x: cardLeft + CARD.padding + BUTTON.width - 28,
    y: cardTop + CARD.height - CARD.padding - BUTTON.height / 2,
  };

  return (
    <AbsoluteFill style={{ background: colors.background, fontFamily: fonts.ui }}>
      <div
        style={{
          position: "absolute",
          top: height / 2 - 260,
          width: "100%",
          textAlign: "center",
          color: colors.ink,
        }}
      >
        <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 88 }}>
          Scaffold is working
        </div>
        <div style={{ marginTop: 20, fontSize: 36, color: colors.inkMuted }}>
          <TypedText text="Every event below lands on a backbeat" startFrame={SUBLINE_STARTS} />
        </div>
      </div>

      <div style={{ position: "absolute", left: cardLeft, top: cardTop }}>
        <PopIn startFrame={CARD_LANDS}>
          <div
            style={{
              width: CARD.width,
              height: CARD.height,
              padding: CARD.padding,
              boxSizing: "border-box",
              borderRadius: 24,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              boxShadow: `0 12px 32px rgba(0,0,0,0.08), 2px 2px 0 ${colors.shadowTint}`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: 32, fontWeight: 600, color: colors.ink }}>
              Replace me with your first scene
            </div>
            <ZoomPunch start={CLICK} peak={CLICK + 3} end={CLICK + 6} peakScale={1.05}>
              <div
                style={{
                  width: BUTTON.width,
                  height: BUTTON.height,
                  borderRadius: 12,
                  background: colors.accent,
                  color: colors.onAccent,
                  fontSize: 26,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Get started
              </div>
            </ZoomPunch>
          </div>
        </PopIn>
      </div>

      {/* The cursor defaults to the accent color; ink keeps it readable over the accent button. */}
      <Cursor
        fill={colors.ink}
        keypoints={clickPath(
          { frame: CARD_LANDS, x: width * 0.75, y: height * 0.92 },
          [{ frame: CLICK, x: button.x, y: button.y }],
        )}
      />
      <ClickRipple clickFrame={CLICK} x={button.x} y={button.y} />
    </AbsoluteFill>
  );
};
