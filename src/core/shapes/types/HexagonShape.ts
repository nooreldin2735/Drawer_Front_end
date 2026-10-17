import { BaseShape } from '../BaseShape.ts';
import { distanceToSegment, isPointInPolygon } from '../geometryUtils.ts';
import type { Point, ShapeConstructorOptions } from '../../../types/index.ts';

/**
 * 6-sided Hexagon premade shape.
 */
export class HexagonShape extends BaseShape {
  public static readonly TYPE = 'hexagon';

  constructor(options: ShapeConstructorOptions) {
    super(HexagonShape.TYPE, options);
  }

  private getVertices(): Point[] {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const rx = Math.abs(this.width) / 2;
    const ry = Math.abs(this.height) / 2;

    const vertices: Point[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      vertices.push({
        x: cx + Math.cos(angle) * rx,
        y: cy + Math.sin(angle) * ry,
      });
    }
    return vertices;
  }

  protected render(ctx: CanvasRenderingContext2D): void {
    const vertices = this.getVertices();

    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
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
    const p = { x: px, y: py };

    if (this.style.fillColor && this.style.fillColor !== 'transparent') {
      return isPointInPolygon(p, vertices);
    }

    const threshold = Math.max(this.style.strokeWidth / 2, 5);
    for (let i = 0; i < vertices.length; i++) {
      const next = vertices[(i + 1) % vertices.length];
      if (distanceToSegment(p, vertices[i], next) <= threshold) {
        return true;
      }
    }
    return false;
  }

  public clone(newId?: string): HexagonShape {
    return new HexagonShape({
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
