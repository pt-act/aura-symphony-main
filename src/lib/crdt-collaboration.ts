/**
 * CRDT Collaborative Editing Module (Yjs)
 *
 * Implements the "Master Score" vision from VISION.md: conflict-free
 * real-time collaboration on Symphony documents (annotations, insights,
 * DLP, and presentations). Uses Yjs for CRDT-based data structures
 * with IndexedDB persistence and WebSocket transport.
 *
 * Architecture:
 *   YDoc (Yjs Document)
 *     ├── annotations  → Y.Array<Annotation>
 *     ├── insights     → Y.Array<Insight>
 *     ├── dlp          → Y.Map<ConceptMastery>
 *     ├── chat         → Y.Array<ChatMessage>
 *     ├── cursors      → Y.Map<CursorState>  (awareness)
 *     └── metadata     → Y.Map<DocMetadata>
 *
 * Transport options (plug-in pattern):
 *   - WebSocket (y-websocket) for server-mediated sync
 *   - WebRTC (y-webrtc) for peer-to-peer sync
 *   - Firestore (custom adapter) for existing infra
 *
 * References:
 *   [1] Shapiro et al. (2011) "Conflict-free Replicated Data Types"
 *   [2] Kleppmann & Beresford (2017) "A Conflict-Free Replicated JSON Datatype"
 *   [3] Yjs documentation: https://docs.yjs.dev/
 *
 * @module
 */

import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

// ─── Types ────────────────────────────────────────────────────────────

/** Awareness state for each connected peer. */
export interface PeerAwareness {
  userId: string;
  displayName: string;
  color: string;
  cursor?: { time: number; insightId?: number };
  lastActive: number;
}

/** Metadata for a collaborative document. */
export interface DocMetadata {
  title: string;
  videoId?: string;
  createdAt: number;
  createdBy: string;
  lastModified: number;
}

/** Change event emitted by the collaboration system. */
export interface CollabChangeEvent {
  type: 'annotation' | 'insight' | 'dlp' | 'chat' | 'cursor' | 'metadata';
  origin: 'local' | 'remote';
  userId?: string;
}

/** Callback for change events. */
export type CollabChangeCallback = (event: CollabChangeEvent) => void;

/** Transport provider interface (pluggable). */
export interface TransportProvider {
  /** Connect to a room. */
  connect(roomId: string, doc: Y.Doc): void;
  /** Disconnect from the room. */
  disconnect(): void;
  /** Whether currently connected. */
  readonly connected: boolean;
  /** Update local awareness state. */
  setAwareness(state: PeerAwareness): void;
  /** Get all peer awareness states. */
  getAwareness(): Map<number, PeerAwareness>;
  /** Subscribe to awareness changes. */
  onAwarenessChange(callback: (peers: Map<number, PeerAwareness>) => void): void;
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

/**
 * A CollaborationSession wraps a single Yjs document with typed
 * shared data structures and a pluggable transport layer.
 */
export class CollaborationSession {
  readonly doc: Y.Doc;
  readonly roomId: string;
  private persistence: IndexeddbPersistence | null = null;
  private transport: TransportProvider | null = null;
  private changeListeners: CollabChangeCallback[] = [];
  private _destroyed = false;

  // ── Shared types ───────────────────────────────────────────
  readonly annotations: Y.Array<any>;
  readonly insights: Y.Array<any>;
  readonly dlp: Y.Map<any>;
  readonly chat: Y.Array<any>;
  readonly cursors: Y.Map<any>;
  readonly metadata: Y.Map<any>;

  constructor(roomId: string) {
    this.roomId = roomId;
    this.doc = new Y.Doc();

    // Initialize shared types
    this.annotations = this.doc.getArray('annotations');
    this.insights = this.doc.getArray('insights');
    this.dlp = this.doc.getMap('dlp');
    this.chat = this.doc.getArray('chat');
    this.cursors = this.doc.getMap('cursors');
    this.metadata = this.doc.getMap('metadata');

    // Set up observers
    this.annotations.observe((event) => {
      this.emitChange('annotation', event.transaction.local ? 'local' : 'remote');
    });
    this.insights.observe((event) => {
      this.emitChange('insight', event.transaction.local ? 'local' : 'remote');
    });
    this.dlp.observe((event) => {
      this.emitChange('dlp', event.transaction.local ? 'local' : 'remote');
    });
    this.chat.observe((event) => {
      this.emitChange('chat', event.transaction.local ? 'local' : 'remote');
    });
    this.cursors.observe((event) => {
      this.emitChange('cursor', event.transaction.local ? 'local' : 'remote');
    });
    this.metadata.observe((event) => {
      this.emitChange('metadata', event.transaction.local ? 'local' : 'remote');
    });
  }

  // ── Lifecycle ──────────────────────────────────────────────

  /**
   * Enables IndexedDB persistence for offline support.
   */
  enablePersistence(): void {
    if (this.persistence) return;
    this.persistence = new IndexeddbPersistence(`crdt-${this.roomId}`, this.doc);
    this.persistence.on('synced', () => {
      console.log(`[CRDT] IndexedDB synced for room "${this.roomId}"`);
    });
  }

