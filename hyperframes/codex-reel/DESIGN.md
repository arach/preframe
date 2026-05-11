# Codex Reel — Design

Mood: minimal, dark, focused. The video is the star — UI states shifting from idle to active recording.

## Colors

| Role | Hex | Usage |
|---|---|---|
| canvas | `#0a0a0f` | background |
| surface | `#111118` | panels, cards |
| border | `#1e1e2a` | dividers, rules |
| ink | `#e8e8f0` | primary text |
| dim | `#8a8a9a` | secondary, metadata |
| muted | `#5a5a6a` | tertiary |
| accent | `#4ade80` | green — links to the waveform color in the video |

## Typography

- **Primary:** `system-ui, -apple-system, sans-serif`
- **Mono:** `ui-monospace, monospace` — timestamps, metadata
- Sizes: 56px title, 18px subtitle, 12px metadata

## Motion

- Camera: static. No parallax, no zoom.
- Transitions: cross-fade, 0.3s.
- Element entrances: `gsap.fromTo` with `power2.out`.
- Video: plays inline, no filters or transforms.

## What NOT to Do

- No gradients, no glows, no shadows.
- No animated borders.
- No serif fonts, no decorative elements.
- No camera movement.
