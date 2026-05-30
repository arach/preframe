'use client';

import { useMemo } from 'react';
import { Thumbnail } from '@remotion/player';
import { FrameDesignerComposition } from '../../src/projects/frame-designer/FrameDesignerComposition';
import { useFrameDesigner } from '../Provider';

export function FrameDesignerCanvas() {
  const { preset, showSafeArea } = useFrameDesigner();

  const inputProps = useMemo(
    () => ({ layers: preset.layers, showSafeArea }),
    [preset.layers, showSafeArea],
  );

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        background: 'rgba(0,0,0,0.4)',
        minHeight: 0,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1200,
          aspectRatio: `${preset.canvas.width} / ${preset.canvas.height}`,
          position: 'relative',
          boxShadow: '0 12px 64px rgba(0,0,0,0.5)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <Thumbnail
          component={FrameDesignerComposition}
          inputProps={inputProps}
          compositionWidth={preset.canvas.width}
          compositionHeight={preset.canvas.height}
          frameToDisplay={30}
          durationInFrames={120}
          fps={30}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