  /**
   * Connects a transport provider for real-time sync.
   */
  connectTransport(provider: TransportProvider): void {
    this.transport = provider;
    provider.connect(this.roomId, this.doc);
  }

  /**
   * Destroys the session, disconnecting all providers.
   */
  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    this.transport?.disconnect();
    this.persistence?.destroy();
    this.doc.destroy();
    this.changeListeners = [];
    console.log(`[CRDT] Session destroyed for room "${this.roomId}"`);
  }

  get destroyed(): boolean {
    return this._destroyed;
  }

  // ── Change events ──────────────────────────────────────────

  onChange(callback: CollabChangeCallback): () => void {
    this.changeListeners.push(callback);
    return () => {
      this.changeListeners = this.changeListeners.filter((cb) => cb !== callback);
    };
  }

  private emitChange(type: CollabChangeEvent['type'], origin: CollabChangeEvent['origin']): void {
    const event: CollabChangeEvent = { type, origin };
    for (const cb of this.changeListeners) {
      try { cb(event); } catch { /* swallow listener errors */ }
    }
  }

  // ── Annotation operations ──────────────────────────────────

  addAnnotation(time: number, text: string, userId?: string): void {
    this.doc.transact(() => {
      this.annotations.push([{
        id: Date.now(),
        time,
        text,
        userId,
        createdAt: Date.now(),
      }]);
    });
  }

  removeAnnotation(id: number): void {
    this.doc.transact(() => {
      for (let i = 0; i < this.annotations.length; i++) {
        if (this.annotations.get(i)?.id === id) {
          this.annotations.delete(i);
          break;
        }
      }
    });
  }

  getAnnotations(): any[] {
    return this.annotations.toArray();
  }

  // ── Insight operations ─────────────────────────────────────

  addInsight(insight: any): void {
    this.doc.transact(() => {
      this.insights.push([{ ...insight, createdAt: Date.now() }]);
    });
  }

  updateInsight(id: number, updates: Record<string, unknown>): void {
    this.doc.transact(() => {
      for (let i = 0; i < this.insights.length; i++) {
        const existing = this.insights.get(i);
        if (existing?.id === id) {
          this.insights.delete(i);
          this.insights.insert(i, [{ ...existing, ...updates }]);
          break;
        }
      }
    });
  }

  getInsights(): any[] {
    return this.insights.toArray();
  }

  // ── DLP / Knowledge operations ─────────────────────────────

  setConceptMastery(conceptId: string, mastery: any): void {
    this.doc.transact(() => {
      this.dlp.set(conceptId, { ...mastery, lastUpdated: Date.now() });
    });
  }

  getConceptMastery(conceptId: string): any | undefined {
    return this.dlp.get(conceptId);
  }

