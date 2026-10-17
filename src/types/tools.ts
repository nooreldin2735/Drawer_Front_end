/**
 * Primary tool categories.
 */
export type ToolType = 'select' | 'pan' | 'draw';

/**
 * Shape types that can be created with DrawTool.
 */
export type DrawShapeType =
  // Basic shapes
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'triangle'
  | 'freehand'
  // Premade shapes
  | 'star'
  | 'arrow'
  | 'hexagon'
  | 'diamond'
  | 'heart'
  | 'speech_bubble';

/**
 * Configuration options when activating a tool.
 */
export interface ToolConfig {
  shapeType?: DrawShapeType;
}
