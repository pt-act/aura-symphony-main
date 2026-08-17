import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Reference</span>
      <h2>Project Structure</h2>
      <div className="markdown-body">
        <CodeBlock title="Directory Layout" code={`aura-symphony/
├── backend/
│   ├── api-proxy/              # Gemini API proxy (Express, :3005)
│   │   ├── server.js           # Rate limiting, usage metering
│   │   └── server.test.js
│   ├── clip-embeddings/        # CLIP multimodal embeddings (FastAPI, :3006)
│   │   ├── server.py           # ViT-B/32 + ChromaDB
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   ├── graph-knowledge/        # SQLite graph service (Node.js/Express)
│   │   ├── server-sqlite.js    # SQLite impl with recursive CTEs
│   │   ├── server.js           # Neo4j impl (requires Neo4j)
│   │   └── server.test.js
│   ├── media-pipeline/         # FFmpeg processing service
│   │   ├── server.js           # Express + WebSocket
│   │   ├── server.test.js
│   │   └── websocket.test.js
│   └── vector-search/          # Semantic search (Python/FastAPI)
│       ├── server.py           # ChromaDB vector store
│       └── test_server.py
├── docs/
│   ├── AGENTS.md               # AI-First Design principles
│   ├── UI_UX.md                # Complete UI/UX specification
│   └── VISION.md               # Project vision & Pantheon architecture
├── e2e/
│   └── aura.spec.ts            # Playwright end-to-end tests
├── src/
│   ├── api/
│   │   ├── client.ts           # GoogleGenAI client factory
│   │   ├── api.ts              # Unified re-export barrel
│   │   ├── firebase.ts         # Firebase Auth helpers
│   │   ├── firebaseConfig.ts   # Firebase project config
│   │   ├── firestoreService.ts # Firestore CRUD operations
│   │   ├── valhalla.ts         # Valhalla command execution
│   │   └── virtuosos/          # ← Individual agent implementations
│   │       ├── conductor.ts    #   Intent parsing & delegation
│   │       ├── visionary.ts    #   Video/image analysis
│   │       ├── scholar.ts      #   Google Search grounding
│   │       ├── artisan.ts      #   Veo/Imagen generation
│   │       ├── analyst.ts      #   Course & structured reasoning
│   │       ├── chronicler.ts   #   TTS, transcription, export
│   │       └── critic.ts       #   Quality evaluation gate
│   ├── components/
│   │   ├── analysis/           # Video analysis UI (timeline, insights, charts)
│   │   ├── conductor/          # ConductorInput (command bar)
│   │   ├── course/             # Adaptive learning views
│   │   ├── creator/            # Creator Studio (presentations)
│   │   ├── docs/               # ← This documentation site
│   │   ├── landing/            # Landing page
│   │   ├── lenses/             # Lens palette & prompt modals
│   │   ├── settings/           # Provider settings UI
│   │   ├── shared/             # Modals, OrchestraVisualizer, LiveConversation
│   │   ├── valhalla/           # ValhallaGateway component
│   │   └── virtuosos/          # CustomVirtuosoBuilder
│   ├── hooks/                  # ← React hooks (state management)
│   │   ├── useKnowledgeTracing.ts  # BKT-based adaptive learning
│   │   ├── useStreaming.ts     # Streaming response hook
│   │   └── ...
│   ├── lib/                    # ← Core libraries & utilities
│   │   ├── crdt-collaboration.ts   # Yjs CRDT sessions
│   │   ├── clip-embeddings.ts      # Multimodal RAG client
│   │   ├── federated-learning.ts   # FedAvg + differential privacy
│   │   ├── knowledge-tracing.ts    # Bayesian Knowledge Tracing
│   │   ├── lens-handlers/          # Strategy pattern handlers
│   │   ├── offline-sync.ts         # PWA offline mutation queue
│   │   ├── plugin-marketplace.ts   # Plugin registry + sandbox
│   │   ├── react-planner.ts        # ReAct planning loop
│   │   ├── semantic-chunker.ts     # Adaptive semantic chunking
│   │   ├── valhalla-sandbox.ts     # Pyodide WASM execution
│   │   ├── worker-pool.ts          # WebWorker pool + work-stealing
│   │   └── ...
│   ├── services/
│   │   └── virtuosos.ts        # VIRTUOSO_REGISTRY (agent profiles)
│   ├── styles/
│   │   └── index.css           # Global styles
│   ├── workers/
│   │   └── media.worker.ts     # WebWorker for frame/PDF processing
│   ├── App.tsx                 # Router: / → Landing, /docs → Docs, /app → Workspace
│   ├── Workspace.tsx           # Main application shell
│   └── types.ts                # Shared TypeScript interfaces
├── docker-compose.yml          # Full backend orchestration
├── firestore.rules             # Security rules with domain validators
├── package.json
├── tsconfig.json
└── vite.config.ts`} />
      </div>
    </div>
  );
}