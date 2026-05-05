// Email composer mockup for Scene 3 (Generic / Archive).
// Body content is provided via children so the parent can mount TypedChars there.

import React from "react";
import { colors, fonts } from "../theme";

export interface SchematicEmailComposerProps {
  to: string;
  subject: string;
  body: React.ReactNode;
  width?: number;
}

export const SchematicEmailComposer: React.FC<SchematicEmailComposerProps> = ({
  to,
  subject,
  body,
  width = 1100,
}) => (
  <div
    style={{
      width,
      background: colors.cream,
      border: `3px solid ${colors.coral}`,
      borderRadius: 16,
      boxShadow: "0 12px 32px rgba(0,0,0,0.10)",
      fontFamily: fonts.ui,
      overflow: "hidden",
    }}
  >
    {/* Title bar */}
    <div
      style={{
        background: colors.coral,
        color: colors.cream,
        padding: "12px 20px",
        fontWeight: 700,
        fontSize: 16,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span>New Message</span>
      <span style={{ display: "flex", gap: 8 }}>
        <Dot />
        <Dot />
        <Dot />
      </span>
    </div>
    {/* To row */}
    <Row label="To" value={to} />
    {/* Subject row */}
    <Row label="Subject" value={subject} />
    {/* Body */}
    <div
      style={{
        padding: 20,
        minHeight: 220,
        fontSize: 24,
        color: colors.graphite,
        lineHeight: 1.4,
        fontFamily: fonts.ui,
      }}
    >
      {body}
    </div>
    {/* Action bar */}
    <div
      style={{
        padding: "16px 20px",
        borderTop: `1px solid ${colors.lightGray}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <button
        style={{
          background: colors.coral,
          color: colors.cream,
          padding: "10px 24px",
          borderRadius: 8,
          border: "none",
          fontWeight: 700,
          fontSize: 16,
        }}
      >
        Send
      </button>
      <ArchiveIcon />
    </div>
  </div>
);

const Dot: React.FC = () => (
  <span
    style={{
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.6)",
      display: "inline-block",
    }}
  />
);

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ padding: "12px 20px", borderBottom: `1px solid ${colors.lightGray}`, display: "flex", gap: 12 }}>
    <span style={{ width: 80, color: colors.mediumGray, fontSize: 16 }}>{label}</span>
    <span style={{ color: colors.graphite, fontSize: 16 }}>{value}</span>
  </div>
);

export const ArchiveIcon: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Lid */}
    <path d="M3 6h18" stroke={colors.graphite} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke={colors.graphite} strokeWidth="1.8" strokeLinecap="round" />
    {/* Bin body */}
    <path d="M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" stroke={colors.graphite} strokeWidth="1.8" strokeLinejoin="round" />
    {/* Vertical lines inside */}
    <path d="M10 11v6M14 11v6" stroke={colors.graphite} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
