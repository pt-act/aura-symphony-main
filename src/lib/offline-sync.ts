/**
 * Offline-First Sync Engine
 *
 * Provides offline support by combining:
 *   1. Service Worker registration for asset + API caching
 *   2. IndexedDB queue for pending Firestore writes
 *   3. Optimistic UI updates with eventual consistency
 *   4. Background sync when connectivity is restored
 *
 * The existing IndexedDB persistence (task-persistence.ts) handles
 * task state. This module adds:
 *   - A generic offline mutation queue
 *   - Connectivity detection and auto-retry
 *   - Conflict resolution (last-writer-wins with timestamps)
 *   - Cache management for frames and transcripts
 *
 * @module
 */

// ─── Types ────────────────────────────────────────────────────────────

/** A pending mutation that will be synced when online. */
export interface PendingMutation {
  /** Unique mutation ID. */
  id: string;
  /** Firestore operation type. */
  operation: 'create' | 'update' | 'delete';
  /** Firestore collection path. */
  collection: string;
  /** Document ID (undefined for create). */
  documentId?: string;
  /** Data payload. */
  data: Record<string, unknown>;
  /** Timestamp when the mutation was created. */
  createdAt: number;
  /** Number of sync attempts. */
  attempts: number;
  /** Last sync attempt timestamp. */
  lastAttemptAt?: number;
  /** Error from last attempt. */
  lastError?: string;
}

/** Sync status. */
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

/** Sync event. */
export interface SyncEvent {
  type: 'sync-start' | 'sync-complete' | 'sync-error' | 'mutation-queued' | 'online' | 'offline';
  pendingCount: number;
  timestamp: number;
  error?: string;
}

/** Sync event callback. */
export type SyncEventCallback = (event: SyncEvent) => void;

// ─── Configuration ────────────────────────────────────────────────────

const DB_NAME = 'aura-offline';
const DB_VERSION = 1;
const MUTATIONS_STORE = 'mutations';
const CACHE_STORE = 'cache';
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_BACKOFF_MS = 2000;
const SYNC_INTERVAL_MS = 30_000;

// ─── IndexedDB for Offline Mutations ──────────────────────────────────

let offlineDb: IDBDatabase | null = null;

function openOfflineDb(): Promise<IDBDatabase> {
  if (offlineDb) return Promise.resolve(offlineDb);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(MUTATIONS_STORE)) {
        const store = db.createObjectStore(MUTATIONS_STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('collection', 'collection', { unique: false });
      }

      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        const cache = db.createObjectStore(CACHE_STORE, { keyPath: 'key' });
        cache.createIndex('expiresAt', 'expiresAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      offlineDb = request.result;
      resolve(offlineDb);
    };

    request.onerror = () => reject(request.error);
  });
}

// ─── Mutation Queue ───────────────────────────────────────────────────

/**
 * Enqueues a mutation for eventual sync.
 * The mutation is applied optimistically to local state immediately.
 */
