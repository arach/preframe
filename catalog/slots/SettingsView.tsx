'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { MODEL_SLOTS, type ModelSlotId } from '../../lib/model-slots';
import type { ModelConfig } from '../../lib/provider';
import { apiClient } from '../lib/api-client';

type SlotFormState = {
  form: ModelConfig;
  enabled: boolean;
  hasKey: boolean;
  keyEdited: boolean;
  showKey: boolean;
};

type SettingsPayload = {
  llm: ModelConfig & { hasKey?: boolean };
  vlm?: (ModelConfig & { hasKey?: boolean }) | null;
  music?: (ModelConfig & { hasKey?: boolean }) | null;
  image?: (ModelConfig & { hasKey?: boolean }) | null;
  enabled?: Record<ModelSlotId, boolean>;
};

function slotFromApi(slotId: ModelSlotId, data: SettingsPayload): SlotFormState {
  const def = MODEL_SLOTS.find(s => s.id === slotId)!;
  const remote = data[slotId] ?? null;
  const enabled = data.enabled?.[slotId] ?? (slotId === 'llm' ? true : !!remote);
  return {
    enabled,
    hasKey: remote?.hasKey ?? false,
    keyEdited: false,
    showKey: false,
    form: {
      format: remote?.format ?? def.defaultConfig.format,
      baseUrl: remote?.baseUrl ?? def.defaultConfig.baseUrl,
      apiKey: '',
      model: remote?.model ?? def.defaultConfig.model,
      name: remote?.name ?? def.defaultConfig.name,
    },
  };
}

type IngestForm = {
  kind: 'talkie' | 'folder';
  since: string;
  folder: string;
  analyze: boolean;
};

const DEFAULT_INGEST_FORM: IngestForm = {
  kind: 'talkie',
  since: '1d',
  folder: '~/Downloads',
  analyze: true,
};

