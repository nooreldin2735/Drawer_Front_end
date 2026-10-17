import type { Bounds, Point } from './geometry.ts';

/**
 * Styling attributes applicable to 2D vector shapes.
 */
export interface ShapeStyle {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
}

/**
 * Constructor arguments supplied to any BaseShape instantiation.
 */
export interface ShapeConstructorOptions {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  style?: Partial<ShapeStyle>;
  data?: Record<string, unknown>;
}

/**
 * Serializable JSON format representing any BaseShape instance.
 */
export interface SerializedShape {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: ShapeStyle;
  data?: Record<string, unknown>;
}

/**
 * Metadata definition for premade shapes displayed in the picker.
 */
export interface PremadeShapeDefinition {
  type: string;
  label: string;
  defaultWidth: number;
  defaultHeight: number;
}

/**
 * Common shape interface matching BaseShape contract.
 */
export interface IShape {
  readonly id: string;
  readonly type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: ShapeStyle;
  data: Record<string, unknown>;

  draw(ctx: CanvasRenderingContext2D): void;
  contains(worldPoint: Point): boolean;
  getBounds(): Bounds;
  toJSON(): SerializedShape;
  clone(newId?: string): IShape;
}

/**
 * Constructor type for shape classes registered with ShapeFactory.
 */
export type ShapeConstructor = new (options: ShapeConstructorOptions) => IShape;
