'use client';

import { useState } from 'react';

interface Candidate {
  id: string;
  name: string;
  svg: string;
  bucket: string;
  pairId?: string;
  state?: 'idle' | 'recording';
}

interface Bucket {
  id: string;
  label: string;
  description: string;
  candidates: Candidate[];
}

const SCALES = [16, 64, 256, 1024] as const;
type Scale = typeof SCALES[number];

export function MarksGallery({ buckets }: { buckets: Bucket[] }) {
  const [scale, setScale] = useState<Scale>(256);

  const totalCandidates = buckets.reduce((sum, b) => sum + b.candidates.length, 0);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0E0D0A',
        color: '#F4EFE6',
        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
        padding: '32px 48px 80px',
      }}
    >
      <header style={{ marginBottom: 32 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#7A6E5C',
            marginBottom: 8,
          }}
        >
          Talkie · Mark Exploration · Round 4
        </div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 400,
            margin: 0,
            color: '#F4EFE6',
          }}
        >
          Divergent shape candidates
        </h1>
        <p
          style={{
            fontSize: 13,
            color: '#B8B2A4',
            maxWidth: '64ch',
            lineHeight: 1.55,
            marginTop: 8,
          }}
        >
          {totalCandidates} candidates across 4 direction buckets. Letterless where possible.
          The locked <code style={{ color: '#E68A3C' }}>t</code> is not in play this round.
          Mics off-limits. Palette respected. Use the scale toggle to test the legibility ladder.
        </p>
      </header>

      {/* Scale toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
        <span
          style={{
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#7A6E5C',
          }}
        >
          Scale
        </span>
        {SCALES.map(s => (
          <button
            key={s}
            onClick={() => setScale(s)}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              fontFamily: 'inherit',
              backgroundColor: scale === s ? '#F4EFE6' : 'transparent',
              color: scale === s ? '#0E0D0A' : '#B8B2A4',
              border: `1px solid ${scale === s ? '#F4EFE6' : '#3A372F'}`,
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 120ms ease',
            }}
          >
            {s}px
          </button>
        ))}
      </div>

      {buckets.map(bucket => (
        <section key={bucket.id} style={{ marginBottom: 56 }}>
          <header style={{ marginBottom: 20, borderTop: '1px solid #23201a', paddingTop: 16 }}>
            <div
              style={{
                fontSize: 14,
                letterSpacing: '0.06em',
                color: '#F4EFE6',
                marginBottom: 4,
              }}
            >
              {bucket.label}
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#7A6E5C',
                fontStyle: 'italic',
              }}
            >
              {bucket.description}
            </div>
          </header>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            {bucket.candidates.map(c => (
              <div
                key={c.id}
                style={{
                  border: '1px solid #23201a',
                  borderRadius: 8,
                  padding: 16,
                  backgroundColor: '#16140e',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: scale > 256 ? 256 : scale,
                    height: scale > 256 ? 256 : scale,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#0E0D0A',
                    borderRadius: 4,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{ width: scale, height: scale, lineHeight: 0 }}
                    dangerouslySetInnerHTML={{ __html: c.svg.replace('<svg ', `<svg width="${scale}" height="${scale}" `) }}
                  />
                </div>
                <div style={{ width: '100%', textAlign: 'left' }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#F4EFE6',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {c.id}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: '#7A6E5C',
                      marginTop: 2,
                      textTransform: 'lowercase',
                    }}
                  >
                    {c.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <footer style={{ marginTop: 80, fontSize: 10, color: '#7A6E5C' }}>
        <div>Round 4 · Track 1 (SVG / vector) · Preframe</div>
        <div>Assets: <code>preframe/assets/talkie-marks-round-4/</code></div>
      </footer>
    </div>
  );
}
