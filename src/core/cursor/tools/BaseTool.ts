import type {
  CanvasCursorStyle,
  IWhiteboardContext,
  Point,
} from '../../../types/index.ts';

/**
 * Normalized tool pointer event data with both world and screen coordinates.
 */
export interface ToolEvent {
  worldPoint: Point;
  screenPoint: Point;
  rawEvent: PointerEvent;
}

/**
 * Abstract base class for all interactive whiteboard canvas tools.
 */
export abstract class BaseTool {
  protected whiteboard: IWhiteboardContext;

  constructor(whiteboard: IWhiteboardContext) {
    this.whiteboard = whiteboard;
  }

  /**
   * Called when pointer down event occurs on the canvas.
   */
  public abstract onPointerDown(e: ToolEvent): void;

  /**
   * Called on pointer move across the canvas.
   */
  public abstract onPointerMove(e: ToolEvent): void;

  /**
   * Called when pointer up occurs.
   */
  public abstract onPointerUp(e: ToolEvent): void;

  /**
   * Returns current cursor style based on hover position.
   */
  public abstract getCursorStyle(worldPoint: Point): CanvasCursorStyle;

  /**
   * Called when this tool is activated.
   */
  public onActivate(): void {}

  /**
   * Called when switching away from this tool.
   */
  public onDeactivate(): void {}
}
