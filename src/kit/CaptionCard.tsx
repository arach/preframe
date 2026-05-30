/**
 * CaptionCard — body caption in the terminal-card motif.
 *
 * Used during content sequences to surface the narrative copy for the
 * current "speaker" or role (HOOK / SETUP / DEVELOPMENT / PAYOFF / CLOSE).
 * Designed to be driven by a persistent track that fades between groups —
 * NOT by per-cut emerge/drop.
 *
 * Calm-rules:
 *   - No cursor blink. Text is fully rendered when the card is on screen.
 *   - Single solid speaker dot.
 *   - The card itself is a static layout; motion is applied by the caller
 *     via opacity/transform on the wrapping element.
 */
import React from 'react';
import {
  CARD_BORDER,
  CREAM,
  HUD_DIM,
  MONO,
  roleColor,
  TRACKING,
  TYPE,
} from './tokens';

export interface CaptionCardProps {
  /** Role / speaker key (hook | setup | development | payoff | close). */
  role?: string | null;
  /** Visible label, e.g., "HOOK" or "ARACH". Falls back to role uppercased. */
  label?: string;
  /** The narrative text. */
  text: string;
  /** Caption card width. 70% / max 820 by default. */
  maxWidth?: number;
}

export const CaptionCard: React.FC<CaptionCardProps> = ({
  role,
  label,
  text,
  maxWidth = 820,
}) => {
  const color = roleColor(role);
  const displayLabel = (label ?? role ?? '').toString().toUpperCase();

  return (
    <div
      style={{
        maxWidth,
        width: '70%',
        padding: '14px 22px',
        background: 'rgba(10, 10, 14, 0.88)',
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: 6,
        fontFamily: MONO,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          fontSize: TYPE.cardChromePath,
          color: HUD_DIM,
          letterSpacing: TRACKING.uppercase,
          marginBottom: 7,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ color, fontSize: 7, lineHeight: 1 }}>●</span>
        {displayLabel}
      </div>
      <div
        style={{
          fontSize: TYPE.cardBodyTight,
          color: CREAM,
          fontWeight: 400,
          lineHeight: 1.5,
          letterSpacing: '0.02em',
        }}
      >
        <span style={{ color: HUD_DIM }}>{'› '}</span>
        {text}
      </div>
    </div>
  );
};
