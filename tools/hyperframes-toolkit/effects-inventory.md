# Cinematic Effects & Filter Inventory

A complete taxonomy of techniques for cinematic video post-processing — covering FFmpeg, HyperFrames/WebGL shaders, and related tools.

---

## Color Grading & Film Look

### FFmpeg Filters

| Filter | Category | What It Does |
|---|---|---|
| `colorbalance` | Color | Fine-tune RGB in shadows/midtones/highlights. Key for teal/orange. |
| `colorequ` / `eq` | Color | Brightness, contrast, gamma, saturation. Quick grade. |
| `curves` | Color | Master curves — Photoshop-style. Most powerful manual grade. |
| `colormatrix` | Color | Colorspace conversion (BT.709, BT.601, etc.) |
| `colorspace` | Color | Full colorspace + gamma + primaries conversion |
| `tonemap` | Color | HDR to SDR tonemapping (Mobius, Reinhard, ACES) |
| `vibrance` | Color | Intelligent saturation boost (protects skin tones) |
| `hue` | Color | Shift hue, adjust saturation/brightness |
| `colortemperature` | Color | Warm/cool color temperature shift |
| `exposure` | Color | Exposure compensation in EV stops |
| `interlace` | Color | Field blending for interlaced source cleanup |

### HyperFrames Shaders
- **ACES Filmic** — cinematic tone response curve
- **Teal & Orange** — complementary color split in shadows/highlights

---

## Grain, Noise & Texture

### FFmpeg Filters

| Filter | Category | What It Does |
|---|---|---|
| `noise` | Grain | Add Gaussian, uniform, or temporally correlated noise |
| `bitplanenoise` | Grain | Visualize noise in specific bit planes |
| `temporalpair` | Grain | Temporal noise smoothing |
| `hqdn3d` | Noise Red. | High-quality 3D denoiser (luma + chroma) |
| `nlmeans` | Noise Red. | Non-local means denoising — very high quality |
| `vaguedenoiser` | Noise Red. | Wavelet-based denoiser |
| `gradfun` | Grain | Debanding — smooth gradient banding |
| `deband` | Grain | Remove color banding |
| `pp7` | Noise Red. | 7-point posterize-based denoiser |
| `dctdnoiz` | Noise Red. | DCT-based denoiser |
| `fftdnoiz` | Noise Red. | FFT-based denoiser |
| `owdenoise` | Noise Red. | Optimized wavelet denoiser |
| `atadenoise` | Noise Red. | Area-based temporal denoiser |
| `removegrain` | Noise Red. | MPlayer's denoising mode (1–4, higher = stronger) |

### Analog Texture (FFmpeg)
| Filter | Category | What It Does |
|---|---|---|
| `signalstats` | Signal | Analyze video signal — can reveal analog signal noise |

### HyperFrames Shaders
- **Film Grain** — animated SVG feTurbulence noise overlaid via CSS `mix-blend-mode: overlay`
- **fractalNoise** — organic noise pattern (feTurbulence type="fractalNoise")
- **Grain Overlay (CSS)** — `@keyframes` animated noise texture, `opacity: 0.04–0.08`

---

## Vignette & Optical Effects

### FFmpeg Filters

| Filter | Category | What It Does |
|---|---|---|
| `vignette` | Vignette | Radial edge darkening. `angle=PI/4` classic. |
| `lenscorrection` | Lens | Barrel/pincushion distortion + vignetting |
| `deflate` | Morphology | Shrink bright areas — atmospheric fog effect |
| `dilate` | Morphology | Expand bright areas — glow/bloom effect |
| `cover_rect` | Composite | Cover a region with another image |

### HyperFrames / CSS
- **CSS radial-gradient vignette** — `radial-gradient(ellipse 75% 70% at 50% 50%, transparent 30%, rgba(0,0,0,0.85) 100%)`
- **Corner brackets** — CSS border-based targeting reticle
- **Film frame border** — CSS padding + dark border

---

## Blur, Focus & Depth of Field

### FFmpeg Filters

