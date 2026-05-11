# Lattices Motion Toolkit

A set of brand-native, composable video effects for HyperFrames, built around the Lattices identity: the 3×3 grid, the L-shape pattern, rx=10 corners, and a black void canvas.

## Getting Started

```bash
cd effects/lattice-intro
npx hyperframes render --quality draft --output intro.mp4
```

## Effects

### Compositions (fixed-duration, standalone)
| Effect | Duration | Summary |
|---|---|---|
| `lattice-intro` | 4s | Logo assembly: cells scale in, L-shape brightens, radial glow pulses |
| `tiling-transition` | 2.5s | Window chrome flies from edges, snaps to grid, snap-flash on impact |
| `terminal-assembly` | 3.5s | Tmux pane borders draw via clipPath, code types in, active line glows |
| `gesture-trail` | 8s | Green cursor traces L-shape across footage, cells light on intersect |
| `waveform-lattice` | 6s | Audio-reactive bars in 3 columns, L-shape base row, beat-pulse green |

### Music-Reactive Overlays (loop, driven by audio-frame postMessage)
| Effect | Trigger | Summary |
|---|---|---|
| `beat-slam` | beat / drop | Grid cells compress and spring on beat; explosive cell slam on drop with L-shape flare |
| `bass-breathe` | bass amplitude | Whole scene breathes/scales with bass; center glow and corner glows pulse outward |
| `drop-cut` | drop / beat | Hard white flash cut on drop + chromatic aberration recovery; subtle brightness pulse on beat |
| `reverb-bloom` | beat / drop | 3-ring bloom expands from center on beat, decays over reverb tail; shimmer rotates with bass |
| `grid-glitch` | beat / drop | Horizontal band displacement + block artifacts + tear lines; mild per-beat glitch |
| `scan-pulse` | beat / drop | CRT sweep line descends on beat; FFT bar graph at bottom; triple sweep burst on drop |

### Audio-Frame Message Protocol
All music-reactive overlays listen for:
```js
iframe.contentWindow.postMessage({
  type: 'audio-frame',
  amplitude: 0–1,     // overall loudness
  bass:      0–1,     // 20–200 Hz energy
  mid:       0–1,     // 200–2000 Hz energy
  high:      0–1,     // 2000 Hz+ energy
  beat:      boolean, // beat detected this frame
  drop:      boolean, // sudden large energy spike
  frequencies: Uint8Array | number[], // raw FFT bins (optional, 0–255)
}, '*');
```

## Design System

All effects share these tokens:

```css
--canvas:        #000000
--ink:           #f2f2f2
--ink-ghost:     rgba(255,255,255,0.18)
--accent:        #4ade80
--grid-line:     rgba(255,255,255,0.08)
--cell-size:     107px
--cell-radius:   10px
--ease-bounce:   cubic-bezier(0.34, 1.56, 0.64, 1)
--ease-smooth:   power2.out
```

Rules:
- Grid lines always visible (even at 4% opacity)
- L-shape: column 0 all rows + row 2 all columns
- Green accent only appears from interaction (cursor, audio, snap)
- `back.out(1.6)` for cell entrances, `power2.out` for text

## Composing a Reel

Copy any effect into your composition directory, adjust `src` paths, and place it on the timeline with GSAP crossfades. See `compositions/toolkit-demo/` for an example.

## MiniMax Integration

Your current MiniMax plan supports:
- ✅ Text: `MiniMax-M2.7`, `MiniMax-01`, `MiniMax-M1`
- ✅ Vision: `MiniMax-VL-01`
- ❌ Music: `music-01`, `music-02` — plan not supported
- ❌ TTS: `speech-01-turbo` — plan not supported (use `edge-tts` instead)

For music generation, use a separate service or upgrade your MiniMax plan.
