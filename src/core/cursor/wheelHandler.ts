import type { Drawer } from '../drawer/Drawer.ts';
import type { Point } from '../../types/index.ts';

/**
 * Handles canvas zoom and pan interactions triggered by mouse wheel and trackpad gestures.
 */
export function handleCanvasWheel(
  e: WheelEvent,
  canvas: HTMLCanvasElement,
  drawer: Drawer
): void {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const screenPoint: Point = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };

  if (e.ctrlKey || e.metaKey) {
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    drawer.viewport.zoomAt(screenPoint, zoomFactor);
  } else {
    drawer.viewport.pan(-e.deltaX, -e.deltaY);
  }

  drawer.requestRender();
}
