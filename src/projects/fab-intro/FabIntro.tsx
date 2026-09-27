/**
 * FabIntro — ~70s launch film for fab. Spec: fab repo, design/notes/launch-video.md.
 *
 * Woven look: cotton paper, ink, one vermilion thread. Paper slates set up the problem
 * and close the film; the product beats sit on night bands with a warm underlight.
 * Every UI moment is real footage or a capture from the running app. A music bed runs
 * under it all and ducks while the narrator speaks.
 *
 *    1  problem    Your work is spread across a dozen tools. And you're the glue.
 *    2  windows    Every tool has its own window…
 *    3  loop       So you copy, screenshot, paste…
 *    4  thread     fab pulls the threads together.
 *    5  say        Hold a key… (the talk strip, live)
 *    6  mark       Grab what you're looking at… (grab + drawn box)
 *    7  route      fab turns it into one job… (the Line, live)
 *    8  follow     It follows the work… (the notch)
 *    9  review     When it's back… (History + the take's video)
 *   10  local      Your voice and your screen…
 *   11  end        fab. One way in.
 */

import React from 'react'
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Freeze,
} from 'remotion'
import { VO_SEC } from './timing'
import { LINES } from './lines'

const FPS = 30
const C = {
  paper: '#f2eddf',
  paper2: '#e8e1cf',
  card: '#faf6ec',
  ink: '#1d1b18',
  inkSoft: '#5c564b',
  label: '#6b6558',
  thread: '#b64025',
  night: '#16140f',
  night2: '#211e18',
  nightInk: '#efe8d8',
  nightSoft: '#b3aa98',
  lit: '#e0583a',
}
const SERIF = 'FabSerif, Georgia, serif'
const MONO = 'FabMono, Menlo, monospace'

// ── Timing ────────────────────────────────────────────────────────
const LEAD = 0.6 // silence before each line
const TAIL = 1.1 // room after each line
const MIN_SEC = [6.2, 6.5, 6, 4.8, 9, 6.2, 9, 6.2, 8.4, 6.4, 6.5]
const XF = 12 // crossfade frames between beats
const LAST = MIN_SEC.length - 1

const beatFrames = VO_SEC.map((v, i) => Math.round(Math.max(MIN_SEC[i], LEAD + v + TAIL) * FPS))
const beatStarts = beatFrames.map((_, i) => beatFrames.slice(0, i).reduce((a, b) => a + b, 0))
export const FAB_INTRO_FRAMES = beatStarts[LAST] + beatFrames[LAST]

// The music bed ducks under each spoken line, and fades in and out at the ends.
const BED = 0.34
const DUCK = 0.13
const voSpans = VO_SEC.map((v, i) => [beatStarts[i] + LEAD * FPS, beatStarts[i] + (LEAD + v) * FPS])
const bedVolume = (f: number) => {
  const speaking = Math.max(...voSpans.map(([a, b]) => Math.min(fade(f, a - 8, a + 4), fade(f, b, b + 16, 1, 0))))
  const ends = Math.min(fade(f, 0, 24), fade(f, FAB_INTRO_FRAMES - 90, FAB_INTRO_FRAMES - 4, 1, 0))
  return ends * (BED - (BED - DUCK) * speaking)
}


const ease = Easing.bezier(0.22, 1, 0.36, 1)
const fade = (f: number, from: number, to: number, a = 0, b = 1) =>
  interpolate(f, [from, to], [a, b], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease })

// ── Shared pieces ─────────────────────────────────────────────────
const Fonts: React.FC = () => (
  <style>{`
    @font-face { font-family: FabSerif; src: url(${staticFile('fab-intro/eb-garamond-latin-wght-normal.woff2')}) format('woff2'); font-weight: 400 800; }
    @font-face { font-family: FabSerif; font-style: italic; src: url(${staticFile('fab-intro/eb-garamond-latin-wght-italic.woff2')}) format('woff2'); font-weight: 400 800; }
    @font-face { font-family: FabMono; src: url(${staticFile('fab-intro/jetbrains-mono-latin-wght-normal.woff2')}) format('woff2'); font-weight: 100 800; }
  `}</style>
)

const Grain: React.FC<{ opacity: number }> = ({ opacity }) => (
  <svg style={{ position: 'absolute', inset: 0, opacity, mixBlendMode: 'multiply' }} width="100%" height="100%">
    <filter id="g">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
      <feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 0.55 0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#g)" />
  </svg>
)

