import type {
  Bounds,
  CanvasCursorStyle,
  Point,
  ResizeHandleType,
  SerializedShape,
} from '../../../types/index.ts';
import type { BaseShape } from '../../shapes/BaseShape.ts';

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

/**
 * Returns CSS cursor style corresponding to a resize handle.
 */
export function getHandleCursor(handle: ResizeHandleType): CanvasCursorStyle {
  switch (handle) {
    case 'nw':
    case 'se':
      return 'nwse-resize';
    case 'ne':
    case 'sw':
      return 'nesw-resize';
    case 'n':
    case 's':
      return 'ns-resize';
    case 'e':
    case 'w':
      return 'ew-resize';
  }
}

/**
 * Translates a shape and any internal vector points based on drag delta.
 */
export function applyShapeMove(
  shape: BaseShape,
  initial: SerializedShape,
  dx: number,
  dy: number
): void {
  shape.x = initial.x + dx;
  shape.y = initial.y + dy;

  if (Array.isArray(initial.data?.points)) {
    const rawPts = initial.data.points as Point[];
    shape.data.points = rawPts.map((p) => ({ x: p.x + dx, y: p.y + dy }));
  }
}

/**
 * Resizes a shape and scales any internal vector points.
 */
export function applyShapeResize(
  shape: BaseShape,
  initial: SerializedShape,
  newBounds: Bounds,
  initialBounds: Bounds,
  scaleX: number,
  scaleY: number
): void {
  const targetMinX = newBounds.minX + (initial.x - initialBounds.minX) * scaleX;
  const targetMinY = newBounds.minY + (initial.y - initialBounds.minY) * scaleY;

  if (Array.isArray(initial.data?.points)) {
    const rawPts = initial.data.points as Point[];
    shape.data.points = rawPts.map((p) => ({
      x: targetMinX + (p.x - initial.x) * scaleX,
      y: targetMinY + (p.y - initial.y) * scaleY,
    }));
    shape.x = targetMinX;
    shape.y = targetMinY;
    shape.width = Math.max(1, initial.width * scaleX);
    shape.height = Math.max(1, initial.height * scaleY);
  } else {
    shape.resizeToBounds({
      minX: targetMinX,
      minY: targetMinY,
      maxX: 0,
      maxY: 0,
      width: Math.max(1, initial.width * scaleX),
      height: Math.max(1, initial.height * scaleY),
    });
  }
}
