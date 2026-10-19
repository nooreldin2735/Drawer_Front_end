import type {
  Bounds,
  DrawShapeType,
  IWhiteboardContext,
  Point,
  SerializedShape,
  ShapeStyle,
  SnapLine,
  ToolType,
  WhiteboardEventType,
  WhiteboardListener,
  WhiteboardOperation,
} from '../types/index.ts';
import { BaseShape } from './shapes/BaseShape.ts';
import { ShapeFactory } from './shapes/ShapeFactory.ts';
import { Drawer } from './drawer/Drawer.ts';
import { Renderer } from './drawer/services/Renderer.ts';
import { ViewportService } from './drawer/services/ViewportService.ts';
import { HitTester } from './drawer/services/HitTester.ts';
import { SelectionService } from './drawer/services/SelectionService.ts';
import { HistoryService } from './drawer/services/HistoryService.ts';
import { Cursor } from './cursor/Cursor.ts';
import { SyncClient } from './sync/SyncClient.ts';
import { EventEmitter } from './EventEmitter.ts';
import { OperationService } from './OperationService.ts';

/**
 * Whiteboard facade orchestrator.
 * Acts as the sole access point for React components and wires subsystems.
 */
export class Whiteboard implements IWhiteboardContext {
  public readonly shapes: Map<string, BaseShape> = new Map();
  public readonly shapeFactory: ShapeFactory;
  public readonly drawer: Drawer;
  public readonly cursor: Cursor;
  public readonly syncClient: SyncClient;

  private activeStyle: ShapeStyle = {
    strokeColor: '#6366f1',
    fillColor: 'transparent',
    strokeWidth: 2,
    opacity: 1,
  };
  private events: EventEmitter = new EventEmitter();
  private operations: OperationService;

  constructor(serverUrl?: string, userName?: string, userColor?: string) {
    this.shapeFactory = new ShapeFactory();
    this.drawer = new Drawer(
      new Renderer(), new ViewportService(), new HitTester(), new SelectionService(), new HistoryService()
    );
    this.syncClient = new SyncClient(serverUrl, userName, userColor);

    this.operations = new OperationService(
      this.shapes,
      this.shapeFactory,
      this.drawer,
      this.syncClient,
      () => this.events.emit('change', { shapeCount: this.shapes.size })
    );

    this.cursor = new Cursor(this);
    this.syncClient.setOperationHandler((op) => this.applyRemoteOperation(op));
    this.syncClient.setStatusHandler((status, err) => {
      this.events.emit('syncStatus', { status, error: err });
    });
  }

  public mount(canvas: HTMLCanvasElement): void {
    this.drawer.mount(canvas, () => this.shapes);
    this.cursor.mount(canvas);
    this.syncClient.connect();
    this.events.emit('change', { shapeCount: this.shapes.size });
    this.events.emit('tool', { tool: 'select' });
    this.events.emitSelection(this.drawer.selection, this.shapes, this.activeStyle);
    this.events.emitHistory(this.drawer.history);
  }

  public destroy(): void {
    this.cursor.unmount();
    this.drawer.unmount();
    this.syncClient.disconnect();
    this.events.clear();
  }

  public setTool(name: ToolType, shapeType?: DrawShapeType): void {
    this.cursor.setTool(name, shapeType);
    this.events.emit('tool', { tool: name, shapeType });
  }

  public addShape(shape: BaseShape, recordHistory = true, broadcast = true): void {
    this.operations.addShape(shape, recordHistory, broadcast);
    this.events.emitHistory(this.drawer.history);
  }

  public updateShape(
    id: string,
    changes: Partial<SerializedShape>,
    prev?: Partial<SerializedShape>,
    recordHistory = true,
    broadcast = true
  ): void {
    this.operations.updateShape(id, changes, prev, recordHistory, broadcast);
    this.events.emitSelection(this.drawer.selection, this.shapes, this.activeStyle);
    this.events.emitHistory(this.drawer.history);
  }

  public removeShape(id: string, recordHistory = true, broadcast = true): void {
    this.operations.removeShape(id, recordHistory, broadcast);
    this.events.emitSelection(this.drawer.selection, this.shapes, this.activeStyle);
    this.events.emitHistory(this.drawer.history);
  }

  public deleteSelected(): void {
    for (const id of this.drawer.selection.getSelectedIds()) {
      this.removeShape(id);
    }
  }

  public undo(): void {
    const op = this.drawer.history.popUndo();
    if (!op) return;
    const inv = this.drawer.history.getInverse(op);
    this.operations.applyOperation(inv);
    this.syncClient.send(inv);
    this.events.emitHistory(this.drawer.history);
  }

  public redo(): void {
    const op = this.drawer.history.popRedo();
    if (!op) return;
    this.operations.applyOperation(op);
    this.syncClient.send(op);
    this.events.emitHistory(this.drawer.history);
  }

  public applyRemoteOperation(op: WhiteboardOperation): void {
    if (op.type === 'cursor:move') {
      this.cursor.remoteCursors.update({
        userId: op.userId,
        userName: op.payload.userName ?? 'User',
        color: op.payload.color ?? '#6366f1',
        x: op.payload.x,
        y: op.payload.y,
        lastUpdate: Date.now(),
      });
      this.events.emit('remoteCursors', {
        cursors: this.cursor.remoteCursors.getAll(),
      });
    } else {
      this.operations.applyOperation(op);
    }
  }

  public setActiveStyle(partial: Partial<ShapeStyle>): void {
    this.activeStyle = { ...this.activeStyle, ...partial };
    for (const id of this.drawer.selection.getSelectedIds()) {
      this.updateShape(id, { style: { ...this.activeStyle } });
    }
    this.events.emitSelection(this.drawer.selection, this.shapes, this.activeStyle);
  }

  public getActiveStyle(): ShapeStyle { return { ...this.activeStyle }; }
  public setPreviewShape(shape: BaseShape | null): void { this.drawer.setPreviewShape(shape); }
  public setMarquee(bounds: Bounds | null): void { this.drawer.setMarquee(bounds); }
  public setSnapGuides(guides: SnapLine[] | null): void { this.drawer.setSnapGuides(guides); }
  public requestRender(): void { this.drawer.requestRender(); }

  public selectShape(id: string, additive = false): void {
    this.drawer.selection.select(id, additive);
    this.drawer.requestRender();
    this.events.emitSelection(this.drawer.selection, this.shapes, this.activeStyle);
  }

  public setSelection(ids: string[]): void {
    this.drawer.selection.setSelection(ids);
    this.drawer.requestRender();
    this.events.emitSelection(this.drawer.selection, this.shapes, this.activeStyle);
  }

  public clearSelection(): void {
    this.drawer.selection.clear();
    this.drawer.requestRender();
    this.events.emitSelection(this.drawer.selection, this.shapes, this.activeStyle);
  }

  public subscribe<K extends WhiteboardEventType>(
    event: K,
    listener: WhiteboardListener<K>
  ): () => void {
    return this.events.on(event, listener);
  }

  public broadcastCursorMove(pt: Point): void {
    this.syncClient.broadcastCursor(pt.x, pt.y, this.operations.getVersion());
  }
}
