import { createElement } from 'react';
import { Film } from 'lucide-react';
import type { HudsonApp } from 'hudsonkit';
import { CatalogProvider } from './Provider';
import { CatalogContent } from './slots/Content';
import { CatalogLeftPanel } from './slots/LeftPanel';
import { CatalogInspector } from './slots/Inspector';
import { preframePlayerEmbedSurface } from './embeds/PlayerEmbed';
import {
  useCatalogCommands,
  useCatalogStatus,
  useCatalogSearch,
  useCatalogNavCenter,
  useCatalogNavActions,
  useCatalogLayoutMode,
} from './hooks';

export const catalogApp: HudsonApp = {
  id: 'preframe-catalog',
  name: 'Preframe',
  description: 'Video catalog — browse, filter, and inspect recorded demos',
  mode: 'panel',

  Provider: CatalogProvider,

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
  },

  hooks: {
    useCommands: useCatalogCommands,
    useStatus: useCatalogStatus,
    useSearch: useCatalogSearch,
    useNavCenter: useCatalogNavCenter,
    useNavActions: useCatalogNavActions,
    useLayoutMode: useCatalogLayoutMode,
  },

  exports: {
    embeds: [preframePlayerEmbedSurface],
  },
};
