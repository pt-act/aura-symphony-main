/**
 * Worker Pool Tests
 *
 * Tests the WorkerPool class using mock workers.
 * Validates load balancing, work-stealing, and lifecycle management.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkerPool } from '../lib/worker-pool';

// ─── Mock Worker ──────────────────────────────────────────────────────

class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  private _terminated = false;

  postMessage(data: any): void {
    if (this._terminated) return;
    // Simulate async processing
    setTimeout(() => {
      if (this._terminated) return;
      this.onmessage?.({
        data: {
          type: `${data.type}_RESULT`,
          payload: `result-${data.id}`,
          id: data.id,
        },
      } as MessageEvent);
    }, 10);
  }

  terminate(): void {
    this._terminated = true;
  }

  addEventListener(_type: string, handler: any): void {
    if (_type === 'message') this.onmessage = handler;
    if (_type === 'error') this.onerror = handler;
  }

  removeEventListener(): void {}
}

function createMockWorker(): Worker {
  return new MockWorker() as unknown as Worker;
}

// ─── Tests ────────────────────────────────────────────────────────────

describe('WorkerPool', () => {
  let pool: WorkerPool;

  afterEach(() => {
    pool?.terminate();
  });

  it('creates a pool with the specified size', () => {
    pool = new WorkerPool(createMockWorker, 4);
    expect(pool.size).toBe(4);
  });

  it('caps pool size at 8', () => {
    pool = new WorkerPool(createMockWorker, 100);
    expect(pool.size).toBe(8);
  });

  it('submits a task and gets a result', async () => {
    pool = new WorkerPool(createMockWorker, 2);
    const result = await pool.submit(
      { type: 'TEST', id: 'task-1' },
      'task-1',
    );
    expect(result.payload).toBe('result-task-1');
  });

  it('distributes tasks across workers', async () => {
    pool = new WorkerPool(createMockWorker, 3);

    const results = await Promise.all([
      pool.submit({ type: 'TEST', id: 't1' }, 't1'),
      pool.submit({ type: 'TEST', id: 't2' }, 't2'),
      pool.submit({ type: 'TEST', id: 't3' }, 't3'),
    ]);

    expect(results).toHaveLength(3);
    expect(results.map((r) => r.payload)).toEqual([
      'result-t1',
      'result-t2',
      'result-t3',
    ]);
  });

  it('handles more tasks than workers', async () => {
    pool = new WorkerPool(createMockWorker, 2);

    const results = await Promise.all([
      pool.submit({ type: 'TEST', id: 'a' }, 'a'),
      pool.submit({ type: 'TEST', id: 'b' }, 'b'),
      pool.submit({ type: 'TEST', id: 'c' }, 'c'),
      pool.submit({ type: 'TEST', id: 'd' }, 'd'),
    ]);

    expect(results).toHaveLength(4);
  });

  it('rejects tasks after termination', async () => {
    pool = new WorkerPool(createMockWorker, 2);
    pool.terminate();

    await expect(
      pool.submit({ type: 'TEST', id: 'x' }, 'x'),
    ).rejects.toThrow('Worker pool is terminated');
  });

  it('reports pool stats correctly', async () => {
    pool = new WorkerPool(createMockWorker, 3);

    const stats = pool.stats();
    expect(stats.totalWorkers).toBe(3);
    expect(stats.completedTasks).toBe(0);

    await pool.submit({ type: 'TEST', id: 's1' }, 's1');

    const afterStats = pool.stats();
    expect(afterStats.completedTasks).toBe(1);
  });

  it('reports per-worker stats', () => {
    pool = new WorkerPool(createMockWorker, 3);
    const workerStats = pool.workerStats();
    expect(workerStats).toHaveLength(3);
    for (const ws of workerStats) {
      expect(ws.idle).toBe(true);
      expect(ws.activeTasks).toBe(0);
    }
  });

  it('submits batch tasks', async () => {
    pool = new WorkerPool(createMockWorker, 3);

    const results = await pool.submitBatch([
      { message: { type: 'TEST', id: 'b1' }, taskId: 'b1' },
      { message: { type: 'TEST', id: 'b2' }, taskId: 'b2' },
      { message: { type: 'TEST', id: 'b3' }, taskId: 'b3' },
    ]);

    expect(results).toHaveLength(3);
  });

  it('terminates all workers on pool.terminate()', () => {
    pool = new WorkerPool(createMockWorker, 4);
    pool.terminate();
    expect(pool.size).toBe(0);
  });
});