import { BaseShape } from '../BaseShape.ts';
import { distanceToSegment, isPointInPolygon } from '../geometryUtils.ts';
import type { Point, ShapeConstructorOptions } from '../../../types/index.ts';

/**
 * Diamond (rhombus) premade shape.
 */
export class DiamondShape extends BaseShape {
  public static readonly TYPE = 'diamond';

  constructor(options: ShapeConstructorOptions) {
    super(DiamondShape.TYPE, options);
  }

  private getVertices(): Point[] {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    return [
      { x: cx, y: this.y },
      { x: this.x + this.width, y: cy },
      { x: cx, y: this.y + this.height },
      { x: this.x, y: cy },
    ];
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

  public clone(newId?: string): DiamondShape {
    return new DiamondShape({
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
