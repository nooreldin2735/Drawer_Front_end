import { BaseShape } from '../BaseShape.ts';
import { distanceToSegment, isPointInPolygon } from '../geometryUtils.ts';
import type { Point, ShapeConstructorOptions } from '../../../types/index.ts';

/**
 * Directional block Arrow premade shape.
 */
export class ArrowShape extends BaseShape {
  public static readonly TYPE = 'arrow';

  constructor(options: ShapeConstructorOptions) {
    super(ArrowShape.TYPE, options);
  }

  private getVertices(): Point[] {
    const { x, y, width, height } = this;
    const shaftTop = y + height * 0.3;
    const shaftBottom = y + height * 0.7;
    const headX = x + width * 0.6;

    return [
      { x, y: shaftTop },
      { x: headX, y: shaftTop },
      { x: headX, y },
      { x: x + width, y: y + height * 0.5 },
      { x: headX, y: y + height },
      { x: headX, y: shaftBottom },
      { x, y: shaftBottom },
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

  public clone(newId?: string): ArrowShape {
    return new ArrowShape({
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
