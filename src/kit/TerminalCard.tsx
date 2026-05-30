/**
 * TerminalCard — the shared card shape behind PromptCard and CaptionCard.
 *
 * Chrome strip on top (status dot + label on the left, breadcrumb path on
 * the right), bordered body underneath, optional footer. Solid dot only —
 * the kit's calm contract forbids blinking indicators.
 */
import React from 'react';
import {
  CARD_BORDER,
  CARD_CHROME_BG,
  CARD_INNER_RULE,
  CARD_PANEL_BG,
  HUD,
  HUD_DIM,
  MONO,
  TRACKING,
  TYPE,
} from './tokens';

export interface TerminalCardProps {
  /** Status dot color on the left of the chrome strip. Solid. */
  statusColor?: string;
  /** Uppercase label next to the dot, e.g., "voice session" or "memo reel". */
  statusLabel: string;
  /** Right-side breadcrumb, e.g., "LATTICES / VOICE MODE". */
  path?: string;
  /** Card width in px. */
  width?: number;
  /** Body content. */
  children: React.ReactNode;
  /** Optional footer slot — left + right text or arbitrary node. */
  footerLeft?: React.ReactNode;
  footerRight?: React.ReactNode;
  /** Override chrome / body opacity (e.g., for fade-ins). 0..1 */
  opacity?: number;
}

export const TerminalCard: React.FC<TerminalCardProps> = ({
  statusColor,
  statusLabel,
  path,
  width = 760,
  children,
  footerLeft,
  footerRight,
  opacity = 1,
}) => {
  return (
    <div style={{ width, fontFamily: MONO, opacity }}>
      {/* Chrome strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: CARD_CHROME_BG,
          borderTop: `1px solid ${CARD_BORDER}`,
          borderLeft: `1px solid ${CARD_BORDER}`,
          borderRight: `1px solid ${CARD_BORDER}`,
          borderRadius: '6px 6px 0 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {statusColor && (
            <span style={{ color: statusColor, fontSize: 8, lineHeight: 1 }}>●</span>
          )}
          <span
            style={{
              color: HUD,
              fontSize: TYPE.cardChromeLabel,
              letterSpacing: TRACKING.uppercase,
              textTransform: 'uppercase',
            }}
          >
            {statusLabel}
          </span>
        </div>
        {path && (
          <span
            style={{
              color: HUD_DIM,
              fontSize: TYPE.cardChromePath,
              letterSpacing: TRACKING.uppercaseTight,
            }}
          >
            {path}
          </span>
        )}
      </div>

      {/* Card body */}
      <div
        style={{
          padding: '32px 28px',
          background: CARD_PANEL_BG,
          border: `1px solid ${CARD_BORDER}`,
          borderTop: 'none',
          borderRadius: '0 0 6px 6px',
        }}
      >
        {children}

        {(footerLeft || footerRight) && (
          <div
            style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: `1px solid ${CARD_INNER_RULE}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: HUD_DIM,
              fontSize: TYPE.cardFooter,
              letterSpacing: TRACKING.uppercaseTight,
            }}
          >
            <span>{footerLeft}</span>
            <span>{footerRight}</span>
          </div>
        )}
      </div>
    </div>
  );
};
