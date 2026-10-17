import type { Bounds, Point } from '../../../types/index.ts';
import { BaseShape } from '../../shapes/BaseShape.ts';

/**
 * Service for testing intersections and retrieving shapes at world coordinates.
 */
export class HitTester {
  /**
   * Finds the topmost shape hit at the specified world coordinate.
   * Scans in reverse rendering order (highest z-index first).
   *
   * @param worldPoint Point in canvas world space
   * @param shapes Array of shapes ordered by z-index (lowest to highest)
   * @returns Topmost hit shape or null
   */
  public findTopShapeAt(worldPoint: Point, shapes: BaseShape[]): BaseShape | null {
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      if (shape.contains(worldPoint)) {
        return shape;
      }
    }
    return null;
  }

  /**
   * Finds all shapes intersecting or completely contained within an axis-aligned bounding box.
   *
   * @param selectionBounds Marquee selection box in world space
   * @param shapes List of candidate shapes
   * @returns List of intersected shapes
   */
  public findShapesInBounds(selectionBounds: Bounds, shapes: BaseShape[]): BaseShape[] {
    return shapes.filter((shape) => {
      const sb = shape.getBounds();
      return (
        sb.minX < selectionBounds.maxX &&
        sb.maxX > selectionBounds.minX &&
        sb.minY < selectionBounds.maxY &&
        sb.maxY > selectionBounds.minY
      );
    });
  }
}
