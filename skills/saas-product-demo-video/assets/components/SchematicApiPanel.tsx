// SchematicApiPanel - request + response panels for "the product is an API" scenes.
// See references/schematic-ui-fidelity.md for the design pattern.
//
// Optional component: copy into src/components/.

import React from "react";
import { colors, fonts } from "../theme";

export interface SchematicApiPanelProps {
  request: React.ReactNode;
  response: React.ReactNode;
  status?: string; // "200 OK" etc - pass null to hide
  showResponse?: boolean;
  width?: number;
}

export const SchematicApiPanel: React.FC<SchematicApiPanelProps> = ({
  request,
  response,
  status = "200 OK",
  showResponse = true,
  width = 900,
}) => (
  <div
    style={{
      width,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      fontFamily: fonts.mono,
    }}
  >
    {/* Request */}
    <Panel label="Request" borderColor={colors.accent}>
      <div style={{ fontSize: 18, lineHeight: 1.5, color: colors.inkMuted, whiteSpace: "pre" }}>
        {request}
      </div>
    </Panel>

    {/* Response - fades in via parent */}
    {showResponse && (
      <Panel label="Response" borderColor={colors.accent}>
        {status && (
          <div
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: 999,
              background: colors.accent,
              color: colors.onAccent,
              fontWeight: 700,
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            {status}
          </div>
        )}
        <div style={{ fontSize: 18, lineHeight: 1.5, color: colors.inkMuted, whiteSpace: "pre" }}>
          {response}
        </div>
      </Panel>
    )}
  </div>
);

const Panel: React.FC<{ label: string; borderColor: string; children: React.ReactNode }> = ({
  label,
  borderColor,
  children,
}) => (
  <div
    style={{
      background: colors.surface,
      borderLeft: `4px solid ${borderColor}`,
      borderRadius: 12,
      padding: 24,
      boxShadow: `0 8px 24px rgba(0,0,0,0.08), 2px 2px 0 ${colors.shadowTint}`,
    }}
  >
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 1.5,
        color: colors.inkMuted,
        marginBottom: 8,
        fontFamily: fonts.ui,
      }}
    >
      {label}
    </div>
    {children}
  </div>
);
