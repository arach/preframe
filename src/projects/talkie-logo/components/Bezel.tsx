/**
 * Bezel — reusable iPad-ish display frame for backdrop effect variants.
 *
 * Outer: full composition size, ribbonBlack canvas.
 * Rim: neutral surface color with subtle inner shadow.
 * Interior: children are clipped to the rounded inner area.
 */
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { COLORS } from '../tokens';

export interface BezelProps {
  children: React.ReactNode;
  /** Aspect as "w:h" string. Default "16:10" */
  aspect?: string;
  /** Corner radius in composition units. Default 36. */
  cornerRadius?: number;
  /** Rim width in composition units. Default 20. */
  rimWidth?: number;
  /** Rim color. Default brand surface #1A1813. */
  rimColor?: string;
  /** Width fraction of the composition. Default 0.70. */
  widthFraction?: number;
  /** Height fraction of the composition. Default 0.50. */
  heightFraction?: number;
}

export const Bezel: React.FC<BezelProps> = ({
  children,
  cornerRadius = 36,
  rimWidth = 20,
  rimColor = '#1A1813',
  widthFraction = 0.70,
  heightFraction = 0.50,
}) => {
  const innerRadius = Math.max(0, cornerRadius - rimWidth * 0.6);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack }}>
      {/* Centered bezel frame */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: `${widthFraction * 100}%`,
          height: `${heightFraction * 100}%`,
          borderRadius: cornerRadius,
          backgroundColor: rimColor,
          boxShadow: `inset 0 2px 8px rgba(0,0,0,0.5), inset 0 -1px 4px rgba(0,0,0,0.3)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: rimWidth,
        }}
      >
        {/* Interior — clipped */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: innerRadius,
            overflow: 'hidden',
            position: 'relative',
            backgroundColor: COLORS.ribbonBlack,
          }}
        >
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};
