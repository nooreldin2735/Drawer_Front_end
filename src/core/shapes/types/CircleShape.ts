import { BaseShape } from '../BaseShape.ts';
import type { ShapeConstructorOptions } from '../../../types/index.ts';

/**
 * Circle / Ellipse shape defined by its bounding box.
 */
export class CircleShape extends BaseShape {
  public static readonly TYPE = 'circle';

  constructor(options: ShapeConstructorOptions) {
    super(CircleShape.TYPE, options);
  }

  private getRadiiAndCenter() {
    const rx = Math.abs(this.width) / 2;
    const ry = Math.abs(this.height) / 2;
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    return { rx, ry, cx, cy };
  }

  protected render(ctx: CanvasRenderingContext2D): void {
    const { rx, ry, cx, cy } = this.getRadiiAndCenter();
    if (rx <= 0 || ry <= 0) return;

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);

    if (this.style.fillColor && this.style.fillColor !== 'transparent') {
      ctx.fill();
    }
    if (this.style.strokeWidth > 0 && this.style.strokeColor !== 'transparent') {
      ctx.stroke();
    }
  }

  protected hitTest(px: number, py: number): boolean {
    const { rx, ry, cx, cy } = this.getRadiiAndCenter();
    if (rx <= 0 || ry <= 0) return false;

    const tolerance = Math.max(this.style.strokeWidth / 2, 4);
    const outerNorm = Math.pow((px - cx) / (rx + tolerance), 2) + Math.pow((py - cy) / (ry + tolerance), 2);

    if (outerNorm > 1) return false;

    if (this.style.fillColor && this.style.fillColor !== 'transparent') {
      return true;
    }

    const innerRx = Math.max(0, rx - tolerance);
    const innerRy = Math.max(0, ry - tolerance);
    if (innerRx === 0 || innerRy === 0) return true;

    const innerNorm = Math.pow((px - cx) / innerRx, 2) + Math.pow((py - cy) / innerRy, 2);
    return innerNorm >= 1;
  }

  public clone(newId?: string): CircleShape {
    return new CircleShape({
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
