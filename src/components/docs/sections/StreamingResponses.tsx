import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Advanced</span>
      <h2>Streaming Responses</h2>
      <div className="markdown-body">
        <p>Uses Gemini's <code>generateContentStream</code> to display partial results as they arrive. Wrappers exist for all 6 Virtuoso APIs with <code>StreamOptions</code> callbacks and <code>AbortController</code> cancellation.</p>
        <p><FileRef path="src/api/streaming.ts" /></p>
        <CodeBlock code={`// Streaming wrappers for each Virtuoso:
streamPdfAnalysis(frames, query, options)
streamSearch(query, options)
streamChat(message, history, options)
streamVideoAnalysis(frames, lensType, query, options)
streamCourse(frames, options)
streamTranscription(frames, options)

// Generic:
streamGenerate(model, contents, options)`} />
      </div>
    </div>
  );
}