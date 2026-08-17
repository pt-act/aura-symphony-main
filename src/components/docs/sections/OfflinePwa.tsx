import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Advanced</span>
      <h2>Offline-First PWA</h2>
      <div className="markdown-body">
        <p>Service Worker + IndexedDB mutation queue for full offline operation with background sync on reconnect.</p>
        <p><FileRef path="src/lib/offline-sync.ts" /> · <FileRef path="public/sw.js" /></p>
        <CodeBlock code={`Service Worker Caching Strategies:
  Cache-First: /assets/, fonts, images (static)
  Network-First: /api/ calls
  Stale-While-Revalidate: CDN resources

IndexedDB Mutation Queue:
  - FIFO ordering
  - Optimistic sync with exponential backoff (max 5 retries)
  - Auto-sync on reconnect (online/offline detection)
  - Frame/transcript caching with 7-day TTL
  - Background sync via SW sync event`} />
      </div>
    </div>
  );
}