/**
 * SceneLabel — bottom-anchored act label with progress hairline.
 *
 * Two layouts:
 *   - placement="left"   → tucked at bottom-left (Lattices UIHighlight feel).
 *   - placement="center" → centered bottom (Lattices MenuBar feel).
 *
 * Caller controls the opacity envelope; this component just renders the
 * three pieces (label / sublabel / progress) cleanly. Progress is a 0..1
 * value usually tied to the act's local frame or the whole body's frame.
 */
import React from 'react';
import {
  CREAM,
  HUD,
  HUD_DIM,
  HUD_LO,
  MONO,
  TRACKING,
  TYPE,
} from './tokens';

export interface SceneLabelProps {
  label: string;
  sublabel?: string;
  /** 0..1 — controls the width of the inner progress fill. */
  progress?: number;
  placement?: 'left' | 'center';
  /** px from the bottom. */
  bottom?: number;
  /** px from the left when placement="left". */
  left?: number;
  /** Width of the progress bar in px. */
  barWidth?: number;
}

export const SceneLabel: React.FC<SceneLabelProps> = ({
  label,
  sublabel,
  progress = 0,
  placement = 'left',
  bottom = 48,
  left = 48,
  barWidth = 120,
}) => {
  const wrap: React.CSSProperties = placement === 'center'
    ? {
        position: 'absolute',
        bottom,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: MONO,
      }
    : {
        position: 'absolute',
        bottom,
        left,
        fontFamily: MONO,
      };

  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <div style={wrap}>
      <div
        style={{
          color: CREAM,
          fontSize: TYPE.sceneLabel,
          fontWeight: 600,
          letterSpacing: TRACKING.uppercase,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      {sublabel && (
        <div
          style={{
            color: HUD,
            fontSize: TYPE.sceneSublabel,
            letterSpacing: TRACKING.uppercaseTight,
            marginBottom: 8,
          }}
        >
          {sublabel}
        </div>
      )}
      <div
        style={{
          width: barWidth,
          height: 2,
          background: HUD_LO,
          borderRadius: 1,
        }}
      >
        <div
          style={{
            width: `${clamped * 100}%`,
            height: '100%',
            background: HUD_DIM,
            borderRadius: 1,
          }}
        />
      </div>
    </div>
  );
};
