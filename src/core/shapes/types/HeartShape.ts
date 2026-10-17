import { BaseShape } from '../BaseShape.ts';
import type { ShapeConstructorOptions } from '../../../types/index.ts';

/**
 * Heart premade shape using smooth cubic bezier curves.
 */
export class HeartShape extends BaseShape {
  public static readonly TYPE = 'heart';

  constructor(options: ShapeConstructorOptions) {
    super(HeartShape.TYPE, options);
  }

  private buildPath(): Path2D {
    const path = new Path2D();
    const { x, y, width, height } = this;
    const topCenter = { x: x + width / 2, y: y + height * 0.28 };
    const bottomPoint = { x: x + width / 2, y: y + height };

    path.moveTo(topCenter.x, topCenter.y);

    // Left lobe
    path.bezierCurveTo(
      x + width * 0.15,
      y - height * 0.05,
      x - width * 0.05,
      y + height * 0.45,
      bottomPoint.x,
      bottomPoint.y
    );

    // Right lobe
    path.bezierCurveTo(
      x + width * 1.05,
      y + height * 0.45,
      x + width * 0.85,
      y - height * 0.05,
      topCenter.x,
      topCenter.y
    );

    path.closePath();
    return path;
  }

  protected render(ctx: CanvasRenderingContext2D): void {
    const path = this.buildPath();

    if (this.style.fillColor && this.style.fillColor !== 'transparent') {
      ctx.fill(path);
    }
    if (this.style.strokeWidth > 0 && this.style.strokeColor !== 'transparent') {
      ctx.stroke(path);
    }
  }

  protected hitTest(px: number, py: number): boolean {
    const bounds = this.getBounds();
    const tolerance = Math.max(this.style.strokeWidth / 2, 4);

    if (
      px < bounds.minX - tolerance ||
      px > bounds.maxX + tolerance ||
      py < bounds.minY - tolerance ||
      py > bounds.maxY + tolerance
    ) {
      return false;
    }

    // Offscreen context test for accurate bezier hit-testing
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    const path = this.buildPath();
    if (this.style.fillColor && this.style.fillColor !== 'transparent') {
      return ctx.isPointInPath(path, px, py);
    }

    ctx.lineWidth = Math.max(this.style.strokeWidth, 6);
    return ctx.isPointInStroke(path, px, py);
  }

  public clone(newId?: string): HeartShape {
    return new HeartShape({
      id: newId ?? crypto.randomUUID(),
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      style: { ...this.style },
      data: { ...this.data },
    });
  }
}
