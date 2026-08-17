import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Advanced</span>
      <h2>Plugin Marketplace</h2>
      <div className="markdown-body">
        <p>Registry with local catalog + remote API fallback. Supports search/filter, SHA-256 integrity verification, and sandboxed handler execution.</p>
        <p><FileRef path="src/lib/plugin-marketplace.ts" /></p>
        <CodeBlock code={`Installation Pipeline:
  1. Fetch handler code from registry
  2. SHA-256 integrity verification
  3. Create sandboxed handler (restricted Function scope)
     - Blocks: window, document, fetch, eval, XMLHttpRequest
  4. Register with Virtuoso system

Search: by query, tags, verified status
Sort: by installs, rating, or recency
Publishing: ID must start with 'plugin_' or 'custom_'
Per-plugin telemetry tracking`} />
      </div>
    </div>
  );
}