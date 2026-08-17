import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Hook</span>
      <h2>useStreaming</h2>
      <div className="markdown-body">
        <p>Pipes streaming Gemini responses directly into Insight state, reducing perceived latency by 60-80%. Supports all 6 Virtuoso APIs with <code>AbortController</code> cancellation.</p>
        <p><FileRef path="src/hooks/useStreaming.ts" /> · <FileRef path="src/api/streaming.ts" /></p>
        <CodeBlock code={`const { streamResponse, isStreaming, cancel } = useStreaming();

// StreamOptions:
//   onChunk(text: string)    — called per token
//   onComplete(full: string) — called when stream ends
//   onError(err: Error)      — called on failure
//   signal: AbortSignal      — for cancellation`} />
      </div>
    </div>
  );
}