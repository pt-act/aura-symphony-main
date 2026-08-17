/**
 * WebSocket transport layer for CRDT collaboration.
 * Handles connection lifecycle, message framing, and reconnection.
 */
import type {Doc} from 'yjs';
import type {TransportProvider} from '../crdt-collaboration';

export class WebSocketTransport implements TransportProvider {
  private ws: WebSocket | null = null;
  private url: string;
  private doc: Doc;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(url: string, doc: Doc) {
    this.url = url;
    this.doc = doc;
  }

  connect(roomId: string, doc: Doc): void {
    this.url = `${this.url}/${roomId}`;
    this.doc = doc;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      console.log(`[WS] Connected to ${this.url}`);
    };

    this.ws.onclose = (event) => {
      console.warn(`[WS] Disconnected: ${event.code} ${event.reason}`);
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
    this.reconnectTimer = window.setTimeout(() => {
      const onConnect = () => {};
      const onDisconnect = () => {};
      this.connect('', this.doc);
    }, delay);
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

  setAwareness(state: import('../crdt-collaboration').PeerAwareness): void {
    this.send(JSON.stringify({type: 'awareness', state}));
  }

  getAwareness(): Map<number, import('../crdt-collaboration').PeerAwareness> {
    return new Map();
  }

  onAwarenessChange(callback: (peers: Map<number, import('../crdt-collaboration').PeerAwareness>) => void): void {
    // No-op for now
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
// ─── Color palette for peer cursors ──────────────────────────────────

const PEER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F0B27A', '#82E0AA',
];

function pickColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return PEER_COLORS[hash % PEER_COLORS.length];
}

// ─── Collaboration Session ───────────────────────────────────────────
