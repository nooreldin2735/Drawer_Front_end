import React, { useEffect, useRef } from 'react';
import type { ShapeFactory } from '../core/shapes/ShapeFactory.ts';
import type { DrawShapeType, PremadeShapeDefinition } from '../types/index.ts';

interface ShapePickerProps {
  shapeFactory: ShapeFactory;
  activeShapeType?: DrawShapeType;
  onSelectShape: (type: DrawShapeType) => void;
  onClose?: () => void;
}

const ThumbnailCanvas: React.FC<{
  factory: ShapeFactory;
  definition: PremadeShapeDefinition;
}> = ({ factory, definition }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 48, 48);

    try {
      const shape = factory.create(definition.type, {
        id: 'thumb',
        x: 6,
        y: 6,
        width: 36,
        height: 36,
        style: {
          strokeColor: '#818cf8',
          fillColor: 'rgba(99, 102, 241, 0.25)',
          strokeWidth: 2,
          opacity: 1,
        },
      });
      shape.draw(ctx);
    } catch {
      // Fallback
    }
  }, [factory, definition]);

  return (
    <canvas
      ref={canvasRef}
      width={48}
      height={48}
      style={{ display: 'block' }}
    />
  );
};

/**
 * ShapePicker renders registered premade shapes as a grid of live vector thumbnails.
 */
export const ShapePicker: React.FC<ShapePickerProps> = ({
  shapeFactory,
  activeShapeType,
  onSelectShape,
  onClose,
}) => {
  const premades = shapeFactory.listPremade();

  return (
    <div className="shape-picker-popover glass-panel">
      {premades.map((shape) => {
        const isActive = activeShapeType === shape.type;
        return (
          <button
            key={shape.type}
            type="button"
            className={`shape-picker-card ${isActive ? 'active' : ''}`}
            onClick={() => {
              onSelectShape(shape.type as DrawShapeType);
              onClose?.();
            }}
            title={shape.label}
          >
            <ThumbnailCanvas factory={shapeFactory} definition={shape} />
            <span>{shape.label}</span>
          </button>
        );
      })}
    </div>
  );
};
