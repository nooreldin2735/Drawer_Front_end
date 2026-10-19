import React, { useState } from 'react';
import {
  MousePointer,
  Hand,
  Square,
  Circle,
  Minus,
  Triangle,
  Pencil,
  Shapes,
  Undo2,
  Redo2,
  Trash2,
} from 'lucide-react';
import type { DrawShapeType, ShapeStyle, ToolType } from '../types/index.ts';
import { ShapePicker } from './ShapePicker.tsx';
import type { ShapeFactory } from '../core/shapes/ShapeFactory.ts';

interface ToolbarProps {
  activeTool: ToolType;
  activeShapeType?: DrawShapeType;
  selectedCount: number;
  activeStyle: ShapeStyle;
  canUndo: boolean;
  canRedo: boolean;
  shapeFactory: ShapeFactory;
  onSelectTool: (tool: ToolType, shapeType?: DrawShapeType) => void;
  onUpdateStyle: (style: Partial<ShapeStyle>) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDeleteSelected: () => void;
}

const PRESET_COLORS = [
  '#f3f4f6', // White/slate
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#a855f7', // Purple
];

const STROKE_WIDTHS = [1, 2, 4, 8];

/**
 * Top floating toolbar providing tool selection, style properties,
 * history controls, and premade shape picker modal.
 */
export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  activeShapeType,
  selectedCount,
  activeStyle,
  canUndo,
  canRedo,
  shapeFactory,
  onSelectTool,
  onUpdateStyle,
  onUndo,
  onRedo,
  onDeleteSelected,
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const isPremadeActive =
    activeTool === 'draw' &&
    activeShapeType &&
    !['rectangle', 'circle', 'line', 'triangle', 'freehand'].includes(
      activeShapeType
    );

  return (
    <>
      <nav aria-label="Whiteboard toolbar" className="floating-toolbar glass-panel">
        {/* Select & Pan */}
        <button
          type="button"
          aria-label="Select tool"
          className={`tool-btn ${activeTool === 'select' ? 'active' : ''}`}
          onClick={() => {
            setIsPickerOpen(false);
            onSelectTool('select');
          }}
          title="Select (V)"
        >
          <MousePointer size={18} />
        </button>

        <button
          type="button"
          aria-label="Pan canvas"
          className={`tool-btn ${activeTool === 'pan' ? 'active' : ''}`}
          onClick={() => {
            setIsPickerOpen(false);
            onSelectTool('pan');
          }}
          title="Pan (H or Space+Drag)"
        >
          <Hand size={18} />
        </button>

        <div className="toolbar-separator" />

        {/* Basic Vector Shapes */}
        <button
          type="button"
          aria-label="Rectangle tool"
          className={`tool-btn ${activeTool === 'draw' && activeShapeType === 'rectangle' ? 'active' : ''}`}
          onClick={() => {
            setIsPickerOpen(false);
            onSelectTool('draw', 'rectangle');
          }}
          title="Rectangle (R)"
        >
          <Square size={18} />
        </button>

        <button
          type="button"
          aria-label="Circle tool"
          className={`tool-btn ${activeTool === 'draw' && activeShapeType === 'circle' ? 'active' : ''}`}
          onClick={() => {
            setIsPickerOpen(false);
            onSelectTool('draw', 'circle');
          }}
          title="Circle (O)"
        >
          <Circle size={18} />
        </button>

        <button
          type="button"
          aria-label="Line tool"
          className={`tool-btn ${activeTool === 'draw' && activeShapeType === 'line' ? 'active' : ''}`}
          onClick={() => {
            setIsPickerOpen(false);
            onSelectTool('draw', 'line');
          }}
          title="Line (L)"
        >
          <Minus size={18} />
        </button>

        <button
          type="button"
          aria-label="Triangle tool"
          className={`tool-btn ${activeTool === 'draw' && activeShapeType === 'triangle' ? 'active' : ''}`}
          onClick={() => {
            setIsPickerOpen(false);
            onSelectTool('draw', 'triangle');
          }}
          title="Triangle (T)"
        >
          <Triangle size={18} />
        </button>

        <button
          type="button"
          aria-label="Pencil tool"
          className={`tool-btn ${activeTool === 'draw' && activeShapeType === 'freehand' ? 'active' : ''}`}
          onClick={() => {
            setIsPickerOpen(false);
            onSelectTool('draw', 'freehand');
          }}
          title="Draw (P)"
        >
          <Pencil size={18} />
        </button>

        {/* Premade Shape Picker */}
        <button
          type="button"
          aria-label="Premade shapes"
          className={`tool-btn ${isPremadeActive || isPickerOpen ? 'active' : ''}`}
          onClick={() => setIsPickerOpen((prev) => !prev)}
          title="Premade Shapes (Star, Arrow, Hexagon...)"
        >
          <Shapes size={18} />
        </button>

        <div className="toolbar-separator" />

        {/* History & Actions */}
        <button
          type="button"
          aria-label="Undo"
          className="tool-btn"
          disabled={!canUndo}
          onClick={onUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={18} />
        </button>

        <button
          type="button"
          aria-label="Redo"
          className="tool-btn"
          disabled={!canRedo}
          onClick={onRedo}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={18} />
        </button>

        {selectedCount > 0 && (
          <button
            type="button"
            aria-label="Delete selected"
            className="tool-btn"
            onClick={onDeleteSelected}
            title="Delete Selected (Del / Backspace)"
            style={{ color: '#ef4444' }}
          >
            <Trash2 size={18} />
          </button>
        )}
      </nav>

      {/* Premade shapes dropdown popover */}
      {isPickerOpen && (
        <ShapePicker
          shapeFactory={shapeFactory}
          activeShapeType={activeShapeType}
          onSelectShape={(type) => {
            onSelectTool('draw', type);
            setIsPickerOpen(false);
          }}
          onClose={() => setIsPickerOpen(false)}
        />
      )}

      {/* Floating Style Properties Palette */}
      <aside aria-label="Style properties" className="floating-style-panel glass-panel">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
            STROKE COLOR
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Select stroke color ${c}`}
                onClick={() => onUpdateStyle({ strokeColor: c })}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  backgroundColor: c,
                  border:
                    activeStyle.strokeColor === c
                      ? '2px solid #ffffff'
                      : '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  transform: activeStyle.strokeColor === c ? 'scale(1.15)' : 'none',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
            FILL COLOR
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              type="button"
              aria-label="No fill color"
              onClick={() => onUpdateStyle({ fillColor: 'transparent' })}
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                backgroundColor: 'transparent',
                border:
                  activeStyle.fillColor === 'transparent'
                    ? '2px solid #6366f1'
                    : '1px dashed rgba(255,255,255,0.3)',
                cursor: 'pointer',
                position: 'relative',
              }}
              title="None"
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderTop: '1px solid #ef4444',
                  transform: 'rotate(45deg)',
                  top: '9px',
                }}
              />
            </button>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Select fill color ${c}`}
                onClick={() => onUpdateStyle({ fillColor: c })}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  backgroundColor: c,
                  border:
                    activeStyle.fillColor === c
                      ? '2px solid #ffffff'
                      : '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  transform: activeStyle.fillColor === c ? 'scale(1.15)' : 'none',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
            STROKE WIDTH
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {STROKE_WIDTHS.map((w) => (
              <button
                key={w}
                type="button"
                className={`tool-btn ${activeStyle.strokeWidth === w ? 'active' : ''}`}
                style={{ width: 32, height: 28, fontSize: 12, fontWeight: 600 }}
                onClick={() => onUpdateStyle({ strokeWidth: w })}
              >
                {w}px
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
};
