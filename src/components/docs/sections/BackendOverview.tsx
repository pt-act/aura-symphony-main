import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Backend</span>
      <h2>Service Overview</h2>
      <div className="markdown-body">
        <p>Aura Symphony includes five backend microservices, all orchestrated via Docker Compose. Each service has health checks, graceful degradation, and is fully testable in isolation.</p>

        <PropTable rows={[
          { name: 'API Proxy', type: 'Node.js / Express', desc: 'Gemini API proxy with rate limiting (30 req/min), usage metering, key isolation', default: ':3005' },
          { name: 'Vector Search', type: 'Python / FastAPI', desc: 'Semantic search with ChromaDB embeddings + adaptive chunking', default: ':3001' },
          { name: 'Graph Knowledge', type: 'Node.js / Express', desc: 'Concept graph with SQLite recursive CTEs', default: ':4004' },
          { name: 'Media Pipeline', type: 'Node.js / Express', desc: 'FFmpeg frame extraction + WebSocket progress', default: ':3002 / WS :3003' },
          { name: 'CLIP Embeddings', type: 'Python / FastAPI', desc: 'Multimodal RAG with CLIP ViT-B/32 + ChromaDB for visual search', default: ':3006' },
        ]} />

        <Callout type="tip">All backends are optional. When their URLs are not configured, the frontend falls back to browser-local alternatives. Set <code>VITE_API_PROXY_URL</code>, <code>VITE_VECTOR_BACKEND_URL</code>, <code>VITE_GRAPH_BACKEND_URL</code>, and <code>VITE_MEDIA_BACKEND_URL</code> to enable them.</Callout>
      </div>
    </div>
  );
}