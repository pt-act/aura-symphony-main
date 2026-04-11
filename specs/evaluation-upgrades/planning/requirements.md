# Planning: Evaluation Upgrades for Aura Symphony

## Source
Evaluation report by Dr. [Redacted], Professor of CS and Software Engineering (April 8, 2026). Grade: A+.

## Problem Statement
Aura Symphony is a highly capable prosumer tool but has architectural and algorithmic limitations that prevent it from scaling to enterprise-grade. The evaluation identified 6 concrete improvements across 3 phases.

## Current Architecture Summary

- **Frontend**: React 19 + Vite + TypeScript, thick client
- **State**: Custom hooks (useAnalysisState, useVideoState, useCreatorState)
- **Event Bus**: SymphonyBus (EventTarget-based EDA)
- **AI**: Gemini 3.1 Pro via @google/genai, function calling for Conductor → Virtuoso routing
- **Persistence**: Firebase Firestore (NoSQL documents)
- **Media Processing**: WebWorker (media.worker.ts) for frame extraction
- **Agents**: 6 Virtuosos (Analyst, Artisan, Chronicler, Conductor, Scholar, Visionary)
- **Agent Builder**: Custom Virtuoso Builder (dynamic context window injection)
- **Valhalla**: Generates Python/automation scripts for external tools (Blender, Ableton)

## Identified Improvements

### Phase I: Algorithmic Optimization

**1. Vectorized RAG for Semantic Video Search**
- Current: Entire video transcript + frame descriptions fed into Gemini prompt per search query (O(n) per query)
- Needed: Backend microservice that chunks video frames/audio, generates multimodal embeddings, stores in vector DB (Pinecone/Milvus). Searches use cosine similarity lookup (O(log n))
- Impact: 10-100x cost reduction, sub-second search on long videos

**2. Deterministic Fallbacks (Schema Validation)**
- Current: Conductor function calls (JSON) from Gemini are trusted directly
- Needed: Zod schema validation on every function call. If LLM hallucinates a tool or provides invalid args, catch error and re-prompt without exposing failure to user
- Impact: Eliminates silent failures from LLM hallucinations

### Phase II: Scalability and Architecture

**3. Backend Media Pipeline**
- Current: WebWorker handles frame extraction in-browser, significant client-side memory pressure
- Needed: Cloud media processing (AWS MediaConvert or containerized FFmpeg on Cloud Run). Client sends signed URL, backend processes async, pushes results via WebSocket
- Impact: Removes client memory bottleneck, enables processing longer/larger videos

**4. Graph-Based Knowledge Representation (DLP)**
- Current: Digital Learner Profile stored as flat Firestore documents
- Needed: Graph database (Neo4j) for DLP and cross-video annotations. Enables Analyst agent to find complex relationships across a user's entire learning history
- Impact: Richer adaptive learning, cross-video concept linking

### Phase III: Advanced Feature Integration

**5. Multi-Agent Reinforcement Learning (Critic Agent)**
- Current: Virtuosos produce output directly, no quality gate
- Needed: New "Critic" Virtuoso. Before Artisan generates media or Analyst finalizes a course, Critic evaluates output against user's original prompt. Adversarial/collaborative loop
- Impact: Reduced hallucinations, higher output quality

**6. Valhalla Telemetry and AST Parsing**
- Current: Generated scripts execute without structural verification
- Needed: AST parsing of generated code before execution. Ensures no infinite loops, no destructive system calls. Mathematically provable security layer
- Impact: Safe sandbox execution, production-ready Valhalla

## Constraints

- Must maintain backward compatibility with existing Virtuoso architecture
- Client-side app remains the primary interface (backend augments, doesn't replace)
- Firebase Auth already in use — new backend services must integrate with existing auth
- All new services must implement introspection (--manifest) for AI-first design

## Reusable Code

- `src/lib/symphonyBus.ts` — extend for backend WebSocket integration
- `src/services/virtuosos.ts` — add Critic VirtuosoType
- `src/api/virtuosos/` — pattern for new Virtuoso implementations
- `src/workers/media.worker.ts` — reference for backend media pipeline design
- `src/hooks/useAnalysisState.ts` — extend for vector search integration
- `src/lib/conductor-functions.ts` — add schema validation layer

## Consciousness Alignment Check

- **Does this enhance human capability?** Yes — faster search, safer automation, better learning paths
- **Does it foster contemplation or create distraction?** Contemplation — reduces friction, lets users focus on creative work
- **Is the system transparent (glass-box)?** Yes — AST parsing and schema validation make AI outputs inspectable

✅ Gate 1 PASSED
