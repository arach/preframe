import type { ModelConfig, ModelWireFormat } from './provider';

export type ModelSlotId = 'llm' | 'vlm' | 'music' | 'image';

export interface ModelSlotDef {
  id: ModelSlotId;
  title: string;
  description: string;
  optional: boolean;
  allowedFormats: ModelWireFormat[];
  defaultFormat: ModelWireFormat;
  defaultConfig: ModelConfig;
  presets: { label: string; config: Partial<ModelConfig> }[];
}

export const MODEL_SLOTS: ModelSlotDef[] = [
  {
    id: 'llm',
    title: 'LLM',
    description: 'Text model for composition plans, revisions, and music ideation. Codex uses a long-running local runner.',
    optional: false,
    allowedFormats: ['codex', 'openai', 'anthropic'],
    defaultFormat: 'codex',
    defaultConfig: {
      format: 'codex',
      baseUrl: '',
      apiKey: '',
      model: 'gpt-5.5',
      name: 'Codex',
    },
    presets: [
      { label: 'Codex (local runner)', config: { format: 'codex', baseUrl: '', model: 'gpt-5.5', name: 'Codex' } },
      { label: 'OpenAI API', config: { format: 'openai', baseUrl: '', model: 'gpt-5.5', name: 'OpenAI' } },
      { label: 'OpenAI (gpt-4o)', config: { format: 'openai', baseUrl: '', model: 'gpt-4o', name: 'OpenAI' } },
      { label: 'Anthropic', config: { format: 'anthropic', baseUrl: '', model: 'claude-sonnet-4-20250514', name: 'Anthropic' } },
      { label: 'Groq', config: { format: 'openai', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile', name: 'Groq' } },
      { label: 'Together', config: { format: 'openai', baseUrl: 'https://api.together.xyz/v1', model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Together' } },
      { label: 'Fireworks', config: { format: 'openai', baseUrl: 'https://api.fireworks.ai/inference/v1', model: 'accounts/fireworks/models/llama-v3p3-70b-instruct', name: 'Fireworks' } },
      { label: 'DeepSeek', config: { format: 'openai', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat', name: 'DeepSeek' } },
    ],
  },
  {
    id: 'vlm',
    title: 'VLM',
    description: 'Vision model for storyboard extraction and per-frame analysis.',
    optional: true,
    allowedFormats: ['anthropic'],
    defaultFormat: 'anthropic',
    // MiniMax Anthropic-compat: only MiniMax-M3 accepts type=image (and video).
    // M2.x models silently ignore image blocks and reply as if no image was sent.
    defaultConfig: {
      format: 'anthropic',
      baseUrl: 'https://api.minimax.io/anthropic',
      apiKey: '',
      model: 'MiniMax-M3',
      name: 'MiniMax',
    },
    presets: [
      { label: 'MiniMax M3 (vision)', config: { format: 'anthropic', baseUrl: 'https://api.minimax.io/anthropic', model: 'MiniMax-M3', name: 'MiniMax' } },
      { label: 'Anthropic', config: { format: 'anthropic', baseUrl: '', model: 'claude-sonnet-4-20250514', name: 'Anthropic' } },
    ],
  },
  {
    id: 'music',
    title: 'Music',
    description: 'Music generation model for soundtracks and catalog track creation.',
    optional: true,
    allowedFormats: ['minimax-music'],
    defaultFormat: 'minimax-music',
    defaultConfig: {
      format: 'minimax-music',
      baseUrl: 'https://api.minimax.io',
      apiKey: '',
      model: 'music-2.6',
      name: 'MiniMax Music',
    },
    presets: [
      { label: 'MiniMax Music', config: { format: 'minimax-music', baseUrl: 'https://api.minimax.io', model: 'music-2.6', name: 'MiniMax Music' } },
    ],
  },
  {
    id: 'image',
    title: 'Image',
    description: 'Image generation model for stills, thumbnails, and visual assets.',
    optional: true,
    allowedFormats: ['openai-images'],
    defaultFormat: 'openai-images',
    defaultConfig: {
      format: 'openai-images',
      baseUrl: '',
      apiKey: '',
      model: 'gpt-image-1',
      name: 'OpenAI Images',
    },
    presets: [
      { label: 'OpenAI Images', config: { format: 'openai-images', baseUrl: '', model: 'gpt-image-1', name: 'OpenAI Images' } },
    ],
  },
];

export function getModelSlot(id: ModelSlotId): ModelSlotDef {
  const slot = MODEL_SLOTS.find(s => s.id === id);
  if (!slot) throw new Error(`Unknown model slot: ${id}`);
  return slot;
}