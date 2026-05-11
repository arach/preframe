import React from 'react'
import { staticFile } from 'remotion'

export type MiraState =
  | 'idle'
  | 'blink'
  | 'run_right'
  | 'run_left'
  | 'thinking'
  | 'typing'
  | 'success'
  | 'error'
  | 'sleep'

interface StateMeta {
  row: number
  frames: number
  fps: number
}

const STATES: Record<MiraState, StateMeta> = {
  idle:      { row: 0, frames: 8, fps: 6 },
  blink:     { row: 1, frames: 4, fps: 12 },
  run_right: { row: 2, frames: 8, fps: 12 },
  run_left:  { row: 3, frames: 8, fps: 12 },
  thinking:  { row: 4, frames: 8, fps: 6 },
  typing:    { row: 5, frames: 8, fps: 10 },
  success:   { row: 6, frames: 8, fps: 12 },
  error:     { row: 7, frames: 5, fps: 8 },
  sleep:     { row: 8, frames: 8, fps: 4 },
}

const FRAME_W = 192
const FRAME_H = 208
const SHEET_COLS = 8

interface Props {
  state: MiraState
  /** Composition frame (used to advance sprite frame). */
  frame: number
  /** Composition fps. */
  compositionFps: number
  /** Scale multiplier. 2 = 384×416, 3 = 576×624. */
  scale?: number
  /** Optional starting offset for the state's animation (in sprite frames). */
  startOffset?: number
  style?: React.CSSProperties
}

export const MiraSprite: React.FC<Props> = ({
  state,
  frame,
  compositionFps,
  scale = 2,
  startOffset = 0,
  style,
}) => {
  const meta = STATES[state]
  const elapsedSeconds = frame / compositionFps
  const spriteFrameIndex = (Math.floor(elapsedSeconds * meta.fps) + startOffset) % meta.frames

  const col = spriteFrameIndex % SHEET_COLS
  const row = meta.row

  const w = FRAME_W * scale
  const h = FRAME_H * scale

  return (
    <div
      style={{
        width: w,
        height: h,
        backgroundImage: `url(${staticFile('mira-action/actor/spritesheet.webp')})`,
        backgroundSize: `${SHEET_COLS * FRAME_W * scale}px ${9 * FRAME_H * scale}px`,
        backgroundPosition: `${-col * FRAME_W * scale}px ${-row * FRAME_H * scale}px`,
        imageRendering: 'pixelated',
        ...style,
      }}
    />
  )
}