| Filter | Category | What It Does |
|---|---|---|
| `gblur` | Blur | Gaussian blur |
| `avgblur` | Blur | Fast average blur (configurable radius) |
| `dblur` | Blur | Directional blur |
| `boxblur` | Blur | Fast box blur |
| `smartblur` | Blur | Blur with edge preservation |
| `yaepblur` | Blur | Yet another edge-preserving blur |
| `varblur` | Blur | Variable blur (different per-pixel strength) |
| `fspp` | Sharpen | Fast super-advanced spatial denoiser + sharpen |
| `uspp` | Sharpen | Ultra-wide super-psychic denoiser |
| `unsharp` | Sharpen | Unsharp mask — crisp edges, counteracts blur |
| `pp` | Multi | Post-processing: deblock + dering + denoise |

### HyperFrames / CSS
- **CSS backdrop-filter: blur()** — real-time glass blur for UI elements
- **CSS backdrop-filter: saturate()** — desaturate background
- **CSS filter: blur()** — soft focus effect

---

## Glitch & Digital Corruption

### FFmpeg Filters

| Filter | Category | What It Does |
|---|---|---|
| `random` | Glitch | Drop/skip/repeat frames randomly — digital stutter |
| `shuffleframes` | Glitch | Rearrange frame order non-linearly |
| `field` | Glitch | Separate/operate on individual fields (interlace glitch) |
| `separatefields` | Glitch | Split interlaced fields into frames |
| `weave` | Glitch | Combine fields back into interlaced frame |
| `telecine` | Glitch | 24→30 telecine pattern application |
| `detelecine` | Glitch | Remove telecine pattern |
| `interlace` | Glitch | Apply interlace effect |
| `tinterlace` | Glitch | Temporal field interleaving |
| `fps` | Frame | Force frame rate — can create motion stutter |
| `framestep` | Frame | Drop every Nth frame |

### HyperFrames Shaders

| Shader | What It Does |
|---|---|
| **Glitch** | Scan lines + block scramble + RGB channel split + brightness flicker + color posterization |
| **Domain Warp Dissolve** | Fractal noise domain warping — dissolves with organic turbulence |
| **Cross Warp Morph** | Cross-warped morph between two images with sinusoidal displacement |
| **Swirl Vortex** | Spiral vortex distortion emanating from center |
| **Shatter** | Break image into triangular shards with physics-like scatter |
| **Ridged Burn** | Ridged turbulence burn — fire-like rising distortion |
| **Flash Through White** | White flash crossfade — hard cut transition |

---

## Distortion & Spatial Warp

### FFmpeg Filters

| Filter | Category | What It Does |
|---|---|---|
| `perspective` | Warp | Perspective transform — tilt, shift, keystone |
| `rotate` | Warp | Rotate by arbitrary angle |
| `shear` | Warp | Shear transform (skew X/Y) |
| `scale` | Warp | Scale, resize, aspect correction |
| `crop` | Warp | Crop region |
| `pad` | Warp | Add padding/borders |
| `displace` | Warp | Displacement map — pixels shifted by another input |
| `il` | Warp | Inverse telecine |
| `reverse` | Temporal | Reverse video playback |

### HyperFrames Shaders

| Shader | What It Does |
|---|---|
| **Thermal Distortion** | FBM noise-driven heat shimmer rising from bottom — warm haze |
| **Ripple Waves** | Concentric sine-wave ripple from a point |
| **Gravitational Lens** | Gravity-bending lens effect (Einstein ring simulation) |
| **Chromatic Radial Split** | Chromatic aberration radiating from center |
| **Cinematic Zoom** | Dramatic zoom blur transition |
| **Whip Pan** | Fast camera whip pan — motion blur streak |
| **Domain Warp Dissolve** | Fractal noise warping with dissolve |
| **SDF Iris** | Signed distance field iris reveal — sharp geometric opening |

---

## Light, Glow & Atmosphere

### FFmpeg Filters

| Filter | Category | What It Does |
|---|---|---|
| `vibrance` | Glow | Boost chroma without clipping |
| ` convolution` | Kernel | Arbitrary 3x3/5x5 kernel convolution — blur, sharpen, edge detect |
| `morpho` | Morphology | Dilation, erosion, opening, closing |
| `median` | Filter | Temporal median filter — removes noise/spots |
| `blend` | Blend | Combine two streams (lighten, darken, multiply, screen, overlay…) |
| `tblend` | Blend | Temporal blend — crossfade between frames |
| `maskedmax/maskedmin` | Mask | Pick max/min of two streams per-pixel |
| `haldclut` | LUT | Apply a Hald CLUT (color lookup table) for film print look |
| `lut3d` | LUT | 3D color lookup table |
| `lut/lutrgb/lutyuv` | LUT | 1D/3D color mapping |
| `colormap` | LUT | Palette-based color mapping |
| `interpolate` | Motion | Frame interpolation — can produce ghosting |

