import type { Bounds, SnapLine } from '../../types/index.ts';
import { BaseShape } from '../shapes/BaseShape.ts';
import { Renderer } from './services/Renderer.ts';
import { ViewportService } from './services/ViewportService.ts';
import { HitTester } from './services/HitTester.ts';
import { SelectionService } from './services/SelectionService.ts';
import { HistoryService } from './services/HistoryService.ts';

export type ShapesProvider = () => Map<string, BaseShape>;
export type OverlayDrawCallback = (
  ctx: CanvasRenderingContext2D,
  zoom: number
) => void;

/**
 * Main rendering engine for the whiteboard.
 * Coordinates rendering services and executes the canvas drawing pipeline.
 * Never handles input events directly.
 */
export class Drawer {
  private shapesGetter: ShapesProvider | null = null;
  private previewShape: BaseShape | null = null;
  private marqueeBounds: Bounds | null = null;
  private snapGuides: SnapLine[] = [];
  private customOverlayCallback: OverlayDrawCallback | null = null;

  public readonly renderer: Renderer;
  public readonly viewport: ViewportService;
  public readonly hitTester: HitTester;
  public readonly selection: SelectionService;
  public readonly history: HistoryService;

  /**
   * Injects single-responsibility services via constructor.
   */
  constructor(
    renderer: Renderer,
    viewport: ViewportService,
    hitTester: HitTester,
    selection: SelectionService,
    history: HistoryService
  ) {
    this.renderer = renderer;
    this.viewport = viewport;
    this.hitTester = hitTester;
    this.selection = selection;
    this.history = history;
  }

  /**
   * Mounts the HTML canvas and initiates the rendering pipeline.
   *
   * @param canvas Target HTML canvas element
   * @param shapesGetter Function returning active shapes map
   */
  public mount(canvas: HTMLCanvasElement, shapesGetter: ShapesProvider): void {
    this.shapesGetter = shapesGetter;
    this.renderer.attach(canvas, (ctx) => this.renderPipeline(ctx));
  }

  /**
   * Detaches canvas and cleans up resources.
   */
  public unmount(): void {
    this.renderer.detach();
    this.shapesGetter = null;
    this.previewShape = null;
    this.marqueeBounds = null;
    this.snapGuides = [];
    this.customOverlayCallback = null;
  }

  /**
   * Requests a re-render on the next animation frame.
   */
  public requestRender(): void {
    this.renderer.markDirty();
  }

  /**
   * Sets in-progress preview shape while user is dragging to draw.
   */
  public setPreviewShape(shape: BaseShape | null): void {
    this.previewShape = shape;
    this.requestRender();
  }

  /**
   * Sets marquee selection rectangle in world coordinates.
   */
  public setMarquee(bounds: Bounds | null): void {
    this.marqueeBounds = bounds;
    this.requestRender();
  }

  /**
   * Sets active magnetic snap guide lines to render.
   */
  public setSnapGuides(guides: SnapLine[] | null): void {
    this.snapGuides = guides ? [...guides] : [];
    this.requestRender();
  }

  /**
   * Registers a custom overlay callback (e.g. for remote cursors).
   */
  public setOverlayCallback(callback: OverlayDrawCallback | null): void {
    this.customOverlayCallback = callback;
    this.requestRender();
  }

  /**
   * Core rendering pipeline executed per dirty frame.
   */
  private renderPipeline(ctx: CanvasRenderingContext2D): void {
    const { panX, panY, zoom } = this.viewport.getTransform();

    // 1. Draw background grid in screen space
    this.renderer.drawGrid(ctx, panX, panY, zoom);

    // 2. Enter world coordinates
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    // 3. Render all committed shapes
    if (this.shapesGetter) {
      const shapesMap = this.shapesGetter();
      for (const shape of shapesMap.values()) {
        shape.draw(ctx);
      }

      // 4. Render selection bounding box & handles
      const selectionBounds = this.selection.getBounds(shapesMap);
      if (selectionBounds) {
        this.selection.drawOverlay(ctx, selectionBounds, zoom);
      }
    }

    // 5. Render in-progress shape preview
    if (this.previewShape) {
      this.previewShape.draw(ctx);
    }

    // 6. Render marquee selection box
    if (this.marqueeBounds) {
      this.drawMarquee(ctx, this.marqueeBounds, zoom);
    }

    // 7. Render magnetic snap / alignment guide lines
    if (this.snapGuides.length > 0) {
      this.drawSnapGuides(ctx, this.snapGuides, zoom);
    }

    // 8. Custom overlay (e.g. remote cursors in world space)
    if (this.customOverlayCallback) {
      this.customOverlayCallback(ctx, zoom);
    }

    // Exit world coordinates
    ctx.restore();
  }

  /**
   * Draws marquee drag-selection box.
   */
  private drawMarquee(
    ctx: CanvasRenderingContext2D,
    bounds: Bounds,
    zoom: number
  ): void {
    ctx.save();
    ctx.strokeStyle = '#6366f1';
    ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
    ctx.lineWidth = 1 / zoom;
    ctx.fillRect(bounds.minX, bounds.minY, bounds.width, bounds.height);
    ctx.strokeRect(bounds.minX, bounds.minY, bounds.width, bounds.height);
    ctx.restore();
  }

  /**
   * Draws magnetic alignment snap guide lines with subtle endpoint anchor markers.
   */
  private drawSnapGuides(
    ctx: CanvasRenderingContext2D,
    guides: SnapLine[],
    zoom: number
  ): void {
    ctx.save();
    ctx.strokeStyle = '#f43f5e';
    ctx.fillStyle = '#f43f5e';
    ctx.lineWidth = 1.25 / zoom;

    const tickRadius = 2.5 / zoom;

    for (const guide of guides) {
      ctx.beginPath();
      ctx.setLineDash([4 / zoom, 3 / zoom]);
      if (guide.orientation === 'vertical') {
        ctx.moveTo(guide.position, guide.start);
        ctx.lineTo(guide.position, guide.end);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(guide.position, guide.start, tickRadius, 0, Math.PI * 2);
        ctx.arc(guide.position, guide.end, tickRadius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.moveTo(guide.start, guide.position);
        ctx.lineTo(guide.end, guide.position);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(guide.start, guide.position, tickRadius, 0, Math.PI * 2);
        ctx.arc(guide.end, guide.position, tickRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
