/**
 * Aura Telemetry — Structured observability for all Virtuoso operations.
 *
 * Provides structured JSON logging for agent interactions, function calls,
 * and system events. Designed for both development (console) and production
 * (aggregation service) use.
 */

import type {VirtuosoType} from '../services/virtuosos';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  event: string;
  data: Record<string, unknown>;
  duration?: number;
  error?: string;
  traceId?: string;
}

type LogSink = (entry: LogEntry) => void;

const sinks: LogSink[] = [];

/** Register a log sink (console, remote service, etc.). */
export function addLogSink(sink: LogSink): void {
  sinks.push(sink);
}

/** Console sink enabled by default in development. */
if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
  addLogSink((entry) => {
    const prefix = `[${entry.level.toUpperCase()}][${entry.component}]`;
    const method = entry.level === 'error' ? console.error : entry.level === 'warn' ? console.warn : console.log;
    method(prefix, entry.event, entry.data);
  });
}

function emit(level: LogLevel, component: string, event: string, data: Record<string, unknown>, extra?: {duration?: number; error?: string; traceId?: string}): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    component,
    event,
    data,
    ...extra,
  };
  for (const sink of sinks) {
    try { sink(entry); } catch { /* sink must not throw */ }
  }
}

// ─── Virtuoso-specific logging ─────────────────────────────────────

export function logVirtuosoCommission(
  virtuosoId: VirtuosoType | string,
  taskName: string,
  taskId: string | number,
): void {
  emit('info', 'symphony', 'virtuoso:commission', {
    virtuosoId,
    taskName,
    taskId,
  });
}

export function logVirtuosoResult(
  virtuosoId: VirtuosoType | string,
  taskId: string | number,
  success: boolean,
  durationMs: number,
  metadata?: Record<string, unknown>,
): void {
  emit(
    success ? 'info' : 'error',
    'symphony',
    success ? 'virtuoso:success' : 'virtuoso:error',
    {
      virtuosoId,
      taskId,
      durationMs,
      ...metadata,
    },
    {duration: durationMs},
  );
}

export function logConductorQuery(
  query: string,
  functionCalls: string[],
  attempt: number,
  durationMs: number,
): void {
  emit('info', 'conductor', 'query:executed', {
    queryLength: query.length,
    functionCalls,
    attempt,
    durationMs,
  }, {duration: durationMs});
}

export function logValidationFailure(
  functionName: string,
  errors: string[],
  attempt: number,
): void {
  emit('warn', 'conductor', 'validation:failed', {
    functionName,
    errors,
    attempt,
  });
}

export function logSearchExecuted(
  query: string,
  source: 'vector' | 'fallback',
  resultCount: number,
  durationMs: number,
): void {
  emit('info', 'search', 'search:executed', {
    queryLength: query.length,
    source,
    resultCount,
    durationMs,
  }, {duration: durationMs});
}

export function logValhallaAnalysis(
  scriptLines: number,
  findingCount: number,
  score: number,
  safe: boolean,
): void {
  emit(safe ? 'info' : 'warn', 'valhalla', 'script:analyzed', {
    scriptLines,
    findingCount,
    score,
    safe,
  });
}

// ─── Performance timer utility ─────────────────────────────────────

export function startTimer(): {elapsed: () => number} {
  const start = performance.now();
  return {
    elapsed: () => performance.now() - start,
  };
}