### HyperFrames Shaders / CSS

| Effect | What It Does |
|---|---|
| **Light Leak** | Warm color bleed from bright region overlay — cinematic halation |
| **Shimmer Sweep** | Diagonal band of light moving across frame |
| **SDF Iris** | Geometric iris/window opening |
| **3D UI Reveal** | Perspective 3D flip reveal of UI elements |
| **Portal** | Vortex portal with depth and light |
| **Liquid Glass** | Refractive glass-like distortion on liquid surface |
| **Liquid Background** | Vertex displacement on subdivided plane — organic ripples |
| **Magnetic** | VFX composition block |
| **Glow Bloom (CSS)** | `filter: brightness()` or SVG feGaussianBlur for glow |
| **CSS mix-blend-mode** | screen, overlay, multiply, lighten, darken for compositing |

---

## Motion & Temporal Effects

### FFmpeg Filters

| Filter | Category | What It Does |
|---|---|---|
| `minterpolate` | Motion | Motion interpolation (frame rate up conversion) |
| `mcdeint` | Motion | Motion-compensated deinterlacing |
| `framestep` | Motion | Step through frames — freeze/glitch effect |
| `setpts` | Motion | Change timestamp — speed ramp, freeze, reverse |
| `freezeframes` | Motion | Hold specific frames |
| `loop` | Motion | Loop a portion of video |
| `trim` | Motion | Cut to specific time range |
| `tpad` | Motion | Pad with copies or black frames |
| `fade` | Motion | Fade in/out from/to black or a color |
| `mpdecimate` | Motion | Drop duplicate/static frames |
| `dejudder` | Motion | Remove judder from source |
| `pullup` | Motion | Reverse telecine detection |
| `removegrain` mode 4 | Motion | Temporal smoothing (frame blending) |
| `despill` | Composite | Remove color spill from green/blue screen |

### HyperFrames / GSAP

| Effect | What It Does |
|---|---|
| **GSAP timeline** | Frame-accurate orchestration of CSS transforms, opacity, SVG |
| **GSAP proxy object** | `{t: 0}` driven by timeline, canvas drawn on each frame |
| **CSS keyframe animation** | `animation-delay`, `animation-duration` for repeating patterns |

---

## Transitions (between scenes)

### FFmpeg

| Filter | Category | What It Does |
|---|---|---|
| `xfade` | Transition | Crossfade between two inputs |
| `dissolve` | Transition | Alpha-blended crossfade |
| `blend` | Transition | Multiple blend modes for transition |
| `dilate`/`erode` | Transition | Organic morph transitions |

### HyperFrames Shaders

| Shader | What It Does |
|---|---|
| **Glitch** | Digital corruption crossfade |
| **Light Leak** | Warm cinematic crossfade |
| **Flash Through White** | Hard white flash cut |
| **Cross Warp Morph** | Organic warp-morph between scenes |
| **Domain Warp Dissolve** | Fractal turbulence dissolve |
| **Ridged Burn** | Fire-like rising turbulence |
| **SDF Iris** | Geometric iris open/close |
| **Chromatic Radial Split** | Radial aberration push-pull |
| **Ripple Waves** | Concentric ripple reveal |
| **Gravitational Lens** | Gravity-bending warp |
| **Swirl Vortex** | Spiral wipe |
| **Whip Pan** | Motion-blur streak wipe |

---

## Compositing & Layering

### FFmpeg Filters

