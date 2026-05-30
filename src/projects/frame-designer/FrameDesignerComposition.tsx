/**
 * FrameDesignerComposition — Remotion composition driven by designer state.
 *
 * Takes a list of layers (kit primitive type + props) and renders them
 * stacked on the canvas. Used by the Frame Designer's live preview via
 * @remotion/player's <Thumbnail>, and registered in Root.tsx so it shows
 * up in the Remotion Studio for full-motion previews if needed.
 *
 * ## Stack-order nesting
 *
 * If the layer list contains a visible MonitorFrame, every layer that sits
 * ABOVE it in the stack (= later in the array) becomes a child of that
 * MonitorFrame, so it renders inside the monitor's screen rectangle.
 * Layers BELOW the MonitorFrame stay at the canvas level (rendered behind
 * the monitor).
 *
 * That lets a TacticalFrame above a MonitorFrame hug the screen rails,
 * while a TacticalFrame below the MonitorFrame frames the whole canvas —
 * matching either "monitor inside tactical" or "tactical inside monitor".
 *
 * Multiple MonitorFrames: only the first visible one is treated as a
 * container; any later MonitorFrame just renders as itself.
 */
import React from 'react';
import { AbsoluteFill } from 'remotion';
import {
  BG,
  CaptionCard,
  MonitorFrame,
  PromptCard,
  SceneLabel,
  TacticalFrame,
} from '../../kit';

interface DesignerLayer {
  id: string;
  type: string;
  visible: boolean;
  props: Record<string, unknown>;
}

export interface FrameDesignerProps {
  layers: DesignerLayer[];
  /** Show 5% safe-area guides on top. */
  showSafeArea?: boolean;
}

// Cast to a generic component map — each primitive accepts its own props,
// and the designer's defaults.ts contract guarantees shapes match at runtime.
const REGISTRY: Record<string, React.ComponentType<any>> = {
  TacticalFrame,
  MonitorFrame,
  PromptCard,
  CaptionCard,
  SceneLabel,
};

export const frameDesignerDefaultProps: FrameDesignerProps = {
  layers: [],
  showSafeArea: false,
};

/** Render a single non-MonitorFrame layer with its centering wrapper if needed. */
function renderLayer(l: DesignerLayer, nested: boolean): React.ReactNode {
  const C = REGISTRY[l.type];
  if (!C) return null;

  // PromptCard centers via AbsoluteFill so it works the same inside a
  // monitor screen (position: relative) or at canvas level.
  if (l.type === 'PromptCard') {
    return (
      <AbsoluteFill key={l.id} style={{ pointerEvents: 'none' }}>
        <C {...l.props} />
      </AbsoluteFill>
    );
  }
  // CaptionCard is bottom-anchored — relative to whatever container it's in.
  if (l.type === 'CaptionCard') {
    return (
      <div
        key={l.id}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: nested ? 32 : 96,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <C {...l.props} />
      </div>
    );
  }
  return <C key={l.id} {...l.props} />;
}

export const FrameDesignerComposition: React.FC<FrameDesignerProps> = ({
  layers,
  showSafeArea,
}) => {
  const visible = layers.filter((l) => l.visible);

  // Find the first visible MonitorFrame — it acts as the screen container
  // for everything above it in the stack.
  const monitorIdx = visible.findIndex((l) => l.type === 'MonitorFrame');

  let content: React.ReactNode;
  if (monitorIdx === -1) {
    content = visible.map((l) => renderLayer(l, false));
  } else {
    const below = visible.slice(0, monitorIdx);
    const monitor = visible[monitorIdx];
    const above = visible.slice(monitorIdx + 1);
    const Monitor = REGISTRY.MonitorFrame;
    content = (
      <>
        {below.map((l) => renderLayer(l, false))}
        <Monitor key={monitor.id} {...monitor.props}>
          {above.map((l) => renderLayer(l, true))}
        </Monitor>
      </>
    );
  }

  return (
    <AbsoluteFill style={{ background: BG }}>
      {content}
      {showSafeArea && <SafeAreaGuides />}
    </AbsoluteFill>
  );
};

function SafeAreaGuides() {
  // 5% inset rectangle — broadcast title-safe equivalent.
  return (
    <div
      style={{
        position: 'absolute',
        inset: '5%',
        border: '1px dashed rgba(124, 158, 178, 0.35)',
        pointerEvents: 'none',
      }}
    />
  );
}
