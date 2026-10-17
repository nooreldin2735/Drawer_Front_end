import { BaseShape } from '../BaseShape.ts';
import { distanceToSegment } from '../geometryUtils.ts';
import type { Bounds, Point, ShapeConstructorOptions } from '../../../types/index.ts';

/**
 * Freehand brush / pencil drawing path.
 */
export class FreehandShape extends BaseShape {
  public static readonly TYPE = 'freehand';

  constructor(options: ShapeConstructorOptions) {
    super(FreehandShape.TYPE, options);
    if (!Array.isArray(this.data.points)) {
      this.data.points = [{ x: options.x, y: options.y }];
    }
    this.recalculateBounds();
  }

  public get points(): Point[] {
    return (this.data.points as Point[]) || [];
  }

  public set points(val: Point[]) {
    this.data.points = val;
    this.recalculateBounds();
  }

  /**
   * Appends a new point to the freehand stroke.
   */
  public addPoint(p: Point): void {
    this.points.push(p);
    this.recalculateBounds();
  }

  private recalculateBounds(): void {
    const pts = this.points;
    if (pts.length === 0) return;

    let minX = pts[0].x;
    let minY = pts[0].y;
    let maxX = pts[0].x;
    let maxY = pts[0].y;

    for (let i = 1; i < pts.length; i++) {
      const pt = pts[i];
      if (pt.x < minX) minX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y > maxY) maxY = pt.y;
    }

    this.x = minX;
    this.y = minY;
    this.width = Math.max(maxX - minX, 1);
    this.height = Math.max(maxY - minY, 1);
  }

  public override translate(dx: number, dy: number): void {
    super.translate(dx, dy);
    for (const pt of this.points) {
      pt.x += dx;
      pt.y += dy;
    }
  }

  public override resizeToBounds(newBounds: Bounds): void {
    const oldBounds = this.getBounds();
    const scaleX = oldBounds.width > 0 ? newBounds.width / oldBounds.width : 1;
    const scaleY = oldBounds.height > 0 ? newBounds.height / oldBounds.height : 1;

    for (const pt of this.points) {
      pt.x = newBounds.minX + (pt.x - oldBounds.minX) * scaleX;
      pt.y = newBounds.minY + (pt.y - oldBounds.minY) * scaleY;
    }

    super.resizeToBounds(newBounds);
  }

  protected render(ctx: CanvasRenderingContext2D): void {
    const pts = this.points;
    if (pts.length < 2) {
      if (pts.length === 1) {
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, this.style.strokeWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = this.style.strokeColor;
        ctx.fill();
      }
      return;
    }

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);

    // Smooth quadratic curve midpoint interpolation
    for (let i = 1; i < pts.length - 1; i++) {
      const midX = (pts[i].x + pts[i + 1].x) / 2;
      const midY = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
    }

    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);

    if (this.style.strokeWidth > 0 && this.style.strokeColor !== 'transparent') {
      ctx.stroke();
    }
  }

  protected hitTest(px: number, py: number): boolean {
    const pts = this.points;
    if (pts.length === 0) return false;
    const threshold = Math.max(this.style.strokeWidth / 2, 6);
    const p = { x: px, y: py };

    if (pts.length === 1) {
      const dx = px - pts[0].x;
      const dy = py - pts[0].y;
      return Math.sqrt(dx * dx + dy * dy) <= threshold;
    }

    for (let i = 0; i < pts.length - 1; i++) {
      if (distanceToSegment(p, pts[i], pts[i + 1]) <= threshold) {
        return true;
      }
    }

    return false;
  }

  public clone(newId?: string): FreehandShape {
    return new FreehandShape({
      id: newId ?? crypto.randomUUID(),
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      style: { ...this.style },
      data: { points: this.points.map((p) => ({ ...p })) },
    });
  }
}
