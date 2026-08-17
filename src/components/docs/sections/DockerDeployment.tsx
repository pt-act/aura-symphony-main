import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Backend</span>
      <h2>Docker & Compose</h2>
      <div className="markdown-body">
        <p><FileRef path="docker-compose.yml" /> orchestrates all backend services with health checks and persistent volumes.</p>
        <CodeBlock title="docker-compose.yml services" code={`services:
  neo4j:           # Neo4j Community 5 (:7474, :7687)
  vector-search:   # FastAPI + ChromaDB (:3001)
  media-pipeline:  # Express + FFmpeg (:3002, WS :3003)
  graph-knowledge: # Express + SQLite/Neo4j (:3004)
  api-proxy:       # Gemini API proxy with rate limiting (:3005)
  clip-embeddings: # CLIP ViT-B/32 + ChromaDB (:3006)

volumes:
  neo4j-data:    # Persistent graph storage
  vector-data:   # Persistent ChromaDB embeddings
  media-temp:    # Temporary frame extraction`} />

        <CodeBlock title="Quick Start" language="bash" code={`docker compose up -d
# Health checks:
curl http://localhost:3001/health  # Vector Search
curl http://localhost:3002/health  # Media Pipeline
curl http://localhost:3004/health  # Graph Knowledge
curl http://localhost:3005/api/health  # API Proxy
curl http://localhost:3006/health  # CLIP Embeddings`} />
      </div>
    </div>
  );
}