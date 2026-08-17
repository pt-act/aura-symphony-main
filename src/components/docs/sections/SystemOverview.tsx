import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Architecture</span>
      <h2>System Overview</h2>
      <div className="markdown-body">
        <p>Aura Symphony is a polyglot microservices architecture with a rich client frontend. The system decomposes into multiple tiers:</p>
        <CodeBlock title="Architecture Diagram" code={`┌─────────────────────────────────────────────────────────┐
│                 Frontend (React 19 + Vite 6)             │
│                                                          │
│  ┌──────────┐   ┌────────────────┐   ┌────────────────┐ │
│  │Conductor │◀─▶│  Symphony Bus  │◀─▶│ Virtuosos (7)  │ │
│  │  Input   │   │  (EventTarget) │   │ + Plugin Market │ │
│  └──────────┘   └───────┬────────┘   └────────────────┘ │
│                         │ Events / Commission Chains      │
│  ┌──────────────────────▼──────────────────────────────┐ │
│  │  Zod Validation · Critic Gate · ReAct Planner       │ │
│  │  BKT Knowledge Tracing · Streaming · CRDT (Yjs)    │ │
│  │  Worker Pool · Pyodide Sandbox · Offline Sync (PWA) │ │
│  │  Semantic Chunker · Federated Learning              │ │
│  └─────────────────────────────────────────────────────┘ │
└───┬──────────┬──────────┬──────────┬──────────┬──────────┘
    │REST      │REST      │WS+REST   │REST      │REST
┌───▼────┐ ┌───▼───┐ ┌────▼─────┐ ┌──▼──────┐ ┌─▼──────────┐
│ Vector │ │ Graph │ │  Media   │ │  API    │ │  CLIP      │
│ Search │ │ Know. │ │ Pipeline │ │ Proxy   │ │ Embeddings │
│ :3001  │ │ :4004 │ │ :3002/03 │ │ :3005   │ │ :3006      │
└────────┘ └───────┘ └──────────┘ └─────────┘ └────────────┘
               │                        │
┌──────────────▼────────────────────────▼──────────────────┐
│              Firebase (Auth + Firestore)                 │
│              Google Gemini API (via proxy or direct)      │
└──────────────────────────────────────────────────────────┘`} />

        <h3>Design Decisions</h3>
        <ul>
          <li><strong>API key security:</strong> A backend API proxy (<code>:3005</code>) keeps the Gemini key server-side with rate limiting and usage metering. Users can also configure keys via the in-app Settings panel (stored in <code>localStorage</code>). Direct browser-to-Gemini calls remain as a fallback.</li>
          <li><strong>Strategy-pattern dispatch:</strong> <code>useLensExecution</code> uses a handler registry where each lens type is an independent module. New lenses are added by creating a handler file and registering it.</li>
          <li><strong>Graceful degradation:</strong> All backend services are optional. When unavailable, the frontend falls back to browser-local alternatives (WebWorker for media, Gemini context-window for search, flat Firestore for DLP).</li>
          <li><strong>Polyglot backends:</strong> Python for vector search and CLIP embeddings (ML ecosystem), Node.js for I/O-intensive media pipeline and graph queries.</li>
          <li><strong>Real-time collaboration:</strong> Yjs CRDT enables conflict-free multi-user editing with WebSocket transport and IndexedDB persistence.</li>
          <li><strong>Offline-first:</strong> Service Worker caching + IndexedDB mutation queue enables full offline operation with background sync on reconnect.</li>
        </ul>
      </div>
    </div>
  );
}