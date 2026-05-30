'use client';

import { useMemo } from 'react';
import type { CommandOption } from 'hudsonkit';
import { ALL_LAYER_TYPES, LAYER_SPECS } from './defaults';
import { useFrameDesigner } from './Provider';

/**
 * Commands surfaced to Hudson's command palette + Assistant (chat mode).
 * Each command is a no-arg action; parameterised intents (e.g. "set fill
 * color on selected layer to #abcdef") are reachable by the Assistant via
 * tool calls once a toolset is wired — for now the palette covers the
 * obvious frame-shaping verbs.
 */
export function useFrameDesignerCommands(): CommandOption[] {
  const {
    preset,
    selectedId,
    dirty,
    addLayer,
    removeLayer,
    toggleVisibility,
    moveLayer,
    savePreset,
    resetCanvas,
    setShowSafeArea,
    showSafeArea,
  } = useFrameDesigner();

  return useMemo<CommandOption[]>(() => {
    const cmds: CommandOption[] = [];

    // ── Add layer ────────────────────────────────────────────
    for (const t of ALL_LAYER_TYPES) {
      cmds.push({
        id: `designer:add:${t}`,
        label: `Add layer · ${LAYER_SPECS[t].label}`,
        action: () => addLayer(t),
      });
    }

    // ── Selection-targeted ───────────────────────────────────
    if (selectedId) {
      cmds.push({
        id: 'designer:remove-selected',
        label: 'Remove selected layer',
        action: () => removeLayer(selectedId),
      });
      cmds.push({
        id: 'designer:toggle-selected',
        label: 'Toggle visibility · selected',
        action: () => toggleVisibility(selectedId),
      });
      cmds.push({
        id: 'designer:move-up',
        label: 'Move selected up',
        shortcut: 'Cmd+]',
        action: () => moveLayer(selectedId, 'up'),
      });
      cmds.push({
        id: 'designer:move-down',
        label: 'Move selected down',
        shortcut: 'Cmd+[',
        action: () => moveLayer(selectedId, 'down'),
      });
    }

    // ── Preset ───────────────────────────────────────────────
    cmds.push({
      id: 'designer:save',
      label: dirty ? `Save preset · ${preset.name} *` : `Save preset · ${preset.name}`,
      shortcut: 'Cmd+S',
      action: () => savePreset(preset.name),
    });

    cmds.push({
      id: 'designer:reset',
      label: 'Reset canvas (empty frame)',
      action: () => resetCanvas(),
    });

    // ── View ─────────────────────────────────────────────────
    cmds.push({
      id: 'designer:toggle-safe-area',
      label: showSafeArea ? 'Hide safe area' : 'Show safe area',
      action: () => setShowSafeArea(!showSafeArea),
    });

    return cmds;
  }, [
    preset,
    selectedId,
    dirty,
    showSafeArea,
    addLayer,
    removeLayer,
    toggleVisibility,
    moveLayer,
    savePreset,
    resetCanvas,
    setShowSafeArea,
  ]);
}

/**
 * Status pill shown next to the app name. Reflects dirty state + layer
 * count so the user can see at a glance whether the frame has been saved.
 */
export function useFrameDesignerStatus() {
  const { preset, dirty } = useFrameDesigner();
  const n = preset.layers.length;
  const visible = preset.layers.filter((l) => l.visible).length;
  return {
    label: dirty ? `${visible}/${n} · unsaved` : `${visible}/${n} layers`,
    color: dirty ? ('amber' as const) : ('neutral' as const),
  };
}