const Mark: React.FC<{ size: number; color?: string }> = ({ size, color = C.thread }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
    <rect x="2" y="2" width="12" height="2" />
    <rect x="12" y="2" width="2" height="12" />
    <rect x="2" y="6" width="8" height="2" />
    <rect x="8" y="6" width="2" height="6" />
  </svg>
)

const Label: React.FC<{ children: React.ReactNode; color: string; style?: React.CSSProperties }> = ({ children, color, style }) => (
  <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: '0.18em', textTransform: 'uppercase', color, fontWeight: 500, ...style }}>
    {children}
  </div>
)

const Key: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      fontFamily: MONO, fontSize: 22, color: C.nightInk, padding: '8px 14px', borderRadius: 8,
      background: 'linear-gradient(#2c2820, #1d1a14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 3px 0 #0c0b08',
      border: '1px solid rgba(239,232,216,0.14)', marginLeft: 10,
    }}
  >
    {children}
  </span>
)

/** One beat: fades in/out, holds its narration line and caption. */
const Beat: React.FC<{ i: number; children: React.ReactNode; night?: boolean; caption?: boolean }> = ({ i, children, night, caption = true }) => {
  const f = useCurrentFrame()
  const dur = beatFrames[i]
  const o = Math.min(fade(f, 0, XF), i === LAST ? 1 : fade(f, dur - 2, dur + XF - 2, 1, 0))
  const voAt = Math.round(LEAD * FPS)
  const capIn = fade(f, voAt - 4, voAt + 14)
  return (
    <AbsoluteFill style={{ opacity: o, background: night ? C.night : C.paper }}>
      <Grain opacity={night ? 0.18 : 0.32} />
      {children}
      <Sequence from={voAt} layout="none">
        <Audio src={staticFile(`fab-intro/vo-${i + 1}.wav`)} />
      </Sequence>
      {caption && (
        <div
          style={{
            position: 'absolute', left: 0, right: 0, bottom: 74, textAlign: 'center', padding: '0 200px', textWrap: 'balance',
            fontFamily: SERIF, fontSize: 42, lineHeight: 1.25, fontWeight: 420, letterSpacing: '-0.01em',
            color: night ? C.nightInk : C.ink, opacity: capIn, transform: `translateY(${(1 - capIn) * 10}px)`,
          }}
        >
          {LINES[i]}
        </div>
      )}
    </AbsoluteFill>
  )
}

/** A captured UI moment on a night band: slow push-in, soft edge, warm underlight. Keys, if any, sit above it. */
const Shot: React.FC<{ children: React.ReactNode; w: number; h: number; y?: number; keys?: React.ReactNode; push?: number; radius?: number }> = ({
  children, w, h, y = 0, keys, push = 0.045, radius = 18,
}) => {
  const f = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const rise = spring({ frame: f, fps: FPS, config: { damping: 200 }, durationInFrames: 28 })
  const s = 1 + push * (f / durationInFrames)
  return (
    <>
      <div
        style={{
          position: 'absolute', left: '50%', top: 500 + y, width: w * 1.3, height: 220,
          transform: 'translate(-50%, 30%)', background: `radial-gradient(closest-side, ${C.lit}40, transparent)`,
          filter: 'blur(30px)', opacity: rise,
        }}
      />
      <div
        style={{
          position: 'absolute', left: '50%', top: 500 + y, width: w, height: h, borderRadius: radius, overflow: 'hidden',
          transform: `translate(-50%, -50%) translateY(${(1 - rise) * 30}px) scale(${s})`, opacity: rise,
          boxShadow: '0 40px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(239,232,216,0.08)',
        }}
      >
        {children}
      </div>
      {keys && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 76, textAlign: 'center', opacity: rise, color: C.nightSoft, fontFamily: MONO, fontSize: 18 }}>
          {keys}
        </div>
      )}
    </>
  )
}

