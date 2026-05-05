// PopIn - spring-style scale + fade for cards, chips, UI elements.

import { spring, useCurrentFrame, useVideoConfig } from "remotion";

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
