// Marker - a mark drawn left to right on a phrase.
//
// Two forms of the same move: `highlight` fills behind the words (the key
// phrase in a quote or a message), `underline` draws a line under them (a URL,
// a call to action). Progress comes from the scene, so the scene decides which
// beat the mark starts on and how long it takes:
//
//   const p = interpolate(frame, [MARK_STARTS, MARK_STARTS + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
//   <Marker progress={p}>delaying customer contracts</Marker>

import { colors } from "../theme";

export const Marker: React.FC<{
  /** 0 = not drawn, 1 = fully drawn. */
  progress: number;
  kind?: "highlight" | "underline";
  color?: string;
  children: React.ReactNode;
}> = ({ progress, kind = "highlight", color, children }) => {
  const p = Math.max(0, Math.min(1, progress));
  if (kind === "underline") {
    return (
      <span style={{ position: "relative", display: "inline-block" }}>
        {children}
        <span
          style={{
            position: "absolute",
            left: 0,
            bottom: -8,
            height: 6,
            width: `${p * 100}%`,
            borderRadius: 3,
            background: color ?? colors.accent,
          }}
        />
      </span>
    );
  }
  const fill = color ?? colors.accentSoft;
  return (
    <span
      style={{
        // A solid fill sized by progress. Written as an image because a background image can be sized.
        backgroundImage: `linear-gradient(${fill}, ${fill})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${p * 100}% 100%`,
        borderRadius: 4,
        padding: "2px 5px",
        margin: "0 -5px",
      }}
    >
      {children}
    </span>
  );
};
