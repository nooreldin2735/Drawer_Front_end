import type { SerializedShape } from './shape.ts';

/**
 * Supported whiteboard operation types.
 */
export type OperationType =
  | 'shape:add'
  | 'shape:update'
  | 'shape:remove'
  | 'cursor:move';

/**
 * Payload when adding a shape to the whiteboard.
 */
export interface ShapeAddPayload {
  shape: SerializedShape;
}

/**
 * Payload when updating existing shape properties.
 */
export interface ShapeUpdatePayload {
  id: string;
  changes: Partial<SerializedShape>;
  previous?: Partial<SerializedShape>;
}

/**
 * Payload when removing a shape from the whiteboard.
 */
export interface ShapeRemovePayload {
  id: string;
  shape: SerializedShape;
}

/**
 * Payload for cursor movement broadcast.
 */
export interface CursorMovePayload {
  x: number;
  y: number;
  userName?: string;
  color?: string;
}

/**
 * Base whiteboard operation structure.
 */
export interface BaseOperation<TType extends OperationType, TPayload> {
  id: string;
  type: TType;
  payload: TPayload;
  version: number;
  userId: string;
  timestamp: number;
}

export type ShapeAddOperation = BaseOperation<'shape:add', ShapeAddPayload>;
export type ShapeUpdateOperation = BaseOperation<'shape:update', ShapeUpdatePayload>;
export type ShapeRemoveOperation = BaseOperation<'shape:remove', ShapeRemovePayload>;
export type CursorMoveOperation = BaseOperation<'cursor:move', CursorMovePayload>;

/**
 * Discriminated union of all whiteboard operations.
 */
export type WhiteboardOperation =
  | ShapeAddOperation
  | ShapeUpdateOperation
  | ShapeRemoveOperation
  | CursorMoveOperation;

/**
 * History operations eligible for undo/redo (excluding ephemeral cursor moves).
 */
export type HistoryOperation =
  | ShapeAddOperation
  | ShapeUpdateOperation
  | ShapeRemoveOperation;
