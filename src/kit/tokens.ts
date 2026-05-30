/**
 * Preframe Kit — shared design tokens.
 *
 * The kit is the calm, lattices-derived visual language used across preframe
 * compositions: terminal cards, tactical frames, monitor bezels, scene labels.
 *
 * Calm rules baked in:
 * - No moving scanlines, no blinking dots, no cursor flicker.
 * - Status indicators are solid; "alive" comes from typography + composition,
 *   not from motion.
 */

export const BG = '#0a0a0e';

/** Mono = body / chrome / tactical labels. Display = titles. */
export const MONO = 'JetBrains Mono, SF Mono, Monaco, Consolas, monospace';
export const DISPLAY = 'SF Pro Display, system-ui, -apple-system, sans-serif';

/** Cool grey ramp. HUD is the strongest, HUD_LO is barely-there.
 *  Lifted from the original calm palette for stronger chrome contrast against
 *  the BG (#0a0a0e). Don't push past 0.92 or the chrome stops feeling tactical. */
export const HUD = 'rgba(190, 200, 220, 0.86)';
export const HUD_DIM = 'rgba(180, 190, 210, 0.58)';
export const HUD_LO = 'rgba(180, 190, 210, 0.32)';
export const HUD_HAIRLINE = 'rgba(170, 180, 200, 0.48)';

export const CREAM = '#dddde4';
/** Calm slate-blue. Used sparingly for accent dots / hairlines. */
export const ACCENT = '#7c9eb2';

/** Card body — translucent panel + thin border + grid tex (in CardChrome). */
export const CARD_PANEL_BG = 'rgba(160, 170, 190, 0.05)';
export const CARD_CHROME_BG = 'rgba(160, 170, 190, 0.10)';
export const CARD_BORDER = 'rgba(170, 180, 200, 0.22)';
export const CARD_INNER_RULE = 'rgba(160, 170, 190, 0.14)';

/** Type scale. */
export const TYPE = {
  cardChromeLabel: 11,
  cardChromePath: 10,
  cardBody: 20,
  cardBodyTight: 18,
  cardFooter: 10,
  hudCorner: 10,
  sceneLabel: 14,
  sceneSublabel: 11,
  slateTitle: 64,
  slateSubtitle: 13,
  outroTitle: 44,
} as const;

export const TRACKING = {
  uppercase: '0.12em',
  uppercaseTight: '0.06em',
  uppercaseLoose: '0.32em',
} as const;

/** Speaker / role colors — cool pastels, no neon. */
export const SPEAKER_COLORS = {
  hook: '#7dd3fc',
  setup: '#a5b4fc',
  development: '#c4b5fd',
  payoff: '#86efac',
  close: '#fcd34d',
  default: '#7c9eb2',
} as const;

export type RoleKey = keyof typeof SPEAKER_COLORS;

export function roleColor(role?: string | null): string {
  if (!role) return SPEAKER_COLORS.default;
  return (SPEAKER_COLORS as Record<string, string>)[role] ?? SPEAKER_COLORS.default;
}
