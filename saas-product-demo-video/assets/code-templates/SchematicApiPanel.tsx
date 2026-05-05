// API request + response panel for Scene 8.

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
    <Panel label="Request" borderColor={colors.coral}>
      <div style={{ fontSize: 18, lineHeight: 1.5, color: colors.graphite, whiteSpace: "pre" }}>
        {request}
      </div>
    </Panel>

    {/* Response - fades in via parent */}
    {showResponse && (
      <Panel label="Response" borderColor={colors.coral}>
        {status && (
          <div
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: 999,
              background: colors.coral,
              color: colors.cream,
              fontWeight: 700,
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            {status}
          </div>
        )}
        <div style={{ fontSize: 18, lineHeight: 1.5, color: colors.graphite, whiteSpace: "pre" }}>
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
      background: colors.cream,
      borderLeft: `4px solid ${borderColor}`,
      borderRadius: 12,
      padding: 24,
      boxShadow: "0 8px 24px rgba(0,0,0,0.08), 2px 2px 0 rgba(255,176,156,0.5)",
    }}
  >
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 1.5,
        color: colors.mediumGray,
        marginBottom: 8,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {label}
    </div>
    {children}
  </div>
);
