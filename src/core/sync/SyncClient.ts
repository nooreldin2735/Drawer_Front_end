import type { WhiteboardOperation } from '../../types/index.ts';

export type OperationHandler = (operation: WhiteboardOperation) => void;
export type SyncStatusHandler = (
  status: 'disconnected' | 'connecting' | 'connected' | 'error',
  error?: string
) => void;

const USER_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
];

/**
 * WebSocket client for real-time collaboration.
 * Serializes local operations, handles exponential backoff reconnects,
 * and functions as a safe no-op stub when no server URL is configured.
 */
export class SyncClient {
  public readonly userId: string;
  public readonly userName: string;
  public readonly userColor: string;

  private serverUrl: string | null = null;
  private socket: WebSocket | null = null;
  private onOperation: OperationHandler | null = null;
  private onStatus: SyncStatusHandler | null = null;
  private reconnectAttempts: number = 0;
  private reconnectTimer: number | null = null;
  private isIntentionallyClosed: boolean = false;

  constructor(serverUrl?: string, userName?: string, userColor?: string) {
    this.userId = crypto.randomUUID().slice(0, 8);
    this.userName = userName ?? `User ${this.userId.slice(0, 4)}`;
    this.userColor =
      userColor ??
      USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
    this.serverUrl = serverUrl ?? null;
  }

  /**
   * Connects to WebSocket server.
   */
  public connect(url?: string): void {
    if (url) this.serverUrl = url;
    if (!this.serverUrl) return;

    this.isIntentionallyClosed = false;
    this.notifyStatus('connecting');

    try {
      this.socket = new WebSocket(this.serverUrl);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.notifyStatus('connected');
      };

      this.socket.onmessage = (event) => {
        try {
          const operation = JSON.parse(event.data) as WhiteboardOperation;
          if (operation && operation.userId !== this.userId && this.onOperation) {
            this.onOperation(operation);
          }
        } catch (err) {
          console.error('SyncClient: failed to parse incoming operation', err);
        }
      };

      this.socket.onclose = () => {
        this.notifyStatus('disconnected');
        if (!this.isIntentionallyClosed) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = () => {
        this.notifyStatus('error', 'WebSocket connection error');
      };
    } catch (err) {
      this.notifyStatus('error', err instanceof Error ? err.message : String(err));
      this.scheduleReconnect();
    }
  }

  /**
   * Sets callback for receiving remote operations.
   */
  public setOperationHandler(handler: OperationHandler): void {
    this.onOperation = handler;
  }

  /**
   * Sets callback for connection status updates.
   */
  public setStatusHandler(handler: SyncStatusHandler): void {
    this.onStatus = handler;
  }

  /**
   * Broadcasts a local operation to the room.
   */
  public send(operation: WhiteboardOperation): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return; // Safe no-op when disconnected or stubbed
    }
    this.socket.send(JSON.stringify(operation));
  }

  /**
   * Broadcasts local cursor movement.
   */
  public broadcastCursor(x: number, y: number, version: number): void {
    this.send({
      id: crypto.randomUUID(),
      type: 'cursor:move',
      payload: { x, y, userName: this.userName, color: this.userColor },
      version,
      userId: this.userId,
      timestamp: Date.now(),
    });
  }

  /**
   * Closes active connection and cancels reconnect timers.
   */
  public disconnect(): void {
    this.isIntentionallyClosed = true;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.notifyStatus('disconnected');
  }

  private scheduleReconnect(): void {
    if (this.isIntentionallyClosed || !this.serverUrl) return;
    const maxBackoff = 10000;
    const backoff = Math.min(maxBackoff, 1000 * Math.pow(1.5, this.reconnectAttempts));
    this.reconnectAttempts++;

    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, backoff);
  }

  private notifyStatus(
    status: 'disconnected' | 'connecting' | 'connected' | 'error',
    error?: string
  ): void {
    if (this.onStatus) {
      this.onStatus(status, error);
    }
  }
}
