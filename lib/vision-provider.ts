import { createAnthropicVision, createMiniMaxMcpVision } from '../scripts/lib/index';
import type { VisionProvider } from '../scripts/lib/types';
import { getMiniMaxApiKey, isMiniMaxProvider, readVlmProviderConfig } from './provider';

export type ConfiguredVisionProvider = VisionProvider & { close?: () => Promise<void> };

/**
 * Build the active VLM for frame unpack / storyboard tagging.
 *
 * Product default is **MiniMax** on the Anthropic-compatible HTTP API
 * (`format: anthropic`, baseUrl `https://api.minimax.io/anthropic`). That uses
 * the Anthropic SDK pointed at MiniMax — not Claude, and not the MCP path.
 *
 * MCP (`createMiniMaxMcpVision`) is only used when the VLM model id is the
 * explicit MCP sentinel `understand_image` / `minimax-mcp`.
 */
export function createConfiguredVisionProvider(): ConfiguredVisionProvider | undefined {
  const config = readVlmProviderConfig();
  if (!config) return undefined;

  const apiKey = isMiniMaxProvider(config)
    ? getMiniMaxApiKey(config)
    : config.apiKey;
  if (!apiKey) return undefined;

  const modelLower = (config.model || '').toLowerCase();
  const wantsMcp =
    modelLower === 'understand_image' ||
    modelLower === 'minimax-mcp' ||
    modelLower.includes('mcp');

  if (isMiniMaxProvider(config) && wantsMcp) {
    return createMiniMaxMcpVision({ apiKey });
  }

  // MiniMax VLM (default) and real Anthropic Claude both speak Messages API.
  return createAnthropicVision({
    apiKey,
    baseURL: config.baseUrl || undefined,
    model: config.model,
    provider: config.name || (isMiniMaxProvider(config) ? 'MiniMax' : 'Vision'),
  });
}

export function describeConfiguredVisionProvider(): string | null {
  const config = readVlmProviderConfig();
  if (!config) return null;
  const modelLower = (config.model || '').toLowerCase();
  const wantsMcp =
    modelLower === 'understand_image' ||
    modelLower === 'minimax-mcp' ||
    modelLower.includes('mcp');
  if (isMiniMaxProvider(config) && wantsMcp) {
    return `MiniMax MCP understand_image`;
  }
  if (isMiniMaxProvider(config)) {
    return `MiniMax VLM (${config.model}) via ${config.baseUrl || 'anthropic-compat'}`;
  }
  return `${config.name || 'Vision'} (${config.model})`;
}