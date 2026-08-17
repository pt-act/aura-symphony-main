import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Hook</span>
      <h2>useVectorSearch</h2>
      <div className="markdown-body">
        <p>Wraps the vector search client library for React components. Provides semantic search across indexed video content with automatic fallback to Gemini context-window search when the backend is unavailable.</p>
        <p><FileRef path="src/hooks/useVectorSearch.ts" /></p>
        <p>See <strong>Vector Search Service</strong> under Backend Services for the full client API.</p>
      </div>
    </div>
  );
}