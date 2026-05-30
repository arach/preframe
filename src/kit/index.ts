/**
 * Preframe Kit — the shared visual language for preframe compositions.
 *
 * The kit is built around a small set of primitives that snap together to
 * make calm, instrument-panel-flavored reels. It is intentionally limited
 * so that new compositions stay in the same family without prescribing
 * what they say.
 *
 * # Primitives
 *
 * - `TerminalCard`      — chrome + body card shell (status dot, breadcrumb).
 * - `PromptCard`        — opening directive slate (typewriter-once, no blink).
 * - `CaptionCard`       — body caption in the same card motif.
 * - `TacticalFrame`     — corner-HUD overlay (rails + 4 corner labels).
 * - `MonitorFrame`      — hardware-bezel wrapper for video content.
 * - `SceneLabel`        — bottom-anchored act label + progress hairline.
 * - `CrossDissolveClip` — opacity-ramp wrapper for cross-dissolved cuts.
 *
 * # Calm contract
 *
 * Any kit primitive must obey these rules so reels stay watchable:
 *   1. No moving scanlines.
 *   2. No blinking dots / cursors (solid only).
 *   3. Chrome that lives across cuts fades once at the body boundary,
 *      not on every cut.
 *   4. Per-cut transitions are cross-dissolves, not hard cuts, unless the
 *      caller explicitly opts in.
 *
 * If a new primitive needs motion, it should be slow (>= 12 frames per
 * cycle), single-direction, and tied to content boundaries — not free-
 * running animations.
 */

export * from './tokens';
export { TerminalCard } from './TerminalCard';
export type { TerminalCardProps } from './TerminalCard';
export { PromptCard } from './PromptCard';
export type { PromptCardProps } from './PromptCard';
export { CaptionCard } from './CaptionCard';
export type { CaptionCardProps } from './CaptionCard';
export { TacticalFrame } from './TacticalFrame';
export type { TacticalFrameProps } from './TacticalFrame';
export { MonitorFrame } from './MonitorFrame';
export type { MonitorFrameProps } from './MonitorFrame';
export { SceneLabel } from './SceneLabel';
export type { SceneLabelProps } from './SceneLabel';
export { CrossDissolveClip, placeCrossDissolved } from './CrossDissolveClip';
export type { CrossDissolveClipProps } from './CrossDissolveClip';