// ── Beats 1–3: the problem ────────────────────────────────────────
// The problem, broad: said in the serif, word by word with the voice; a thread draws under "glue".
const SAY_1 = ['Your', 'work', 'is', 'spread', 'across', 'a', 'dozen', 'tools.']
const SAY_2_AT = 2.69 // the second sentence starts here in vo-1.wav (silencedetect)
const ProblemSlate: React.FC = () => {
  const f = useCurrentFrame()
  const voF = LEAD * FPS
  const first = 2.19 * FPS // the first sentence ends
  const secondF = voF + SAY_2_AT * FPS
  const under = interpolate(f, [secondF + 0.8 * FPS, secondF + 1.5 * FPS], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const ease = 1 - Math.pow(1 - under, 3)
  return (
    <Beat i={0} caption={false}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 40, fontFamily: SERIF, color: C.ink, letterSpacing: '-0.02em' }}>
        <div style={{ fontSize: 82, fontWeight: 400 }}>
          {SAY_1.map((w, k) => {
            const at = voF + (k / SAY_1.length) * first - 4
            const o = fade(f, at, at + 10)
            return <span key={k} style={{ display: 'inline-block', marginRight: '0.26em', opacity: o, transform: `translateY(${(1 - o) * 12}px)` }}>{w}</span>
          })}
        </div>
        <div style={{ marginTop: 26, fontSize: 82, fontWeight: 400, fontStyle: 'italic', opacity: fade(f, secondF - 4, secondF + 12), transform: `translateY(${(1 - fade(f, secondF - 4, secondF + 12)) * 12}px)` }}>
          And you’re the{' '}
          <span style={{ position: 'relative', display: 'inline-block' }}>
            glue.
            <svg viewBox="0 0 230 40" preserveAspectRatio="none" style={{ position: 'absolute', left: -6, width: 'calc(100% - 10px)', height: 40, bottom: -26, overflow: 'visible' }}>
              <path d="M4 22 C 50 8, 100 34, 150 18 S 214 12, 226 20" fill="none" stroke={C.thread} strokeWidth={4} strokeLinecap="round" vectorEffect="non-scaling-stroke"
                pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease} />
            </svg>
          </span>
        </div>
      </AbsoluteFill>
    </Beat>
  )
}

const LEAVES = [
  { x: 330, y: 250, r: -7, w: 360, h: 250, tone: C.card, tag: 'chat' },
  { x: 800, y: 170, r: 4, w: 330, h: 230, tone: '#ece5d3', tag: 'terminal', dark: true },
  { x: 1300, y: 260, r: -3, w: 380, h: 260, tone: C.card, tag: 'browser' },
  { x: 560, y: 560, r: 5, w: 340, h: 220, tone: '#e6ddc8', tag: 'agent' },
  { x: 1120, y: 580, r: -5, w: 360, h: 230, tone: C.card, tag: 'notes' },
  { x: 90, y: 600, r: 6, w: 300, h: 200, tone: '#ece5d3', tag: 'tickets' },
  { x: 1560, y: 560, r: -6, w: 300, h: 210, tone: C.card, tag: 'inbox' },
  { x: 1580, y: 70, r: 3, w: 280, h: 190, tone: '#e6ddc8', tag: 'docs' },
]
const STACK = { x: 810, y: 330 }

const Leaves: React.FC<{ gather: number; drift: number; count?: number; restless?: number }> = ({ gather, drift, count = LEAVES.length, restless = 0 }) => (
  <>
    {LEAVES.slice(0, count).map((l, k) => {
      const inAt = spring({ frame: drift - k * 7, fps: FPS, config: { damping: 18, mass: 0.9 } })
      const sway = restless * Math.sin((drift + k * 23) / 9)
      const x = interpolate(gather, [0, 1], [l.x, STACK.x + k * 7]) + sway * 3
      const y = interpolate(gather, [0, 1], [l.y, STACK.y + k * 7])
      const r = interpolate(gather, [0, 1], [l.r, (k - 2) * 1.2]) + sway * 0.6
      const w = interpolate(gather, [0, 1], [l.w, 300])
      const h = interpolate(gather, [0, 1], [l.h, 390])
      return (
        <div
          key={l.tag}
          style={{
            position: 'absolute', left: x, top: y + (1 - inAt) * 60, width: w, height: h, opacity: inAt,
            transform: `rotate(${r}deg)`, background: l.dark ? '#221f19' : l.tone, borderRadius: 6,
            boxShadow: '0 1px 0 rgba(29,27,24,0.08), 0 18px 40px rgba(29,27,24,0.12)', padding: 26,
            border: `1px solid ${l.dark ? '#2e2a22' : 'rgba(29,27,24,0.08)'}`,
          }}
        >
          <Label color={l.dark ? C.nightSoft : C.label} style={{ fontSize: 15 }}>{l.tag}</Label>
          {[0.9, 0.72, 0.8, 0.5].map((len, j) => (
            <div key={j} style={{ height: 8, width: `${len * 100}%`, marginTop: j ? 14 : 26, borderRadius: 4, background: l.dark ? 'rgba(239,232,216,0.16)' : 'rgba(29,27,24,0.1)' }} />
          ))}
        </div>
      )
    })}
  </>
)