| Filter | Category | What It Does |
|---|---|---|
| `overlay` | Composite | Place video over another (with optional alpha) |
| `alphamerge` | Composite | Combine two sources by alpha channel |
| `blend` | Composite | All blend modes: normal, multiply, screen, overlay, darken, lighten… |
| `maskfun` | Composite | Generate/filter mask by expression |
| `lumakey` | Composite | Key out by luminance |
| `chromakey` | Composite | Green/blue screen keying |
| `colorkey` | Composite | Key out by specific color |
| `huesaturation` | Composite | Isolate and adjust hue ranges |
| `selectivecolor` | Composite | Adjust specific color ranges |
| `dedot` | Composite | Remove cross-color dot crawl |
| `deblock` | Composite | Fix block artifacts |
| `dering` | Composite | Remove ringing artifacts |

---

## Analysis & Monitoring

### FFmpeg Filters

| Filter | Category | What It Does |
|---|---|---|
| `signalstats` | Analyze | Signal analysis — YUV levels, saturation, noise |
| `signalstretch` | Analyze | Audio-style time stretching on video |
| `histogram` | Analyze | Real-time histogram display |
| `vectorscope` | Analyze | Color vector scope |
| `pixdesctest` | Analyze | Pixel descriptor test |
| `psnr` / `ssim` | Analyze | Quality metrics vs reference |
| `libvmaf` | Analyze | VMAF perceptual quality score |
| `cover_rect` | Analyze | Find coverable rectangle |
| `find_rect` | Analyze | Find rectangular region |
| `scenechange` | Analyze | Detect scene changes |
| `siti` | Analyze | Spatial Information (SI) and Temporal Information (TI) |

---

## HDR & Wide Gamut

### FFmpeg Filters

| Filter | Category | What It Does |
|---|---|---|
| `zscale` | HDR | Resize with color space / gamut scaling |
| `toneapp` | HDR | Tone map to APP1 EXIF metadata |
| `hdr10plus` | HDR | Inject HDR10+ metadata |
| `zscale` | HDR | Colorspace-aware upscaling |
| `colorspace` | HDR | Full color space conversion |

---

## Practical FFmpeg Chains (Canned Recipes)

### Film Grain (heavy)
```bash
ffmpeg -i input.mp4 -vf "noise=alls=20:allf=t" output.mp4
```

### Film Grain (subtle, temporally correlated)
```bash
ffmpeg -i input.mp4 -vf "noise=alls=8:allf=p" output.mp4
```

### Teal/Orange Grade
```bash
ffmpeg -i input.mp4 -vf "colorbalance=rs=0.08:bs=0.10:rh=0.03:gh=-0.04:bh=0.06" output.mp4
```

### Heavy Vignette
```bash
ffmpeg -i input.mp4 -vf "vignette=angle=PI/3.5:mode=forward" output.mp4
```

### Unsharp Mask (crisp)
```bash
ffmpeg -i input.mp4 -vf "unsharp=5:5:0.5:5:5:0.4" output.mp4
```

### Film Print Look (Hald CLUT simulation)
```bash
ffmpeg -i input.mp4 -vf "curves=all='0/0 0.25/0.20 0.5/0.50 0.75/0.80 1/1':preset=linear, colorbalance=rs=0.06:bs=0.08" output.mp4
```

### Warm Fade-In
```bash
ffmpeg -i input.mp4 -vf "fade=t=in:st=0:d=3:color=white,eq=brightness=0.03:saturation=1.2" output.mp4
```

### Broken TV / Digital Corruption
```bash
ffmpeg -i input.mp4 -vf "random=frames=48:seed=13,colorbalance=rs=0.10:bs=0.06" output.mp4
```

### Desaturation (bleach bypass feel)
```bash
ffmpeg -i input.mp4 -vf "colorbalance=rs=0.03:gs=0.03:bs=0.03:rm=-0.05:gm=-0.05:bm=-0.05,curves=all='0/0 0.5/0.48 1/0.95'" output.mp4
```

### Color Banding Fix (debanner)
```bash
ffmpeg -i input.mp4 -vf "gradfun=1.5:0.8" output.mp4
```

### Crossfade Transition
```bash
ffmpeg -i input1.mp4 -i input2.mp4 -filter_complex "[0:v][1:v]xfade=transition=fade:duration=1:offset=9" output.mp4
```

### Freeze Frame + Glitch
```bash
ffmpeg -i input.mp4 -vf "freezeframes=pts=freeze:start=2:duration=1,random=frames=12:seed=5" output.mp4
```

### Lens Correction (barrel distortion)
```bash
ffmpeg -i input.mp4 -vf "lenscorrection=cx=0.5:cy=0.5:k1=0.1:k2=0.05" output.mp4
```

