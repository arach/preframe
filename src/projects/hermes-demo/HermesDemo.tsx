/**
 * HermesDemo — visual effects showcase composition.
 *
 * Demonstrates all HermesEffects layers + GlassPanel variants at 1920×1080.
 * Sequence: 4 sections × 5s each = 20s total.
 *   0-5s:   Full effects on dark field — grain, scanlines, vignette visible
 *   5-10s:  Holographic shimmer solo highlight
 *  10-15s:  CA filter on glass panels
 *  15-20s:  All combined with teal/orange grade
 */

import React from 'react'
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from 'remotion'
import { HermesEffects } from '../../components/HermesEffects'
import { GlassPanel } from '../../components/GlassPanel'

const W = 1920
const H = 1080
const FPS = 30
export const HERMES_DEMO_FRAMES = 20 * FPS

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))

const Section: React.FC<{
  label: string
  sublabel: string
  from: number
  children: React.ReactNode
}> = ({ label, sublabel, from, children }) => {
  const frame = useCurrentFrame()
  const fadeIn  = clamp((frame - from) / 18)
  const fadeOut = clamp(((from + 150) - frame) / 12)
  const opacity = Math.min(fadeIn, fadeOut)

  return (
    <AbsoluteFill style={{ opacity }}>
      {children}
      {/* Label bottom-left — reel aesthetic */}
      <div
        style={{
          position: 'absolute',
          left: 72,
          bottom: 72,
          display: 'flex',
          alignItems: 'stretch',
          gap: 16,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}
      >
        <div style={{ width: 2, background: 'rgba(0,210,185,0.7)', borderRadius: 1, minHeight: 44 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, letterSpacing: '0.35em', color: 'rgba(255,255,255,0.42)', textTransform: 'uppercase' }}>
            Hermes FX
          </span>
          <span style={{ fontSize: 32, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.92)', lineHeight: 1 }}>
            {label}
          </span>
          <span style={{ fontSize: 13, letterSpacing: '0.15em', color: 'rgba(0,210,185,0.72)', marginTop: 2 }}>
            {sublabel}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  )
}

export const HermesDemo: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <AbsoluteFill style={{ backgroundColor: '#050810' }}>

      {/* ── Shared background: subtle grid ─────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0,200,180,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,200,180,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* ══ Section 1 (0–5s): Full effects demo ════════════════════════════ */}
      <Sequence from={0} durationInFrames={5 * FPS}>
        <Section label="Full Stack" sublabel="grain · scanlines · grade · vignette" from={0}>
          {/* Three glass panels in a row */}
          <GlassPanel x={120} y={200} w={520} h={340} tint="teal" r={20}>
            <div style={{ padding: 32, color: 'rgba(255,255,255,0.82)', fontFamily: 'ui-monospace, monospace' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.3em', color: 'rgba(0,210,185,0.7)', marginBottom: 12 }}>TEAL PANEL</div>
              <div style={{ fontSize: 18, marginBottom: 8 }}>Glass morphism base</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.46)', lineHeight: 1.6 }}>
                backdrop-filter blur<br/>
                teal border 28% opacity<br/>
                inner top highlight
              </div>
            </div>
          </GlassPanel>

          <GlassPanel x={700} y={200} w={520} h={340} tint="neutral" r={20}>
            <div style={{ padding: 32, color: 'rgba(255,255,255,0.82)', fontFamily: 'ui-monospace, monospace' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>NEUTRAL PANEL</div>
              <div style={{ fontSize: 18, marginBottom: 8 }}>Default glass tone</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.46)', lineHeight: 1.6 }}>
                10% white border<br/>
                dark frosted base<br/>
                subtle top sheen
              </div>
            </div>
          </GlassPanel>

          <GlassPanel x={1280} y={200} w={520} h={340} tint="orange" r={20}>
            <div style={{ padding: 32, color: 'rgba(255,255,255,0.82)', fontFamily: 'ui-monospace, monospace' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.3em', color: 'rgba(240,130,50,0.8)', marginBottom: 12 }}>ORANGE PANEL</div>
              <div style={{ fontSize: 18, marginBottom: 8 }}>Warm accent tone</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.46)', lineHeight: 1.6 }}>
                amber border<br/>
                warm frosted base<br/>
                orange highlight
              </div>
            </div>
          </GlassPanel>
        </Section>
        <HermesEffects holoIntensity={0.15} tealStrength={0.08} orangeStrength={0.06} />
      </Sequence>

      {/* ══ Section 2 (5–10s): Holographic shimmer ═════════════════════════ */}
      <Sequence from={5 * FPS} durationInFrames={5 * FPS}>
        <Section label="Holographic" sublabel="rotating conic · iridescent shimmer · screen blend" from={5 * FPS}>
          {/* Single large panel with shimmer border */}
          <GlassPanel x={360} y={160} w={1200} h={500} tint="deep" r={24} shimmer frame={frame} fps={fps}>
            <div style={{
              padding: '48px 56px',
              color: 'rgba(255,255,255,0.88)',
              fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
            }}>
              <div style={{ fontSize: 11, letterSpacing: '0.4em', color: 'rgba(140,170,255,0.6)', marginBottom: 16, fontFamily: 'monospace' }}>
                HOLOGRAPHIC SHIMMER PANEL
              </div>
              <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 16, letterSpacing: '-0.01em' }}>
                Glass + Iridescent Border
              </div>
              <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.52)', lineHeight: 1.7, maxWidth: 680 }}>
                The border rotates a full-spectrum conic gradient at 14°/s, approximating
                the holographic GLSL shader's polar hue sweep. Tint: deep blue-violet.
              </div>
            </div>
          </GlassPanel>
        </Section>
        {/* Full holo at this section */}
        <HermesEffects holoIntensity={0.42} holoSpeed={24} tealStrength={0.12} orangeStrength={0.05} grainIntensity={0.16} />
      </Sequence>

      {/* ══ Section 3 (10–15s): Chromatic aberration ════════════════════════ */}
      <Sequence from={10 * FPS} durationInFrames={5 * FPS}>
        <Section label="Chromatic Flow" sublabel="channel split · radial shift · breathing cycle" from={10 * FPS}>
          {/* CA applied to panel contents */}
          <GlassPanel x={120} y={180} w={760} h={440} tint="teal" r={20} ca>
            <div style={{ padding: 40, fontFamily: 'ui-monospace, monospace' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.3em', color: 'rgba(0,210,185,0.7)', marginBottom: 16 }}>CA ACTIVE</div>
              <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.9)', marginBottom: 12 }}>R / G / B Split</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.52)', lineHeight: 1.7 }}>
                Radial chromatic aberration:<br/>
                R channel offset +dx outward<br/>
                B channel offset −dx inward<br/>
                G channel stays centered<br/>
                Breathing: 4-second sine cycle
              </div>
              <div style={{ marginTop: 24, fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.88)', letterSpacing: '0.06em' }}>
                LATTICES · AGENT · PIPELINE
              </div>
            </div>
          </GlassPanel>

          <GlassPanel x={960} y={180} w={840} h={440} tint="neutral" r={20}>
            <div style={{ padding: 40, fontFamily: 'ui-monospace, monospace' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>NO CA</div>
              <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.9)', marginBottom: 12 }}>Clean Reference</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.52)', lineHeight: 1.7 }}>
                Same content without<br/>
                chromatic aberration applied.<br/>
                Compare fringe on left panel<br/>
                vs. sharp edges here.
              </div>
              <div style={{ marginTop: 24, fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.88)', letterSpacing: '0.06em' }}>
                LATTICES · AGENT · PIPELINE
              </div>
            </div>
          </GlassPanel>
        </Section>
        <HermesEffects
          holoIntensity={0.18}
          chromaShift={5}
          tealStrength={0.09}
          orangeStrength={0.08}
          grainIntensity={0.22}
          scanlineOpacity={0.45}
        />
      </Sequence>

      {/* ══ Section 4 (15–20s): All combined ════════════════════════════════ */}
      <Sequence from={15 * FPS} durationInFrames={5 * FPS}>
        <Section label="Full Hermes" sublabel="all effects combined · maximum cinematic" from={15 * FPS}>
          {/* Asymmetric layout */}
          <GlassPanel x={72} y={160} w={680} h={540} tint="teal" r={22} shimmer frame={frame} fps={fps} ca>
            <div style={{ padding: '36px 40px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.4em', color: 'rgba(0,210,185,0.65)', marginBottom: 14, fontFamily: 'monospace' }}>
                AGENT STATUS
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'rgba(255,255,255,0.92)', marginBottom: 8 }}>
                preframe · active
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)', lineHeight: 1.8 }}>
                holographic shimmer border<br/>
                chromatic aberration (ca=true)<br/>
                teal tint + deep glass<br/>
                all HermesEffects layers
              </div>
              <div style={{ marginTop: 28, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['grain', 'scanlines', 'holo', 'ca', 'teal', 'orange', 'vignette'].map(tag => (
                  <span key={tag} style={{
                    padding: '4px 10px',
                    background: 'rgba(0,210,185,0.12)',
                    border: '1px solid rgba(0,210,185,0.28)',
                    borderRadius: 6,
                    fontSize: 11,
                    color: 'rgba(0,210,185,0.82)',
                    fontFamily: 'monospace',
                    letterSpacing: '0.1em',
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          </GlassPanel>

          <GlassPanel x={820} y={160} w={1028} h={248} tint="deep" r={20}>
            <div style={{ padding: '28px 36px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.4em', color: 'rgba(140,170,255,0.6)', marginBottom: 10, fontFamily: 'monospace' }}>
                COMPOSITION
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.01em' }}>
                Hermes Glass UI System
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', marginTop: 8, lineHeight: 1.6 }}>
                HermesEffects + GlassPanel · Remotion 4.0 · 1920×1080 · 30fps
              </div>
            </div>
          </GlassPanel>

          <GlassPanel x={820} y={452} w={492} h={248} tint="orange" r={20}>
            <div style={{ padding: '28px 36px', fontFamily: 'monospace' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.4em', color: 'rgba(240,130,50,0.7)', marginBottom: 10 }}>
                COLOR GRADE
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.90)' }}>
                Teal · Orange
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', marginTop: 8, lineHeight: 1.6 }}>
                screen / multiply blend<br/>
                cinematic push-pull grade
              </div>
            </div>
          </GlassPanel>

          <GlassPanel x={1356} y={452} w={492} h={248} tint="neutral" r={20} shimmer frame={frame} fps={fps}>
            <div style={{ padding: '28px 36px', fontFamily: 'monospace' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.4em', color: 'rgba(255,255,255,0.38)', marginBottom: 10 }}>
                SHIMMER BORDER
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.90)' }}>
                14°/s rotation
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', marginTop: 8, lineHeight: 1.6 }}>
                conic-gradient mask<br/>
                border-only via CSS mask
              </div>
            </div>
          </GlassPanel>
        </Section>

        {/* All effects combined, pushed harder */}
        <HermesEffects
          holoIntensity={0.38}
          holoSpeed={22}
          chromaShift={4}
          grainIntensity={0.24}
          scanlineOpacity={0.50}
          tealStrength={0.13}
          orangeStrength={0.09}
          vignetteStrength={0.52}
        />
      </Sequence>

    </AbsoluteFill>
  )
}
