import type { Point } from '../../types/index.ts';

/**
 * Calculates perpendicular distance from point P to line segment AB.
 */
export function distanceToSegment(
  p: Point,
  a: Point,
  b: Point
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    const px = p.x - a.x;
    const py = p.y - a.y;
    return Math.sqrt(px * px + py * py);
  }

  // Projection scalar t on segment [0, 1]
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;

  const diffX = p.x - projX;
  const diffY = p.y - projY;
  return Math.sqrt(diffX * diffX + diffY * diffY);
}

/**
 * Determines whether a point is inside a polygon using ray-casting algorithm.
 */
export function isPointInPolygon(p: Point, vertices: Point[]): boolean {
  let inside = false;
  const n = vertices.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const vi = vertices[i];
    const vj = vertices[j];

    const intersect =
      vi.y > p.y !== vj.y > p.y &&
      p.x < ((vj.x - vi.x) * (p.y - vi.y)) / (vj.y - vi.y) + vi.x;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}
