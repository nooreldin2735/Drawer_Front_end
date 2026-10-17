import type {
  CanvasCursorStyle,
  DrawShapeType,
  Point,
} from '../../../types/index.ts';
import { BaseTool, type ToolEvent } from './BaseTool.ts';
import { FreehandShape } from '../../shapes/types/FreehandShape.ts';

/**
 * Tool for creating basic shapes, freehand drawing, and placing premade shapes.
 */
export class DrawTool extends BaseTool {
  private shapeType: DrawShapeType = 'rectangle';
  private isDrawing: boolean = false;
  private startPoint: Point | null = null;
  private currentFreehand: FreehandShape | null = null;

  /**
   * Updates the shape type being drawn.
   */
  public setShapeType(type: DrawShapeType): void {
    this.shapeType = type;
  }

  public getShapeType(): DrawShapeType {
    return this.shapeType;
  }

  public onPointerDown(e: ToolEvent): void {
    this.isDrawing = true;
    this.startPoint = { ...e.worldPoint };

    if (this.shapeType === 'freehand') {
      const freehand = this.whiteboard.shapeFactory.create('freehand', {
        id: crypto.randomUUID(),
        x: e.worldPoint.x,
        y: e.worldPoint.y,
        style: this.whiteboard.getActiveStyle(),
        data: { points: [{ x: e.worldPoint.x, y: e.worldPoint.y }] },
      });
      if (freehand instanceof FreehandShape) {
        this.currentFreehand = freehand;
        this.whiteboard.setPreviewShape(this.currentFreehand);
      }
    }
  }

  public onPointerMove(e: ToolEvent): void {
    if (!this.isDrawing || !this.startPoint) return;

    if (this.shapeType === 'freehand') {
      if (this.currentFreehand) {
        this.currentFreehand.addPoint({ ...e.worldPoint });
        this.whiteboard.requestRender();
      }
      return;
    }

    // 2-point shapes and premade shapes
    const isLine = this.shapeType === 'line';
    const x = isLine ? this.startPoint.x : Math.min(this.startPoint.x, e.worldPoint.x);
    const y = isLine ? this.startPoint.y : Math.min(this.startPoint.y, e.worldPoint.y);
    const width = isLine
      ? e.worldPoint.x - this.startPoint.x
      : Math.abs(e.worldPoint.x - this.startPoint.x);
    const height = isLine
      ? e.worldPoint.y - this.startPoint.y
      : Math.abs(e.worldPoint.y - this.startPoint.y);

    const preview = this.whiteboard.shapeFactory.create(this.shapeType, {
      id: 'preview',
      x,
      y,
      width: Math.max(1, width),
      height: Math.max(1, height),
      style: this.whiteboard.getActiveStyle(),
    });

    this.whiteboard.setPreviewShape(preview);
  }

  public onPointerUp(e: ToolEvent): void {
    if (!this.isDrawing || !this.startPoint) return;

    this.whiteboard.setPreviewShape(null);

    if (this.shapeType === 'freehand') {
      if (this.currentFreehand && this.currentFreehand.points.length > 0) {
        this.whiteboard.addShape(this.currentFreehand);
        this.whiteboard.selectShape(this.currentFreehand.id);
      }
      this.currentFreehand = null;
      this.isDrawing = false;
      this.startPoint = null;
      return;
    }

    const dist = Math.hypot(
      e.worldPoint.x - this.startPoint.x,
      e.worldPoint.y - this.startPoint.y
    );

    let x: number;
    let y: number;
    let width: number;
    let height: number;

    const isLine = this.shapeType === 'line';

    // Click-to-place default sizing
    if (dist < 6) {
      const defaultW = isLine ? 120 : 100;
      const defaultH = isLine ? 0 : 80;
      x = isLine ? this.startPoint.x : this.startPoint.x - defaultW / 2;
      y = isLine ? this.startPoint.y : this.startPoint.y - defaultH / 2;
      width = defaultW;
      height = defaultH;
    } else {
      x = isLine ? this.startPoint.x : Math.min(this.startPoint.x, e.worldPoint.x);
      y = isLine ? this.startPoint.y : Math.min(this.startPoint.y, e.worldPoint.y);
      width = isLine
        ? e.worldPoint.x - this.startPoint.x
        : Math.max(10, Math.abs(e.worldPoint.x - this.startPoint.x));
      height = isLine
        ? e.worldPoint.y - this.startPoint.y
        : Math.max(10, Math.abs(e.worldPoint.y - this.startPoint.y));
    }

    const newShape = this.whiteboard.shapeFactory.create(this.shapeType, {
      id: crypto.randomUUID(),
      x,
      y,
      width,
      height,
      style: this.whiteboard.getActiveStyle(),
    });

    this.whiteboard.addShape(newShape);
    this.whiteboard.selectShape(newShape.id);

    this.isDrawing = false;
    this.startPoint = null;
  }

  public getCursorStyle(): CanvasCursorStyle {
    return 'crosshair';
  }

  public override onDeactivate(): void {
    this.isDrawing = false;
    this.startPoint = null;
    this.currentFreehand = null;
    this.whiteboard.setPreviewShape(null);
  }
}
