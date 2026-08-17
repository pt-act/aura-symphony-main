import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Advanced</span>
      <h2>CRDT Collaborative Editing</h2>
      <div className="markdown-body">
        <p>Real-time collaboration via <strong>Yjs</strong> CRDTs. <code>CollaborationSession</code> wraps a <code>Y.Doc</code> with 6 shared types and WebSocket transport with auto-reconnect.</p>
        <p><FileRef path="src/lib/crdt-collaboration.ts" /></p>
        <CodeBlock code={`Shared CRDT Types:
  annotations: Y.Map    // Timeline annotations
  insights: Y.Array     // Analysis insights
  dlp: Y.Map            // Digital Learner Profile
  chat: Y.Array         // Chat messages
  cursors: Y.Map        // Peer cursor positions
  metadata: Y.Map       // Session metadata

Features:
  - WebSocketTransport with auto-reconnect
  - SessionManager for multi-room support
  - Change events with local/remote origin tracking
  - State export/import for snapshots
  - UndoManager per session
  - y-indexeddb persistence
  - Peer color assignment for cursor visualization`} />
      </div>
    </div>
  );
}