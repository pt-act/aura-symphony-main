import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Advanced</span>
      <h2>CLIP Multimodal RAG</h2>
      <div className="markdown-body">
        <p>Client-side fusion search combining text and visual embeddings. Uses CLIP ViT-B/32 on the backend for frame-level visual search.</p>
        <p><FileRef path="src/lib/clip-embeddings.ts" /> · <FileRef path="backend/clip-embeddings/server.py" /></p>
        <CodeBlock code={`Fusion Search:
  Text results (40% weight) + Visual results (60% weight)
  "Both" boost: timestamps appearing in both modalities get score bonus

Pipeline: frame → CLIP embedding → ChromaDB → cosine search
Batch processing for video-level indexing

Example: "find the frame where the speaker points at the whiteboard"
  → embedding-based retrieval, not LLM re-analysis`} />
      </div>
    </div>
  );
}