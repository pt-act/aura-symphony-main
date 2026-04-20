/**
 * Task Queue Persistence
 *
 * Persists SymphonyBus task state to IndexedDB so tasks survive page refreshes.
 * On reload, incomplete tasks are restored and can be queried/retried.
 *
 * Storage: IndexedDB 'aura-symphony' database, 'tasks' object store.
 */

import type {Task} from './symphonyBus';

const DB_NAME = 'aura-symphony';
const DB_VERSION = 1;
const STORE_NAME = 'tasks';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

let dbInstance: IDBDatabase | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {keyPath: 'id'});
        store.createIndex('status', 'status', {unique: false});
        store.createIndex('createdAt', 'createdAt', {unique: false});
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Persists a task to IndexedDB.
 */
export async function persistTask(task: Task): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({...task, id: String(task.id)});
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[TaskPersistence] Failed to persist task:', err);
  }
}

/**
 * Removes a task from IndexedDB.
 */
export async function removeTask(taskId: string | number): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(String(taskId));
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[TaskPersistence] Failed to remove task:', err);
  }
}

/**
 * Loads all persisted tasks, filtering out stale ones.
 */
export async function loadPersistedTasks(): Promise<Task[]> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const tasks: Task[] = request.result || [];
        const now = Date.now();
        // Filter out stale tasks older than MAX_AGE_MS
        const fresh = tasks.filter((t) => now - t.createdAt < MAX_AGE_MS);
        resolve(fresh);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[TaskPersistence] Failed to load tasks:', err);
    return [];
  }
}

/**
 * Clears all persisted tasks (useful for debugging).
 */
export async function clearPersistedTasks(): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[TaskPersistence] Failed to clear tasks:', err);
  }
}

/**
 * Prunes completed/errored tasks older than maxAgeMs.
 */
export async function pruneStaleTasks(maxAgeMs: number = MAX_AGE_MS): Promise<number> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    const now = Date.now();
    let pruned = 0;

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const tasks: Task[] = request.result || [];
        for (const task of tasks) {
          const isDone = task.status === 'success' || task.status === 'error';
          const isStale = now - task.createdAt > maxAgeMs;
          if (isDone && isStale) {
            store.delete(String(task.id));
            pruned++;
          }
        }
        resolve(pruned);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[TaskPersistence] Failed to prune tasks:', err);
    return 0;
  }
}
