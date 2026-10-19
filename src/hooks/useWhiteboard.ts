import { useEffect, useState, useCallback } from 'react';
import type { Whiteboard } from '../core/Whiteboard.ts';
import type {
  DrawShapeType,
  ShapeStyle,
  ToolType,
} from '../types/index.ts';

export interface WhiteboardState {
  activeTool: ToolType;
  activeShapeType?: DrawShapeType;
  selectedIds: string[];
  activeStyle: ShapeStyle;
  shapeCount: number;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  syncStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

/**
 * Custom React hook that subscribes to Whiteboard facade events
 * and exposes reactive UI state with memoized action dispatchers.
 */
export function useWhiteboard(whiteboard: Whiteboard | null) {
  const [state, setState] = useState<WhiteboardState>({
    activeTool: 'select',
    activeShapeType: undefined,
    selectedIds: [],
    activeStyle: {
      strokeColor: '#6366f1',
      fillColor: 'transparent',
      strokeWidth: 2,
      opacity: 1,
    },
    shapeCount: 0,
    canUndo: false,
    canRedo: false,
    zoom: 1,
    syncStatus: 'disconnected',
  });

  useEffect(() => {
    if (!whiteboard) return;

    const unsubs = [
      whiteboard.subscribe('tool', ({ tool, shapeType }) => {
        setState((prev) => ({
          ...prev,
          activeTool: tool,
          activeShapeType: shapeType,
        }));
      }),
      whiteboard.subscribe('change', ({ shapeCount }) => {
        setState((prev) => ({ ...prev, shapeCount }));
      }),
      whiteboard.subscribe('selection', ({ selectedIds, activeStyle }) => {
        setState((prev) => ({
          ...prev,
          selectedIds,
          activeStyle: activeStyle ? { ...activeStyle } : prev.activeStyle,
        }));
      }),
      whiteboard.subscribe('history', ({ canUndo, canRedo }) => {
        setState((prev) => ({ ...prev, canUndo, canRedo }));
      }),
      whiteboard.subscribe('viewport', ({ zoom }) => {
        setState((prev) => ({ ...prev, zoom }));
      }),
      whiteboard.subscribe('syncStatus', ({ status }) => {
        setState((prev) => ({ ...prev, syncStatus: status }));
      }),
    ];

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, [whiteboard]);

  const setTool = useCallback(
    (tool: ToolType, shapeType?: DrawShapeType) => {
      whiteboard?.setTool(tool, shapeType);
    },
    [whiteboard]
  );

  const setActiveStyle = useCallback(
    (style: Partial<ShapeStyle>) => {
      whiteboard?.setActiveStyle(style);
    },
    [whiteboard]
  );

  const undo = useCallback(() => whiteboard?.undo(), [whiteboard]);
  const redo = useCallback(() => whiteboard?.redo(), [whiteboard]);
  const deleteSelected = useCallback(
    () => whiteboard?.deleteSelected(),
    [whiteboard]
  );

  const zoomIn = useCallback(() => {
    if (!whiteboard) return;
    const vp = whiteboard.drawer.viewport;
    vp.setZoom(vp.getTransform().zoom * 1.2);
    whiteboard.requestRender();
  }, [whiteboard]);

  const zoomOut = useCallback(() => {
    if (!whiteboard) return;
    const vp = whiteboard.drawer.viewport;
    vp.setZoom(vp.getTransform().zoom / 1.2);
    whiteboard.requestRender();
  }, [whiteboard]);

  const resetZoom = useCallback(() => {
    if (!whiteboard) return;
    whiteboard.drawer.viewport.reset();
    whiteboard.requestRender();
  }, [whiteboard]);

  return {
    ...state,
    setTool,
    setActiveStyle,
    undo,
    redo,
    deleteSelected,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}
