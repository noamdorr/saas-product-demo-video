// theme.ts - brand tokens: colors, fonts, canvas size.
//
// Every value in `colors` and `fonts` is a PLACEHOLDER. Replace them with the
// product's real brand before the first render. Components read these tokens
// and never hard-code a hex value, so the whole film re-skins from this file.
// If you change a font family here, change the matching loadFont() in Root.tsx.

export const colors = {
  accent: "#4F46E5", // primary brand color: buttons, cursor, highlights
  accentSoft: "rgba(79, 70, 229, 0.2)", // translucent accent for ambient shapes
  onAccent: "#FFFFFF", // text and icons sitting on the accent color
  background: "#F7F7F5", // default scene background
  surface: "#FFFFFF", // cards and panels
  ink: "#111827", // headings and dark blocks
  inkSoft: "#374151", // second stop of dark gradients
  inkMuted: "#6B7280", // body copy and labels
  border: "rgba(17, 24, 39, 0.08)",
  shadowTint: "rgba(79, 70, 229, 0.25)", // colored offset shadow under cards and the cursor
} as const;

export const fonts = {
  display: "Plus Jakarta Sans, system-ui, sans-serif",
  editorial: "Roboto Slab, Georgia, serif",
  ui: "Inter, system-ui, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

// 16:9 master, and the 9:16 size used by the optional vertical master.
export const canvas = { width: 1920, height: 1080 } as const;
export const canvasVertical = { width: 1080, height: 1920 } as const;

/** Blend two #rrggbb colors; t = 0 gives a, t = 1 gives b. For scene-background shifts without a cut. */
export const blendHex = (a: string, b: string, t: number): string => {
  const channels = (hex: string) =>
    [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((h) => parseInt(h, 16));
  const [ar, ag, ab] = channels(a);
  const [br, bg, bb] = channels(b);
  return `#${[ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]
    .map((n) => Math.round(n).toString(16).padStart(2, "0"))
    .join("")}`;
};