const WindowsSlate: React.FC = () => {
  const f = useCurrentFrame()
  return (
    <Beat i={1}>
      <Leaves gather={0} drift={f} restless={fade(f, 60, 150)} />
    </Beat>
  )
}

// the round trip you make by hand, one word per step
const LOOP = ['copy', 'screenshot', 'paste', 'explain', 'check back']

const LoopSlate: React.FC = () => {
  const f = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const voF = Math.round(LEAD * FPS)
  // one lap while the line is said, then it keeps going round, a little faster
  const lap = interpolate(f, [voF, voF + VO_SEC[2] * FPS, durationInFrames], [0, 1, 1.9], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const RX = 420
  const RY = 190
  const CY = 430
  const at = (t: number) => {
    const a = -Math.PI / 2 + t * Math.PI * 2
    return { x: 960 + RX * Math.cos(a), y: CY + RY * Math.sin(a) }
  }
  const dot = at(lap)
  const ring = fade(f, 0, 20)
  return (
    <Beat i={2}>
      <div style={{ opacity: 0.28, filter: 'blur(2px)' }}>
        <Leaves gather={0} drift={999} restless={1} />
      </div>
      <svg style={{ position: 'absolute', inset: 0 }} width={1920} height={1080}>
        <ellipse cx={960} cy={CY} rx={RX} ry={RY} fill="none" stroke={C.ink} strokeOpacity={0.18 * ring} strokeWidth={2} strokeDasharray="2 10" strokeLinecap="round" />
        <circle cx={dot.x} cy={dot.y} r={9} fill={C.thread} opacity={ring} />
      </svg>
      {LOOP.map((w, k) => {
        const t = k / LOOP.length
        const p = at(t)
        const since = ((lap - t) % 1 + 1) % 1 // how far the dot has gone past this word
        const lit = lap >= t ? Math.max(0, 1 - since * 3) : 0
        const shown = fade(f, voF + t * VO_SEC[2] * FPS - 6, voF + t * VO_SEC[2] * FPS + 8)
        return (
          <div
            key={w}
            style={{
              position: 'absolute', left: p.x, top: p.y, transform: 'translate(-50%, -50%)', opacity: shown,
              padding: '10px 22px', borderRadius: 999, background: C.paper,
              fontFamily: MONO, fontSize: 24, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: lit > 0.05 ? C.thread : C.inkSoft, boxShadow: `0 0 0 1px rgba(29,27,24,${0.1 + lit * 0.2})`,
            }}
          >
            {w}
          </div>
        )
      })}
    </Beat>
  )
}

// ── Beat 4: the turn ──────────────────────────────────────────────
// the thread weaves through every leaf's centre
const THREAD = 'M 60 520 C 300 300, 420 360, 510 375 S 820 180, 965 285 S 1300 420, 1490 390 S 1400 760, 1300 695 S 800 820, 730 670 S 400 540, 60 560'

const ThreadSlate: React.FC = () => {
  const f = useCurrentFrame()
  const draw = fade(f, 0, 34)
  const gather = fade(f, 30, 62)
  const lock = spring({ frame: f - 50, fps: FPS, config: { damping: 200 } })
  return (
    <Beat i={3} caption={false}>
      <div style={{ opacity: 1 - gather }}>
        <Leaves gather={gather * 0.6} drift={999} />
      </div>
      <svg style={{ position: 'absolute', inset: 0 }} width={1920} height={1080}>
        <path d={THREAD} fill="none" stroke={C.thread} strokeWidth={4} strokeLinecap="round" pathLength={1}
          strokeDasharray="1" strokeDashoffset={1 - draw} opacity={1 - gather} />
      </svg>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: lock }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 34, transform: `translateY(${(1 - lock) * 14}px)` }}>
          <Mark size={104} />
          <div style={{ fontFamily: SERIF, fontSize: 190, fontWeight: 500, color: C.ink, letterSpacing: '-0.03em', lineHeight: 1 }}>fab</div>
        </div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 56, color: C.inkSoft, marginTop: 30 }}>
          pulls the threads together.
        </div>
      </AbsoluteFill>
    </Beat>
  )
}

