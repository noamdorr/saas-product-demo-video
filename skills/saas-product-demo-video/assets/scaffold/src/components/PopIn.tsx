// PopIn - spring-style scale + fade for cards, chips, UI elements. The default.
// LandIn - a hard landing: absent, then fully there on one frame.
//
// Which one: use PopIn almost everywhere. It starts on the beat and eases in,
// which is what makes a film feel smooth against its music. Keep LandIn for
// the two or three moments the film is built around (the main reveal on the
// music's lift, the logo). A film where everything lands hard reads as jerky,
// however exactly each landing sits on its beat.

import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface PopInProps {
  startFrame: number;
  children: React.ReactNode;
  config?: { damping?: number; stiffness?: number; mass?: number };
  style?: React.CSSProperties;
}

export const PopIn: React.FC<PopInProps> = ({
  startFrame,
  children,
  config = {},
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.7, ...config },
  });

  return (
    <div
      style={{
        transform: `scale(${s})`,
        opacity: s,
        transformOrigin: "center",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// SlidePopIn - PopIn combined with a slide-from-direction
export const SlidePopIn: React.FC<
  PopInProps & { fromX?: number; fromY?: number }
> = ({ startFrame, children, config = {}, style, fromX = 0, fromY = 60 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 14, stiffness: 140, mass: 0.8, ...config },
  });

  const translateX = fromX * (1 - s);
  const translateY = fromY * (1 - s);

  return (
    <div
      style={{
        transform: `translate(${translateX}px, ${translateY}px) scale(${0.92 + 0.08 * s})`,
        opacity: s,
        transformOrigin: "center",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// LandIn - absent before `startFrame`, at full opacity on it, with a small
// scale punch (and optional rise) that settles over the next few frames.
export const LandIn: React.FC<
  Omit<PopInProps, "config"> & { fromScale?: number; rise?: number }
> = ({ startFrame, children, style, fromScale = 0.94, rise = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < startFrame) return null;

  const punch = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 12, mass: 0.5, stiffness: 130 },
  });

  return (
    <div
      style={{
        transform: `translateY(${(1 - punch) * rise}px) scale(${interpolate(punch, [0, 1], [fromScale, 1])})`,
        transformOrigin: "center",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
