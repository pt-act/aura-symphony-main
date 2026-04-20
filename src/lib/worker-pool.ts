/**
 * WebWorker Pool with Work-Stealing
 *
 * Replaces the singleton SharedWorker with a pool of `n` workers where
 * `n = navigator.hardwareConcurrency` (capped). Implements work-stealing
 * for load balancing: idle workers pull tasks from busy workers' queues.
 *
 * Architecture:
 *   WorkerPool → manages N WorkerSlot instances
 *   WorkerSlot → wraps a single Worker + its pending task queue
 *   TaskQueue  → FIFO queue with steal-from-tail capability
 *
 * The pool is transparent to callers: the same postMessage/onMessage API
 * is preserved, but work is distributed across workers.
 *
 * @module
 */

// ─── Types ────────────────────────────────────────────────────────────

/** A pending task waiting to be assigned to a worker. */
interface PendingTask {
  id: string;
  message: any;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  submittedAt: number;
}

/** Stats for a single worker slot. */
export interface WorkerSlotStats {
  id: number;
  activeTasks: number;
  completedTasks: number;
  idle: boolean;
}

/** Overall pool statistics. */
export interface PoolStats {
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  pendingTasks: number;
  completedTasks: number;
  steals: number;
}

// ─── Worker Slot ──────────────────────────────────────────────────────

class WorkerSlot {
  readonly id: number;
  readonly worker: Worker;
  private queue: PendingTask[] = [];
  private activeTask: PendingTask | null = null;
  private _completedCount = 0;

  constructor(id: number, createWorker: () => Worker) {
    this.id = id;
    this.worker = createWorker();

    this.worker.onmessage = (e: MessageEvent) => {
      this.handleMessage(e);
    };

    this.worker.onerror = (e: ErrorEvent) => {
      this.handleError(e);
    };
  }

  /** Number of tasks in queue (not counting the active one). */
  get queueLength(): number {
    return this.queue.length;
  }

  /** Whether this worker is not processing anything. */
  get idle(): boolean {
    return this.activeTask === null && this.queue.length === 0;
  }

  /** Total load = active + queued. */
  get load(): number {
    return (this.activeTask ? 1 : 0) + this.queue.length;
  }

  get completedCount(): number {
    return this._completedCount;
  }

  /** Submit a task to this worker's queue. */
  submit(task: PendingTask): void {
    this.queue.push(task);
    this.processNext();
  }

  /** Steal the last task from this worker's queue (work-stealing). */
  steal(): PendingTask | null {
    if (this.queue.length === 0) return null;
    return this.queue.pop()!;
  }

  /** Stats for monitoring. */
  stats(): WorkerSlotStats {
    return {
      id: this.id,
      activeTasks: this.activeTask ? 1 : 0,
      completedTasks: this._completedCount,
      idle: this.idle,
    };
  }

  /** Terminate the worker. */
  terminate(): void {
    this.worker.terminate();
    // Reject any pending tasks
    if (this.activeTask) {
      this.activeTask.reject(new Error('Worker terminated'));
      this.activeTask = null;
    }
    for (const task of this.queue) {
      task.reject(new Error('Worker terminated'));
    }
    this.queue = [];
  }

  private processNext(): void {
    if (this.activeTask || this.queue.length === 0) return;

    this.activeTask = this.queue.shift()!;
    this.worker.postMessage(this.activeTask.message);
  }

  private handleMessage(e: MessageEvent): void {
    if (!this.activeTask) return;

    const task = this.activeTask;

    // Check if this message corresponds to the active task
    if (e.data.id === task.id) {
      if (e.data.type?.endsWith('_ERROR')) {
        task.reject(new Error(e.data.payload));
      } else {
        task.resolve(e.data);
      }
      this.activeTask = null;
      this._completedCount++;
      this.processNext();
    }
  }

  private handleError(e: ErrorEvent): void {
    if (this.activeTask) {
      this.activeTask.reject(new Error(e.message || 'Worker error'));
      this.activeTask = null;
      this.processNext();
    }
  }
}

// ─── Worker Pool ──────────────────────────────────────────────────────

export class WorkerPool {
  private slots: WorkerSlot[] = [];
  private _stealCount = 0;
  private stealIntervalId: ReturnType<typeof setInterval> | null = null;
  private _terminated = false;

  /**
   * Creates a worker pool.
   *
   * @param createWorker - Factory function that creates a new Worker instance
   * @param size - Number of workers (default: navigator.hardwareConcurrency, capped at 8)
   */
  constructor(
    private readonly createWorker: () => Worker,
    size?: number,
  ) {
    const poolSize = Math.min(
      size ?? (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4),
      8, // Cap to prevent resource exhaustion
    );

    for (let i = 0; i < poolSize; i++) {
      this.slots.push(new WorkerSlot(i, createWorker));
    }

    // Start periodic work-stealing
    this.stealIntervalId = setInterval(() => this.trySteal(), 100);
  }

  /** Number of workers in the pool. */
  get size(): number {
    return this.slots.length;
  }