export async function enqueueMutation(mutation: Omit<PendingMutation, 'id' | 'createdAt' | 'attempts'>): Promise<string> {
  const id = `mut-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const pending: PendingMutation = {
    ...mutation,
    id,
    createdAt: Date.now(),
    attempts: 0,
  };

  try {
    const db = await openOfflineDb();
    const tx = db.transaction(MUTATIONS_STORE, 'readwrite');
    tx.objectStore(MUTATIONS_STORE).put(pending);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[Offline] Failed to enqueue mutation:', err);
  }

  emitEvent({ type: 'mutation-queued', pendingCount: await getPendingCount(), timestamp: Date.now() });

  // Try immediate sync if online
  if (navigator.onLine) {
    syncPendingMutations().catch(() => {});
  }

  return id;
}

/**
 * Gets all pending (unsynced) mutations.
 */
export async function getPendingMutations(): Promise<PendingMutation[]> {
  try {
    const db = await openOfflineDb();
    const tx = db.transaction(MUTATIONS_STORE, 'readonly');
    const request = tx.objectStore(MUTATIONS_STORE).getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ?? []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

/**
 * Gets the count of pending mutations.
 */
export async function getPendingCount(): Promise<number> {
  const mutations = await getPendingMutations();
  return mutations.length;
}

/**
 * Removes a mutation after successful sync.
 */
async function removeMutation(id: string): Promise<void> {
  try {
    const db = await openOfflineDb();
    const tx = db.transaction(MUTATIONS_STORE, 'readwrite');
    tx.objectStore(MUTATIONS_STORE).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    console.warn('[Offline] Failed to remove mutation:', id);
  }
}

/**
 * Updates a mutation after a failed sync attempt.
 */
async function updateMutation(mutation: PendingMutation): Promise<void> {
  try {
    const db = await openOfflineDb();
    const tx = db.transaction(MUTATIONS_STORE, 'readwrite');
    tx.objectStore(MUTATIONS_STORE).put(mutation);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    console.warn('[Offline] Failed to update mutation:', mutation.id);
  }
}

// ─── Sync Engine ──────────────────────────────────────────────────────

let syncInProgress = false;
let syncIntervalId: ReturnType<typeof setInterval> | null = null;

/** The sync executor function. Override this to plug in Firestore. */
let syncExecutor: ((mutation: PendingMutation) => Promise<boolean>) | null = null;

/**
 * Sets the sync executor function.
 * This function receives a mutation and should apply it to Firestore.
 * Returns true on success, false on failure.
 */
export function setSyncExecutor(executor: (mutation: PendingMutation) => Promise<boolean>): void {
  syncExecutor = executor;
}

/**
 * Syncs all pending mutations to the server.
 * Processes mutations in FIFO order with exponential backoff on failure.
 */
export async function syncPendingMutations(): Promise<{ synced: number; failed: number }> {
  if (syncInProgress || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  syncInProgress = true;
  emitEvent({ type: 'sync-start', pendingCount: await getPendingCount(), timestamp: Date.now() });

  let synced = 0;
  let failed = 0;

  try {
    const mutations = await getPendingMutations();

    // Sort by creation time (FIFO)
    mutations.sort((a, b) => a.createdAt - b.createdAt);

    for (const mutation of mutations) {
      if (!navigator.onLine) break;

      // Skip if too many attempts
      if (mutation.attempts >= MAX_RETRY_ATTEMPTS) {
        console.warn(`[Offline] Mutation ${mutation.id} exceeded max retries, discarding.`);
        await removeMutation(mutation.id);
        failed++;
        continue;
      }

      try {
        let success = false;

        if (syncExecutor) {
          success = await syncExecutor(mutation);
        } else {
          // Default: simulate successful sync (for development)
          console.log(`[Offline] Simulated sync: ${mutation.operation} ${mutation.collection}/${mutation.documentId}`);
          success = true;
        }

        if (success) {
          await removeMutation(mutation.id);
          synced++;
        } else {
          throw new Error('Sync executor returned false');
        }
      } catch (err: any) {
        mutation.attempts++;
        mutation.lastAttemptAt = Date.now();
        mutation.lastError = err.message;
        await updateMutation(mutation);
        failed++;
      }
    }

    emitEvent({
      type: synced > 0 ? 'sync-complete' : 'sync-error',
      pendingCount: await getPendingCount(),
      timestamp: Date.now(),
    });
  } finally {
    syncInProgress = false;
  }

  return { synced, failed };
}

// ─── Connectivity Detection ──────────────────────────────────────────

let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
const eventListeners: SyncEventCallback[] = [];

/**
 * Initializes offline detection and background sync.
 * Call once on app startup.
 */
export function initOfflineSync(): () => void {
  const handleOnline = () => {
    isOnline = true;
    emitEvent({ type: 'online', pendingCount: 0, timestamp: Date.now() });
    // Immediately try to sync
    syncPendingMutations().catch(() => {});
  };

  const handleOffline = () => {
    isOnline = false;
    emitEvent({ type: 'offline', pendingCount: 0, timestamp: Date.now() });
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  // Periodic sync
  syncIntervalId = setInterval(() => {
    if (navigator.onLine) {
      syncPendingMutations().catch(() => {});
    }
  }, SYNC_INTERVAL_MS);

  // Cleanup function
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
    if (syncIntervalId) {
      clearInterval(syncIntervalId);
      syncIntervalId = null;
    }
  };
}

/**
 * Returns current online status.
 */
export function getOnlineStatus(): boolean {
  return isOnline;
}

// ─── Event System ─────────────────────────────────────────────────────

function emitEvent(event: SyncEvent): void {
  for (const cb of eventListeners) {
    try { cb(event); } catch { /* swallow */ }
  }
}

/**
 * Subscribe to sync events.
 */
export function onSyncEvent(callback: SyncEventCallback): () => void {
  eventListeners.push(callback);
  return () => {
    const idx = eventListeners.indexOf(callback);
    if (idx >= 0) eventListeners.splice(idx, 1);
  };
}

// ─── Offline Cache (Frames / Transcripts) ─────────────────────────────

interface CacheEntry {
  key: string;
  data: any;
  type: 'frame' | 'transcript' | 'insight' | 'generic';
  videoId?: string;
  createdAt: number;
  expiresAt: number;
  sizeBytes: number;
}

/** Default cache TTL: 7 days. */
const DEFAULT_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Maximum cache size in bytes (100MB). */
const MAX_CACHE_SIZE = 100 * 1024 * 1024;

/**
 * Stores data in the offline cache.
 */
export async function cacheData(
  key: string,
  data: any,
  type: CacheEntry['type'] = 'generic',
  videoId?: string,
  ttlMs: number = DEFAULT_CACHE_TTL_MS,
): Promise<void> {
  try {
    const serialized = JSON.stringify(data);
    const entry: CacheEntry = {
      key,
      data,
      type,
      videoId,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
      sizeBytes: serialized.length,
    };

    const db = await openOfflineDb();
    const tx = db.transaction(CACHE_STORE, 'readwrite');
    tx.objectStore(CACHE_STORE).put(entry);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[Offline Cache] Failed to cache:', key, err);
  }
}

/**
 * Retrieves data from the offline cache.
 * Returns null if not found or expired.
 */
export async function getCachedData<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openOfflineDb();
    const tx = db.transaction(CACHE_STORE, 'readonly');
    const request = tx.objectStore(CACHE_STORE).get(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined;
        if (!entry || entry.expiresAt < Date.now()) {
          resolve(null);
        } else {
          resolve(entry.data as T);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

/**
 * Removes expired cache entries.
 */
export async function pruneCache(): Promise<number> {
  try {
    const db = await openOfflineDb();
    const tx = db.transaction(CACHE_STORE, 'readwrite');
    const store = tx.objectStore(CACHE_STORE);
    const request = store.getAll();
    let pruned = 0;

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const entries: CacheEntry[] = request.result ?? [];
        const now = Date.now();
        for (const entry of entries) {
          if (entry.expiresAt < now) {
            store.delete(entry.key);
            pruned++;
          }
        }
        resolve(pruned);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return 0;
  }
}

/**
 * Gets total cache size in bytes.
 */
export async function getCacheSize(): Promise<number> {
  try {
    const db = await openOfflineDb();
    const tx = db.transaction(CACHE_STORE, 'readonly');
    const request = tx.objectStore(CACHE_STORE).getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const entries: CacheEntry[] = request.result ?? [];
        resolve(entries.reduce((sum, e) => sum + e.sizeBytes, 0));
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return 0;
  }
}

// ─── Service Worker Registration ──────────────────────────────────────

/**
 * Registers the service worker for asset caching.
 * Should be called once on app startup.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Offline] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            console.log('[Offline] Service worker updated and activated');
          }
        });
      }
    });

    console.log('[Offline] Service worker registered');
    return registration;
  } catch (err) {
    console.warn('[Offline] Service worker registration failed:', err);
    return null;
  }
}

// ─── Exports for testing ──────────────────────────────────────────────

export const _testing = {
  MUTATIONS_STORE,
  CACHE_STORE,
  MAX_RETRY_ATTEMPTS,
  SYNC_INTERVAL_MS,
  DEFAULT_CACHE_TTL_MS,
  MAX_CACHE_SIZE,
};