// ── Beats 5–9: the product, on night bands ────────────────────────
// What the person in the take says, word by word, as they say it (job.wav).
const SAID = 'Fix the flaky sign-in test in the web app, and open a PR.'.split(' ')
const SAID_AT = 2.9 // when job.wav starts in the beat, in seconds
const SAID_SPAN = 3.9 // how long the words take to say

const SayBeat: React.FC = () => {
  const f = useCurrentFrame()
  const rise = spring({ frame: f, fps: FPS, config: { damping: 200 }, durationInFrames: 28 })
  const press = fade(f, 14, 22)
  return (
    <Beat i={4} night>
      <Sequence from={Math.round(SAID_AT * FPS) - 18} layout="none">
        <Audio src={staticFile('fab-intro/job.wav')} volume={0.75} />
      </Sequence>
      <AbsoluteFill style={{ alignItems: 'center', opacity: rise }}>
        <div style={{ marginTop: 150, color: C.nightSoft, fontFamily: MONO, fontSize: 18, transform: `translateY(${press * 3}px)` }}>
          hold<Key>right ⌘</Key>
        </div>
        <div style={{ marginTop: 90, width: 1180, minHeight: 200, textAlign: 'center', fontFamily: SERIF, fontSize: 64, lineHeight: 1.2, color: C.nightInk, textWrap: 'balance' }}>
          {SAID.map((w, k) => {
            const t = (SAID_AT + (k / SAID.length) * SAID_SPAN) * FPS
            const o = fade(f, t - 2, t + 8)
            return (
              <span key={k} style={{ opacity: o, filter: `blur(${(1 - o) * 6}px)` }}>
                {w}{' '}
              </span>
            )
          })}
        </div>
      </AbsoluteFill>
      <Shot w={1152} h={96} y={170} radius={14} push={0.02}>
        <OffthreadVideo src={staticFile('fab-intro/strip.mp4')} muted style={{ width: '100%', height: '100%' }} />
      </Shot>
    </Beat>
  )
}

const MarkBeat: React.FC = () => {
  const f = useCurrentFrame()
  const box = fade(f, 26, 52)
  const W = 1040
  const H = 660
  return (
    <Beat i={5} night>
      <Shot w={W} h={H} keys={<>grab<Key>⌃⌥S</Key></>}>
        <Img src={staticFile('fab-intro/grab-signin.png')} style={{ width: '100%', height: '100%' }} />
        <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H} viewBox="0 0 1040 660">
          <rect x={330} y={488} width={380} height={112} rx={10} fill="none" stroke="#e8412c" strokeWidth={6}
            pathLength={1} strokeDasharray="1" strokeDashoffset={1 - box} />
        </svg>
      </Shot>
    </Beat>
  )
}

const RouteBeat: React.FC = () => (
  <Beat i={6} night>
    <Shot w={940 * 1.62} h={334 * 1.62} y={-10} radius={16} push={0.03} keys={<Key>⌃⌥Space</Key>}>
      <OffthreadVideo src={staticFile('fab-intro/line.mp4')} muted startFrom={20} style={{ width: '100%', height: '100%' }} />
    </Shot>
  </Beat>
)

const FollowBeat: React.FC = () => (
  <Beat i={7} night>
    <Shot w={600 * 1.9} h={230 * 1.9}>
      <Img src={staticFile('fab-intro/notch.png')} style={{ width: '100%', height: '100%' }} />
    </Shot>
  </Beat>
)

const ReviewBeat: React.FC = () => {
  const f = useCurrentFrame()
  const card = spring({ frame: f - 40, fps: FPS, config: { damping: 200 } })
  return (
    <Beat i={8} night>
      <Shot w={1040} h={660} push={0.03}>
        <Img src={staticFile('fab-intro/history.png')} style={{ width: '100%', height: '100%' }} />
      </Shot>
      {/* the take's own demo video lifts out of its row and plays */}
      <div
        style={{
          position: 'absolute', left: 1080, top: 300, width: 640, height: 400, borderRadius: 14, overflow: 'hidden',
          opacity: card, transform: `translateY(${(1 - card) * 40}px) scale(${0.94 + card * 0.06})`,
          boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(239,232,216,0.12)', background: '#000',
        }}
      >
        {/* the take plays through, then holds its last clear frame (it fades to black at 5.2 s) */}
        <Sequence from={40} durationInFrames={TAKE_PLAY} layout="none">
          <OffthreadVideo src={staticFile('fab-intro/take.mp4')} muted style={{ width: '100%', height: '100%' }} />
        </Sequence>
        <Sequence from={40 + TAKE_PLAY} layout="none">
          <Freeze frame={TAKE_PLAY - 1}>
            <OffthreadVideo src={staticFile('fab-intro/take.mp4')} muted style={{ width: '100%', height: '100%' }} />
          </Freeze>
        </Sequence>
      </div>
    </Beat>
  )
}

