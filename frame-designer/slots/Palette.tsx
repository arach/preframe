'use client';

import { ALL_LAYER_TYPES, LAYER_SPECS } from '../defaults';
import { useFrameDesigner } from '../Provider';

export function FrameDesignerPalette() {
  const {
    preset,
    selectedId,
    presetList,
    addLayer,
    selectLayer,
    toggleVisibility,
    moveLayer,
    removeLayer,
    loadPreset,
  } = useFrameDesigner();

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
      <Section title="Add layer">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {ALL_LAYER_TYPES.map((t) => {
            const spec = LAYER_SPECS[t];
            return (
              <button
                key={t}
                onClick={() => addLayer(t)}
                style={btn()}
                title={spec.description}
              >
                <span style={{ fontWeight: 600 }}>{spec.label}</span>
                <span style={{ color: 'rgba(180,190,210,0.55)', fontSize: 10 }}>
                  {spec.description}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title={`Layers (${preset.layers.length})`}>
        {preset.layers.length === 0 ? (
          <div style={{ color: 'rgba(180,190,210,0.5)', fontSize: 11, padding: '4px 6px' }}>
            Empty frame. Add a layer above.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(() => {
              const monitorIdx = preset.layers.findIndex(
                (l) => l.visible && l.type === 'MonitorFrame',
              );
              return preset.layers.map((l, i) => {
                const selected = l.id === selectedId;
                const inScreen =
                  monitorIdx !== -1 && i > monitorIdx && l.type !== 'MonitorFrame';
                return (
                <div
                  key={l.id}
                  onClick={() => selectLayer(l.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 8px',
                    cursor: 'pointer',
                    borderRadius: 4,
                    background: selected
                      ? 'rgba(124, 158, 178, 0.18)'
                      : 'rgba(160, 170, 190, 0.04)',
                    border: `1px solid ${
                      selected ? 'rgba(124, 158, 178, 0.45)' : 'rgba(160, 170, 190, 0.10)'
                    }`,
                  }}
                >
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisibility(l.id);
                    }}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: l.visible ? '#7c9eb2' : 'transparent',
                      border: '1px solid rgba(180,190,210,0.4)',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, opacity: l.visible ? 1 : 0.5 }}>
                    {LAYER_SPECS[l.type].label}
                  </span>
                  {inScreen && (
                    <span
                      title="Renders inside the MonitorFrame's screen"
                      style={{
                        fontSize: 8,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'rgba(124, 158, 178, 0.85)',
                        border: '1px solid rgba(124, 158, 178, 0.35)',
                        borderRadius: 3,
                        padding: '1px 4px',
                        flexShrink: 0,
                      }}
                    >
                      in screen
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(l.id, 'up');
                    }}
                    disabled={i === 0}
                    style={iconBtn()}
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(l.id, 'down');
                    }}
                    disabled={i === preset.layers.length - 1}
                    style={iconBtn()}
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLayer(l.id);
                    }}
                    style={iconBtn()}
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </div>
              );
              });
            })()}
          </div>
        )}
      </Section>

      <Section title={`Presets (${presetList.length})`}>
        {presetList.length === 0 ? (
          <div style={{ color: 'rgba(180,190,210,0.5)', padding: '4px 6px' }}>
            No saved presets yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {presetList.map((p) => (
              <button key={p.name} onClick={() => loadPreset(p.name)} style={btn()}>
                <span style={{ fontWeight: 600 }}>{p.title ?? p.name}</span>
                {p.description && (
                  <span style={{ color: 'rgba(180,190,210,0.55)', fontSize: 10 }}>
                    {p.description}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
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

function btn(): React.CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    alignItems: 'flex-start',
    textAlign: 'left',
    padding: '8px 10px',
    border: '1px solid rgba(160, 170, 190, 0.12)',
    background: 'rgba(160, 170, 190, 0.04)',
    color: 'inherit',
    cursor: 'pointer',
    borderRadius: 4,
    fontFamily: 'inherit',
    fontSize: 11,
  };
}

function iconBtn(): React.CSSProperties {
  return {
    width: 22,
    height: 22,
    padding: 0,
    border: '1px solid rgba(160, 170, 190, 0.12)',
    background: 'transparent',
    color: 'rgba(180,190,210,0.7)',
    cursor: 'pointer',
    borderRadius: 3,
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
}
