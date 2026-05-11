import { AbsoluteFill } from "remotion";

interface DeviceFrameProps {
  children: React.ReactNode;
  device?: "iphone" | "macbook" | "browser";
  colorScheme?: "dark" | "silver";
  showStatusBar?: boolean;
  bgColor?: string;
}

const SCHEMES = {
  iphone: {
    dark:   { chassis: "#1c1c1e", button: "#2c2c2e", screen: "#000", statusText: "rgba(255,255,255,0.7)" },
    silver: { chassis: "#e8e8ed", button: "#d0d0d5", screen: "#000", statusText: "rgba(0,0,0,0.6)" },
  },
  macbook: {
    dark:   { lid: "#3a3a3c", base: "#2a2a2c", hinge: "#1a1a1c", screen: "#000", trackpad: "#3f3f41" },
    silver: { lid: "#d4d4d6", base: "#c8c8ca", hinge: "#b0b0b2", screen: "#000", trackpad: "#c0c0c2" },
  },
  browser: {
    dark:   { chrome: "#1e1e1e", urlBar: "#2c2c2e", urlText: "rgba(255,255,255,0.4)" },
    silver: { chrome: "#f5f5f5", urlBar: "#e0e0e2", urlText: "rgba(0,0,0,0.4)" },
  },
};

function IPhone({ colorScheme = "dark", showStatusBar = true, children }: Omit<DeviceFrameProps, "device" | "bgColor">) {
  const c = SCHEMES.iphone[colorScheme];
  return (
    <div style={{
      position: "absolute",
      left: "50%", top: "50%",
      transform: "translate(-50%, -50%)",
      width: "41%",
      aspectRatio: "9 / 19.5",
      backgroundColor: c.chassis,
      borderRadius: 40,
      boxShadow: `0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,${colorScheme === "dark" ? "0.08" : "0.6"})`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    }}>
      {/* Side buttons */}
      <div style={{ position: "absolute", left: -4, top: "22%", width: 4, height: "8%", backgroundColor: c.button, borderRadius: "2px 0 0 2px" }} />
      <div style={{ position: "absolute", left: -4, top: "33%", width: 4, height: "11%", backgroundColor: c.button, borderRadius: "2px 0 0 2px" }} />
      <div style={{ position: "absolute", left: -4, top: "46%", width: 4, height: "11%", backgroundColor: c.button, borderRadius: "2px 0 0 2px" }} />
      <div style={{ position: "absolute", right: -4, top: "30%", width: 4, height: "16%", backgroundColor: c.button, borderRadius: "0 2px 2px 0" }} />

      {/* Screen inset */}
      <div style={{
        position: "absolute",
        inset: "1.5%",
        backgroundColor: c.screen,
        borderRadius: 34,
        overflow: "hidden",
      }}>
        {/* Dynamic Island */}
        <div style={{
          position: "absolute",
          top: "2.5%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "28%",
          height: "3.8%",
          backgroundColor: "#000",
          borderRadius: 20,
          zIndex: 10,
        }} />

        {/* Status bar */}
        {showStatusBar && (
          <div style={{
            position: "absolute",
            top: "1.2%",
            left: 0, right: 0,
            height: "5%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 8% 0 7%",
            zIndex: 9,
          }}>
            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "clamp(7px, 1.2vw, 14px)", color: c.statusText, fontWeight: 600 }}>9:41</span>
            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "clamp(6px, 1vw, 12px)", color: c.statusText }}>● ● ●</span>
          </div>
        )}

        {/* Content */}
        <div style={{ position: "absolute", inset: 0 }}>{children}</div>
      </div>
    </div>
  );
}

function MacBook({ colorScheme = "dark", children }: Omit<DeviceFrameProps, "device" | "bgColor" | "showStatusBar">) {
  const c = SCHEMES.macbook[colorScheme];
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: "82%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Lid */}
      <div style={{
        width: "100%",
        aspectRatio: "16 / 10",
        backgroundColor: c.lid,
        borderRadius: "12px 12px 0 0",
        padding: "1.5%",
        boxSizing: "border-box",
        boxShadow: `0 -2px 0 ${c.hinge}, 0 20px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.2)`,
        position: "relative",
      }}>
        {/* Screen */}
        <div style={{ width: "100%", height: "100%", backgroundColor: c.screen, borderRadius: 6, overflow: "hidden" }}>
          {children}
        </div>
        {/* Camera notch */}
        <div style={{
          position: "absolute",
          top: 6, left: "50%",
          transform: "translateX(-50%)",
          width: 8, height: 8,
          borderRadius: "50%",
          backgroundColor: "#1a1a1a",
        }} />
      </div>
      {/* Hinge */}
      <div style={{ width: "102%", height: 6, backgroundColor: c.hinge, borderRadius: 0 }} />
      {/* Base */}
      <div style={{
        width: "108%",
        height: 28,
        backgroundColor: c.base,
        borderRadius: "0 0 10px 10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
      }}>
        {/* Trackpad */}
        <div style={{ width: "22%", height: 14, backgroundColor: c.trackpad, borderRadius: 4, border: `1px solid rgba(0,0,0,0.15)` }} />
      </div>
    </div>
  );
}

function Browser({ colorScheme = "dark", children }: Omit<DeviceFrameProps, "device" | "bgColor" | "showStatusBar">) {
  const c = SCHEMES.browser[colorScheme];
  const isDark = colorScheme === "dark";
  return (
    <div style={{
      position: "absolute",
      left: "50%", top: "50%",
      transform: "translate(-50%, -50%)",
      width: "88%",
      aspectRatio: "16 / 10",
      backgroundColor: c.chrome,
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: "0 30px 100px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,0,0,0.3)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Chrome bar */}
      <div style={{ height: 44, backgroundColor: c.chrome, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 14px", gap: 10 }}>
        {/* Traffic lights */}
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ff5f57" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ffbd2e" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#28c840" }} />
        </div>
        {/* URL bar */}
        <div style={{
          flex: 1,
          height: 24,
          backgroundColor: c.urlBar,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid rgba(${isDark ? "255,255,255,0.08" : "0,0,0,0.12"})`,
        }}>
          <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: c.urlText, letterSpacing: "0.02em" }}>preframe.dev</span>
        </div>
      </div>
      {/* Separator */}
      <div style={{ height: 1, backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.1)", flexShrink: 0 }} />
      {/* Content */}
      <div style={{ flex: 1, backgroundColor: "#000", overflow: "hidden" }}>{children}</div>
    </div>
  );
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  children,
  device = "iphone",
  colorScheme = "dark",
  showStatusBar = true,
  bgColor = "#0a0a0a",
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: bgColor }}>
      {device === "iphone" && <IPhone colorScheme={colorScheme} showStatusBar={showStatusBar}>{children}</IPhone>}
      {device === "macbook" && <MacBook colorScheme={colorScheme}>{children}</MacBook>}
      {device === "browser" && <Browser colorScheme={colorScheme}>{children}</Browser>}
    </AbsoluteFill>
  );
};
