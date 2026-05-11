# Evidence Reel — Design

Mood: technical, forensic, restrained. Like a video analysis tool.

## Colors

| Role | Hex | Usage |
|---|---|---|
| canvas | `#0a0a0f` | background, void |
| surface | `#111118` | panels, cards |
| border | `#1e1e2a` | dividers, subtle rules |
| ink | `#e8e8f0` | primary text |
| dim | `#8a8a9a` | secondary, metadata |
| muted | `#5a5a6a` | tertiary, de-emphasized |
| minimax | `#f59e0b` | amber — MiniMax evidence lane |
| moondream | `#06b6d4` | cyan — Moondream evidence lane |
| human | `#a78bfa` | purple — human annotation / curation |

## Typography

- **Primary:** `system-ui, -apple-system, sans-serif`
- **Mono:** `ui-monospace, SFMono-Regular, monospace` — for rects, coords, timestamps
- Sizes: 64px title, 24px subtitle, 16px body, 12px metadata/caption

## Motion

- Camera: static, no drift. Evidence is the subject.
- Transitions: fade only, 0.3s. No motion between scenes.
- Element entrances: `gsap.from` with short duration (0.4s), ease `power2.out`.
- Boxes: fade in with 0.1s stagger per provider.

## What NOT to Do

- No gradients, no glows, no drop shadows.
- No animated borders or pulsing effects on evidence boxes.
- No serif fonts, no decorative icons.
- No camera movement (zoom, pan, tilt) — frames are evidence, keep them flat.
