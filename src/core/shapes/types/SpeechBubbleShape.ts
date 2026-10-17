import { BaseShape } from '../BaseShape.ts';
import type { ShapeConstructorOptions } from '../../../types/index.ts';

/**
 * Speech Bubble premade shape with rounded body and callout tail.
 */
export class SpeechBubbleShape extends BaseShape {
  public static readonly TYPE = 'speech_bubble';

  constructor(options: ShapeConstructorOptions) {
    super(SpeechBubbleShape.TYPE, options);
  }

  private buildPath(): Path2D {
    const path = new Path2D();
    const { x, y, width, height } = this;
    const radius = Math.min(Math.abs(width), Math.abs(height)) * 0.15;
    const bodyBottom = y + height * 0.8;

    // Top-left corner
    path.moveTo(x + radius, y);
    // Top edge & top-right corner
    path.lineTo(x + width - radius, y);
    path.arcTo(x + width, y, x + width, y + radius, radius);
    // Right edge & bottom-right corner
    path.lineTo(x + width, bodyBottom - radius);
    path.arcTo(x + width, bodyBottom, x + width - radius, bodyBottom, radius);

    // Bottom edge towards tail
    path.lineTo(x + width * 0.45, bodyBottom);
    // Tail tip
    path.lineTo(x + width * 0.2, y + height);
    // Back up to bottom edge
    path.lineTo(x + width * 0.25, bodyBottom);

    // Bottom-left corner
    path.lineTo(x + radius, bodyBottom);
    path.arcTo(x, bodyBottom, x, bodyBottom - radius, radius);
    // Left edge & back to top-left corner
    path.lineTo(x, y + radius);
    path.arcTo(x, y, x + radius, y, radius);

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

  public clone(newId?: string): SpeechBubbleShape {
    return new SpeechBubbleShape({
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
