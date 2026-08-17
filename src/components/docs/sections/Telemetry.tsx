import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Operations</span>
      <h2>Telemetry & Observability</h2>
      <div className="markdown-body">
        <p>Structured JSON logging for all Virtuoso operations, function calls, and system events.</p>
        <p><FileRef path="src/lib/telemetry.ts" /></p>

        <CodeBlock title="Log Entry Structure" code={`interface LogEntry {
  timestamp: string;     // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error';
  component: string;     // 'symphony', 'conductor', 'valhalla', 'search'
  event: string;         // 'virtuoso:commission', 'query:executed', etc.
  data: Record<string, unknown>;
  duration?: number;     // milliseconds
  error?: string;
  traceId?: string;
}`} />

        <h3>Log Sinks</h3>
        <p>Console sink is enabled by default in development. Production sinks can be added via <code>addLogSink()</code>.</p>

        <h3>Available Log Functions</h3>
        <PropTable rows={[
          { name: 'logVirtuosoCommission', type: 'info', desc: 'Logs when a Virtuoso is commissioned' },
          { name: 'logVirtuosoResult', type: 'info/error', desc: 'Logs task completion with duration' },
          { name: 'logConductorQuery', type: 'info', desc: 'Logs Conductor query with function calls and attempt count' },
          { name: 'logValidationFailure', type: 'warn', desc: 'Logs Zod validation failures with error details' },
          { name: 'logSearchExecuted', type: 'info', desc: 'Logs vector/fallback search with result count and duration' },
          { name: 'logValhallaAnalysis', type: 'info/warn', desc: 'Logs script safety analysis results' },
        ]} />
      </div>
    </div>
  );
}