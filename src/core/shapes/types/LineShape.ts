import { BaseShape } from '../BaseShape.ts';
import { distanceToSegment } from '../geometryUtils.ts';
import type { ShapeConstructorOptions } from '../../../types/index.ts';

/**
 * 2D straight Line segment shape.
 */
export class LineShape extends BaseShape {
  public static readonly TYPE = 'line';

  constructor(options: ShapeConstructorOptions) {
    super(LineShape.TYPE, options);
  }

  protected render(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + this.width, this.y + this.height);

    if (this.style.strokeWidth > 0 && this.style.strokeColor !== 'transparent') {
      ctx.stroke();
    }
  }

  protected hitTest(px: number, py: number): boolean {
    const a = { x: this.x, y: this.y };
    const b = { x: this.x + this.width, y: this.y + this.height };
    const threshold = Math.max(this.style.strokeWidth / 2, 6);

    const dist = distanceToSegment({ x: px, y: py }, a, b);
    return dist <= threshold;
  }

  public clone(newId?: string): LineShape {
    return new LineShape({
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
