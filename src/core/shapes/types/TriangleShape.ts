import { BaseShape } from '../BaseShape.ts';
import { distanceToSegment, isPointInPolygon } from '../geometryUtils.ts';
import type { Point, ShapeConstructorOptions } from '../../../types/index.ts';

/**
 * 2D Triangle shape.
 */
export class TriangleShape extends BaseShape {
  public static readonly TYPE = 'triangle';

  constructor(options: ShapeConstructorOptions) {
    super(TriangleShape.TYPE, options);
  }

  private getVertices(): Point[] {
    return [
      { x: this.x + this.width / 2, y: this.y },
      { x: this.x + this.width, y: this.y + this.height },
      { x: this.x, y: this.y + this.height },
    ];
  }

  protected render(ctx: CanvasRenderingContext2D): void {
    const [v1, v2, v3] = this.getVertices();

    ctx.beginPath();
    ctx.moveTo(v1.x, v1.y);
    ctx.lineTo(v2.x, v2.y);
    ctx.lineTo(v3.x, v3.y);
    ctx.closePath();

    if (this.style.fillColor && this.style.fillColor !== 'transparent') {
      ctx.fill();
    }
    if (this.style.strokeWidth > 0 && this.style.strokeColor !== 'transparent') {
      ctx.stroke();
    }
  }

  protected hitTest(px: number, py: number): boolean {
    const vertices = this.getVertices();
    const point = { x: px, y: py };

    if (this.style.fillColor && this.style.fillColor !== 'transparent') {
      return isPointInPolygon(point, vertices);
    }

    const threshold = Math.max(this.style.strokeWidth / 2, 5);
    return (
      distanceToSegment(point, vertices[0], vertices[1]) <= threshold ||
      distanceToSegment(point, vertices[1], vertices[2]) <= threshold ||
      distanceToSegment(point, vertices[2], vertices[0]) <= threshold
    );
  }

  public clone(newId?: string): TriangleShape {
    return new TriangleShape({
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
