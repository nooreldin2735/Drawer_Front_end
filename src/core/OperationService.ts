import type {
  SerializedShape,
  WhiteboardOperation,
} from '../types/index.ts';
import { BaseShape } from './shapes/BaseShape.ts';
import { ShapeFactory } from './shapes/ShapeFactory.ts';
import { Drawer } from './drawer/Drawer.ts';
import { SyncClient } from './sync/SyncClient.ts';

/**
 * Service that encapsulates shape mutations, operation serialization,
 * and applying forward and inverted operations.
 */
export class OperationService {
  private shapes: Map<string, BaseShape>;
  private shapeFactory: ShapeFactory;
  private drawer: Drawer;
  private syncClient: SyncClient;
  private version: number = 0;
  private onChange: () => void;

  constructor(
    shapes: Map<string, BaseShape>,
    shapeFactory: ShapeFactory,
    drawer: Drawer,
    syncClient: SyncClient,
    onChange: () => void
  ) {
    this.shapes = shapes;
    this.shapeFactory = shapeFactory;
    this.drawer = drawer;
    this.syncClient = syncClient;
    this.onChange = onChange;
  }

  public getVersion(): number {
    return this.version;
  }

  public addShape(shape: BaseShape, recordHistory = true, broadcast = true): void {
    this.shapes.set(shape.id, shape);
    this.version++;

    const op: WhiteboardOperation = {
      id: crypto.randomUUID(),
      type: 'shape:add',
      payload: { shape: shape.toJSON() },
      version: this.version,
      userId: this.syncClient.userId,
      timestamp: Date.now(),
    };

    if (recordHistory) this.drawer.history.record(op);
    if (broadcast) this.syncClient.send(op);

    this.drawer.requestRender();
    this.onChange();
  }

  public updateShape(
    id: string,
    changes: Partial<SerializedShape>,
    previous?: Partial<SerializedShape>,
    recordHistory = true,
    broadcast = true
  ): void {
    const shape = this.shapes.get(id);
    if (!shape) return;

    const prev = previous ?? {
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
      style: { ...shape.style },
      data: shape.data ? JSON.parse(JSON.stringify(shape.data)) : {},
    };

    if (changes.x !== undefined) shape.x = changes.x;
    if (changes.y !== undefined) shape.y = changes.y;
    if (changes.width !== undefined) shape.width = changes.width;
    if (changes.height !== undefined) shape.height = changes.height;
    if (changes.style) shape.style = { ...shape.style, ...changes.style };
    if (changes.data) {
      shape.data = JSON.parse(JSON.stringify(changes.data));
    }

    this.version++;
    const op: WhiteboardOperation = {
      id: crypto.randomUUID(),
      type: 'shape:update',
      payload: { id, changes, previous: prev },
      version: this.version,
      userId: this.syncClient.userId,
      timestamp: Date.now(),
    };

    if (recordHistory) this.drawer.history.record(op);
    if (broadcast) this.syncClient.send(op);

    this.drawer.requestRender();
    this.onChange();
  }

  public removeShape(id: string, recordHistory = true, broadcast = true): void {
    const shape = this.shapes.get(id);
    if (!shape) return;

    this.shapes.delete(id);
    this.drawer.selection.deselect(id);
    this.version++;

    const op: WhiteboardOperation = {
      id: crypto.randomUUID(),
      type: 'shape:remove',
      payload: { id, shape: shape.toJSON() },
      version: this.version,
      userId: this.syncClient.userId,
      timestamp: Date.now(),
    };

    if (recordHistory) this.drawer.history.record(op);
    if (broadcast) this.syncClient.send(op);

    this.drawer.requestRender();
    this.onChange();
  }

  public applyOperation(op: WhiteboardOperation): void {
    if (op.type === 'shape:add') {
      const s = this.shapeFactory.fromJSON(op.payload.shape);
      this.shapes.set(s.id, s);
    } else if (op.type === 'shape:remove') {
      this.shapes.delete(op.payload.id);
      this.drawer.selection.deselect(op.payload.id);
    } else if (op.type === 'shape:update') {
      this.updateShape(op.payload.id, op.payload.changes, undefined, false, false);
    }
    this.drawer.requestRender();
    this.onChange();
  }
}