export function SettingsView() {
  const [slots, setSlots] = useState<Record<ModelSlotId, SlotFormState>>(() =>
    Object.fromEntries(
      MODEL_SLOTS.map(slot => [slot.id, {
        enabled: !slot.optional,
        hasKey: false,
        keyEdited: false,
        showKey: false,
        form: { ...slot.defaultConfig },
      }]),
    ) as Record<ModelSlotId, SlotFormState>,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ingest, setIngest] = useState<IngestForm>(DEFAULT_INGEST_FORM);
  const [ingestSaving, setIngestSaving] = useState(false);
  const [ingestSaved, setIngestSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get('/api/settings/provider').then(r => r.json()),
      apiClient.get('/api/settings/ingest').then(r => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([data, ingestData]: [SettingsPayload, IngestForm | null]) => {
        setSlots(Object.fromEntries(
          MODEL_SLOTS.map(slot => [slot.id, slotFromApi(slot.id, data)]),
        ) as Record<ModelSlotId, SlotFormState>);
        if (ingestData) {
          setIngest({
            kind: ingestData.kind === 'folder' ? 'folder' : 'talkie',
            since: ingestData.since || '1d',
            folder: ingestData.folder || '~/Downloads',
            analyze: ingestData.analyze !== false,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateSlot = useCallback((slotId: ModelSlotId, patch: Partial<SlotFormState> | Partial<ModelConfig>, formPatch = false) => {
    setSlots(prev => {
      const current = prev[slotId];
      if (formPatch) {
        return {
          ...prev,
          [slotId]: {
            ...current,
            form: { ...current.form, ...(patch as Partial<ModelConfig>) },
          },
        };
      }
      return {
        ...prev,
        [slotId]: { ...current, ...(patch as Partial<SlotFormState>) },
      };
    });
    setSaved(false);
  }, []);

  const applyPreset = useCallback((slotId: ModelSlotId, config: Partial<ModelConfig>) => {
    setSlots(prev => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        form: { ...prev[slotId].form, ...config, apiKey: prev[slotId].form.apiKey },
        keyEdited: false,
      },
    }));
    setSaved(false);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    const { apiKey: llmApiKey, ...llmForm } = slots.llm.form;
    const body: Record<string, unknown> = {
      enabled: Object.fromEntries(
        MODEL_SLOTS.map(slot => [slot.id, slots[slot.id].enabled]),
      ),
      llm: {
        ...llmForm,
        ...(slots.llm.keyEdited && llmApiKey ? { apiKey: llmApiKey } : {}),
      },
    };

    for (const slot of MODEL_SLOTS) {
      if (slot.optional && slots[slot.id].enabled) {
        const state = slots[slot.id];
        const { apiKey, ...form } = state.form;
        body[slot.id] = {
          ...form,
          ...(state.keyEdited && apiKey ? { apiKey } : {}),
        };
      }
    }

    try {
      const res = await apiClient.fetch('/api/settings/provider', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json() as SettingsPayload;
        setSlots(Object.fromEntries(
          MODEL_SLOTS.map(slot => [slot.id, slotFromApi(slot.id, data)]),
        ) as Record<ModelSlotId, SlotFormState>);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }, [slots]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-white/20 text-[12px] font-mono tracking-wider uppercase">
        Loading settings…
      </div>
    );
  }

  return (
    <div className="px-6 py-5 max-w-xl space-y-8">
      <div>
        <h2 className="text-[16px] font-medium text-white/90 mb-1">Models</h2>
        <p className="text-[11px] text-white/35">
          Different models for different jobs. Pick the best provider per use case.
        </p>
      </div>

      {MODEL_SLOTS.map((slot, index) => {
        const state = slots[slot.id];
        const showFormatPicker = slot.allowedFormats.length > 1;

        return (
          <section
            key={slot.id}
            className={`pt-2 ${index > 0 ? 'border-t border-white/[0.06]' : ''}`}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-[14px] font-medium text-white/85 mb-1">{slot.title}</h3>
                <p className="text-[11px] text-white/35">{slot.description}</p>
              </div>
              {slot.optional && (
                <button
                  onClick={() => updateSlot(slot.id, { enabled: !state.enabled })}
                  className={`shrink-0 px-2.5 py-1.5 text-[10px] font-mono rounded-sm border transition-colors ${
                    state.enabled
                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-400/20'
                      : 'text-white/40 border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02]'
                  }`}
                >
                  {state.enabled ? 'Enabled' : 'Disabled'}
                </button>
              )}
            </div>

            {state.enabled ? (
              <>
                <div className="mb-6">
                  <label className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/25 mb-2 block">
                    Quick setup
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {slot.presets.map(p => (
                      <button
                        key={p.label}
                        onClick={() => applyPreset(slot.id, p.config)}
                        className={`px-2.5 py-1.5 text-[10px] font-mono rounded-sm border transition-colors ${
                          state.form.name === p.config.name
                            ? 'bg-cyan-500/10 text-cyan-300 border-cyan-400/20'
                            : 'text-white/40 hover:text-white/60 border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {showFormatPicker ? (
                  <Field label="Wire format">
                    <div className="flex flex-wrap gap-2">
                      {slot.allowedFormats.map(f => (
                        <button
                          key={f}
                          onClick={() => updateSlot(slot.id, { format: f }, true)}
                          className={`px-3 py-2 text-[11px] font-mono rounded-sm border transition-colors ${
                            state.form.format === f
                              ? 'bg-white/[0.06] text-white/80 border-white/[0.15]'
                              : 'text-white/30 border-white/[0.06] hover:border-white/[0.1] hover:text-white/50'
                          }`}
                        >
                          {formatLabel(f)}
                        </button>
                      ))}
                    </div>
                  </Field>
                ) : (
                  <Field label="Wire format">
                    <div className="text-[11px] font-mono text-white/45 px-1">{formatLabel(slot.allowedFormats[0])}</div>
                  </Field>
                )}

                {state.form.format === 'codex' ? (
                  <p className="text-[10px] text-white/35 font-mono mb-4 -mt-1">
                    Uses a long-running local Codex app-server (read-only sandbox, no approvals). Auth via your Codex CLI login — no API key.
                  </p>
                ) : (
                  <>
                    <Field label="Base URL" hint="Leave empty for the provider's default endpoint">
                      <input
                        type="text"
                        value={state.form.baseUrl}
                        onChange={e => updateSlot(slot.id, { baseUrl: e.target.value }, true)}
                        placeholder={slot.defaultConfig.baseUrl || (state.form.format === 'anthropic' ? 'https://api.anthropic.com' : 'https://api.openai.com/v1')}
                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] font-mono text-white/70 placeholder:text-white/15 outline-none focus:border-white/[0.2] transition-colors"
                      />
                    </Field>

                    <Field label="API Key">
                      <div className="relative">
                        <input
                          type={state.showKey ? 'text' : 'password'}
                          value={state.keyEdited ? state.form.apiKey : (state.hasKey ? '••••••••••••••••' : '')}
                          onChange={e => {
                            updateSlot(slot.id, { apiKey: e.target.value }, true);
                            updateSlot(slot.id, { keyEdited: true });
                          }}
                          onFocus={() => {
                            if (!state.keyEdited) {
                              updateSlot(slot.id, { apiKey: '' }, true);
                              updateSlot(slot.id, { keyEdited: true });
                            }
                          }}
                          placeholder="sk-..."
                          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-sm px-3 py-2 pr-10 text-[12px] font-mono text-white/70 placeholder:text-white/15 outline-none focus:border-white/[0.2] transition-colors"
                        />
                        <button
                          onClick={() => updateSlot(slot.id, { showKey: !state.showKey })}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                        >
                          {state.showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      {state.hasKey && !state.keyEdited && (
                        <div className="text-[10px] text-emerald-400/60 mt-1 font-mono">Key configured</div>
                      )}
                    </Field>
                  </>
                )}

                <Field label="Model ID">
                  <input
                    type="text"
                    value={state.form.model}
                    onChange={e => updateSlot(slot.id, { model: e.target.value }, true)}
                    placeholder={slot.defaultConfig.model}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] font-mono text-white/70 placeholder:text-white/15 outline-none focus:border-white/[0.2] transition-colors"
                  />
                </Field>

                <Field label="Display name" hint="Shown in queue activity logs">
                  <input
                    type="text"
                    value={state.form.name}
                    onChange={e => updateSlot(slot.id, { name: e.target.value }, true)}
                    placeholder={slot.defaultConfig.name}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] font-mono text-white/70 placeholder:text-white/15 outline-none focus:border-white/[0.2] transition-colors"
                  />
                </Field>
              </>
            ) : slot.id === 'vlm' && slots.llm.form.format !== 'anthropic' ? (
              <p className="text-[10px] text-amber-300/70 font-mono">
                No VLM configured — visual analysis will be skipped for this job mix.
              </p>
            ) : slot.id === 'image' ? (
              <p className="text-[10px] text-white/25 font-mono">
                Image generation isn&apos;t wired into jobs yet, but the slot is ready when we add it.
              </p>
            ) : null}
          </section>
        );
      })}

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 rounded-sm text-[11px] font-mono uppercase tracking-wider bg-cyan-400/[0.08] border border-cyan-400/20 text-cyan-300/90 hover:bg-cyan-400/[0.12] hover:text-cyan-200 transition-all disabled:opacity-50"
      >
        {saving ? <Loader2 size={12} className="animate-spin" /> : saved ? <Check size={12} /> : null}
        {saved ? 'Saved' : 'Save models'}
      </button>

      {/* Capture source — drives Assets "Import latest" + bun run process --saved */}
      <section className="pt-6 border-t border-white/[0.06] space-y-4">
        <div>
          <h2 className="text-[16px] font-medium text-white/90 mb-1">Capture source</h2>
          <p className="text-[11px] text-white/35">
            Optional import for Assets. Same pipeline as{' '}
            <code className="text-white/45">bun run process --saved</code>
            {' '}— Talkie clips or any folder (e.g. Downloads).
          </p>
        </div>

        <Field label="Source">
          <div className="flex gap-1.5">
            {(['talkie', 'folder'] as const).map(k => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setIngest(s => ({ ...s, kind: k }));
                  setIngestSaved(false);
                }}
                className={`px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-sm border transition-colors ${
                  ingest.kind === k
                    ? 'bg-cyan-500/10 text-cyan-300 border-cyan-400/25'
                    : 'text-white/40 border-white/[0.08] hover:border-white/[0.14]'
                }`}
              >
                {k === 'talkie' ? 'Talkie' : 'Folder'}
              </button>
            ))}
          </div>
        </Field>

        <Field
          label="Since"
          hint="Relative (1d, 12h, 30m) or calendar day (2026-07-10)"
        >
          <input
            type="text"
            value={ingest.since}
            onChange={e => {
              setIngest(s => ({ ...s, since: e.target.value }));
              setIngestSaved(false);
            }}
            placeholder="1d"
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] font-mono text-white/70 placeholder:text-white/15 outline-none focus:border-white/[0.2] transition-colors"
          />
        </Field>

        {ingest.kind === 'folder' && (
          <Field label="Folder path" hint="Absolute path or ~/…">
            <input
              type="text"
              value={ingest.folder}
              onChange={e => {
                setIngest(s => ({ ...s, folder: e.target.value }));
                setIngestSaved(false);
              }}
              placeholder="~/Downloads"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] font-mono text-white/70 placeholder:text-white/15 outline-none focus:border-white/[0.2] transition-colors"
            />
          </Field>
        )}

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={ingest.analyze}
            onChange={e => {
              setIngest(s => ({ ...s, analyze: e.target.checked }));
              setIngestSaved(false);
            }}
            className="rounded-sm border-white/20"
          />
          <span className="text-[11px] text-white/55">
            Analyze after import (enqueue MiniMax jobs)
          </span>
        </label>

        <button
          type="button"
          disabled={ingestSaving}
          onClick={async () => {
            setIngestSaving(true);
            try {
              const res = await apiClient.fetch('/api/settings/ingest', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ingest),
              });
              if (res.ok) {
                const data = (await res.json()) as IngestForm;
                setIngest({
                  kind: data.kind === 'folder' ? 'folder' : 'talkie',
                  since: data.since || '1d',
                  folder: data.folder || '~/Downloads',
                  analyze: data.analyze !== false,
                });
                setIngestSaved(true);
                setTimeout(() => setIngestSaved(false), 2000);
              }
            } finally {
              setIngestSaving(false);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-sm text-[11px] font-mono uppercase tracking-wider bg-white/[0.04] border border-white/[0.1] text-white/70 hover:text-white/90 hover:border-white/[0.16] transition-all disabled:opacity-50"
        >
          {ingestSaving ? (
            <Loader2 size={12} className="animate-spin" />
          ) : ingestSaved ? (
            <Check size={12} />
          ) : null}
          {ingestSaved ? 'Saved' : 'Save capture source'}
        </button>
      </section>
    </div>
  );
}

function formatLabel(format: ModelConfig['format']): string {
  switch (format) {
    case 'codex':
      return 'Codex (local)';
    case 'minimax-music':
      return 'MiniMax Music';
    case 'openai-images':
      return 'OpenAI Images';
    default:
      return format;
  }
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/25 mb-1.5 block">
        {label}
      </label>
      {children}
      {hint && <div className="text-[10px] text-white/15 mt-1">{hint}</div>}
    </div>
  );
}
