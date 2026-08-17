/**
 * WebSocket transport layer for CRDT collaboration.
 * Handles connection lifecycle, message framing, and reconnection.
 */
import type {Y} from 'yjs';
import type {TransportProvider} from '../crdt-collaboration';

export class WebSocketTransport implements TransportProvider {
  private ws: WebSocket | null = null;
  private url: string;
  private doc: Doc;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private onConnectCallback?: () => void;
  private onDisconnectCallback?: (reason: string) => void;

  constructor(url: string, doc: Doc) {
    this.url = url;
    this.doc = doc;
  }

  connect(onConnect?: () => void, onDisconnect?: (reason: string) => void): void {
    this.onConnectCallback = onConnect;
    this.onDisconnectCallback = onDisconnect;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      console.log(`[WS] Connected to ${this.url}`);
      onConnect?.();
    };

    this.ws.onclose = (event) => {
      console.warn(`[WS] Disconnected: ${event.code} ${event.reason}`);
      onDisconnect?.(event.reason || 'Connection closed');
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('[WS] Error:', error);
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[WS] Max reconnect attempts reached');
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.reconnectTimer = window.setTimeout(() => this.connect(this.onConnectCallback, this.onDisconnectCallback), delay);
  }

  send(data: string | ArrayBuffer): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      console.warn('[WS] Attempted to send while not connected');
    }
  }

  onMessage(callback: (data: string | ArrayBuffer) => void): void {
    if (this.ws) {
      this.ws.onmessage = (event) => callback(event.data);
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