---

## CSS / HTML Real-Time Effects (HyperFrames native)

| Effect | Technique |
|---|---|
| Film grain | SVG `feTurbulence` + CSS `mix-blend-mode: overlay` |
| Vignette | `radial-gradient` overlay |
| Shimmer sweep | CSS `linear-gradient` with animated `--shimmer-pos` custom property |
| Backdrop blur | `backdrop-filter: blur(18px)` |
| Glow | CSS `filter: drop-shadow()` or SVG `feGaussianBlur` |
| CRT scanlines | `repeating-linear-gradient` with thin dark bands |
| Light leak | Radial gradient (warm orange) positioned at corner |
| Glitch pulse | CSS `clip-path` animation or GSAP-driven transforms |
| Chromatic aberration | RGB layers offset with CSS `transform: translateX()` |
| Color grade | Semi-transparent overlay with `linear-gradient` teal/orange |
| Letterbox | `padding-top: 56.25%` + dark background |
| Film burned edge | Radial gradient black from edges |

---

## HyperFrames GSAP Animation Techniques

| Technique | Use Case |
|---|---|
| `gsap.timeline({ paused: true })` | All segments |
| Proxy object `{t:0}` + `onUpdate` | Canvas drawing driven by timeline |
| `class="clip"` + `data-start`/`data-duration` | Element visibility windows |
| `gsap.fromTo()` | Element entrance animations |
| GSAP stagger | Multiple elements with offset timing |
| CSS custom properties (JS-driven) | Shimmer position, wave phase |
| WebGL texture capture | Shader post-processing from DOM |

---

## Color Science Reference

### ACES (Academy Color Encoding System)
- Reference color science for film/digital cinema
- Tone mapping curve: `1.0 / (x * (0.15 * x + 0.50) + 0.10)`

### Teal/Orange
- Shadows: push toward cyan/teal (`colorbalance` rs+, bs+)
- Highlights: push toward orange/red (`colorbalance` rh+)
- Midtones: slight green reduction (`colorbalance` gm-)

### Bleach Bypass
- Desaturate + increase contrast
- `colorbalance` reduce all sat + `curves` crush mids

### Cross-Processing
- Shift `colormatrix` or `curves` — push one channel toward another
- E.g., green → red, blue → green for E-6 slide film look

### Film Print Emulation
- Lift blacks slightly (`curves` dark point above 0)
- Compress highlights (`curves` shoulder below 1.0)
- Add warm midtone separation (`colorbalance` rm+)

---

## Inspiration: Notable Cinematic Post-Processing References

| Film / Show | Key Effect |
|---|---|
| Blade Runner 2049 | Teal shadows, warm highlights, film grain, lens artifacts |
| Mad Max: Fury Road | Bleach bypass, orange push, contrast, heat shimmer |
| Sicario | Teal/orange, desaturated, handheld grain |
| The Grand Budapest Hotel | Bright, saturated, deep focus, lens flare |
| Joker (2019) | Teal shadows, warm face tone, film grain |
| Chernobyl | Heavy film grain, desaturated, cool shadows |
| Dune | Warm amber highlights, teal shadows, heavy contrast |
| ozark | Degraded VHS/film, oversharpened, teal/orange |
| Berlin: Otherwise | Analog signal corruption, waveform distortion |

---

## Tools & References

- **FFmpeg Filters**: `ffmpeg -filters` — full list
- **FFmpeg Formats**: `ffmpeg -formats` — supported formats
- **FFmpeg LAC**: `ffmpeg -loglevel error -i input -vf null output` — test
- **HyperFrames**: `npx hyperframes add <block>` — install blocks
- **HyperFrames CLI**: `npx hyperframes render --quality high --output <file>`
- **QuickTime FCP**: Legacy Color, Effects, Broadcast Safe
- **DaVinci Resolve**: Color page, OFX plugins
- **Adobe After Effects**: Trapcode, Optical Flares, Film Grain Pro
- **Neat Video**: Best-in-class temporal denoising plugin
- **RE:Vision Effects**: SmoothKit, DE:Noise, FieldSmoother

---

*Maintained for: hyperframes-toolkit / preframe cinematic pipeline*
