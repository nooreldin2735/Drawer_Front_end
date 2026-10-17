# Collaborative-Ready Whiteboard

A high-performance, collaborative-ready vector whiteboard built using React 19, Vite, TypeScript, and the raw HTML Canvas 2D API (zero drawing library dependencies such as Konva or Fabric).

## Architecture Overview

The application strictly separates presentation from core canvas engine logic:
- **React layer is thin**: Responsible only for mounting the `<canvas>` DOM element, rendering UI controls (Toolbar, ShapePicker, Style controls), and subscribing to state updates.
- **Pure TypeScript core (`src/core/`)**: Holds all domain logic, math, shape hierarchies, canvas rendering, viewport transformations, and multiplayer event streams.

```
src/
├── types/                     # Shared strict TypeScript types & interfaces
│   ├── geometry.ts            # Point, Bounds, ViewportTransform, ResizeHandle
│   ├── shape.ts               # ShapeStyle, SerializedShape, IShape
│   ├── operation.ts           # Serializable operations for sync & history
│   ├── tools.ts               # ToolType, DrawShapeType
│   ├── cursor.ts              # RemoteCursor, CanvasCursorStyle
│   ├── events.ts              # WhiteboardEventMap
│   └── index.ts
├── core/                      # Pure TypeScript business logic (no React)
│   ├── Whiteboard.ts          # Facade: owns shape Map, wires subsystems, emits events
│   ├── drawer/                # Drawing engine (rendering only, no input handling)
│   │   ├── Drawer.ts          # Main drawer orchestrator
│   │   └── services/          # Single-responsibility drawer services
│   │       ├── Renderer.ts         # requestAnimationFrame, dirty-checking, dpr scaling
│   │       ├── ViewportService.ts  # Pan/zoom math, screenToWorld & worldToScreen
│   │       ├── HitTester.ts        # Top-shape hit detection in world space
│   │       ├── SelectionService.ts # Selected shapes, bounding box & resize handles
│   │       └── HistoryService.ts   # Undo/redo operation stacks
│   ├── shapes/                # Vector shape abstractions & factory
│   │   ├── BaseShape.ts       # Abstract base class: bounds, style, serialization
│   │   ├── ShapeFactory.ts    # Registry pattern for instantiating shapes
│   │   └── types/             # One file per shape (basic & premade)
│   ├── cursor/                # Pointer events, coordinate translation & tools
│   │   ├── Cursor.ts          # Canvas pointer event listener & tool router
│   │   └── tools/             # Tool implementations (call Whiteboard methods)
│   │       ├── BaseTool.ts
│   │       ├── SelectTool.ts
│   │       ├── DrawTool.ts
│   │       ├── PanTool.ts
│   │       └── RemoteCursors.ts
│   └── sync/                  # Real-time collaboration
│       └── SyncClient.ts      # WebSocket client with backoff & cursor throttling
├── components/                # Thin React components
│   ├── WhiteboardCanvas.tsx   # Canvas lifecycle & mount/unmount
│   ├── Toolbar.tsx            # Tool selection, undo/redo, style picker
│   └── ShapePicker.tsx        # Grid of premade shape preview thumbnails
├── hooks/
│   └── useWhiteboard.ts       # Custom React hook exposing reactive state
└── App.tsx                    # Root presentation component
```

## Core Subsystems

1. **Whiteboard Facade (`src/core/Whiteboard.ts`)**: The sole API surface between React and the engine. Manages `Map<string, BaseShape>`, coordinates `Drawer`, `Cursor`, `ShapeFactory`, and `SyncClient`, and broadcasts changes to listeners.
2. **Drawer (`src/core/drawer/Drawer.ts`)**: Render-only engine. Offloads tasks to `Renderer` (rAF + dirty flag), `ViewportService` (pan/zoom), `HitTester` (shape hit detection), `SelectionService` (bounding box & resize handles), and `HistoryService` (undo/redo).
3. **ShapeFactory (`src/core/shapes/ShapeFactory.ts`)**: Extensible registry pattern (`Map<string, ShapeConstructor>`). Supports runtime instantiation, premade shape listings for the picker, and JSON deserialization.
4. **Cursor (`src/core/cursor/Cursor.ts`)**: Translates raw DOM PointerEvents to world coordinates via ViewportService and dispatches them to the active tool (`SelectTool`, `DrawTool`, `PanTool`).
5. **SyncClient (`src/core/sync/SyncClient.ts`)**: Serializes state modifications into atomic operations (`shape:add`, `shape:update`, `shape:remove`, `cursor:move`). Applies incoming operations via `Whiteboard.applyRemoteOperation` with backoff auto-reconnect and throttled cursor streaming.

---

## How to Add a New Shape

Adding a new shape to the whiteboard requires just **2 simple steps**:

### Step 1: Create a new shape class in `src/core/shapes/types/`
Create a file (e.g. `src/core/shapes/types/OctagonShape.ts`) extending `BaseShape`:

```typescript
import { BaseShape } from '../BaseShape.ts';
import type { ShapeConstructorOptions } from '../../../types/index.ts';

export class OctagonShape extends BaseShape {
  static readonly TYPE = 'octagon';

  constructor(options: ShapeConstructorOptions) {
    super(OctagonShape.TYPE, options);
  }

  protected drawPath(ctx: CanvasRenderingContext2D): void {
    const { x, y, width, height } = this;
    const stepX = width / 3;
    const stepY = height / 3;

    ctx.beginPath();
    ctx.moveTo(x + stepX, y);
    ctx.lineTo(x + 2 * stepX, y);
    ctx.lineTo(x + width, y + stepY);
    ctx.lineTo(x + width, y + 2 * stepY);
    ctx.lineTo(x + 2 * stepX, y + height);
    ctx.lineTo(x + stepX, y + height);
    ctx.lineTo(x, y + 2 * stepY);
    ctx.lineTo(x, y + stepY);
    ctx.closePath();
  }
}
```

### Step 2: Register it in `ShapeFactory.ts`
Import the shape and register it in `ShapeFactory`:

```typescript
import { OctagonShape } from './types/OctagonShape.ts';

// In ShapeFactory constructor:
this.register(OctagonShape.TYPE, OctagonShape, {
  isPremade: true,
  label: 'Octagon',
  defaultWidth: 100,
  defaultHeight: 100,
});
```

That's it! The shape will automatically:
- Be available in the `ShapePicker` grid.
- Support hit-testing, selection, moving, and resizing.
- Support undo/redo and JSON serialization.
- Broadcast across the collaborative network.
