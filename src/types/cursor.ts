/**
 * Information describing a remote user's pointer on the canvas.
 */
export interface RemoteCursor {
  userId: string;
  userName: string;
  color: string;
  x: number;
  y: number;
  lastUpdate: number;
}

/**
 * Valid CSS cursor styles returned by active tools.
 */
export type CanvasCursorStyle =
  | 'default'
  | 'crosshair'
  | 'grab'
  | 'grabbing'
  | 'pointer'
  | 'move'
  | 'nwse-resize'
  | 'nesw-resize'
  | 'ns-resize'
  | 'ew-resize';
