import type {
  Bounds,
  CanvasCursorStyle,
  Point,
  ResizeHandleType,
  SerializedShape,
} from '../../../types/index.ts';
import { BaseTool, type ToolEvent } from './BaseTool.ts';
import { computeResizedBounds } from './resizeMath.ts';

type SelectMode = 'idle' | 'moving' | 'resizing' | 'marquee';

/**
 * Tool for selecting, translating, resizing, and marquee-selecting shapes.
 */
export class SelectTool extends BaseTool {
  private mode: SelectMode = 'idle';
  private startPoint: Point | null = null;
  private activeHandle: ResizeHandleType | null = null;
  private initialBounds: Bounds | null = null;
  private initialSnapshots: Map<string, SerializedShape> = new Map();

  public onPointerDown(e: ToolEvent): void {
    const { worldPoint, rawEvent } = e;
    const drawer = this.whiteboard.drawer;
    const selection = drawer.selection;
    const currentBounds = selection.getBounds(this.whiteboard.shapes);

    // 1. Check resize handle on existing selection
    if (currentBounds) {
      const zoom = drawer.viewport.getTransform().zoom;
      const handleSize = 12 / zoom;
      const handle = selection.hitTestHandle(worldPoint, currentBounds, handleSize);

      if (handle) {
        this.mode = 'resizing';
        this.activeHandle = handle;
        this.startPoint = { ...worldPoint };
        this.initialBounds = { ...currentBounds };
        this.captureSnapshots();
        return;
      }
    }

    // 2. Hit-test shape under pointer
    const shapesArray = Array.from(this.whiteboard.shapes.values());
    const hitShape = drawer.hitTester.findTopShapeAt(worldPoint, shapesArray);

    if (hitShape) {
      if (!selection.isSelected(hitShape.id)) {
        this.whiteboard.selectShape(hitShape.id, rawEvent.shiftKey);
      }
      this.mode = 'moving';
      this.startPoint = { ...worldPoint };
      this.captureSnapshots();
    } else {
      // 3. Clicked empty space -> marquee selection
      if (!rawEvent.shiftKey) {
        this.whiteboard.clearSelection();
      }
      this.mode = 'marquee';
      this.startPoint = { ...worldPoint };
    }
  }

  public onPointerMove(e: ToolEvent): void {
    if (this.mode === 'idle' || !this.startPoint) return;

    if (this.mode === 'moving') {
      const dx = e.worldPoint.x - this.startPoint.x;
      const dy = e.worldPoint.y - this.startPoint.y;

      for (const [id, initial] of this.initialSnapshots) {
        const shape = this.whiteboard.shapes.get(id);
        if (!shape) continue;
        shape.x = initial.x + dx;
        shape.y = initial.y + dy;
      }
      this.whiteboard.requestRender();
    } else if (this.mode === 'resizing' && this.initialBounds && this.activeHandle) {
      const newBounds = computeResizedBounds(
        this.initialBounds,
        this.activeHandle,
        e.worldPoint
      );

      const scaleX = this.initialBounds.width > 0 ? newBounds.width / this.initialBounds.width : 1;
      const scaleY = this.initialBounds.height > 0 ? newBounds.height / this.initialBounds.height : 1;

      for (const [id, initial] of this.initialSnapshots) {
        const shape = this.whiteboard.shapes.get(id);
        if (!shape) continue;

        shape.resizeToBounds({
          minX: newBounds.minX + (initial.x - this.initialBounds.minX) * scaleX,
          minY: newBounds.minY + (initial.y - this.initialBounds.minY) * scaleY,
          maxX: 0,
          maxY: 0,
          width: initial.width * scaleX,
          height: initial.height * scaleY,
        });
      }
      this.whiteboard.requestRender();
    } else if (this.mode === 'marquee') {
      const bounds: Bounds = {
        minX: Math.min(this.startPoint.x, e.worldPoint.x),
        minY: Math.min(this.startPoint.y, e.worldPoint.y),
        maxX: Math.max(this.startPoint.x, e.worldPoint.x),
        maxY: Math.max(this.startPoint.y, e.worldPoint.y),
        width: Math.abs(e.worldPoint.x - this.startPoint.x),
        height: Math.abs(e.worldPoint.y - this.startPoint.y),
      };
      this.whiteboard.setMarquee(bounds);
    }
  }

  public onPointerUp(e: ToolEvent): void {
    if (this.mode === 'moving' || this.mode === 'resizing') {
      for (const [id, initial] of this.initialSnapshots) {
        const shape = this.whiteboard.shapes.get(id);
        if (!shape) continue;

        if (shape.x !== initial.x || shape.y !== initial.y || shape.width !== initial.width || shape.height !== initial.height) {
          this.whiteboard.updateShape(
            id,
            { x: shape.x, y: shape.y, width: shape.width, height: shape.height },
            { x: initial.x, y: initial.y, width: initial.width, height: initial.height }
          );
        }
      }
    } else if (this.mode === 'marquee' && this.startPoint) {
      this.whiteboard.setMarquee(null);
      const marqueeBox: Bounds = {
        minX: Math.min(this.startPoint.x, e.worldPoint.x),
        minY: Math.min(this.startPoint.y, e.worldPoint.y),
        maxX: Math.max(this.startPoint.x, e.worldPoint.x),
        maxY: Math.max(this.startPoint.y, e.worldPoint.y),
        width: Math.abs(e.worldPoint.x - this.startPoint.x),
        height: Math.abs(e.worldPoint.y - this.startPoint.y),
      };

      if (marqueeBox.width > 2 || marqueeBox.height > 2) {
        const hit = this.whiteboard.drawer.hitTester.findShapesInBounds(
          marqueeBox,
          Array.from(this.whiteboard.shapes.values())
        );
        this.whiteboard.setSelection(hit.map((s) => s.id));
      }
    }

    this.mode = 'idle';
    this.startPoint = null;
    this.activeHandle = null;
    this.initialBounds = null;
    this.initialSnapshots.clear();
  }

  public getCursorStyle(worldPoint: Point): CanvasCursorStyle {
    const drawer = this.whiteboard.drawer;
    const bounds = drawer.selection.getBounds(this.whiteboard.shapes);

    if (bounds) {
      const zoom = drawer.viewport.getTransform().zoom;
      const handle = drawer.selection.hitTestHandle(worldPoint, bounds, 12 / zoom);
      if (handle) {
        return this.getHandleCursor(handle);
      }
    }

    const hit = drawer.hitTester.findTopShapeAt(
      worldPoint,
      Array.from(this.whiteboard.shapes.values())
    );

    if (hit) {
      return drawer.selection.isSelected(hit.id) ? 'move' : 'pointer';
    }

    return 'default';
  }

  private getHandleCursor(handle: ResizeHandleType): CanvasCursorStyle {
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

  private captureSnapshots(): void {
    this.initialSnapshots.clear();
    for (const id of this.whiteboard.drawer.selection.getSelectedIds()) {
      const shape = this.whiteboard.shapes.get(id);
      if (shape) {
        this.initialSnapshots.set(id, shape.toJSON());
      }
    }
  }

  public override onDeactivate(): void {
    this.mode = 'idle';
    this.startPoint = null;
    this.activeHandle = null;
    this.initialBounds = null;
    this.initialSnapshots.clear();
    this.whiteboard.setMarquee(null);
  }
}
