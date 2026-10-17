import type {
  Bounds,
  Point,
  ResizeHandleInfo,
  ResizeHandleType,
} from '../../../types/index.ts';
import { BaseShape } from '../../shapes/BaseShape.ts';

/**
 * Manages active shape selection, aggregate bounding box calculation,
 * resize handles geometry, and rendering the selection box overlay.
 */
export class SelectionService {
  private selectedIds: Set<string> = new Set();

  /**
   * Selects an individual shape.
   */
  public select(id: string, additive: boolean = false): void {
    if (!additive) {
      this.selectedIds.clear();
    }
    this.selectedIds.add(id);
  }

  /**
   * Deselects an individual shape.
   */
  public deselect(id: string): void {
    this.selectedIds.delete(id);
  }

  /**
   * Sets entire active selection.
   */
  public setSelection(ids: string[]): void {
    this.selectedIds = new Set(ids);
  }

  /**
   * Clears selection entirely.
   */
  public clear(): void {
    this.selectedIds.clear();
  }

  /**
   * Checks if shape ID is currently selected.
   */
  public isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  /**
   * Returns array of selected shape IDs.
   */
  public getSelectedIds(): string[] {
    return Array.from(this.selectedIds);
  }

  /**
   * Returns number of selected shapes.
   */
  public get count(): number {
    return this.selectedIds.size;
  }

  /**
   * Calculates aggregate bounding box encompassing all selected shapes.
   */
  public getBounds(shapesMap: Map<string, BaseShape>): Bounds | null {
    if (this.selectedIds.size === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let count = 0;

    for (const id of this.selectedIds) {
      const shape = shapesMap.get(id);
      if (!shape) continue;

      const sb = shape.getBounds();
      minX = Math.min(minX, sb.minX);
      minY = Math.min(minY, sb.minY);
      maxX = Math.max(maxX, sb.maxX);
      maxY = Math.max(maxY, sb.maxY);
      count++;
    }

    if (count === 0) return null;

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
   * Generates resize handle positions for a bounding box.
   */
  public getResizeHandles(bounds: Bounds, handleSize: number = 8): ResizeHandleInfo[] {
    const { minX, minY, maxX, maxY, width, height } = bounds;
    const midX = minX + width / 2;
    const midY = minY + height / 2;

    return [
      { type: 'nw', x: minX, y: minY, size: handleSize },
      { type: 'n', x: midX, y: minY, size: handleSize },
      { type: 'ne', x: maxX, y: minY, size: handleSize },
      { type: 'e', x: maxX, y: midY, size: handleSize },
      { type: 'se', x: maxX, y: maxY, size: handleSize },
      { type: 's', x: midX, y: maxY, size: handleSize },
      { type: 'sw', x: minX, y: maxY, size: handleSize },
      { type: 'w', x: minX, y: midY, size: handleSize },
    ];
  }

  /**
   * Tests whether a world coordinate hits a resize handle.
   */
  public hitTestHandle(
    worldPoint: Point,
    bounds: Bounds,
    handleWorldSize: number = 10
  ): ResizeHandleType | null {
    const handles = this.getResizeHandles(bounds, handleWorldSize);
    const radius = handleWorldSize / 2;

    for (const h of handles) {
      const dx = Math.abs(worldPoint.x - h.x);
      const dy = Math.abs(worldPoint.y - h.y);
      if (dx <= radius && dy <= radius) {
        return h.type;
      }
    }

    return null;
  }

  /**
   * Draws selection bounding box and resize handles onto canvas context.
   */
  public drawOverlay(
    ctx: CanvasRenderingContext2D,
    bounds: Bounds,
    zoom: number
  ): void {
    ctx.save();

    const handleSize = 8 / zoom;
    const strokeWidth = 1.5 / zoom;

    // Selection border
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = strokeWidth;
    ctx.setLineDash([4 / zoom, 4 / zoom]);
    ctx.strokeRect(bounds.minX, bounds.minY, bounds.width, bounds.height);
    ctx.setLineDash([]);

    // Handles
    const handles = this.getResizeHandles(bounds, handleSize);
    for (const h of handles) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = strokeWidth;

      const half = h.size / 2;
      ctx.fillRect(h.x - half, h.y - half, h.size, h.size);
      ctx.strokeRect(h.x - half, h.y - half, h.size, h.size);
    }

    ctx.restore();
  }
}
