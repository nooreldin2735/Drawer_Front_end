import type {
  ShapeStyle,
  WhiteboardEventMap,
  WhiteboardEventType,
  WhiteboardListener,
} from '../types/index.ts';
import type { BaseShape } from './shapes/BaseShape.ts';
import type { SelectionService } from './drawer/services/SelectionService.ts';
import type { HistoryService } from './drawer/services/HistoryService.ts';

/**
 * Type-safe pub/sub event emitter for Whiteboard state notifications.
 */
export class EventEmitter {
  private listeners: Map<
    WhiteboardEventType,
    Set<WhiteboardListener<WhiteboardEventType>>
  > = new Map();

  public on<K extends WhiteboardEventType>(
    event: K,
    listener: WhiteboardListener<K>
  ): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as WhiteboardListener<WhiteboardEventType>);

    return () => {
      set?.delete(listener as WhiteboardListener<WhiteboardEventType>);
    };
  }

  public emit<K extends WhiteboardEventType>(
    event: K,
    payload: WhiteboardEventMap[K]
  ): void {
    const set = this.listeners.get(event);
    if (!set) return;

    for (const listener of set) {
      listener(payload);
    }
  }

  public emitSelection(
    selection: SelectionService,
    shapes: Map<string, BaseShape>,
    fallbackStyle: ShapeStyle
  ): void {
    const selectedIds = selection.getSelectedIds();
    let style = fallbackStyle;
    if (selectedIds.length > 0) {
      const first = shapes.get(selectedIds[0]);
      if (first) style = { ...first.style };
    }
    this.emit('selection', { selectedIds, activeStyle: style });
  }

  public emitHistory(history: HistoryService): void {
    this.emit('history', {
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  }

  public clear(): void {
    this.listeners.clear();
  }
}
