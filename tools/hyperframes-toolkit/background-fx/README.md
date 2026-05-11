# background-fx

Background video effects for UI/demo presentations — implemented as Hyperframes compositions.

Each effect takes a background video source and applies a treatment that stays visually
subordinate to UI content layered on top.

## Namespace

`hyperframes-toolkit/background-fx/`

## Effects

### Color & Grade
| ID | Effect | Technique |
|----|--------|-----------|
| `film-grade` | Film Grade (ACES + Grain) | WebGL — ACES tone curve + teal-orange + hash grain + vignette |
| `bleach-bypass` | Bleach Bypass | WebGL — desaturate + contrast boost + cool shadow lift |
| `golden-hour` | Golden Hour | WebGL — amber shadow push + warm highlight + filmic rolloff |
| `duotone` | Duotone | WebGL — luminance mapped to two brand colors (navy → gold) |
| `dark-neon` | Dark Mode + Neon Accent | CSS filter crush + cyan/magenta screen-blend pools |

### Lens & Depth
| ID | Effect | Technique |
|----|--------|-----------|
| `tilt-shift` | Tilt-Shift Miniaturization | CSS backdrop-filter blur bands + gradient masks |
| `halo-glow` | Product Halo Glow | CSS radial screen-blend glow, dual-layer breathing |
| `chromatic-flow` | Chromatic Flow | WebGL — radial RGB split breathing 0→8px over 8s |
| `holographic` | Holographic Iridescence | WebGL — rainbow hue from UV angle+distance, screen blend |
| `parallax-depth` | Parallax Depth | CSS — 3 video layers at different scales and drift speeds |

### Generative & Math
| ID | Effect | Technique |
|----|--------|-----------|
| `kaleidoscope` | Kaleidoscope | WebGL — 8-segment radial polar mirror with slow rotation |
| `polar-wrap` | Polar Wrap | WebGL — rectangular→polar planet-wrap with blend-in |
| `voronoi` | Voronoi Cells | WebGL — 20 drifting seed points, cell color from video |
| `truchet` | Truchet Tiles | Canvas 2D — 48×27 quarter-circle tile grid, 30% flip |
| `l-system` | L-System Growth | Canvas 2D — botanical plant grows from bottom over 8s |
| `boids` | Boids Flock | Canvas 2D — 200 parametric agents, video-color-sampled glow |

### Particle & Fluid
| ID | Effect | Technique |
|----|--------|-----------|
| `particle-field` | Particle Field | Canvas 2D — 600 LCG particles sampling video colors |
| `fluid-tint` | Fluid Simulation Tint | WebGL — two-pass FBM domain warp, 4% UV displacement |
| `reaction-diffusion` | Reaction-Diffusion | WebGL — Gray-Scott ping-pong, Turing patterns over video |

### Temporal & Glitch
| ID | Effect | Technique |
|----|--------|-----------|
| `pixel-sort` | Pixel Sort | Canvas 2D — row luminance sort sweeping top→bottom |
| `vj-feedback` | VJ Feedback Tunnel | WebGL — ping-pong feedback with scale+rotation decay |

### Fine Art Photography
| ID | Effect | Technique |
|----|--------|-----------|
| `orton-effect` | Orton Effect | WebGL — sharp × overexposed-blur multiply, painterly glow |
| `infrared` | Infrared Film | WebGL — foliage white, skies dark, warm silver tones |
| `long-exposure` | Long Exposure | WebGL — ping-pong accumulation, moving subjects ghost to silk |

### Historic Photographic Processes
| ID | Effect | Technique |
|----|--------|-----------|
| `cyanotype` | Cyanotype | WebGL — Prussian blue palette, S-curve, paper texture wash |
| `daguerreotype` | Daguerreotype | WebGL — warm silver tones, halation, grain, heavy vignette |
| `wet-plate` | Wet Plate Collodion | WebGL — cool silver-green, vnoise chemical spread, uneven edges |

### Atmospheric Light
| ID | Effect | Technique |
|----|--------|-----------|
| `fog-depth` | Fog Depth | WebGL — luminous morning mist, heavier at distance, slow breathing |
| `rain-glass` | Rain on Glass | WebGL — 40 refracting droplets falling, window condensation |
| `bloom-halation` | Bloom & Halation | WebGL — warm amber glow bleeding from highlights, analog film |

