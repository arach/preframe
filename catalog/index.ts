import { createElement } from 'react';
import { Film } from 'lucide-react';
import type { HudsonApp } from 'hudsonkit';
import { CatalogProvider } from './Provider';
import { CatalogContent } from './slots/Content';
import { CatalogLeftPanel } from './slots/LeftPanel';
import { CatalogInspector } from './slots/Inspector';
import { CraftChat } from './slots/CraftChat';
import { preframePlayerEmbedSurface } from './embeds/PlayerEmbed';
import {
  useCatalogCommands,
  useCatalogStatus,
  useCatalogSearch,
  useCatalogNavCenter,
  useCatalogNavActions,
  useCatalogLayoutMode,
} from './hooks';
import { useCatalogStatusRight } from './PlayerContext';
import { preframePorts, usePreframePortOutput, usePreframePortInput } from './ports';
import { CRAFT_AGENT_CONTEXT } from './lib/craft-context';

export const catalogApp: HudsonApp = {
  id: 'preframe-catalog',
  name: 'Preframe',
  description:
    'Creative catalog studio — assets, treatments, music, FX. Bottom drawer Craft chat for free-form technical direction on the current selection.',
  mode: 'panel',

  Provider: CatalogProvider,

  /** Operating guide for Hudson workspace AI / assistant chat mode */
  agentContext: CRAFT_AGENT_CONTEXT,

  ports: preframePorts,

  leftPanel: {
    title: 'Catalog',
    icon: createElement(Film, { size: 12 }),
  },

  rightPanel: {
    title: 'Details',
  },

  slots: {
    Content: CatalogContent,
    LeftPanel: CatalogLeftPanel,
    Inspector: CatalogInspector,
    /** Bottom drawer — free-form craft with live selection context */
    Terminal: CraftChat,
    /** Hudson workspace console "Chat" surface (same component) */
    Chat: CraftChat,
  },

  hooks: {
    useCommands: useCatalogCommands,
    useStatus: useCatalogStatus,
    useStatusRight: useCatalogStatusRight,
    useSearch: useCatalogSearch,
    useNavCenter: useCatalogNavCenter,
    useNavActions: useCatalogNavActions,
    useLayoutMode: useCatalogLayoutMode,
    usePortOutput: usePreframePortOutput,
    usePortInput: usePreframePortInput,
  } as HudsonApp['hooks'] & { useStatusRight: typeof useCatalogStatusRight },

  exports: {
    embeds: [preframePlayerEmbedSurface],
  },
};
