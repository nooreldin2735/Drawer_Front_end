import type {
  CanvasCursorStyle,
  DrawShapeType,
  IWhiteboardContext,
  Point,
  ToolType,
} from '../../types/index.ts';
import { BaseTool, type ToolEvent } from './tools/BaseTool.ts';
import { SelectTool } from './tools/SelectTool.ts';
import { DrawTool } from './tools/DrawTool.ts';
import { PanTool } from './tools/PanTool.ts';
import { RemoteCursors } from './tools/RemoteCursors.ts';
import { handleCanvasWheel } from './wheelHandler.ts';

/**
 * Cursor manages canvas pointer and keyboard events, viewport coordinate
 * transformations, tool routing, and remote multiplayer cursors.
 */
export class Cursor {
  public readonly remoteCursors: RemoteCursors;
  private whiteboard: IWhiteboardContext;
  private canvas: HTMLCanvasElement | null = null;
  private tools: Map<ToolType, BaseTool> = new Map();
  private activeToolType: ToolType = 'select';
  private activeTool: BaseTool;
  private isSpacePanning: boolean = false;
  private lastCursorBroadcast: number = 0;
  private readonly broadcastThrottleMs: number = 50;

  constructor(whiteboard: IWhiteboardContext) {
    this.whiteboard = whiteboard;
    this.remoteCursors = new RemoteCursors();

    const selectTool = new SelectTool(whiteboard);
    this.tools = new Map<ToolType, BaseTool>([
      ['select', selectTool],
      ['draw', new DrawTool(whiteboard)],
      ['pan', new PanTool(whiteboard)],
    ]);
    this.activeTool = selectTool;
  }

  /**
   * Attaches pointer and keyboard events to the canvas.
   */
  public mount(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;

    canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    // Register remote cursors overlay drawing
    this.whiteboard.drawer.setOverlayCallback((ctx, zoom) => {
      this.remoteCursors.render(ctx, zoom);
    });
  }

  /**
   * Cleans up event listeners.
   */
  public unmount(): void {
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.onPointerDown);
      this.canvas.removeEventListener('wheel', this.onWheel);
    }
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);

    this.canvas = null;
  }

  /**
   * Switches the active tool.
   */
  public setTool(type: ToolType, shapeType?: DrawShapeType): void {
    const targetTool = this.tools.get(type);
    if (!targetTool) return;

    this.activeTool.onDeactivate();
    this.activeToolType = type;
    this.activeTool = targetTool;

    if (type === 'draw' && shapeType && targetTool instanceof DrawTool) {
      targetTool.setShapeType(shapeType);
    }

    this.activeTool.onActivate();
    this.updateCursorStyle();
  }

  public getActiveToolType(): ToolType {
    return this.activeToolType;
  }
  public getActiveTool(): BaseTool {
    return this.activeTool;
  }

  private createToolEvent(e: PointerEvent): ToolEvent | null {
    if (!this.canvas) return null;
    const rect = this.canvas.getBoundingClientRect();
    const screenPoint: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    const worldPoint = this.whiteboard.drawer.viewport.screenToWorld(screenPoint);

    return { worldPoint, screenPoint, rawEvent: e };
  }

  private onPointerDown = (e: PointerEvent): void => {
    const toolEvent = this.createToolEvent(e);
    if (!toolEvent) return;

    if (this.isSpacePanning) {
      const panTool = this.tools.get('pan');
      panTool?.onPointerDown(toolEvent);
      return;
    }

    this.activeTool.onPointerDown(toolEvent);
    this.updateCursorStyle(toolEvent.worldPoint);
  };

  private onPointerMove = (e: PointerEvent): void => {
    const toolEvent = this.createToolEvent(e);
    if (!toolEvent) return;

    if (this.isSpacePanning) {
      const panTool = this.tools.get('pan');
      panTool?.onPointerMove(toolEvent);
      return;
    }

    this.activeTool.onPointerMove(toolEvent);
    this.updateCursorStyle(toolEvent.worldPoint);

    // Throttle cursor broadcast
    const now = Date.now();
    if (now - this.lastCursorBroadcast >= this.broadcastThrottleMs) {
      this.lastCursorBroadcast = now;
      this.whiteboard.broadcastCursorMove(toolEvent.worldPoint);
    }
  };

  private onPointerUp = (e: PointerEvent): void => {
    const toolEvent = this.createToolEvent(e);
    if (!toolEvent) return;

    if (this.isSpacePanning) {
      const panTool = this.tools.get('pan');
      panTool?.onPointerUp(toolEvent);
      return;
    }

    this.activeTool.onPointerUp(toolEvent);
    this.updateCursorStyle(toolEvent.worldPoint);
  };

  private onWheel = (e: WheelEvent): void => {
    if (!this.canvas) return;
    handleCanvasWheel(e, this.canvas, this.whiteboard.drawer);
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.code === 'Space' && !this.isSpacePanning && e.target === document.body) {
      e.preventDefault();
      this.isSpacePanning = true;
      this.updateCursorStyle();
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (e.code === 'Space' && this.isSpacePanning) {
      this.isSpacePanning = false;
      this.updateCursorStyle();
    }
  };

  private updateCursorStyle(worldPoint?: Point): void {
    if (!this.canvas) return;

    let style: CanvasCursorStyle;
    if (this.isSpacePanning) {
      style = 'grab';
    } else if (worldPoint) {
      style = this.activeTool.getCursorStyle(worldPoint);
    } else {
      style = this.activeTool.getCursorStyle({ x: 0, y: 0 });
    }
    this.canvas.style.cursor = style;
  }
}
