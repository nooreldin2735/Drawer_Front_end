import type { ViewportTransform } from './geometry.ts';
import type { ShapeStyle } from './shape.ts';
import type { DrawShapeType, ToolType } from './tools.ts';
import type { RemoteCursor } from './cursor.ts';

/**
 * Event map payload definitions emitted by Whiteboard facade.
 */
export interface WhiteboardEventMap {
  /** Fired when shapes are added, updated, or removed */
  change: { shapeCount: number };
  /** Fired when the active selection changes */
  selection: { selectedIds: string[]; activeStyle?: ShapeStyle };
  /** Fired when the active tool or draw shape type changes */
  tool: { tool: ToolType; shapeType?: DrawShapeType };
  /** Fired when zoom or pan changes */
  viewport: ViewportTransform;
  /** Fired when undo/redo availability updates */
  history: { canUndo: boolean; canRedo: boolean };
  /** Fired when remote cursors update */
  remoteCursors: { cursors: RemoteCursor[] };
  /** Fired when connection status changes */
  syncStatus: { status: 'disconnected' | 'connecting' | 'connected' | 'error'; error?: string };
}

export type WhiteboardEventType = keyof WhiteboardEventMap;

/**
 * Event listener callback signature.
 */
export type WhiteboardListener<TEvent extends WhiteboardEventType> = (
  payload: WhiteboardEventMap[TEvent]
) => void;
