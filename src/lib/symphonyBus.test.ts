/**
 * SymphonyBus Tests
 *
 * Covers: event dispatch, task lifecycle, commission, reportResult,
 * chainCommission, and telemetry integration.
 */

import {describe, it, expect, vi, beforeEach} from 'vitest';

// We need to test the class behavior, so we import the module pieces
// and reconstruct to avoid side-effects from the singleton
describe('SymphonyBus', () => {
  // Re-import for each test to get fresh state
  let symphonyBus: any;
  let Events: any;

  beforeEach(async () => {
    // Dynamic import to reset module state
    vi.resetModules();
    const mod = await import('./symphonyBus');
    symphonyBus = mod.symphonyBus;
    Events = mod.Events;
  });

  describe('listen / dispatch', () => {
    it('dispatches custom events with detail', () => {
      const handler = vi.fn();
      symphonyBus.listen('test:event', handler);
      symphonyBus.dispatch('test:event', {foo: 'bar'});

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual({foo: 'bar'});
    });

    it('unlisten stops receiving events', () => {
      const handler = vi.fn();
      symphonyBus.listen('test:unlisten', handler);
      symphonyBus.dispatch('test:unlisten', {});
      expect(handler).toHaveBeenCalledTimes(1);

      symphonyBus.unlisten('test:unlisten', handler);
      symphonyBus.dispatch('test:unlisten', {});
      expect(handler).toHaveBeenCalledTimes(1); // No additional call
    });

    it('supports multiple listeners on same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      symphonyBus.listen('multi', handler1);
      symphonyBus.listen('multi', handler2);
      symphonyBus.dispatch('multi', {data: 1});

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('commission', () => {
    it('dispatches TASK_START event', () => {
      const handler = vi.fn();
      symphonyBus.listen(Events.TASK_START, handler);

      const taskId = symphonyBus.commission('conductor', 'Test Task');

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as CustomEvent;
      expect(event.detail.name).toBe('Test Task');
      expect(event.detail.virtuosoId).toBe('conductor');
      expect(event.detail.id).toBe(taskId);
    });

    it('generates unique task IDs when not provided', () => {
      const id1 = symphonyBus.commission('visionary', 'Task 1');
      const id2 = symphonyBus.commission('visionary', 'Task 2');
      expect(id1).not.toBe(id2);
    });

    it('accepts custom task IDs', () => {
      const id = symphonyBus.commission('analyst', 'Task', 'custom-id-123');
      expect(id).toBe('custom-id-123');
    });
  });

  describe('reportResult', () => {
    it('dispatches TASK_SUCCESS on success', () => {
      const handler = vi.fn();
      symphonyBus.listen(Events.TASK_SUCCESS, handler);

      symphonyBus.reportResult('task-1', 'conductor', true, {data: 42}, 100);

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as CustomEvent;
      expect(event.detail.id).toBe('task-1');
      expect(event.detail.result).toEqual({data: 42});
    });

    it('dispatches TASK_ERROR on failure', () => {
      const handler = vi.fn();
      symphonyBus.listen(Events.TASK_ERROR, handler);

      symphonyBus.reportResult('task-2', 'conductor', false, 'Something failed', 50);

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as CustomEvent;
      expect(event.detail.id).toBe('task-2');
      expect(event.detail.error).toBe('Something failed');
    });
  });

  describe('chainCommission', () => {
    it('creates hierarchical task IDs', () => {
      const parentId = 'parent-123';
      const childId = symphonyBus.chainCommission(
        parentId,
        'scholar',
        'Sub-research',
        {query: 'test'},
      );

      expect(childId).toContain('parent-123');
      expect(childId).toContain('scholar');
    });

    it('dispatches both COMMISSION_CHAIN and TASK_START', () => {
      const chainHandler = vi.fn();
      const startHandler = vi.fn();
      symphonyBus.listen(Events.COMMISSION_CHAIN, chainHandler);
      symphonyBus.listen(Events.TASK_START, startHandler);

      symphonyBus.chainCommission('parent-1', 'visionary', 'Frame Analysis');

      expect(chainHandler).toHaveBeenCalledTimes(1);
      // TASK_START called once for the child task
      expect(startHandler).toHaveBeenCalled();

      const chainEvent = chainHandler.mock.calls[0][0] as CustomEvent;
      expect(chainEvent.detail.parentId).toBe('parent-1');
      expect(chainEvent.detail.childVirtuoso).toBe('visionary');
      expect(chainEvent.detail.childTaskName).toBe('Frame Analysis');
    });

    it('passes context to chain event', () => {
      const handler = vi.fn();
      symphonyBus.listen(Events.COMMISSION_CHAIN, handler);

      symphonyBus.chainCommission('p', 'analyst', 'Work', {key: 'value'});

      const event = handler.mock.calls[0][0] as CustomEvent;
      expect(event.detail.context).toEqual({key: 'value'});
    });
  });
});

describe('Events constants', () => {
  it('has all required event types', async () => {
    const {Events} = await import('./symphonyBus');
    expect(Events.TASK_START).toBe('task:start');
    expect(Events.TASK_PROGRESS).toBe('task:progress');
    expect(Events.TASK_SUCCESS).toBe('task:success');
    expect(Events.TASK_ERROR).toBe('task:error');
    expect(Events.COMMISSION_CHAIN).toBe('commission:chain');
  });
});