// ── Beat 10: on the Mac ───────────────────────────────────────────
const LOCAL = [
  { from: 'your voice', to: 'words' },
  { from: 'your screen', to: 'what it says' },
]

const LocalSlate: React.FC = () => {
  const f = useCurrentFrame()
  const draw = fade(f, 4, 40)
  return (
    <Beat i={9}>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 130 }}>
        <svg width={960} height={470} viewBox="0 0 960 470" style={{ overflow: 'visible' }}>
          {/* a Mac, drawn in one line */}
          <rect x={110} y={10} width={740} height={410} rx={20} fill="none" stroke={C.ink} strokeWidth={3} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
          <path d="M 30 430 L 930 430 L 885 462 L 75 462 Z" fill="none" stroke={C.ink} strokeWidth={3} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} strokeLinejoin="round" />
        </svg>
        <div style={{ position: 'absolute', top: 250, display: 'flex', flexDirection: 'column', gap: 44, alignItems: 'center' }}>
          {LOCAL.map((l, k) => {
            const o = fade(f, 30 + k * 14, 48 + k * 14)
            const run = fade(f, 44 + k * 14, 70 + k * 14)
            return (
              <div key={l.from} style={{ display: 'flex', alignItems: 'center', gap: 22, opacity: o, fontFamily: MONO, fontSize: 24, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.inkSoft }}>
                <span style={{ width: 250, textAlign: 'right' }}>{l.from}</span>
                <span style={{ width: 120, height: 3, background: C.thread, transform: `scaleX(${run})`, transformOrigin: 'left', borderRadius: 2 }} />
                <span style={{ width: 250, color: C.ink }}>{l.to}</span>
              </div>
            )
          })}
          <div style={{ display: 'flex', gap: 60, marginTop: 10, fontFamily: SERIF, fontStyle: 'italic', fontSize: 50, color: C.thread, opacity: fade(f, 90, 110) }}>
            <span>quick</span>
            <span>free</span>
          </div>
        </div>
      </AbsoluteFill>
    </Beat>
  )
}

// ── Beat 11: end card ─────────────────────────────────────────────
const EndSlate: React.FC = () => {
  const f = useCurrentFrame()
  const a = spring({ frame: f - 4, fps: FPS, config: { damping: 200 } })
  const b = fade(f, 30, 52)
  const thread = fade(f, 10, 50)
  return (
    <Beat i={10} caption={false}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, opacity: a, transform: `translateY(${(1 - a) * 12}px)` }}>
          <Mark size={86} />
          <div style={{ fontFamily: SERIF, fontSize: 160, fontWeight: 500, color: C.ink, letterSpacing: '-0.03em', lineHeight: 1 }}>fab</div>
        </div>
        <div style={{ width: 420 * thread, height: 3, background: C.thread, margin: '40px 0 34px', borderRadius: 2 }} />
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 58, color: C.ink, opacity: b }}>One way in.</div>
        <Label color={C.label} style={{ marginTop: 44, opacity: b }}>fab.run&nbsp;&nbsp;·&nbsp;&nbsp;early access&nbsp;&nbsp;·&nbsp;&nbsp;for Mac</Label>
      </AbsoluteFill>
    </Beat>
  )
}

const TAKE_PLAY = 150 // 5 s of take.mp4, before its fade

const BEATS = [ProblemSlate, WindowsSlate, LoopSlate, ThreadSlate, SayBeat, MarkBeat, RouteBeat, FollowBeat, ReviewBeat, LocalSlate, EndSlate]

export const FabIntro: React.FC = () => (
  <AbsoluteFill style={{ background: C.paper }}>
    <Fonts />
    <Audio src={staticFile('fab-intro/music.mp3')} volume={bedVolume} />
    {BEATS.map((B, i) => (
      <Sequence key={i} from={beatStarts[i]} durationInFrames={beatFrames[i] + (i === LAST ? 0 : XF)}>
        <B />
      </Sequence>
    ))}
  </AbsoluteFill>
)
