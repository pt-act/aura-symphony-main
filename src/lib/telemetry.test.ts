/**
 * Telemetry Tests
 *
 * Tests log sinks, timer utility, and structured log functions.
 */

import {describe, it, expect, vi} from 'vitest';
import {
  addLogSink,
  startTimer,
  logVirtuosoCommission,
  logVirtuosoResult,
  logConductorQuery,
  logValidationFailure,
  logSearchExecuted,
  logValhallaAnalysis,
} from './telemetry';

describe('Telemetry', () => {
  describe('addLogSink', () => {
    it('calls registered sinks with log entries', () => {
      const sink = vi.fn();
      addLogSink(sink);

      logVirtuosoCommission('conductor', 'Test', 'id-1');

      expect(sink).toHaveBeenCalled();
      const entry = sink.mock.calls[sink.mock.calls.length - 1][0];
      expect(entry.level).toBe('info');
      expect(entry.component).toBe('symphony');
      expect(entry.event).toBe('virtuoso:commission');
      expect(entry.data.virtuosoId).toBe('conductor');
      expect(entry.timestamp).toBeDefined();
    });

    it('does not throw if sink throws', () => {
      const badSink = vi.fn(() => { throw new Error('boom'); });
      addLogSink(badSink);

      expect(() => logVirtuosoCommission('visionary', 'Test', 'id-2')).not.toThrow();
    });
  });

  describe('startTimer', () => {
    it('returns elapsed time in milliseconds', async () => {
      const timer = startTimer();
      // Wait a small amount
      await new Promise(r => setTimeout(r, 10));
      const elapsed = timer.elapsed();
      expect(elapsed).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(1000); // Sanity check
    });
  });

  describe('logVirtuosoResult', () => {
    it('logs success at info level', () => {
      const sink = vi.fn();
      addLogSink(sink);

      logVirtuosoResult('analyst', 'task-1', true, 150);

      const entry = sink.mock.calls[sink.mock.calls.length - 1][0];
      expect(entry.level).toBe('info');
      expect(entry.event).toBe('virtuoso:success');
      expect(entry.data.durationMs).toBe(150);
    });

    it('logs error at error level', () => {
      const sink = vi.fn();
      addLogSink(sink);

      logVirtuosoResult('analyst', 'task-2', false, 50);

      const entry = sink.mock.calls[sink.mock.calls.length - 1][0];
      expect(entry.level).toBe('error');
      expect(entry.event).toBe('virtuoso:error');
    });
  });

  describe('logConductorQuery', () => {
    it('logs query with function call names', () => {
      const sink = vi.fn();
      addLogSink(sink);

      logConductorQuery('test query', ['generate_summary', 'applyLens'], 0, 250);

      const entry = sink.mock.calls[sink.mock.calls.length - 1][0];
      expect(entry.data.functionCalls).toEqual(['generate_summary', 'applyLens']);
      expect(entry.data.attempt).toBe(0);
    });
  });

  describe('logValidationFailure', () => {
    it('logs at warn level', () => {
      const sink = vi.fn();
      addLogSink(sink);

      logValidationFailure('badFunction', ['error1'], 1);

      const entry = sink.mock.calls[sink.mock.calls.length - 1][0];
      expect(entry.level).toBe('warn');
      expect(entry.event).toBe('validation:failed');
    });
  });

  describe('logSearchExecuted', () => {
    it('logs search with source type', () => {
      const sink = vi.fn();
      addLogSink(sink);

      logSearchExecuted('quantum physics', 'vector', 5, 120);

      const entry = sink.mock.calls[sink.mock.calls.length - 1][0];
      expect(entry.data.source).toBe('vector');
      expect(entry.data.resultCount).toBe(5);
    });
  });

  describe('logValhallaAnalysis', () => {
    it('logs safe scripts at info level', () => {
      const sink = vi.fn();
      addLogSink(sink);

      logValhallaAnalysis(20, 0, 100, true);

      const entry = sink.mock.calls[sink.mock.calls.length - 1][0];
      expect(entry.level).toBe('info');
      expect(entry.data.safe).toBe(true);
    });

    it('logs unsafe scripts at warn level', () => {
      const sink = vi.fn();
      addLogSink(sink);

      logValhallaAnalysis(30, 2, 40, false);

      const entry = sink.mock.calls[sink.mock.calls.length - 1][0];
      expect(entry.level).toBe('warn');
      expect(entry.data.safe).toBe(false);
    });
  });
});