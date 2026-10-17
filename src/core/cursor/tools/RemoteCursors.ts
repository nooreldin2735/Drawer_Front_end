import type { RemoteCursor } from '../../../types/index.ts';

/**
 * Manages and renders live multiplayer cursor indicators and user badges.
 */
export class RemoteCursors {
  private cursors: Map<string, RemoteCursor> = new Map();

  /**
   * Updates or registers a remote user's cursor position.
   */
  public update(cursor: RemoteCursor): void {
    this.cursors.set(cursor.userId, {
      ...cursor,
      lastUpdate: Date.now(),
    });
  }

  /**
   * Removes a disconnected user's cursor.
   */
  public remove(userId: string): void {
    this.cursors.delete(userId);
  }

  /**
   * Returns list of currently active remote cursors.
   */
  public getAll(): RemoteCursor[] {
    return Array.from(this.cursors.values());
  }

  /**
   * Cleans up stale cursors that haven't sent updates recently.
   */
  public cleanStale(maxAgeMs: number = 20000): void {
    const cutoff = Date.now() - maxAgeMs;
    for (const [id, cursor] of this.cursors.entries()) {
      if (cursor.lastUpdate < cutoff) {
        this.cursors.delete(id);
      }
    }
  }

  /**
   * Renders all active remote cursors with name labels.
   */
  public render(ctx: CanvasRenderingContext2D, zoom: number): void {
    this.cleanStale();
    if (this.cursors.size === 0) return;

    ctx.save();
    const scale = 1 / zoom;

    for (const cursor of this.cursors.values()) {
      const { x, y, color, userName } = cursor;

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      // 1. Draw pointer arrow
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 16);
      ctx.lineTo(4.5, 12.5);
      ctx.lineTo(9.5, 21.5);
      ctx.lineTo(12.5, 20);
      ctx.lineTo(7.5, 11);
      ctx.lineTo(14, 11);
      ctx.closePath();

      ctx.fillStyle = color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      ctx.fill();
      ctx.stroke();

      // Reset shadow for text badge
      ctx.shadowColor = 'transparent';

      // 2. Draw user name badge
      if (userName) {
        const text = userName;
        ctx.font = '600 11px Inter, system-ui, sans-serif';
        const metrics = ctx.measureText(text);
        const padX = 6;
        const badgeW = metrics.width + padX * 2;
        const badgeH = 18;
        const badgeX = 14;
        const badgeY = 14;
        const radius = 4;

        // Rounded badge background
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, radius);
        ctx.fill();

        // White text
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, badgeX + padX, badgeY + badgeH / 2 + 0.5);
      }

      ctx.restore();
    }

    ctx.restore();
  }
}
