import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Advanced</span>
      <h2>Adaptive Semantic Chunking</h2>
      <div className="markdown-body">
        <p>Replaces fixed 100-word windows with topic-boundary-aware chunking. Uses a 5-step pipeline with no API calls — all embeddings computed locally via FNV-1a hash-based bigrams.</p>
        <p><FileRef path="src/lib/semantic-chunker.ts" /></p>
        <CodeBlock code={`Pipeline:
  1. Sentence splitting (regex-based)
  2. FNV-1a hash-based bigram embedding (128-dim)
  3. Pairwise cosine similarity between adjacent sentences
  4. Percentile-based break detection (low similarity = topic change)
  5. Merge/balance (enforce min/max chunk sizes)

// API
adaptiveChunkTranscript(transcript, videoId, config?): VideoChunk[]
chunkTranscript(transcript, videoId): VideoChunk[]  // wrapper
chunkTranscriptFixed(...)  // legacy fixed chunker preserved`} />
      </div>
    </div>
  );
}