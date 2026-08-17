import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Backend</span>
      <h2>CLIP Embeddings Service</h2>
      <div className="markdown-body">
        <p>FastAPI backend using CLIP ViT-B/32 (via <code>transformers</code> + <code>torch</code>) for multimodal embedding generation and visual search.</p>
        <p><FileRef path="backend/clip-embeddings/server.py" /></p>

        <h3>Endpoints</h3>
        <PropTable rows={[
          { name: 'POST /embed/image', type: 'multipart', desc: 'Generate CLIP embedding for an uploaded image' },
          { name: 'POST /embed/text', type: 'JSON body', desc: 'Generate CLIP embedding for text' },
          { name: 'POST /embed/batch', type: 'multipart', desc: 'Batch embed multiple images' },
          { name: 'POST /search/visual', type: 'multipart', desc: 'Visual similarity search across indexed frames' },
          { name: 'GET /health', type: '—', desc: 'Health check' },
        ]} />

        <p>Storage: ChromaDB with cosine distance. Docker service on port <strong>3006</strong>.</p>
      </div>
    </div>
  );
}