import React from 'react'
import {Composition, registerRoot} from 'remotion'
import {
  BlinkSpatialDemo,
  BLINK_SPATIAL_FPS,
  BLINK_SPATIAL_FRAMES,
} from './BlinkSpatialDemo'

const Root: React.FC = () => (
  <Composition
    id="BlinkSpatialDemo"
    component={BlinkSpatialDemo}
    durationInFrames={BLINK_SPATIAL_FRAMES}
    fps={BLINK_SPATIAL_FPS}
    width={1920}
    height={1080}
  />
)

registerRoot(Root)
