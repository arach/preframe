import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { getModelSlot, type ModelSlotId } from './model-slots';

export type ModelWireFormat = 'openai' | 'anthropic' | 'codex' | 'minimax-music' | 'openai-images';

export interface ModelConfig {
  format: ModelWireFormat;
  baseUrl: string;
  apiKey: string;
  model: string;
  name: string;
}

/** @deprecated Use ModelConfig */
export type ProviderConfig = ModelConfig;

export interface ProviderSettings {
  llm: ModelConfig;
  vlm?: ModelConfig | null;
  music?: ModelConfig | null;
  image?: ModelConfig | null;
}

export type RedactedModelConfig = ModelConfig & { hasKey: boolean };
/** @deprecated Use RedactedModelConfig */
export type RedactedProviderConfig = RedactedModelConfig;

export type RedactedProviderSettings = {
  llm: RedactedModelConfig;
  vlm: RedactedModelConfig | null;
  music: RedactedModelConfig | null;
  image: RedactedModelConfig | null;
  enabled: Record<ModelSlotId, boolean>;
};

const CONFIG_PATH = join(process.cwd(), '.data', 'provider.json');

const LLM_DEFAULTS = getModelSlot('llm').defaultConfig;

function envFallbackSettings(): ProviderSettings {
  const baseUrl = process.env.ANTHROPIC_BASE_URL ?? '';
  const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
  const model = process.env.LLM_MODEL ?? '';
  if (apiKey) {
    return {
      llm: {
        format: 'anthropic',
        baseUrl,
        apiKey,
        model,
        name: baseUrl.includes('minimax') ? 'MiniMax' : baseUrl.includes('anthropic.com') ? 'Anthropic' : 'Custom',
      },
    };
  }
  return { llm: { ...LLM_DEFAULTS } };
}

const WIRE_FORMATS = new Set<ModelWireFormat>(['openai', 'anthropic', 'codex', 'minimax-music', 'openai-images']);

function normalizeModelConfig(raw: unknown): ModelConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<ModelConfig>;
  if (!value.format || !WIRE_FORMATS.has(value.format)) return null;
  return {
    format: value.format,
    baseUrl: value.baseUrl ?? '',
    apiKey: value.apiKey ?? '',
    model: value.model ?? '',
    name: value.name ?? '',
  };
}

function inferMiniMaxMusicFrom(config: ModelConfig | null | undefined): ModelConfig | undefined {
  if (!config || !isMiniMaxProvider(config)) return undefined;
  if (!config.apiKey && !process.env.MINIMAX_API_KEY) return undefined;
  return {
    format: 'minimax-music',
    baseUrl: config.baseUrl.includes('minimax') ? 'https://api.minimax.io' : config.baseUrl,
    apiKey: config.apiKey,
    model: 'music-2.6',
    name: 'MiniMax Music',
  };
}

function migrateLegacySettings(parsed: Record<string, unknown>): ProviderSettings {
  const nestedLlm = normalizeModelConfig(parsed.llm);
  if (nestedLlm) {
    const vlm =
      normalizeModelConfig(parsed.vlm) ??
      normalizeModelConfig(parsed.vision);
    const music = normalizeModelConfig(parsed.music);
    const image = normalizeModelConfig(parsed.image);
    return {
      llm: nestedLlm,
      vlm: vlm?.format === 'anthropic' ? vlm : undefined,
      music: music?.format === 'minimax-music' ? music : inferMiniMaxMusicFrom(vlm) ?? inferMiniMaxMusicFrom(nestedLlm),
      image: image?.format === 'openai-images' ? image : undefined,
    };
  }

  const { vision, vlm, music, image, ...rest } = parsed;
  const llm = normalizeModelConfig(rest) ?? { ...LLM_DEFAULTS };
  const legacyVlm =
    normalizeModelConfig(vlm) ??
    normalizeModelConfig(vision);
  const settings: ProviderSettings = { llm };
  if (legacyVlm?.format === 'anthropic') {
    settings.vlm = legacyVlm;
  } else if (llm.format === 'anthropic' && llm.apiKey && llm.model) {
    settings.vlm = { ...llm };
  }
  settings.music =
    normalizeModelConfig(music) ??
    inferMiniMaxMusicFrom(settings.vlm) ??
    inferMiniMaxMusicFrom(llm);
  const legacyImage = normalizeModelConfig(image);
  if (legacyImage?.format === 'openai-images') {
    settings.image = legacyImage;
  }
  return settings;
}

export function readProviderSettings(): ProviderSettings {
  try {
    const parsed = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')) as Record<string, unknown>;
    return migrateLegacySettings(parsed);
  } catch {
    return envFallbackSettings();
  }
}

export function readModelConfig(slot: ModelSlotId): ModelConfig | null {
  const settings = readProviderSettings();
  if (slot === 'llm') return settings.llm;
  return settings[slot] ?? null;
}

/** LLM config for composition, revision, and inference. */
export function readProviderConfig(): ModelConfig {
  return readProviderSettings().llm;
}

