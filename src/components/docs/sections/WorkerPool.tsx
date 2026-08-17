import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Advanced</span>
      <h2>WebWorker Pool</h2>
      <div className="markdown-body">
        <p>N-worker pool (<code>hardwareConcurrency</code>, max 8) with least-loaded selection and work-stealing scheduler. Replaces the singleton SharedWorker for frame extraction.</p>
        <p><FileRef path="src/lib/worker-pool.ts" /></p>
        <CodeBlock code={`const pool = new WorkerPool(workerUrl, { maxWorkers: 8 });

// Submit individual tasks
const result = await pool.submit(task);

// Parallel frame processing (splits across workers)
const frames = await processFramesParallel(bitmaps);

// Work-stealing: 100ms interval, LIFO steal / FIFO local
// Batch submission with round-robin distribution
// Full lifecycle: stats, drain, terminate`} />
      </div>
    </div>
  );
}