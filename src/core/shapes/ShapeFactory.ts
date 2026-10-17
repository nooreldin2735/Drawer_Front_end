import type {
  ShapeConstructor,
  ShapeConstructorOptions,
  SerializedShape,
  PremadeShapeDefinition,
} from '../../types/index.ts';
import { BaseShape } from './BaseShape.ts';
import { RectangleShape } from './types/RectangleShape.ts';
import { CircleShape } from './types/CircleShape.ts';
import { LineShape } from './types/LineShape.ts';
import { TriangleShape } from './types/TriangleShape.ts';
import { FreehandShape } from './types/FreehandShape.ts';
import { StarShape } from './types/StarShape.ts';
import { ArrowShape } from './types/ArrowShape.ts';
import { HexagonShape } from './types/HexagonShape.ts';
import { DiamondShape } from './types/DiamondShape.ts';
import { HeartShape } from './types/HeartShape.ts';
import { SpeechBubbleShape } from './types/SpeechBubbleShape.ts';

/**
 * ShapeFactory handles registration and instantiation of vector shapes.
 * Maintains registry of constructors and premade shape definitions.
 */
export class ShapeFactory {
  private readonly registry: Map<string, ShapeConstructor> = new Map();
  private readonly premadeRegistry: Map<string, PremadeShapeDefinition> = new Map();

  constructor() {
    this.registerDefaults();
  }

  /**
   * Registers default basic and premade shapes.
   */
  private registerDefaults(): void {
    // Basic shapes
    this.register(RectangleShape.TYPE, RectangleShape);
    this.register(CircleShape.TYPE, CircleShape);
    this.register(LineShape.TYPE, LineShape);
    this.register(TriangleShape.TYPE, TriangleShape);
    this.register(FreehandShape.TYPE, FreehandShape);

    // Premade shapes
    this.register(StarShape.TYPE, StarShape, {
      type: StarShape.TYPE,
      label: 'Star',
      defaultWidth: 100,
      defaultHeight: 100,
    });
    this.register(ArrowShape.TYPE, ArrowShape, {
      type: ArrowShape.TYPE,
      label: 'Arrow',
      defaultWidth: 120,
      defaultHeight: 70,
    });
    this.register(HexagonShape.TYPE, HexagonShape, {
      type: HexagonShape.TYPE,
      label: 'Hexagon',
      defaultWidth: 100,
      defaultHeight: 100,
    });
    this.register(DiamondShape.TYPE, DiamondShape, {
      type: DiamondShape.TYPE,
      label: 'Diamond',
      defaultWidth: 90,
      defaultHeight: 90,
    });
    this.register(HeartShape.TYPE, HeartShape, {
      type: HeartShape.TYPE,
      label: 'Heart',
      defaultWidth: 100,
      defaultHeight: 95,
    });
    this.register(SpeechBubbleShape.TYPE, SpeechBubbleShape, {
      type: SpeechBubbleShape.TYPE,
      label: 'Speech Bubble',
      defaultWidth: 120,
      defaultHeight: 90,
    });
  }

  /**
   * Registers a new shape constructor.
   *
   * @param type Unique shape identifier (e.g. 'rectangle', 'star')
   * @param ctor Shape constructor subclassing BaseShape
   * @param premade Optional metadata if shape should appear in Premade picker
   */
  public register(
    type: string,
    ctor: ShapeConstructor,
    premade?: PremadeShapeDefinition
  ): void {
    this.registry.set(type, ctor);
    if (premade) {
      this.premadeRegistry.set(type, premade);
    }
  }

  /**
   * Instantiates a registered shape.
   *
   * @param type Registered shape identifier
   * @param options Constructor options (position, size, style, data)
   * @returns BaseShape instance
   */
  public create(type: string, options: ShapeConstructorOptions): BaseShape {
    const Ctor = this.registry.get(type);
    if (!Ctor) {
      throw new Error(`ShapeFactory: unregistered shape type "${type}"`);
    }
    const instance = new Ctor(options);
    if (!(instance instanceof BaseShape)) {
      throw new Error(`ShapeFactory: constructor for "${type}" must extend BaseShape`);
    }
    return instance;
  }

  /**
   * Returns list of all registered premade shape definitions for the picker.
   */
  public listPremade(): PremadeShapeDefinition[] {
    return Array.from(this.premadeRegistry.values());
  }

  /**
   * Reconstitutes a BaseShape instance from a serialized JSON payload.
   *
   * @param json SerializedShape payload
   * @returns Deserialized BaseShape instance
   */
  public fromJSON(json: SerializedShape): BaseShape {
    return this.create(json.type, {
      id: json.id,
      x: json.x,
      y: json.y,
      width: json.width,
      height: json.height,
      style: json.style,
      data: json.data,
    });
  }

  /**
   * Checks if a shape type has been registered.
   */
  public has(type: string): boolean {
    return this.registry.has(type);
  }
}
