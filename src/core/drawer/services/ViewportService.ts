import type { Point, ViewportTransform } from '../../../types/index.ts';

/**
 * Manages canvas panning, zooming, and screen-to-world coordinate projections.
 */
export class ViewportService {
  private panX: number = 0;
  private panY: number = 0;
  private zoom: number = 1;

  public static readonly MIN_ZOOM = 0.1;
  public static readonly MAX_ZOOM = 10.0;

  constructor(initialTransform?: Partial<ViewportTransform>) {
    if (initialTransform) {
      this.panX = initialTransform.panX ?? 0;
      this.panY = initialTransform.panY ?? 0;
      this.zoom = initialTransform.zoom ?? 1;
    }
  }

  /**
   * Converts screen (pixel) coordinate to canvas world coordinate.
   */
  public screenToWorld(screenPoint: Point): Point {
    return {
      x: (screenPoint.x - this.panX) / this.zoom,
      y: (screenPoint.y - this.panY) / this.zoom,
    };
  }

  /**
   * Converts canvas world coordinate to screen (pixel) coordinate.
   */
  public worldToScreen(worldPoint: Point): Point {
    return {
      x: worldPoint.x * this.zoom + this.panX,
      y: worldPoint.y * this.zoom + this.panY,
    };
  }

  /**
   * Translates the canvas viewport by delta screen pixels.
   */
  public pan(dx: number, dy: number): void {
    this.panX += dx;
    this.panY += dy;
  }

  /**
   * Zooms around a specific screen anchor point.
   *
   * @param screenAnchor Point on screen to keep stationary during zoom
   * @param factor Multiplicative zoom factor (e.g. 1.1 or 0.9)
   */
  public zoomAt(screenAnchor: Point, factor: number): void {
    const targetZoom = Math.max(
      ViewportService.MIN_ZOOM,
      Math.min(ViewportService.MAX_ZOOM, this.zoom * factor)
    );

    if (targetZoom === this.zoom) return;

    // Preserve world coordinate under cursor
    const worldAnchor = this.screenToWorld(screenAnchor);
    this.zoom = targetZoom;
    this.panX = screenAnchor.x - worldAnchor.x * this.zoom;
    this.panY = screenAnchor.y - worldAnchor.y * this.zoom;
  }

  /**
   * Sets zoom scale directly.
   */
  public setZoom(newZoom: number, screenCenter?: Point): void {
    const center = screenCenter ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const factor = newZoom / this.zoom;
    this.zoomAt(center, factor);
  }

  /**
   * Resets pan to origin and zoom to 100%.
   */
  public reset(): void {
    this.panX = 0;
    this.panY = 0;
    this.zoom = 1;
  }

  /**
   * Retrieves current transformation state.
   */
  public getTransform(): ViewportTransform {
    return {
      panX: this.panX,
      panY: this.panY,
      zoom: this.zoom,
    };
  }

  /**
   * Applies viewport transform.
   */
  public setTransform(transform: ViewportTransform): void {
    this.panX = transform.panX;
    this.panY = transform.panY;
    this.zoom = Math.max(
      ViewportService.MIN_ZOOM,
      Math.min(ViewportService.MAX_ZOOM, transform.zoom)
    );
  }
}
