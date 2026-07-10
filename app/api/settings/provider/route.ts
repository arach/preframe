import { NextResponse } from 'next/server';
import {
  getModelSlot,
  MODEL_SLOTS,
  type ModelSlotId,
} from '@/lib/model-slots';
import {
  readProviderSettings,
  writeProviderSettings,
  redactProviderSettings,
  type ModelConfig,
  type ProviderSettings,
} from '@/lib/provider';

function mergeModelConfig(
  current: ModelConfig,
  body: Partial<ModelConfig> | null | undefined,
): ModelConfig | null | undefined {
  if (body === undefined) return undefined;
  if (body === null) return null;
  return {
    format: body.format ?? current.format,
    baseUrl: body.baseUrl ?? current.baseUrl,
    apiKey: body.apiKey !== undefined ? body.apiKey : current.apiKey,
    model: body.model ?? current.model,
    name: body.name ?? current.name,
  };
}

function validateSlotConfig(slot: ModelSlotId, config: ModelConfig | null | undefined): string | null {
  if (!config) return null;
  const def = getModelSlot(slot);
  if (!def.allowedFormats.includes(config.format)) {
    return `${slot} must use one of: ${def.allowedFormats.join(', ')}`;
  }
  return null;
}

export async function GET() {
  const config = readProviderSettings();
  return NextResponse.json(redactProviderSettings(config));
}

export async function PUT(request: Request) {
  const body = await request.json() as Partial<ProviderSettings> & {
    enabled?: Partial<Record<ModelSlotId, boolean>>;
    // Legacy
    vlmEnabled?: boolean;
    visionEnabled?: boolean;
    vision?: Partial<ModelConfig> | null;
    format?: ModelConfig['format'];
    baseUrl?: string;
    apiKey?: string;
    model?: string;
    name?: string;
  };

  const current = readProviderSettings();
  const llmPatch = body.llm ?? (body.format || body.model || body.name || body.baseUrl || body.apiKey !== undefined
    ? {
      format: body.format,
      baseUrl: body.baseUrl,
      apiKey: body.apiKey,
      model: body.model,
      name: body.name,
    }
    : undefined);
  const llm = mergeModelConfig(current.llm, llmPatch) ?? current.llm;

  const enabled = {
    llm: true,
    vlm: body.enabled?.vlm ?? body.vlmEnabled ?? body.visionEnabled ?? !!current.vlm,
    music: body.enabled?.music ?? !!current.music,
    image: body.enabled?.image ?? !!current.image,
  };

  const next: ProviderSettings = { llm };

  for (const slot of MODEL_SLOTS) {
    if (slot.id === 'llm') continue;
    const slotId = slot.id;
    const patch = body[slotId] ?? (slotId === 'vlm' ? body.vision : undefined);
    if (!enabled[slotId]) continue;
    const merged = mergeModelConfig(current[slotId] ?? slot.defaultConfig, patch ?? undefined);
    if (merged) next[slotId] = merged;
  }

  const llmError = validateSlotConfig('llm', next.llm);
  if (llmError) return NextResponse.json({ error: llmError }, { status: 400 });
  for (const slot of MODEL_SLOTS) {
    if (slot.id === 'llm') continue;
    const error = validateSlotConfig(slot.id, next[slot.id]);
    if (error) return NextResponse.json({ error }, { status: 400 });
  }

  writeProviderSettings(next);
  return NextResponse.json(redactProviderSettings(next));
}