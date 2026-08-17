import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Hook</span>
      <h2>useSymphony</h2>
      <div className="markdown-body">
        <p>Subscribes to the Symphony Bus and maintains a reactive list of all active tasks. Auto-clears completed/errored tasks after 5 seconds. Restores persisted tasks from IndexedDB on mount.</p>
        <p><FileRef path="src/hooks/useSymphony.ts" /></p>
        <CodeBlock code={`const { tasks } = useSymphony();
// tasks: Task[] — all active tasks with status, progress, result`} />
      </div>
    </div>
  );
}