  getAllMasteries(): Record<string, any> {
    const result: Record<string, any> = {};
    this.dlp.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  // ── Chat operations ────────────────────────────────────────

  addChatMessage(message: { role: string; text: string; userId?: string }): void {
    this.doc.transact(() => {
      this.chat.push([{ ...message, timestamp: Date.now() }]);
    });
  }

  getChatHistory(): any[] {
    return this.chat.toArray();
  }

  // ── Cursor / awareness ─────────────────────────────────────

  updateCursor(userId: string, cursor: PeerAwareness['cursor']): void {
    this.doc.transact(() => {
      this.cursors.set(userId, {
        cursor,
        lastActive: Date.now(),
      });
    });
  }

  getCursors(): Record<string, { cursor: any; lastActive: number }> {
    const result: Record<string, any> = {};
    this.cursors.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  // ── Metadata ───────────────────────────────────────────────

  setMetadata(meta: Partial<DocMetadata>): void {
    this.doc.transact(() => {
      for (const [key, value] of Object.entries(meta)) {
        this.metadata.set(key, value);
      }
      this.metadata.set('lastModified', Date.now());
    });
  }

  getMetadata(): DocMetadata {
    return {
      title: this.metadata.get('title') ?? 'Untitled',
      videoId: this.metadata.get('videoId'),
      createdAt: this.metadata.get('createdAt') ?? Date.now(),
      createdBy: this.metadata.get('createdBy') ?? 'unknown',
      lastModified: this.metadata.get('lastModified') ?? Date.now(),
    };
  }

  // ── Undo / Redo ────────────────────────────────────────────

  /**
   * Creates an UndoManager for the specified shared types.
   * Each collaborator has their own undo stack (peer-scoped).
   */
  createUndoManager(trackedOrigins?: Set<any>): Y.UndoManager {
    return new Y.UndoManager(
      [this.annotations, this.insights, this.chat],
      { trackedOrigins },
    );
  }

  // ── Serialization ──────────────────────────────────────────

  /**
   * Exports the entire document state as a Uint8Array.
   * Use for backup/restore or cross-session transfer.
   */
  exportState(): Uint8Array {
    return Y.encodeStateAsUpdate(this.doc);
  }

  /**
   * Imports a state update into the document.
   */
  importState(update: Uint8Array): void {
    Y.applyUpdate(this.doc, update);
  }

  /**
   * Merges another document's state into this one.
   * CRDT guarantees convergence regardless of order.
   */
  mergeFrom(other: CollaborationSession): void {
    const update = other.exportState();
    this.importState(update);
  }
}

// ─── Session Manager ─────────────────────────────────────────────────

const activeSessions = new Map<string, CollaborationSession>();

/**
 * Gets or creates a collaboration session for a room.
 *
 * @param roomId - Unique room identifier (e.g., videoId or sessionId)
 * @param enablePersistence - Whether to persist to IndexedDB
 * @returns CollaborationSession instance
 */
export function getCollaborationSession(
  roomId: string,
  enablePersistence = true,
): CollaborationSession {
  let session = activeSessions.get(roomId);
  if (session && !session.destroyed) return session;

  session = new CollaborationSession(roomId);
  if (enablePersistence) {
    session.enablePersistence();
  }
  activeSessions.set(roomId, session);
  console.log(`[CRDT] Created session for room "${roomId}"`);
  return session;
}

/**
 * Destroys a collaboration session.
 */
export function destroyCollaborationSession(roomId: string): void {
  const session = activeSessions.get(roomId);
  if (session) {
    session.destroy();
    activeSessions.delete(roomId);
  }
}

/**
 * Destroys all active sessions (cleanup on app unmount).
 */
export function destroyAllSessions(): void {
  for (const [roomId, session] of activeSessions) {
    session.destroy();
  }
  activeSessions.clear();
}

/**
 * Lists all active room IDs.
 */
export function listActiveSessions(): string[] {
  return Array.from(activeSessions.keys());
}

// ─── WebSocket Transport Provider ────────────────────────────────────

/**
 * WebSocket-based transport using y-websocket protocol.
 * Falls back gracefully when no server is available.
 *
 * NOTE: Requires a y-websocket server running at the given URL.
 * For development, use `npx y-websocket` to start one.
 */
export class WebSocketTransport implements TransportProvider {
  private ws: WebSocket | null = null;
  private _connected = false;
  private awarenessState: PeerAwareness | null = null;
  private peerStates = new Map<number, PeerAwareness>();
  private awarenessCallbacks: Array<(peers: Map<number, PeerAwareness>) => void> = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly serverUrl: string) {}

  get connected(): boolean {
    return this._connected;
  }

  connect(roomId: string, doc: Y.Doc): void {
    const url = `${this.serverUrl}/${roomId}`;
    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this._connected = true;
        console.log(`[CRDT/WS] Connected to ${url}`);
        // Send initial state
        const update = Y.encodeStateAsUpdate(doc);
        this.ws?.send(update);
        // Send awareness
        if (this.awarenessState) {
          this.ws?.send(JSON.stringify({ type: 'awareness', state: this.awarenessState }));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          if (event.data instanceof ArrayBuffer) {
            Y.applyUpdate(doc, new Uint8Array(event.data));
          } else if (typeof event.data === 'string') {
            const msg = JSON.parse(event.data);
            if (msg.type === 'awareness' && msg.clientId !== undefined) {
              this.peerStates.set(msg.clientId, msg.state);
              this.notifyAwareness();
            }
          }
        } catch { /* ignore malformed messages */ }
      };

      this.ws.onclose = () => {
        this._connected = false;
        console.log('[CRDT/WS] Disconnected, scheduling reconnect...');
        this.scheduleReconnect(roomId, doc);
      };

      this.ws.onerror = () => {
        console.warn('[CRDT/WS] Connection error');
      };

      // Relay local updates to server
      doc.on('update', (update: Uint8Array, origin: any) => {
        if (origin !== 'remote' && this._connected && this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(update);
        }
      });
    } catch (err) {
      console.warn('[CRDT/WS] Failed to connect:', err);
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this._connected = false;
  }

  setAwareness(state: PeerAwareness): void {
    this.awarenessState = state;
    if (this._connected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'awareness', state }));
    }
  }

  getAwareness(): Map<number, PeerAwareness> {
    return new Map(this.peerStates);
  }

  onAwarenessChange(callback: (peers: Map<number, PeerAwareness>) => void): void {
    this.awarenessCallbacks.push(callback);
  }

  private notifyAwareness(): void {
    const peers = this.getAwareness();
    for (const cb of this.awarenessCallbacks) {
      try { cb(peers); } catch { /* swallow */ }
    }
  }

  private scheduleReconnect(roomId: string, doc: Y.Doc): void {
    this.reconnectTimer = setTimeout(() => {
      if (!this._connected) {
        console.log('[CRDT/WS] Attempting reconnect...');
        this.connect(roomId, doc);
      }
    }, 3000);
  }
}

// ─── Exports for testing ──────────────────────────────────────────────

export { Y, pickColor, PEER_COLORS };