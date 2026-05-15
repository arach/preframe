/** Shared geometry for dot-library compositions. Single t-mark with dot area. */
import { COLORS, MONO, T_GEOMETRY } from '../tokens';
export { COLORS, MONO, T_GEOMETRY };

export const FPS = 60;
export const SIZE = 600;

export function dotGeom() {
  const anchorX = SIZE * T_GEOMETRY.cellCenter;
  const stemCx = anchorX + SIZE * T_GEOMETRY.stemOffsetFromAnchor;
  const baseline = SIZE * 0.86;
  const dotR = (SIZE * T_GEOMETRY.stemWidth) / 2;
  const dotCy = SIZE * 0.21;
  const viewW = SIZE * 0.62;
  return { anchorX, stemCx, baseline, dotR, dotCy, viewW };
}
