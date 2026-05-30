import { createElement } from 'react';
import { Frame } from 'lucide-react';
import type { HudsonApp } from 'hudsonkit';
import { FrameDesignerProvider } from './Provider';
import { FrameDesignerCanvas } from './slots/Canvas';
import { FrameDesignerPalette } from './slots/Palette';
import { FrameDesignerPropsPanel } from './slots/PropsPanel';
import { useFrameDesignerCommands, useFrameDesignerStatus } from './hooks';

export const frameDesignerApp: HudsonApp = {
  id: 'preframe-frame-designer',
  name: 'Frame Designer',
  description: 'Compose the chrome that wraps a video frame — tactical frame, monitor bezel, captions',
  mode: 'panel',

  Provider: FrameDesignerProvider,

  leftPanel: {
    title: 'Layers',
    icon: createElement(Frame, { size: 12 }),
  },

  rightPanel: {
    title: 'Properties',
  },

  slots: {
    Content: FrameDesignerCanvas,
    LeftPanel: FrameDesignerPalette,
    Inspector: FrameDesignerPropsPanel,
  },

  hooks: {
    useCommands: useFrameDesignerCommands,
    useStatus: useFrameDesignerStatus,
  },

  agentContext: `Frame Designer composes the chrome that wraps a video frame
using the preframe kit primitives (TacticalFrame, MonitorFrame, PromptCard,
CaptionCard, SceneLabel). Layers stack from bottom to top; props are
free-form and passed straight through to the primitive. Saved presets live
in src/kit/presets/<name>.json — feel free to read and edit them directly
if the user asks you to tweak a frame outside the UI.`,
};