  /**
   * Submits a task to the least-loaded worker.
   *
   * @param message - Message to send to the worker
   * @param taskId - Unique ID for matching response (must match message.id)
   * @returns Promise resolving to the worker's response
   */
  submit<T = any>(message: any, taskId: string): Promise<T> {
    if (this._terminated) {
      return Promise.reject(new Error('Worker pool is terminated'));
    }

    return new Promise<T>((resolve, reject) => {
      const task: PendingTask = {
        id: taskId,
        message,
        resolve,
        reject,
        submittedAt: Date.now(),
      };

      // Find least-loaded worker
      const target = this.leastLoaded();
      target.submit(task);
    });
  }

  /**
   * Submits a batch of tasks, distributing them round-robin.
   * Returns all results in order.
   */
  async submitBatch<T = any>(
    tasks: Array<{ message: any; taskId: string }>,
  ): Promise<T[]> {
    const promises = tasks.map((task, idx) => {
      const slotIdx = idx % this.slots.length;
      return new Promise<T>((resolve, reject) => {
        const pending: PendingTask = {
          id: task.taskId,
          message: task.message,
          resolve,
          reject,
          submittedAt: Date.now(),
        };
        this.slots[slotIdx].submit(pending);
      });
    });

    return Promise.all(promises);
  }

  /** Pool statistics. */
  stats(): PoolStats {
    return {
      totalWorkers: this.slots.length,
      activeWorkers: this.slots.filter((s) => !s.idle).length,
      idleWorkers: this.slots.filter((s) => s.idle).length,
      pendingTasks: this.slots.reduce((n, s) => n + s.queueLength, 0),
      completedTasks: this.slots.reduce((n, s) => n + s.completedCount, 0),
      steals: this._stealCount,
    };
  }

  /** Per-worker statistics. */
  workerStats(): WorkerSlotStats[] {
    return this.slots.map((s) => s.stats());
  }

  /** Terminate all workers and clean up. */
  terminate(): void {
    this._terminated = true;
    if (this.stealIntervalId) {
      clearInterval(this.stealIntervalId);
      this.stealIntervalId = null;
    }
    for (const slot of this.slots) {
      slot.terminate();
    }
    this.slots = [];
  }

  // ─── Internal ───────────────────────────────────────────────

  /** Find the worker with the fewest pending tasks. */
  private leastLoaded(): WorkerSlot {
    let minSlot = this.slots[0];
    for (let i = 1; i < this.slots.length; i++) {
      if (this.slots[i].load < minSlot.load) {
        minSlot = this.slots[i];
      }
    }
    return minSlot;
  }

  /**
   * Work-stealing: idle workers take tasks from the most-loaded worker.
   * Steals from the tail of the queue (LIFO steal, FIFO local).
   */
  private trySteal(): void {
    const idleSlots = this.slots.filter((s) => s.idle);
    if (idleSlots.length === 0) return;

    // Find the most-loaded worker
    let maxSlot = this.slots[0];
    for (const slot of this.slots) {
      if (slot.queueLength > maxSlot.queueLength) {
        maxSlot = slot;
      }
    }

    // Only steal if the busiest worker has 2+ queued tasks
    if (maxSlot.queueLength < 2) return;

    for (const idleSlot of idleSlots) {
      if (maxSlot.queueLength < 2) break;
      const stolen = maxSlot.steal();
      if (stolen) {
        idleSlot.submit(stolen);
        this._stealCount++;
      }
    }
  }
}

// ─── Singleton Media Worker Pool ──────────────────────────────────────

let mediaPool: WorkerPool | null = null;

/**
 * Gets or creates the global media worker pool.
 *
 * Replaces the singleton `getSharedMediaWorker()` for parallelized
 * frame processing. The pool size equals `navigator.hardwareConcurrency`
 * (capped at 8).
 */
export function getMediaWorkerPool(): WorkerPool {
  if (!mediaPool) {
    // Dynamic import to use Vite's worker plugin
    const createWorker = () => {
      // @ts-ignore Vite worker import syntax
      return new Worker(new URL('../workers/media.worker.ts', import.meta.url), { type: 'module' });
    };
    mediaPool = new WorkerPool(createWorker);
    console.log(`[WorkerPool] Media pool created with ${mediaPool.size} workers`);
  }
  return mediaPool;
}

/**
 * Processes frame bitmaps in parallel across the worker pool.
 *
 * @param bitmaps - Array of ImageBitmap objects to convert to base64
 * @param quality - JPEG quality (0–1)
 * @returns Array of base64 data URIs
 */
export async function processFramesParallel(
  bitmaps: ImageBitmap[],
  quality = 0.5,
): Promise<string[]> {
  const pool = getMediaWorkerPool();

  // Split bitmaps into chunks for each worker
  const chunkSize = Math.max(1, Math.ceil(bitmaps.length / pool.size));
  const tasks: Array<{ message: any; taskId: string }> = [];

  for (let i = 0; i < bitmaps.length; i += chunkSize) {
    const chunk = bitmaps.slice(i, i + chunkSize);
    const taskId = `frames-${Date.now()}-${i}`;
    tasks.push({
      message: {
        type: 'PROCESS_FRAMES',
        payload: { bitmaps: chunk, quality },
        id: taskId,
      },
      taskId,
    });
  }

  const results = await pool.submitBatch<{ payload: string[] }>(tasks);
  return results.flatMap((r) => r.payload);
}

/**
 * Terminate the media worker pool (for cleanup / hot reload).
 */
export function terminateMediaPool(): void {
  mediaPool?.terminate();
  mediaPool = null;
}