/**
 * VLM config for storyboard and per-frame analysis.
 *
 * Wire format is always `anthropic` (Messages API). The default product VLM is
 * **MiniMax** via `https://api.minimax.io/anthropic` — not Anthropic Claude.
 * Auth is MiniMax's key (`apiKey` on the slot or `MINIMAX_API_KEY`).
 *
 * Falls back to the MiniMax VLM slot defaults when env has `MINIMAX_API_KEY`
 * even if Settings never saved a `vlm` entry (common when only LLM was set).
 */
export function readVlmProviderConfig(): ModelConfig | null {
  const settings = readProviderSettings();
  let candidate =
    settings.vlm ??
    (settings.llm.format === 'anthropic' && isMiniMaxProvider(settings.llm)
      ? settings.llm
      : settings.llm.format === 'anthropic' && settings.llm.apiKey && settings.llm.model
        ? settings.llm
        : null);

  if (!candidate && process.env.MINIMAX_API_KEY) {
    candidate = { ...getModelSlot('vlm').defaultConfig };
  }

  if (!candidate) return null;
  // VLM slot only allows anthropic-compatible endpoints (MiniMax or Claude).
  if (candidate.format !== 'anthropic') return null;
  if (!candidate.model) return null;
  if (!candidate.apiKey && !getMiniMaxApiKey(candidate)) return null;
  return candidate;
}

/** @deprecated Use readVlmProviderConfig */
export function readVisionProviderConfig(): ModelConfig | null {
  return readVlmProviderConfig();
}

/** Music generation config. */
export function readMusicModelConfig(): ModelConfig | null {
  const settings = readProviderSettings();
  const candidate = settings.music;
  if (candidate?.format === 'minimax-music' && candidate.model) {
    if (candidate.apiKey || getMiniMaxApiKey(candidate)) return candidate;
  }
  return inferMiniMaxMusicFrom(settings.vlm) ?? inferMiniMaxMusicFrom(settings.llm) ?? null;
}

/** Image generation config. */
export function readImageModelConfig(): ModelConfig | null {
  const candidate = readProviderSettings().image;
  if (!candidate || candidate.format !== 'openai-images') return null;
  if (!candidate.model || !candidate.apiKey) return null;
  return candidate;
}

export function isMiniMaxProvider(config: Pick<ModelConfig, 'name' | 'baseUrl' | 'model' | 'format'>): boolean {
  return (
    config.format === 'minimax-music' ||
    config.name.toLowerCase().includes('minimax') ||
    config.baseUrl.toLowerCase().includes('minimax') ||
    config.model.toLowerCase().includes('minimax')
  );
}

export function getMiniMaxApiKey(config: ModelConfig): string {
  if (isMiniMaxProvider(config) && config.apiKey) return config.apiKey;
  return process.env.MINIMAX_API_KEY ?? '';
}

function normalizeSlotForWrite(config: ModelConfig, slot: ModelSlotId): ModelConfig {
  const def = getModelSlot(slot);
  return {
    format: def.allowedFormats.includes(config.format) ? config.format : def.defaultFormat,
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    model: config.model,
    name: config.name,
  };
}

export function writeProviderSettings(settings: ProviderSettings): void {
  mkdirSync(join(process.cwd(), '.data'), { recursive: true });
  const payload: ProviderSettings = {
    llm: normalizeSlotForWrite(settings.llm, 'llm'),
  };
  for (const slot of ['vlm', 'music', 'image'] as const) {
    if (settings[slot]) {
      payload[slot] = normalizeSlotForWrite(settings[slot]!, slot);
    }
  }
  writeFileSync(CONFIG_PATH, JSON.stringify(payload, null, 2));
}

export function writeProviderConfig(config: ModelConfig): void {
  const current = readProviderSettings();
  writeProviderSettings({ ...current, llm: config });
}

export function isProviderConfigured(): boolean {
  const config = readProviderConfig();
  if (!config.model) return false;
  if (config.format === 'codex') return true;
  return !!config.apiKey;
}

export function isVlmProviderConfigured(): boolean {
  return !!readVlmProviderConfig();
}

/** @deprecated Use isVlmProviderConfigured */
export function isVisionProviderConfigured(): boolean {
  return isVlmProviderConfigured();
}

export function isMusicModelConfigured(): boolean {
  return !!readMusicModelConfig();
}

function redactModel(config: ModelConfig): RedactedModelConfig {
  return {
    ...config,
    apiKey: config.apiKey ? `${config.apiKey.slice(0, 8)}…${config.apiKey.slice(-4)}` : '',
    hasKey: !!config.apiKey || (isMiniMaxProvider(config) && !!process.env.MINIMAX_API_KEY),
  };
}

export function redactConfig(config: ModelConfig): RedactedModelConfig {
  return redactModel(config);
}

export function redactProviderSettings(settings: ProviderSettings): RedactedProviderSettings {
  return {
    llm: redactModel(settings.llm),
    vlm: settings.vlm ? redactModel(settings.vlm) : null,
    music: settings.music ? redactModel(settings.music) : null,
    image: settings.image ? redactModel(settings.image) : null,
    enabled: {
      llm: true,
      vlm: !!settings.vlm,
      music: !!settings.music,
      image: !!settings.image,
    },
  };
}

export const DEFAULT_VLM = getModelSlot('vlm').defaultConfig;