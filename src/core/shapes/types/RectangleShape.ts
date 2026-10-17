import { BaseShape } from '../BaseShape.ts';
import type { ShapeConstructorOptions } from '../../../types/index.ts';

/**
 * 2D Rectangle shape.
 */
export class RectangleShape extends BaseShape {
  public static readonly TYPE = 'rectangle';

  constructor(options: ShapeConstructorOptions) {
    super(RectangleShape.TYPE, options);
  }

  protected render(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);

    if (this.style.fillColor && this.style.fillColor !== 'transparent') {
      ctx.fill();
    }
    if (this.style.strokeWidth > 0 && this.style.strokeColor !== 'transparent') {
      ctx.stroke();
    }
  }

  protected hitTest(px: number, py: number): boolean {
    const bounds = this.getBounds();
    const tolerance = Math.max(this.style.strokeWidth / 2, 4);

    const isInsideOuter =
      px >= bounds.minX - tolerance &&
      px <= bounds.maxX + tolerance &&
      py >= bounds.minY - tolerance &&
      py <= bounds.maxY + tolerance;

    if (!isInsideOuter) return false;

    // If filled, any point inside is a hit
    if (this.style.fillColor && this.style.fillColor !== 'transparent') {
      return true;
    }

    // If hollow, hit only on/near border
    const isInsideInner =
      px > bounds.minX + tolerance &&
      px < bounds.maxX - tolerance &&
      py > bounds.minY + tolerance &&
      py < bounds.maxY - tolerance;

    return !isInsideInner;
  }

  public clone(newId?: string): RectangleShape {
    return new RectangleShape({
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
