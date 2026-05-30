'use client';

import { useState } from 'react';
import { LAYER_SPECS } from '../defaults';
import { useFrameDesigner } from '../Provider';
import type { FieldSpec, Layer } from '../types';

export function FrameDesignerPropsPanel() {
  const {
    preset,
    selectedId,
    dirty,
    showSafeArea,
    setShowSafeArea,
    updateProps,
    savePreset,
    resetCanvas,
  } = useFrameDesigner();

  const [saveName, setSaveName] = useState('');

  const selected = preset.layers.find((l) => l.id === selectedId) ?? null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 12,
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
        fontSize: 11,
        color: 'rgba(220, 224, 232, 0.86)',
        overflowY: 'auto',
        height: '100%',
      }}
    >
      <Section title="Frame">
        <label style={row()}>
          <span style={lbl()}>Name</span>
          <input
            value={preset.name}
            onChange={(e) =>
              // we mutate name directly through Provider via savePreset(name)
              setSaveName(e.target.value)
            }
            placeholder={preset.name}
            style={inp()}
          />
        </label>
        <label style={row()}>
          <span style={lbl()}>Canvas</span>
          <span style={{ color: 'rgba(180,190,210,0.65)' }}>
            {preset.canvas.width} × {preset.canvas.height}
          </span>
        </label>
        <label style={row()}>
          <span style={lbl()}>Safe area</span>
          <input
            type="checkbox"
            checked={showSafeArea}
            onChange={(e) => setShowSafeArea(e.target.checked)}
          />
        </label>

        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <button
            onClick={() => savePreset(saveName || preset.name)}
            style={primaryBtn(dirty)}
          >
            {dirty ? 'Save changes' : 'Saved'}
          </button>
          <button onClick={resetCanvas} style={btn()}>
            Reset
          </button>
        </div>
      </Section>

      <Section
        title={
          selected
            ? `Layer · ${LAYER_SPECS[selected.type].label}`
            : 'Layer · (none selected)'
        }
      >
        {selected ? (
          <LayerFields
            layer={selected}
            onChange={(patch) => updateProps(selected.id, patch)}
          />
        ) : (
          <div style={{ color: 'rgba(180,190,210,0.5)', padding: '4px 6px' }}>
            Click a layer in the left panel to edit its props.
          </div>
        )}
      </Section>
    </div>
  );
}

function LayerFields({
  layer,
  onChange,
}: {
  layer: Layer;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  const spec = LAYER_SPECS[layer.type];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {spec.fields.map((field) => (
        <FieldRow
          key={field.key}
          field={field}
          value={layer.props[field.key]}
          onChange={(v) => onChange({ [field.key]: v })}
        />
      ))}
    </div>
  );
}

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: FieldSpec;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const label = field.label ?? field.key;

  switch (field.type) {
    case 'boolean':
      return (
        <label style={row()}>
          <span style={lbl()}>{label}</span>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
        </label>
      );

    case 'number':
      return (
        <label style={row()}>
          <span style={lbl()}>{label}</span>
          <input
            type="number"
            value={typeof value === 'number' ? value : ''}
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            onChange={(e) => onChange(Number(e.target.value))}
            style={{ ...inp(), width: 84 }}
          />
        </label>
      );

    case 'color':
      return (
        <label style={row()}>
          <span style={lbl()}>{label}</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="color"
              value={normalizeColorForInput(value)}
              onChange={(e) => onChange(e.target.value)}
              style={{ width: 32, height: 26, padding: 0, border: 'none', background: 'transparent' }}
            />
            <input
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => onChange(e.target.value)}
              style={{ ...inp(), width: 120 }}
            />
          </div>
        </label>
      );

    case 'enum':
      return (
        <label style={row()}>
          <span style={lbl()}>{label}</span>
          <select
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            style={inp()}
          >
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      );

    case 'text':
      return (
        <label style={{ ...row(), alignItems: 'flex-start' }}>
          <span style={lbl()}>{label}</span>
          <textarea
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            style={{ ...inp(), width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
          />
        </label>
      );

    case 'string[]':
      return (
        <label style={row()}>
          <span style={lbl()}>{label}</span>
          <input
            value={Array.isArray(value) ? (value as string[]).join(', ') : ''}
            onChange={(e) =>
              onChange(
                e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
            style={inp()}
          />
        </label>
      );

    case 'string':
    default:
      return (
        <label style={row()}>
          <span style={lbl()}>{label}</span>
          <input
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            style={inp()}
          />
        </label>
      );
  }
}

function normalizeColorForInput(v: unknown): string {
  if (typeof v !== 'string') return '#7c9eb2';
  // <input type="color"> only accepts #rrggbb — fall back if rgba/named.
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v;
  return '#7c9eb2';
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(180,190,210,0.55)',
          paddingLeft: 6,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function row(): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '4px 6px',
  };
}
function lbl(): React.CSSProperties {
  return {
    flex: '0 0 110px',
    color: 'rgba(180,190,210,0.65)',
    fontSize: 10,
    letterSpacing: '0.04em',
  };
}
function inp(): React.CSSProperties {
  return {
    flex: 1,
    background: 'rgba(160, 170, 190, 0.06)',
    border: '1px solid rgba(160, 170, 190, 0.18)',
    color: 'rgba(220, 224, 232, 0.92)',
    padding: '4px 7px',
    borderRadius: 3,
    fontFamily: 'inherit',
    fontSize: 11,
    outline: 'none',
  };
}
function btn(): React.CSSProperties {
  return {
    padding: '6px 10px',
    border: '1px solid rgba(160, 170, 190, 0.18)',
    background: 'rgba(160, 170, 190, 0.05)',
    color: 'inherit',
    cursor: 'pointer',
    borderRadius: 4,
    fontFamily: 'inherit',
    fontSize: 11,
  };
}
function primaryBtn(active: boolean): React.CSSProperties {
  return {
    ...btn(),
    background: active ? 'rgba(124, 158, 178, 0.22)' : 'rgba(160, 170, 190, 0.05)',
    borderColor: active ? 'rgba(124, 158, 178, 0.55)' : 'rgba(160, 170, 190, 0.18)',
    cursor: active ? 'pointer' : 'default',
  };
}
