// FloatingElements - deterministic ambient motion.
//
// CRITICAL: never use Math.random() inside a Remotion component. It re-seeds
// on every frame and produces flicker in the final MP4. Always derive
// "randomness" from the frame number + seed via Math.sin / Math.cos.

import { useCurrentFrame } from "remotion";

export interface FloatingElementsProps {
  count: number;
  seed?: number;
  color?: string;
  sizeRange?: [number, number]; // px
  containerWidth: number;
  containerHeight: number;
  driftAmplitude?: number; // px
}

export const FloatingElements: React.FC<FloatingElementsProps> = ({
  count,
  seed = 1,
  color = "rgba(238,46,127,0.2)",
  sizeRange = [16, 40],
  containerWidth,
  containerHeight,
  driftAmplitude = 20,
}) => {
  const frame = useCurrentFrame();
  const [minSize, maxSize] = sizeRange;

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        // Deterministic pseudo-random from seed + i
        const baseXRatio = ((seed * 9301 + i * 49297) % 233280) / 233280;
        const baseYRatio = ((seed * 1103 + i * 12345) % 233280) / 233280;
        const sizeRatio = ((seed * 5381 + i * 7919) % 233280) / 233280;

        const baseX = baseXRatio * containerWidth;
        const baseY = baseYRatio * containerHeight;
        const size = minSize + sizeRatio * (maxSize - minSize);

        // Frame-driven drift via sin/cos
        const driftX = Math.sin((frame + i * 7) * 0.01) * driftAmplitude;
        const driftY = Math.cos((frame + i * 13) * 0.013) * driftAmplitude;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: baseX + driftX,
              top: baseY + driftY,
              width: size,
              height: size,
              borderRadius: "50%",
              background: color,
              pointerEvents: "none",
            }}
          />
        );
      })}
    </>
  );
};
