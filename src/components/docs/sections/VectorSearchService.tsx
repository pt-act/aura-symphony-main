import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Backend</span>
      <h2>Vector Search Service</h2>
      <div className="markdown-body">
        <p>Python FastAPI service using ChromaDB for semantic video search. Uses cosine similarity with HNSW index.</p>
        <p><FileRef path="backend/vector-search/server.py" /></p>

        <h3>Endpoints</h3>
        <PropTable rows={[
          { name: 'POST /ingest', type: 'IngestRequest', desc: 'Batch ingest video chunks for embedding. Returns { ingested, errors }' },
          { name: 'GET /search', type: 'query params', desc: 'Semantic search. Params: query, videoId?, minSimilarity=0.7, maxResults=10' },
          { name: 'GET /health', type: '—', desc: 'Health check with collection count' },
          { name: 'GET /stats', type: '—', desc: 'Collection statistics (total chunks, videos, types)' },
          { name: 'DELETE /clear', type: '—', desc: 'Clear all indexed data (development only)' },
        ]} />

        <h3>Client-Side Chunking</h3>
        <p><FileRef path="src/lib/vector-search.ts" /> and <FileRef path="src/lib/semantic-chunker.ts" /> provide chunking utilities:</p>
        <CodeBlock code={`// Adaptive semantic chunking (default — splits on topic boundaries)
chunkTranscript(transcript, videoId): VideoChunk[]
// Pipeline: sentence split → FNV-1a bigram embedding (128-dim) →
//   pairwise cosine similarity → percentile break detection → merge/balance

// Legacy fixed chunking (preserved for compatibility)
chunkTranscriptFixed(transcript, videoId, chunkSize=100, overlap=20): VideoChunk[]

// Frame description chunking
chunkFrameDescriptions(frames, videoId): VideoChunk[]

// Semantic search (falls back to Gemini if no backend)
vectorSearch(query, videoId?): Promise<VectorSearchResponse>

// Batch ingestion
ingestChunks(chunks): Promise<void>  // Batched at 50 chunks per request`} />
      </div>
    </div>
  );
}