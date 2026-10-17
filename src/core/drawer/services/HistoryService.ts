import type {
  HistoryOperation,
  ShapeAddOperation,
  ShapeRemoveOperation,
  ShapeUpdateOperation,
} from '../../../types/index.ts';

/**
 * Manages reversible operation stacks for undo and redo functionality.
 */
export class HistoryService {
  private undoStack: HistoryOperation[] = [];
  private redoStack: HistoryOperation[] = [];
  private readonly maxDepth: number;

  constructor(maxDepth: number = 100) {
    this.maxDepth = maxDepth;
  }

  /**
   * Records a new forward operation and clears the redo stack.
   */
  public record(operation: HistoryOperation): void {
    this.undoStack.push(operation);
    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  /**
   * Checks whether undo is possible.
   */
  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Checks whether redo is possible.
   */
  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Pops top operation from undo stack and moves it to redo stack.
   */
  public popUndo(): HistoryOperation | null {
    const op = this.undoStack.pop();
    if (!op) return null;
    this.redoStack.push(op);
    return op;
  }

  /**
   * Pops top operation from redo stack and moves it to undo stack.
   */
  public popRedo(): HistoryOperation | null {
    const op = this.redoStack.pop();
    if (!op) return null;
    this.undoStack.push(op);
    return op;
  }

  /**
   * Generates the inverted operation for an undo execution.
   */
  public getInverse(operation: HistoryOperation): HistoryOperation {
    const timestamp = Date.now();
    const id = crypto.randomUUID();

    switch (operation.type) {
      case 'shape:add': {
        const inv: ShapeRemoveOperation = {
          id,
          type: 'shape:remove',
          payload: {
            id: operation.payload.shape.id,
            shape: operation.payload.shape,
          },
          version: operation.version + 1,
          userId: operation.userId,
          timestamp,
        };
        return inv;
      }
      case 'shape:remove': {
        const inv: ShapeAddOperation = {
          id,
          type: 'shape:add',
          payload: {
            shape: operation.payload.shape,
          },
          version: operation.version + 1,
          userId: operation.userId,
          timestamp,
        };
        return inv;
      }
      case 'shape:update': {
        const inv: ShapeUpdateOperation = {
          id,
          type: 'shape:update',
          payload: {
            id: operation.payload.id,
            changes: operation.payload.previous ?? {},
            previous: operation.payload.changes,
          },
          version: operation.version + 1,
          userId: operation.userId,
          timestamp,
        };
        return inv;
      }
    }
  }

  /**
   * Clears both undo and redo stacks.
   */
  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
