import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Img, staticFile } from "remotion";

interface SocialReelProps {
  children: React.ReactNode;
  title?: string;
  handle?: string;
  accentColor?: string;
  topStripHeight?: number;
  bottomStripHeight?: number;
  bgColor?: string;
  logoSrc?: string;
}

export const SocialReel: React.FC<SocialReelProps> = ({
  children,
  title,
  handle,
  accentColor = "#4ade80",
  topStripHeight = 120,
  bottomStripHeight = 100,
  bgColor = "#0a0a0a",
  logoSrc,
}) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();

  const enterDuration = 0.5 * fps;

  const topY = interpolate(frame, [0, enterDuration], [-topStripHeight, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bottomY = interpolate(frame, [0, enterDuration], [bottomStripHeight, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const stripsOpacity = interpolate(frame, [0, enterDuration * 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // The video content zone sits between top and bottom strips
  const contentHeight = height - topStripHeight - bottomStripHeight;
  // Letterbox the 16:9 source inside the content zone
  const contentWidth = width;
  const videoNativeHeight = contentWidth * (9 / 16);
  const videoTop = topStripHeight + (contentHeight - videoNativeHeight) / 2;

  const stripStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: bgColor,
    display: "flex",
    alignItems: "center",
  };

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor }}>
      {/* Letterboxed video content */}
      <div style={{
        position: "absolute",
        left: 0,
        top: videoTop,
        width: contentWidth,
        height: videoNativeHeight,
        overflow: "hidden",
      }}>
        {children}
      </div>

      {/* Top strip */}
      {title && (
        <div style={{
          ...stripStyle,
          top: topY,
          height: topStripHeight,
          opacity: stripsOpacity,
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 32px",
          gap: 8,
        }}>
          <span style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(18px, 4vw, 52px)",
            color: "#ffffff",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}>
            {title}
          </span>
          <div style={{
            width: 32,
            height: 3,
            backgroundColor: accentColor,
            borderRadius: 2,
            boxShadow: `0 0 8px ${accentColor}`,
          }} />
        </div>
      )}

      {/* Accent separator — top */}
      <div style={{
        position: "absolute",
        left: 0, right: 0,
        top: topStripHeight + topY,
        height: 1,
        backgroundColor: accentColor,
        opacity: stripsOpacity * 0.35,
      }} />

      {/* Accent separator — bottom */}
      <div style={{
        position: "absolute",
        left: 0, right: 0,
        bottom: bottomStripHeight - bottomY,
        height: 1,
        backgroundColor: accentColor,
        opacity: stripsOpacity * 0.35,
      }} />

      {/* Bottom strip */}
      {(handle || logoSrc) && (
        <div style={{
          ...stripStyle,
          bottom: -bottomY,
          height: bottomStripHeight,
          opacity: stripsOpacity,
          padding: "0 32px",
          justifyContent: "space-between",
        }}>
          {handle && (
            <span style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: "clamp(12px, 2.5vw, 32px)",
              color: "rgba(255,255,255,0.65)",
              letterSpacing: "0.04em",
            }}>
              {handle}
            </span>
          )}
          {logoSrc && (
            <Img
              src={staticFile(logoSrc)}
              style={{ height: "55%", width: "auto", objectFit: "contain", opacity: 0.85 }}
            />
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};
