import type { Bounds, Point, ResizeHandleType } from '../../../types/index.ts';

/**
 * Calculates new bounding box given active handle drag point.
 */
export function computeResizedBounds(
  initialBounds: Bounds,
  handle: ResizeHandleType,
  currentPoint: Point
): Bounds {
  let { minX, minY, maxX, maxY } = initialBounds;
  const minDim = 10;

  switch (handle) {
    case 'se':
      maxX = Math.max(minX + minDim, currentPoint.x);
      maxY = Math.max(minY + minDim, currentPoint.y);
      break;
    case 'e':
      maxX = Math.max(minX + minDim, currentPoint.x);
      break;
    case 's':
      maxY = Math.max(minY + minDim, currentPoint.y);
      break;
    case 'nw':
      minX = Math.min(maxX - minDim, currentPoint.x);
      minY = Math.min(maxY - minDim, currentPoint.y);
      break;
    case 'w':
      minX = Math.min(maxX - minDim, currentPoint.x);
      break;
    case 'n':
      minY = Math.min(maxY - minDim, currentPoint.y);
      break;
    case 'ne':
      maxX = Math.max(minX + minDim, currentPoint.x);
      minY = Math.min(maxY - minDim, currentPoint.y);
      break;
    case 'sw':
      minX = Math.min(maxX - minDim, currentPoint.x);
      maxY = Math.max(minY + minDim, currentPoint.y);
      break;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
