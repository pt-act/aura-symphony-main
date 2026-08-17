import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Operations</span>
      <h2>Task Persistence (IndexedDB)</h2>
      <div className="markdown-body">
        <p>Tasks survive page refreshes via IndexedDB. The <code>aura-symphony</code> database stores tasks in the <code>tasks</code> object store.</p>
        <p><FileRef path="src/lib/task-persistence.ts" /></p>

        <h3>API</h3>
        <PropTable rows={[
          { name: 'persistTask(task)', type: 'Promise<void>', desc: 'Upsert a task to IndexedDB' },
          { name: 'removeTask(taskId)', type: 'Promise<void>', desc: 'Delete a task from IndexedDB' },
          { name: 'loadPersistedTasks()', type: 'Promise<Task[]>', desc: 'Load all tasks younger than 24 hours' },
          { name: 'clearPersistedTasks()', type: 'Promise<void>', desc: 'Clear all persisted tasks (debugging)' },
          { name: 'pruneStaleTasks(maxAgeMs?)', type: 'Promise<number>', desc: 'Remove completed/errored tasks older than maxAge. Default: 24h. Returns count pruned.' },
        ]} />
      </div>
    </div>
  );
}