### Painterly
| ID | Effect | Technique |
|----|--------|-----------|
| `crosshatch-etch` | Cross-Hatch Etching | WebGL — 4-direction ink hatching driven by luminance thresholds |
| `pointillist` | Pointillist Painting | WebGL — grid-cell dot sampling, dot radius varies with luminance |
| `watercolor-bleed` | Watercolor Bleed | WebGL — FBM-warped multi-sample blur, warm desaturation, paper grain |
| `kuwahara-aniso` | Anisotropic Kuwahara | WebGL — 4-quadrant variance min-pick, oil-paint edge smoothing |

### Optical Physics
| ID | Effect | Technique |
|----|--------|-----------|
| `god-rays` | God Rays | WebGL — 64-step radial march toward animated light source |
| `caustics` | Caustics | WebGL — 3-layer sine interference pattern overlaid on video |
| `bokeh-hex` | Hexagonal Bokeh | WebGL — 7-tap hex blur with edge DoF + bright bloom |
| `lens-starburst` | Lens Starburst | WebGL — 4-direction streak accumulation from bright highlights |

### Colorimetric
| ID | Effect | Technique |
|----|--------|-----------|
| `prism-dispersion` | Prism Dispersion | WebGL — radial RGB channel split + rainbow edge fringe |
| `silver-gelatin` | Silver Gelatin Print | WebGL — B&W S-curve, warm shadow / cool highlight split-tone, grain |
| `thin-film` | Thin-Film Interference | WebGL — luminance-gradient normal + Fresnel iridescent screen blend |
| `film-lut` | Film LUT Grade | WebGL — Kodak Vision3-style per-channel curves, teal midtones, grain |

### Temporal & Motion
| ID | Effect | Technique |
|----|--------|-----------|
| `motion-smear` | Motion Smear | WebGL — ping-pong accumulation trail with decay-based blend |
| `echo-ghost` | Echo Ghost | WebGL — 3 hue-shifted ghost copies screen-blended over original |
| `slit-scan` | Slit-Scan | WebGL — per-column UV phase offset with chromatic fringing |
| `lenticular` | Lenticular Print | WebGL — 6px lens ridges with parallax shift and color fringing |

### Atmospheric Phenomena
| ID | Effect | Technique |
|----|--------|-----------|
| `aurora` | Aurora Borealis | WebGL — FBM curtain bands (green/cyan/violet) screen-blended, upper half |
| `bioluminescence` | Bioluminescence | WebGL — wave-distorted deep teal + pulsing particle grid at 3 scales |
| `subsurface-glow` | Subsurface Glow | WebGL — 3-scale Gaussian SSS with warm amber tint + rim light |
| `volumetric-mie` | Volumetric Mie | WebGL — depth-from-luminance haze + animated Mie forward-scatter sun |

## Layout Contract

Every composition exposes three layers in z-order:

```
z:10  #ui-layer     ← product UI, screen recordings, text
z:1   #fx-canvas    ← WebGL effect canvas (or CSS overlays)
z:0   #bg-video     ← raw background video
```

## Video Source

Each `index.html` expects a `data-video-src` attribute on `#root`
(or defaults to `../../assets/sample.mp4`) so the caller can swap sources:

```html
<div id="root" data-composition-id="halo-glow" data-video-src="city-skyline.mp4" ...>
```

## Hyperframes Composition Rules

1. Every timed element needs `data-start`, `data-duration`, `data-track-index`
2. Timed elements must have `class="clip"`
3. Timeline must be paused and registered:
   ```js
   window.__timelines = window.__timelines || {};
   window.__timelines["<composition-id>"] = gsap.timeline({ paused: true });
   ```
4. Videos: `muted` attribute, no autoplay
5. No `Date.now()`, `Math.random()`, or network fetches — everything deterministic
6. WebGL canvas: `preserveDrawingBuffer: true`
7. Video as WebGL texture: update via `gl.texImage2D(..., videoElement)` in `onUpdate`
