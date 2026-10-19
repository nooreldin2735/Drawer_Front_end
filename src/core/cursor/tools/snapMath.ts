import type { Bounds, SnapLine, SnapResult } from '../../../types/index.ts';

/**
 * Calculates magnetic snapping adjustments and visual guide lines when moving bounds.
 *
 * Checks alignment on both axes:
 * - Edge-to-edge (Left-Left, Left-Right, Right-Left, Right-Right)
 * - Center-to-center
 * - Top-Top, Top-Bottom, Bottom-Top, Bottom-Bottom
 *
 * @param draggedBounds Tentative bounding box of dragged selection (with raw dx/dy applied)
 * @param stationaryBounds Bounding boxes of stationary (unselected) shapes
 * @param zoom Current canvas viewport zoom level
 * @param thresholdScreenPx Snap distance threshold in screen pixels (default 8)
 */
export function computeMoveSnap(
  draggedBounds: Bounds,
  stationaryBounds: Bounds[],
  zoom: number,
  thresholdScreenPx: number = 8
): SnapResult {
  if (stationaryBounds.length === 0) {
    return { adjustedDx: 0, adjustedDy: 0, guides: [] };
  }

  const threshold = thresholdScreenPx / zoom;
  const padding = 12 / zoom;

  const dragCenterX = draggedBounds.minX + draggedBounds.width / 2;
  const dragCenterY = draggedBounds.minY + draggedBounds.height / 2;

  // --------------------------------------------------------------------------
  // X-axis alignment (Produces vertical guide lines)
  // --------------------------------------------------------------------------
  let bestDistX = threshold;
  let bestOffsetDx = 0;
  let matchingTargetsX: { targetBounds: Bounds; pos: number }[] = [];

  for (const sb of stationaryBounds) {
    const sbCenterX = sb.minX + sb.width / 2;

    const xPairs: [number, number][] = [
      // Flush edge alignments (side by side)
      [draggedBounds.minX, sb.maxX], // Left to Right
      [draggedBounds.maxX, sb.minX], // Right to Left

      // Boundary edge alignments
      [draggedBounds.minX, sb.minX], // Left to Left
      [draggedBounds.maxX, sb.maxX], // Right to Right

      // Center alignment
      [dragCenterX, sbCenterX],
    ];

    for (const [dragX, targetX] of xPairs) {
      const diff = targetX - dragX;
      const absDiff = Math.abs(diff);

      if (absDiff < bestDistX - 1e-4) {
        bestDistX = absDiff;
        bestOffsetDx = diff;
        matchingTargetsX = [{ targetBounds: sb, pos: targetX }];
      } else if (
        Math.abs(absDiff - bestDistX) < 1e-4 &&
        Math.abs(diff - bestOffsetDx) < 1e-4
      ) {
        matchingTargetsX.push({ targetBounds: sb, pos: targetX });
      }
    }
  }

  // --------------------------------------------------------------------------
  // Y-axis alignment (Produces horizontal guide lines)
  // --------------------------------------------------------------------------
  let bestDistY = threshold;
  let bestOffsetDy = 0;
  let matchingTargetsY: { targetBounds: Bounds; pos: number }[] = [];

  for (const sb of stationaryBounds) {
    const sbCenterY = sb.minY + sb.height / 2;

    const yPairs: [number, number][] = [
      // Flush edge alignments (stacked above / below)
      [draggedBounds.minY, sb.maxY], // Top to Bottom
      [draggedBounds.maxY, sb.minY], // Bottom to Top

      // Boundary edge alignments
      [draggedBounds.minY, sb.minY], // Top to Top
      [draggedBounds.maxY, sb.maxY], // Bottom to Bottom

      // Center alignment
      [dragCenterY, sbCenterY],
    ];

    for (const [dragY, targetY] of yPairs) {
      const diff = targetY - dragY;
      const absDiff = Math.abs(diff);

      if (absDiff < bestDistY - 1e-4) {
        bestDistY = absDiff;
        bestOffsetDy = diff;
        matchingTargetsY = [{ targetBounds: sb, pos: targetY }];
      } else if (
        Math.abs(absDiff - bestDistY) < 1e-4 &&
        Math.abs(diff - bestOffsetDy) < 1e-4
      ) {
        matchingTargetsY.push({ targetBounds: sb, pos: targetY });
      }
    }
  }

  const guides: SnapLine[] = [];

  // Construct vertical guide line(s)
  if (matchingTargetsX.length > 0) {
    const pos = matchingTargetsX[0].pos;
    const finalMinY = draggedBounds.minY + bestOffsetDy;
    const finalMaxY = draggedBounds.maxY + bestOffsetDy;

    let startY = finalMinY;
    let endY = finalMaxY;

    for (const match of matchingTargetsX) {
      startY = Math.min(startY, match.targetBounds.minY);
      endY = Math.max(endY, match.targetBounds.maxY);
    }

    guides.push({
      orientation: 'vertical',
      position: pos,
      start: startY - padding,
      end: endY + padding,
    });
  }

  // Construct horizontal guide line(s)
  if (matchingTargetsY.length > 0) {
    const pos = matchingTargetsY[0].pos;
    const finalMinX = draggedBounds.minX + bestOffsetDx;
    const finalMaxX = draggedBounds.maxX + bestOffsetDx;

    let startX = finalMinX;
    let endX = finalMaxX;

    for (const match of matchingTargetsY) {
      startX = Math.min(startX, match.targetBounds.minX);
      endX = Math.max(endX, match.targetBounds.maxX);
    }

    guides.push({
      orientation: 'horizontal',
      position: pos,
      start: startX - padding,
      end: endX + padding,
    });
  }

  return {
    adjustedDx: bestOffsetDx,
    adjustedDy: bestOffsetDy,
    guides,
  };
}
