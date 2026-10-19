import React, { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Wifi, WifiOff } from 'lucide-react';
import { Whiteboard } from '../core/Whiteboard.ts';
import { useWhiteboard } from '../hooks/useWhiteboard.ts';
import { Toolbar } from './Toolbar.tsx';

interface WhiteboardCanvasProps {
  serverUrl?: string;
  userName?: string;
  userColor?: string;
}

/**
 * Main whiteboard canvas container.
 * Instantiates the Whiteboard core engine, mounts the HTML5 canvas,
 * and renders reactive toolbar and viewport HUD controls.
 */
export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  serverUrl,
  userName,
  userColor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [whiteboard] = useState(
    () => new Whiteboard(serverUrl, userName, userColor)
  );

  useEffect(() => {
    if (canvasRef.current) {
      whiteboard.mount(canvasRef.current);
    }

    return () => {
      whiteboard.destroy();
    };
  }, [whiteboard]);

  const {
    activeTool,
    activeShapeType,
    selectedIds,
    activeStyle,
    shapeCount,
    canUndo,
    canRedo,
    zoom,
    syncStatus,
    setTool,
    setActiveStyle,
    undo,
    redo,
    deleteSelected,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useWhiteboard(whiteboard);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          deleteSelected();
        }
      } else if (e.key.toLowerCase() === 'v') {
        setTool('select');
      } else if (e.key.toLowerCase() === 'h') {
        setTool('pan');
      } else if (e.key.toLowerCase() === 'r') {
        setTool('draw', 'rectangle');
      } else if (e.key.toLowerCase() === 'o') {
        setTool('draw', 'circle');
      } else if (e.key.toLowerCase() === 'l') {
        setTool('draw', 'line');
      } else if (e.key.toLowerCase() === 't') {
        setTool('draw', 'triangle');
      } else if (e.key.toLowerCase() === 'p') {
        setTool('draw', 'freehand');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteSelected, redo, selectedIds.length, setTool, undo]);

  return (
    <div className="whiteboard-canvas-container">
      <canvas ref={canvasRef} className="whiteboard-canvas" />

      {whiteboard && (
        <Toolbar
          activeTool={activeTool}
          activeShapeType={activeShapeType}
          selectedCount={selectedIds.length}
          activeStyle={activeStyle}
          canUndo={canUndo}
          canRedo={canRedo}
          shapeFactory={whiteboard.shapeFactory}
          onSelectTool={setTool}
          onUpdateStyle={setActiveStyle}
          onUndo={undo}
          onRedo={redo}
          onDeleteSelected={deleteSelected}
        />
      )}

      {/* Floating Bottom Viewport & Status HUD */}
      <footer aria-label="Canvas viewport controls" className="floating-viewport-controls glass-panel">
        <button
          type="button"
          aria-label="Zoom in"
          className="tool-btn"
          style={{ width: 28, height: 28 }}
          onClick={zoomIn}
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <span style={{ minWidth: 44, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          aria-label="Zoom out"
          className="tool-btn"
          style={{ width: 28, height: 28 }}
          onClick={zoomOut}
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <button
          type="button"
          aria-label="Reset zoom"
          className="tool-btn"
          style={{ width: 28, height: 28 }}
          onClick={resetZoom}
          title="Reset Zoom to 100%"
        >
          <RotateCcw size={14} />
        </button>

        <div className="toolbar-separator" />

        <span style={{ color: 'var(--text-muted)' }}>
          {shapeCount} {shapeCount === 1 ? 'shape' : 'shapes'}
        </span>

        <div className="toolbar-separator" />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: syncStatus === 'connected' ? '#10b981' : 'var(--text-muted)',
          }}
          title={`Collaboration status: ${syncStatus}`}
        >
          {syncStatus === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span style={{ fontSize: 11, textTransform: 'capitalize' }}>
            {syncStatus === 'connected' ? 'Live' : 'Offline'}
          </span>
        </div>
      </footer>
    </div>
  );
};
