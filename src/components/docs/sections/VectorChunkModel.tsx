import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Data</span>
      <h2>Vector Chunk Model</h2>
      <div className="markdown-body">
        <p>Video content is chunked and embedded for semantic retrieval.</p>
        <CodeBlock code={`interface VideoChunk {
  id: string;          // "{videoId}-chunk-{index}"
  videoId: string;
  content: string;     // Text content (transcript or frame description)
  timestamp: number;   // Start time in seconds
  endTime: number;     // End time in seconds
  type: 'transcript' | 'frame_description';
  metadata?: Record<string, unknown>;
}

interface SearchResult {
  chunk: VideoChunk;
  similarity: number;  // 0-1 (cosine similarity)
}

interface VectorSearchResponse {
  query: string;
  results: SearchResult[];
  searchTimeMs: number;
  source: 'vector' | 'fallback';
}`} />

        <h3>Chunking Parameters</h3>
        <PropTable rows={[
          { name: 'chunkSize', type: 'number', desc: 'Words per chunk', default: '100' },
          { name: 'overlap', type: 'number', desc: 'Overlapping words between chunks', default: '20' },
          { name: 'minChunkSize', type: 'number', desc: 'Minimum words to create a chunk', default: '10' },
          { name: 'minSimilarity', type: 'number', desc: 'Minimum cosine similarity threshold', default: '0.7' },
          { name: 'maxResults', type: 'number', desc: 'Maximum search results returned', default: '10' },
          { name: 'batchSize', type: 'number', desc: 'Chunks per ingestion batch', default: '50' },
        ]} />
      </div>
    </div>
  );
}