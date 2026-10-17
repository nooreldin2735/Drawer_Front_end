import type { CanvasCursorStyle, Point } from '../../../types/index.ts';
import { BaseTool, type ToolEvent } from './BaseTool.ts';

/**
 * Tool for panning the canvas viewport by dragging.
 */
export class PanTool extends BaseTool {
  private isPanning: boolean = false;
  private lastScreenPoint: Point | null = null;

  public onPointerDown(e: ToolEvent): void {
    this.isPanning = true;
    this.lastScreenPoint = { ...e.screenPoint };
  }

  public onPointerMove(e: ToolEvent): void {
    if (!this.isPanning || !this.lastScreenPoint) return;

    const dx = e.screenPoint.x - this.lastScreenPoint.x;
    const dy = e.screenPoint.y - this.lastScreenPoint.y;

    this.whiteboard.drawer.viewport.pan(dx, dy);
    this.lastScreenPoint = { ...e.screenPoint };
    this.whiteboard.requestRender();
  }

  public onPointerUp(): void {
    this.isPanning = false;
    this.lastScreenPoint = null;
  }

  public getCursorStyle(): CanvasCursorStyle {
    return this.isPanning ? 'grabbing' : 'grab';
  }

  public override onDeactivate(): void {
    this.isPanning = false;
    this.lastScreenPoint = null;
  }
}
