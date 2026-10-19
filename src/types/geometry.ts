/**
 * 2D point representation in either screen or world space.
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Axis-aligned bounding box representation.
 */
export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

/**
 * Viewport transformation state (pan offset and zoom scale).
 */
export interface ViewportTransform {
  panX: number;
  panY: number;
  zoom: number;
}

/**
 * Resize handle anchors for selection manipulation.
 */
export type ResizeHandleType =
  | 'nw'
  | 'ne'
  | 'se'
  | 'sw'
  | 'n'
  | 's'
  | 'e'
  | 'w';

/**
 * Information describing a rendered resize handle.
 */
export interface ResizeHandleInfo {
  type: ResizeHandleType;
  x: number;
  y: number;
  size: number;
}

/**
 * Visual alignment / magnetic snap guide line.
 */
export interface SnapLine {
  orientation: 'horizontal' | 'vertical';
  position: number;
  start: number;
  end: number;
}

/**
 * Result of magnetic snapping calculations.
 */
export interface SnapResult {
  adjustedDx: number;
  adjustedDy: number;
  guides: SnapLine[];
}

