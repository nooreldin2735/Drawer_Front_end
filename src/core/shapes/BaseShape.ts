import type {
  Bounds,
  Point,
  ShapeConstructorOptions,
  ShapeStyle,
  SerializedShape,
  IShape,
} from '../../types/index.ts';

const DEFAULT_STYLE: ShapeStyle = {
  strokeColor: '#6366f1',
  fillColor: 'transparent',
  strokeWidth: 2,
  opacity: 1,
};

/**
 * Abstract base class for all vector shapes on the canvas.
 * Manages identity, coordinates, styles, serialization, and life-cycle rendering.
 */
export abstract class BaseShape implements IShape {
  public readonly id: string;
  public readonly type: string;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public style: ShapeStyle;
  public data: Record<string, unknown>;

  /**
   * Initializes common shape attributes.
   */
  constructor(type: string, options: ShapeConstructorOptions) {
    this.id = options.id;
    this.type = type;
    this.x = options.x;
    this.y = options.y;
    this.width = options.width ?? 100;
    this.height = options.height ?? 100;
    this.style = { ...DEFAULT_STYLE, ...options.style };
    this.data = options.data ? { ...options.data } : {};
  }

  /**
   * Renders the shape using Canvas 2D context.
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, this.style.opacity));
    ctx.strokeStyle = this.style.strokeColor;
    ctx.fillStyle = this.style.fillColor;
    ctx.lineWidth = this.style.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    this.render(ctx);

    ctx.restore();
  }

  /**
   * Core rendering routine implemented by each concrete shape.
   */
  protected abstract render(ctx: CanvasRenderingContext2D): void;

  /**
   * Hit-tests whether a world coordinate falls within this shape.
   * Supports both `contains(x, y)` and `contains(point)` signatures.
   */
  public contains(pointOrX: Point | number, y?: number): boolean {
    const px = typeof pointOrX === 'number' ? pointOrX : pointOrX.x;
    const py = typeof pointOrX === 'number' ? (y ?? 0) : pointOrX.y;
    return this.hitTest(px, py);
  }

  /**
   * Concrete hit-test implementation for coordinate (px, py).
   */
  protected abstract hitTest(px: number, py: number): boolean;

  /**
   * Returns axis-aligned bounding box of this shape in world coordinates.
   */
  public getBounds(): Bounds {
    const minX = Math.min(this.x, this.x + this.width);
    const minY = Math.min(this.y, this.y + this.height);
    const maxX = Math.max(this.x, this.x + this.width);
    const maxY = Math.max(this.y, this.y + this.height);
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Translates shape position by delta (dx, dy).
   */
  public translate(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  /**
   * Resizes shape to fit within new target bounding box.
   */
  public resizeToBounds(bounds: Bounds): void {
    this.x = bounds.minX;
    this.y = bounds.minY;
    this.width = bounds.width;
    this.height = bounds.height;
  }

  /**
   * Serializes this shape to a plain JSON-compatible object.
   */
  public toJSON(): SerializedShape {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      style: { ...this.style },
      data: { ...this.data },
    };
  }

  /**
   * Creates a deep clone of this shape with an optional new identifier.
   */
  public abstract clone(newId?: string): BaseShape;
}
