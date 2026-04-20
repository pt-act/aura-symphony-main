# Aura Symphony

Aura is a zero-surface, multi-agent platform for deep video analysis, generative media creation, and adaptive learning. Step into the conductor's shoes and let the Virtuosos do the heavy lifting.

## Features

### The Virtuosos
Aura is powered by a multi-agent architecture. Each agent, or "Virtuoso," is an expert in a specific domain:
- **The Conductor:** The orchestrator. It parses your intent and routes tasks.
- **The Visionary:** The visual analyst. It uses Gemini's multimodal capabilities to extract deep insights from video frames and images.
- **The Scholar:** The researcher. It grounds analysis in real-world facts using Google Search.
- **The Artisan:** The creator. It uses Veo and Imagen to generate new media assets.
- **The Analyst:** The logician. It synthesizes data, creates structured courses, and tracks learning progress.
- **The Chronicler:** The documentarian. It summarizes sessions, generates TTS, and exports data.
- **The Critic:** The quality gate. It adversarially evaluates Virtuoso outputs on relevance, factual consistency, and quality — triggering retry loops when standards aren't met.

### Advanced Capabilities
- **Semantic Video Search:** Ask the Conductor questions like "Where did they discuss the black hole?" and it will instantly drop markers on the timeline at the exact timestamps. Powered by adaptive semantic chunking and ChromaDB vector search.
- **Streaming Responses:** All Virtuoso outputs stream token-by-token via `generateContentStream`, reducing perceived latency by 60-80%.
- **ReAct Planning:** Complex multi-step queries are automatically routed through a Reason+Act loop — the Conductor plans, executes, observes, and adapts.
- **Voice-Activated Conductor:** Click the microphone icon or use the wake word to speak your commands naturally, achieving a true "zero-surface" experience.
- **WebWorker Pool:** Frame extraction and heavy processing are distributed across a pool of N workers with work-stealing for load balancing.
- **NLE Integration:** Export your timeline, annotations, and generated assets directly to Premiere Pro, Final Cut Pro, or DaVinci Resolve via FCPXML, EDL, or CSV.
- **Agent Studio & Plugin Marketplace:** Build custom AI agents or install third-party Virtuosos from the marketplace with sandboxed execution and SHA-256 integrity verification.
- **CRDT Collaboration:** Real-time multi-user editing via Yjs CRDTs with WebSocket transport, conflict-free shared state, and peer cursor visualization.
- **Offline-First PWA:** Service Worker caching + IndexedDB mutation queue enables full offline operation with background sync on reconnect.
- **Multimodal RAG:** CLIP ViT-B/32 frame embeddings enable true visual search alongside text-based retrieval, with fusion scoring across modalities.

### Project Valhalla
Project Valhalla is Aura's bridge to the outside world. It allows the AI agents to control external creative software (like Blender, Ableton, or Figma) by generating and executing automation scripts in a **Pyodide sandbox** (Python-in-WASM) with 3-layer security: static analysis, import blocking, and execution timeout.

### Adaptive Learning
Aura isn't just for analysis; it's an educational platform. The "Create Course" lens transforms any video into a structured learning module. As you take quizzes, Aura tracks your performance using **Bayesian Knowledge Tracing** (BKT) with temporal decay and prerequisite-aware content selection. The Digital Learner Profile (DLP) provides calibrated probability-of-mastery estimates. **Federated Learning** with differential privacy enables the system to improve across users while preserving individual privacy.

## Getting Started

### Prerequisites
- Node.js 18+
- A Google Gemini API key ([get one here](https://aistudio.google.com/apikey))

### Setup

1. Clone and install:
   ```bash
   git clone <repo-url> && cd aura-symphony
   npm install
   ```

2. Create your environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=AIzaSy...your_actual_key
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

The app runs at `http://localhost:3000`.

### API Configuration

Aura supports **two ways** to supply an AI provider key:

| Method | Description |
|--------|-------------|
| **In-App Settings (recommended)** | Click the ⚙️ Settings icon in the toolbar to open the **AI Provider Settings** panel. From there you can add one or more providers, each with its own **Base URL**, **API Key**, and **Model**. The active provider is used for all AI calls. A **Test Connection** button validates the key and model before you commit. Settings are persisted in `localStorage`. |
| **`.env` file (fallback)** | Set `GEMINI_API_KEY` in a `.env` file at the project root. Vite injects it as `process.env.API_KEY` at build time via `define` in `vite.config.ts`. This key is used only when no custom provider is configured in Settings. |

> **Resolution order:** `getAI()` checks for an active provider with a non-empty API key first. If none exists, it falls back to the `.env`-based default client. `getEffectiveModel(registryModel)` similarly returns the user's custom model when set, or the per-virtuoso default otherwise.

> **Compatibility:** The Settings panel supports any OpenAI-compatible API (Google AI, Anthropic via proxy, Ollama, local LLMs, etc.).

## Architecture

Aura is a polyglot microservices architecture with a rich React 19 + Vite 6 frontend. Seven AI agents communicate via the `SymphonyBus` (custom `EventTarget`-based event bus) with commission chaining for multi-step orchestration.

| Service | Stack | Port | Role |
|---------|-------|------|------|
| **Frontend** | React 19 + Vite 6 + TypeScript | 3000 | SPA, agent orchestration, frame extraction |
| **API Proxy** | Express | 3005 | Gemini key isolation, rate limiting, usage metering |
| **Vector Search** | FastAPI + ChromaDB | 3001 | Semantic search with adaptive chunking |
| **Graph Knowledge** | Express + SQLite | 4004 | Concept graph traversal, learning paths |
| **Media Pipeline** | Express + FFmpeg + WebSocket | 3002/3003 | Cloud-side frame extraction, transcription |
| **CLIP Embeddings** | FastAPI + CLIP ViT-B/32 | 3006 | Multimodal visual search |

All backend services are optional — the frontend degrades gracefully to browser-local alternatives. Orchestrated via `docker-compose.yml`.

**Defense-in-depth AI safety:** Zod schema validation on all LLM function calls → Critic agent adversarial quality gate → Valhalla 3-layer sandbox → Plugin sandboxed execution.

**438 tests** across 20 files. Production build in ~29s.

## License
Apache 2.0
