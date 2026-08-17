import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Architecture</span>
      <h2>Symphony Bus</h2>
      <div className="markdown-body">
        <p>The <code>SymphonyBus</code> is the system's central nervous system — a custom event bus extending <code>EventTarget</code> that provides decoupled communication between all components and AI agents.</p>

        <p><FileRef path="src/lib/symphonyBus.ts" /></p>

        <CodeBlock title="SymphonyBus API" code={`class SymphonyBus extends EventTarget {
  // Subscribe to events
  listen(type: string, listener: EventListenerOrEventListenerObject): void;
  
  // Unsubscribe from events
  unlisten(type: string, listener: EventListenerOrEventListenerObject): void;
  
  // Dispatch typed events
  dispatch<T>(type: string, detail: T): void;
  
  // Commission a Virtuoso task (with telemetry)
  commission(virtuosoId: VirtuosoType, taskName: string, taskId?: string | number): string | number;
  
  // Report task result (success or error)
  reportResult(taskId: string | number, virtuosoId: VirtuosoType | string,
               success: boolean, result: unknown, durationMs?: number): void;
  
  // Chain a child task from a parent (agent-to-agent delegation)
  chainCommission(parentId: string | number, childVirtuoso: VirtuosoType,
                  childTaskName: string, context?: Record<string, unknown>): string;
}`} />

        <h3>Commission Chaining</h3>
        <p>The <code>chainCommission</code> method creates hierarchical task IDs of the form <code>parentId::childVirtuoso::randomId</code>, implicitly encoding a DAG of agent execution. This enables multi-step orchestration where one Virtuoso delegates sub-tasks to another.</p>

        <CodeBlock code={`// Example: Conductor delegates to Scholar
const parentId = symphonyBus.commission(VirtuosoType.CONDUCTOR, 'Process Query');
const childId = symphonyBus.chainCommission(
  parentId,
  VirtuosoType.SCHOLAR,
  'Web Research',
  { query: 'quantum computing breakthroughs 2026' }
);`} />

        <Callout type="info">The singleton <code>symphonyBus</code> instance is exported from the module and shared across the entire application. Import it with <code>{'import { symphonyBus } from "../lib/symphonyBus"'}</code>.</Callout>
      </div>
    </div>
  );
}