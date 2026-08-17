import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Conductor</span>
      <h2>Schema Validation (Zod)</h2>
      <div className="markdown-body">
        <p>Every Conductor function call is validated against a Zod schema before execution. This prevents hallucinated parameters from reaching application state.</p>
        <p><FileRef path="src/lib/conductor-schemas.ts" /></p>

        <h3>Schema Design Principles</h3>
        <ul>
          <li><strong><code>.strict()</code></strong> on all schemas — rejects any extra properties the LLM hallucinates.</li>
          <li><strong><code>.min(1)</code></strong> on required strings — prevents empty string arguments.</li>
          <li><strong><code>.min(0)</code></strong> on timestamps — prevents negative time values.</li>
          <li><strong><code>.refine()</code></strong> on ranges — ensures <code>endTime &gt; startTime</code>.</li>
        </ul>

        <CodeBlock title="Example: SetSelectionRange Schema" code={`const SetSelectionRangeSchema = z
  .object({
    startTime: z.number().min(0, 'startTime must be >= 0'),
    endTime: z.number().min(0, 'endTime must be >= 0'),
  })
  .refine(data => data.endTime > data.startTime, {
    message: 'endTime must be greater than startTime',
    path: ['endTime'],
  });`} />

        <h3>Schema Registry</h3>
        <p>All schemas are registered in <code>conductorSchemas: Record&lt;string, z.ZodSchema&gt;</code>, mapping function names to their validation schemas. This enables O(1) lookup in the validation middleware.</p>
      </div>
    </div>
  );
}