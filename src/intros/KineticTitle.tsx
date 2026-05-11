import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface KineticTitleProps {
  lines: string[];
  accentColor?: string;
  accentLineIndex?: number;
  exitStyle?: "fade" | "slice";
  bgColor?: string;
  holdPerLine?: number;
  transitionDuration?: number;
}

export const KineticTitle: React.FC<KineticTitleProps> = ({
  lines,
  accentColor = "#4ade80",
  accentLineIndex = 0,
  exitStyle = "fade",
  bgColor = "#0a0a0e",
  holdPerLine = 0.8,
  transitionDuration = 0.35,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const framesPerLine = durationInFrames / lines.length;
  const enterFrames = transitionDuration * fps;
  const exitFrames = transitionDuration * fps;
  const overlapFrames = 0.1 * fps;

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, overflow: "hidden" }}>
      {lines.map((line, i) => {
        const lineStart = i * framesPerLine;
        const lineEnd = lineStart + framesPerLine;
        const enterStart = lineStart;
        const enterEnd = lineStart + enterFrames;
        const exitStart = lineEnd - exitFrames - overlapFrames;
        const exitEnd = lineEnd - overlapFrames;

        // Spring enter — slam up from below with overshoot
        const enterProgress = spring({
          frame: frame - enterStart,
          fps,
          config: { damping: 14, mass: 0.8, stiffness: 200 },
          durationInFrames: enterFrames * 2,
        });

        const translateY = interpolate(enterProgress, [0, 1], [40, 0]);
        const enterOpacity = interpolate(
          frame,
          [enterStart, enterStart + enterFrames * 0.6],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        // Exit
        let exitOpacity = 1;
        let clipPath = "inset(0 0 0% 0)";

        if (exitStyle === "fade") {
          exitOpacity = interpolate(frame, [exitStart, exitEnd], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
        } else {
          const slicePct = interpolate(frame, [exitStart, exitEnd], [0, 100], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          clipPath = `inset(0 0 ${slicePct}% 0)`;
        }

        const visible = frame >= enterStart - overlapFrames && frame <= exitEnd + enterFrames;
        if (!visible) return null;

        const isAccent = i === accentLineIndex;
        const opacity = Math.min(enterOpacity, exitOpacity);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity,
              transform: `translateY(${translateY}px)`,
              clipPath: exitStyle === "slice" ? clipPath : undefined,
            }}
          >
            <span style={{
              fontFamily: "system-ui, -apple-system, 'SF Pro Display', sans-serif",
              fontSize: "clamp(48px, 8vw, 180px)",
              fontWeight: 900,
              color: isAccent ? accentColor : "#ffffff",
              letterSpacing: "-0.04em",
              lineHeight: 1,
              textAlign: "center",
              padding: "0 5%",
              textShadow: isAccent
                ? `0 0 60px ${accentColor}55, 0 4px 40px rgba(0,0,0,0.8)`
                : "0 4px 40px rgba(0,0,0,0.8)",
              userSelect: "none",
            }}>
              {line}
            </span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
