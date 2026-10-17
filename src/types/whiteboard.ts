import type { Bounds, Point } from './geometry.ts';
import type { ShapeStyle, SerializedShape } from './shape.ts';
import type { BaseShape } from '../core/shapes/BaseShape.ts';
import type { Drawer } from '../core/drawer/Drawer.ts';
import type { ShapeFactory } from '../core/shapes/ShapeFactory.ts';

/**
 * Context interface provided to Cursor and Tools.
 * Prevents tight coupling and circular dependencies with Whiteboard facade.
 */
export interface IWhiteboardContext {
  readonly shapes: Map<string, BaseShape>;
  readonly drawer: Drawer;
  readonly shapeFactory: ShapeFactory;
  getActiveStyle(): ShapeStyle;
  addShape(shape: BaseShape): void;
  updateShape(
    id: string,
    changes: Partial<SerializedShape>,
    previous?: Partial<SerializedShape>
  ): void;
  removeShape(id: string): void;
  selectShape(id: string, additive?: boolean): void;
  setSelection(ids: string[]): void;
  clearSelection(): void;
  setPreviewShape(shape: BaseShape | null): void;
  setMarquee(bounds: Bounds | null): void;
  broadcastCursorMove(worldPoint: Point): void;
  requestRender(): void;
}
