// SchematicProfileCard - example template for a "professional network profile" mockup.
//
// This is an EXAMPLE - adapt to your brand:
//   - Replace "YourBrand" / brand-icon image references with your actual brand
//   - Adjust colors via your theme.ts (slate, cream, coral are placeholders)
//   - The Persona type is expected to live at src/data/personas.ts
//
// Visual cues that signal "professional network" without being LinkedIn:
//   - Slate gradient header (NOT LinkedIn blue #0A66C2 - pick a desaturated slate)
//   - Photo in a circle, overlapping the bottom of the header
//   - Name + title + location stack
//   - Connect pill button
//
// See references/schematic-ui-fidelity.md for the design pattern.

import React from "react";
import { staticFile } from "remotion";
import { colors, fonts } from "../theme";
import type { Persona } from "../data/personas";

export interface SchematicProfileCardProps {
  persona: Persona;
  width?: number;
  showBrandButton?: boolean;
  brandButtonScale?: number;
}

export const SchematicProfileCard: React.FC<SchematicProfileCardProps> = ({
  persona,
  width = 1080,
  showBrandButton = true,
  brandButtonScale = 1,
}) => {
  const headerH = 180;
  const photoSize = 220;
  return (
    <div
      style={{
        width,
        background: colors.cream,
        borderRadius: 24,
        boxShadow: "0 12px 32px rgba(0,0,0,0.08), 0 2px 0 rgba(255,176,156,0.4)",
        overflow: "hidden",
        position: "relative",
        fontFamily: fonts.ui,
      }}
    >
      <div
        style={{
          height: headerH,
          background: `linear-gradient(135deg, ${colors.slate}, ${colors.slateDark})`,
          position: "relative",
        }}
      >
        {showBrandButton && (
          <div
            style={{
              position: "absolute",
              top: 24,
              right: 24,
              padding: "8px 18px",
              borderRadius: 999,
              background: colors.cream,
              color: colors.black,
              border: `2px solid ${colors.coral}`,
              fontWeight: 700,
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              gap: 8,
              transform: `scale(${brandButtonScale})`,
              transformOrigin: "center",
              boxShadow: "0 4px 0 rgba(0,0,0,0.12), 0 2px 8px rgba(255,122,89,0.4)",
            }}
          >
            <img src={staticFile("brand-icon.png")} alt="" style={{ width: 26, height: 26, borderRadius: 6 }} /> YourBrand
          </div>
        )}
      </div>
      <img
        src={staticFile(persona.photo)}
        alt={persona.name}
        style={{
          position: "absolute",
          left: 48,
          top: headerH - photoSize / 2,
          width: photoSize,
          height: photoSize,
          borderRadius: "50%",
          border: `6px solid ${colors.cream}`,
          objectFit: "cover",
          boxShadow: "0 4px 12px rgba(0,0,0,0.16)",
        }}
      />
      <div style={{ padding: `${photoSize / 2 + 24}px 48px 48px 48px` }}>
        <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 44, color: colors.black, marginBottom: 8 }}>
          {persona.name}
        </div>
        <div style={{ fontWeight: 500, fontSize: 22, color: colors.graphite, marginBottom: 4 }}>
          {persona.title} at {persona.company}
        </div>
        <div style={{ fontWeight: 400, fontSize: 18, color: colors.mediumGray }}>
          {persona.location}
        </div>
        <div
          style={{
            marginTop: 24,
            display: "inline-block",
            padding: "10px 28px",
            borderRadius: 999,
            background: colors.slate,
            color: colors.white,
            fontWeight: 600,
            fontSize: 18,
          }}
        >
          + Connect
        </div>
      </div>
    </div>
  );
};

// Example data type for personas - define in src/data/personas.ts
//
// export interface Persona {
//   id: string;
//   name: string;
//   title: string;
//   company: string;
//   location: string;
//   photo: string;        // path under public/, e.g. "personas/sarah.svg"
// }
//
// See references/schematic-ui-fidelity.md for inventing personas.

// --- Layout constants for click-target math ---
// See references/click-positioning.md for the recommended approaches.
export const SCHEMATIC_PROFILE_CARD_LAYOUT = {
  defaultWidth: 1080,
  headerHeight: 180,
  photoSize: 220,
  brandButton: {
    topInHeader: 24,
    rightInHeader: 24,
    paddingV: 8,
    paddingH: 18,
    iconSize: 26,
    gap: 8,
    fontSize: 18,
  },
} as const;

// Helper: brand-button center given composition + card width.
// Assumes card centered horizontally and vertically in composition.
export function brandButtonCenter(comp: { width: number; height: number }, cardWidth = 1080) {
  const L = SCHEMATIC_PROFILE_CARD_LAYOUT;
  const buttonW = L.brandButton.paddingH * 2 + L.brandButton.iconSize + L.brandButton.gap + 90;
  const buttonH = L.brandButton.paddingV * 2 + Math.max(L.brandButton.iconSize, L.brandButton.fontSize);
  const cardLeft = (comp.width - cardWidth) / 2;
  const headerTop = (comp.height - 534) / 2; // assumes ~534 card height; tune for your card body
  return {
    x: cardLeft + cardWidth - L.brandButton.rightInHeader - buttonW / 2,
    y: headerTop + L.brandButton.topInHeader + buttonH / 2,
  };
}
