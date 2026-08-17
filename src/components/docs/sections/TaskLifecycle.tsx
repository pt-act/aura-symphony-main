import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Architecture</span>
      <h2>Task Lifecycle</h2>
      <div className="markdown-body">
        <p>Every Virtuoso operation follows a standardized lifecycle managed by the Symphony Bus:</p>

        <CodeBlock title="Task State Machine" code={`                ┌─────────────┐
                │   CREATED   │
                └──────┬──────┘
                       │ commission()
                ┌──────▼──────┐
                │   RUNNING   │◀─── TASK_START event
                └───┬─────┬───┘
                    │     │
           success  │     │  error
                    │     │
            ┌───────▼─┐ ┌─▼───────┐
            │ SUCCESS │ │  ERROR  │
            └────┬────┘ └────┬────┘
                 │           │
                 └─────┬─────┘
                       │ auto-clear after 5s
                 ┌─────▼─────┐
                 │  REMOVED  │
                 └───────────┘`} />

        <h3>Task Interface</h3>
        <CodeBlock code={`interface Task {
  id: string | number;
  name: string;
  virtuosoId: VirtuosoType;
  status: 'running' | 'success' | 'error';
  progress?: number;       // 0-100
  result?: unknown;
  error?: string;
  createdAt: number;       // Date.now()
}`} />

        <h3>Persistence</h3>
        <p>Tasks are persisted to IndexedDB (database: <code>aura-symphony</code>, store: <code>tasks</code>) so they survive page refreshes. Tasks older than 24 hours are automatically pruned. See <FileRef path="src/lib/task-persistence.ts" />.</p>
      </div>
    </div>
  );
}