/**
 * Callback invoked every frame when the canvas is dirty.
 */
export type RenderFrameCallback = (ctx: CanvasRenderingContext2D) => void;

/**
 * Handles HTML5 Canvas 2D lifecycle, devicePixelRatio scaling,
 * dirty-checked requestAnimationFrame rendering loop, and background grid.
 */
export class Renderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private isDirty: boolean = false;
  private rafId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private renderCallback: RenderFrameCallback | null = null;

  /**
   * Attaches the canvas element and configures high-DPI scaling.
   */
  public attach(canvas: HTMLCanvasElement, onRender: RenderFrameCallback): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.renderCallback = onRender;

    if (!this.ctx) {
      throw new Error('Renderer: failed to obtain 2D rendering context');
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });
    this.resizeObserver.observe(canvas);

    this.resize();
    this.markDirty();
  }

  /**
   * Detaches canvas, cancels animation frame, and tears down observers.
   */
  public detach(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.canvas = null;
    this.ctx = null;
    this.renderCallback = null;
  }

  /**
   * Flags the canvas as dirty and schedules a redraw on next animation frame.
   */
  public markDirty(): void {
    this.isDirty = true;
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(this.renderLoop);
    }
  }

  /**
   * Handles devicePixelRatio sizing.
   */
  public resize(): void {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));

    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.markDirty();
  }

  /**
   * Animation frame render tick.
   */
  private renderLoop = (): void => {
    this.rafId = null;
    if (!this.isDirty || !this.ctx || !this.canvas || !this.renderCallback) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    this.ctx.save();
    this.ctx.scale(dpr, dpr);

    // Clear whole viewport
    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;
    this.ctx.clearRect(0, 0, width, height);

    // Execute drawing pipeline
    this.renderCallback(this.ctx);

    this.ctx.restore();
    this.isDirty = false;
  };

  /**
   * Draws an infinite background dot grid aligned with world coordinates.
   */
  public drawGrid(
    ctx: CanvasRenderingContext2D,
    panX: number,
    panY: number,
    zoom: number
  ): void {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;

    const baseSpacing = 28;
    const gridSpacing = baseSpacing * zoom;

    // Fade grid dots when zoomed too far out
    if (gridSpacing < 10) return;

    const startX = ((panX % gridSpacing) + gridSpacing) % gridSpacing;
    const startY = ((panY % gridSpacing) + gridSpacing) % gridSpacing;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';

    const dotRadius = Math.max(0.75, Math.min(1.5, 1 * Math.sqrt(zoom)));

    for (let x = startX; x < width; x += gridSpacing) {
      for (let y = startY; y < height; y += gridSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
