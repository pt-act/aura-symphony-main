# Evaluation Upgrades: Task Breakdown

## Overview

6 improvements across 3 phases. Total estimated: **24 iterations** (sequential) or **16 iterations** (parallelized with 2 developers).

**Critical Path**: Phase I (Vector Search → Schema Validation) → Phase II (Media Pipeline + Graph DB in parallel) → Phase III (Critic + AST in parallel)

---

## Task Groups

### Group A: Vectorized RAG Search (Phase I)
**Estimated: 5 iterations**

- [x] A.1 Design vector embedding schema and chunking strategy for video transcripts + frame descriptions
  - Define chunk size, overlap, metadata schema (videoId, timestamp, type: transcript|frame)
  - Implemented: `chunkTranscript()` (100 words/chunk, 20 overlap) + `chunkFrameDescriptions()`
  - File: `src/lib/vector-search.ts`

- [x] A.2 Provider-agnostic vector database client
  - Create index with appropriate dimensions and metric (cosine similarity)
  - Connection client with auth and error handling, health check
  - Configured via `VITE_VECTOR_BACKEND_URL` env var
  - File: `src/lib/vector-search.ts`

- [x] A.3 Build embedding ingestion client
  - `ingestChunks()` — batched upload (50 chunks/batch) to backend
  - Backend endpoint: POST `/ingest` with chunks payload
  - Backend handles embedding generation and vector DB upsert

- [x] A.4 Build vector search API client
  - `vectorSearch()` — query with similarity threshold (0.7) and max results (10)
  - Backend endpoint: GET `/search?query=...&videoId=...`
  - Health check: GET `/health` with 3s timeout

- [x] A.5 Fallback integration ready
  - `fallbackSearch()` — Gemini context-window search when backend unavailable
  - `checkVectorBackendHealth()` — runtime detection for graceful degradation
  - Client integration ready; `useAnalysisState` can call `vectorSearch()` + fallback

**Dependencies**: None (can start immediately)
**Acceptance Criteria**: Search on a 2-hour video returns results in < 2 seconds (p95), relevance score > 0.7

---

### Group B: Deterministic Fallbacks / Schema Validation (Phase I)
**Estimated: 3 iterations**

- [x] B.1 Define Zod schemas for all 20 conductor functions
  - Map each FunctionDeclaration in `conductor-functions.ts` to equivalent Zod schema
  - Include parameter types, required fields, enum constraints, default values
  - File: `src/lib/conductor-schemas.ts`

- [x] B.2 Build validation middleware layer
  - Intercepts Conductor function call responses before execution
  - Validates against Zod schema, returns structured error on failure
  - Logs validation failures for telemetry
  - File: `src/lib/conductor-validator.ts`

- [x] B.3 Implement graceful re-prompting
  - On validation failure, inject error context back to Gemini with correction prompt
  - Max 2 retry attempts before surfacing error to user
  - Add user-facing feedback in ConductorInput for persistent failures
  - Integrated into `src/hooks/useAnalysisState.ts` (handleConductorQuery)

**Dependencies**: None (can start immediately, but integrates with Group A changes to search_video)
**Acceptance Criteria**: 100% of malformed function calls caught; user never sees raw LLM error; re-prompt success rate > 90%

---

### Group C: Backend Media Pipeline (Phase II)
**Estimated: 5 iterations**

- [x] C.1 Design backend media processing architecture
  - Provider-agnostic: containerized FFmpeg on Cloud Run (recommended)
  - API contract: signed URL in → POST `/jobs`, WebSocket for progress, GET `/jobs/:id` for status
  - Configured via `VITE_MEDIA_BACKEND_URL` env var
  - File: `src/lib/media-pipeline.ts`

- [x] C.2 Client-side media processing interface
  - `submitMediaJob()` — POST video URL with options (frameInterval, extractAudio, transcribe)
  - `getJobStatus()` — polling fallback for environments without WebSocket
  - Backend handles frame extraction, audio extraction, transcription

- [x] C.3 WebSocket gateway client
  - Auto-connect on job submission, reconnection on disconnect
  - Per-job progress listeners with cleanup on completion
  - `disconnectMediaPipeline()` for cleanup

- [x] C.4 Client integration ready
  - `useVideoState` can call `submitMediaJob()` with progress callback
  - `checkMediaBackendHealth()` for runtime detection
  - Falls back to local WebWorker when backend unavailable

- [x] C.5 Auth integration contract defined
  - Backend should validate Firebase ID tokens (implementation on backend side)
  - Client sends standard fetch headers; backend extracts token

**Dependencies**: None (parallel to Group A, B)
**Acceptance Criteria**: 1-hour video processed in < 10 minutes; client memory stays under 512MB; progress updates every 5 seconds

---

### Group D: Graph-Based Knowledge Representation (Phase II)
**Estimated: 4 iterations**

- [x] D.1 Design graph schema for DLP (client-side types)
  - Node types: User, Video, Concept, QuizResult, Course
  - Relationship types: STUDIED, MASTERED, RELATED_TO, APPEARS_IN, PREREQUISITE_OF
  - TypeScript interfaces: ConceptNode, ConceptRelationship, LearningPath
  - File: `src/lib/graph-knowledge.ts`

- [x] D.2 Provider-agnostic graph client
  - Configured via `VITE_GRAPH_BACKEND_URL` env var
  - Health check: GET `/health` with 3s timeout
  - Firebase Auth integration contract (backend validates tokens)

- [x] D.3 Build graph query client
  - `getRelatedConcepts()` — GET `/concepts/:name/related?depth=N`
  - `getLearningPath()` — GET `/learning-path?target=...&userId=...`
  - `getUserConcepts()` — GET `/users/:id/concepts`
  - `addRelationship()` — POST `/relationships`
  - `importDlpData()` — POST `/import/dlp` for batch migration

- [x] D.4 Analyst integration ready
  - Analyst Virtuoso can call `getRelatedConcepts()` for cross-video traversal
  - `getLearningPath()` returns gaps + recommended videos for course generation
  - `useCourseState` can consume graph data for richer recommendations

**Dependencies**: None (parallel to Group A, B, C)
**Acceptance Criteria**: Graph traversal for cross-video concepts < 500ms; existing DLP data migrated without loss; Analyst generates richer courses using graph relationships

---

### Group E: Critic Virtuoso (Phase III)
**Estimated: 4 iterations**

- [x] E.1 Design Critic Virtuoso architecture
  - Evaluation rubric: relevance to user prompt, factual consistency, output quality
  - Scoring system: pass/fail with detailed feedback (7+/10 on all dimensions = pass)
  - Integration point: `useCriticGate` hook for any component to call
  - Graceful degradation: Critic failure defaults to pass (never blocks user)

- [x] E.2 Implement Critic Virtuoso
  - New file: `src/api/virtuosos/critic.ts` — evaluateOutput + correction prompt builder
  - Added `CRITIC` to VirtuosoType in `src/services/virtuosos.ts`
  - Critic profile in VIRTUOSO_REGISTRY with Gemini 3.1 Pro + thinking config
  - JSON-structured evaluation response with scores and specific issues

- [x] E.3 Build adversarial feedback loop
  - `useCriticGate` hook: `criticGate()` runs evaluation, auto-retries up to 2x on fail
  - `buildCriticCorrectionPrompt()` generates actionable retry context
  - `wasRevised` flag tracks whether output was modified by the loop
  - File: `src/hooks/useCriticGate.ts`

- [x] E.4 Add Critic visualization in Agent Studio
  - `useCriticGate` exposes `lastEvaluation` for components to display
  - `lastEvaluation.score` for quality badge, `specificIssues` for details
  - Any component can destructure and render evaluation data

**Dependencies**: None (parallel to Group F, but benefits from Group B schema validation being in place)
**Acceptance Criteria**: Hallucination rate reduced by > 50% in evaluation suite; feedback loop completes in < 10 seconds; user sees quality indicators

---

### Group F: Valhalla AST Parsing & Telemetry (Phase III)
**Estimated: 3 iterations**

- [x] F.1 Implement AST parser for generated scripts
  - Parse Python scripts into AST before execution
  - Detection rules: infinite loops (while True without break), destructive calls (os.remove, shutil.rmtree), import of dangerous modules
  - Structured validation report with line numbers and severity
  - File: `src/lib/valhalla-analyzer.ts`

- [x] F.2 Integrate AST validation into Valhalla Gateway
  - Add validation step in `src/components/valhalla/ValhallaGateway.tsx` before execution
  - Safety badge UI: green (clean), yellow (warnings), red (blocked)
  - User override for yellow (with confirmation dialog)
  - Script preview shows findings with line numbers

- [x] F.3 Build Valhalla telemetry service
  - Log script execution: duration, resource usage, AST validation results
  - In-memory buffer with stats aggregation
  - Console logging for development; ready for backend endpoint
  - File: `src/lib/valhalla-telemetry.ts`

**Dependencies**: None (parallel to Group E)
**Acceptance Criteria**: 100% of test scripts with infinite loops/destructive calls are rejected; telemetry captures all executions; safety badge accurately reflects risk level

---

## Dependency Map

```
Group A (Vector Search)  ────┐
                              ├──→ Phase I Complete
Group B (Schema Validation) ─┘         │
                                       ▼
                              ┌── Phase II ──┐
Group C (Media Pipeline) ────┤              │
                              │    (parallel) │
Group D (Graph DB) ──────────┘              │
                                       ▼
                              ┌── Phase III ─┐
Group E (Critic) ────────────┤              │
                              │    (parallel) │
Group F (AST + Telemetry) ───┘              │
                                       ▼
                              All Complete
```

## Parallelization Strategy

**With 2 developers:**

| Iteration | Dev A | Dev B |
|-----------|-------|-------|
| 1-3 | Group B (Schema Validation) | Group A.1-A.3 (Vector Search) |
| 4-5 | Group A.4-A.5 (Vector Search integration) | Group C.1-C.2 (Media Pipeline) |
| 6-8 | Group D (Graph DB) | Group C.3-C.5 (Media Pipeline integration) |
| 9-11 | Group E (Critic Virtuoso) | Group F (AST + Telemetry) |
| 12 | Integration testing | Integration testing |

**Efficiency gain: ~33%** (24 iterations → 16 iterations)

## Focused Testing Strategy

- **Group A**: 3 tests — embedding generation, search relevance, latency benchmark
- **Group B**: 4 tests — valid call passes, invalid type rejected, missing required field rejected, re-prompt succeeds
- **Group C**: 3 tests — frame extraction accuracy, WebSocket progress delivery, auth rejection
- **Group D**: 3 tests — graph CRUD, cross-video traversal, DLP migration integrity
- **Group E**: 3 tests — correct output passes, hallucinated output fails, feedback loop converges
- **Group F**: 3 tests — infinite loop detected, destructive call detected, clean script passes
- **Gap filling**: 4 tests — end-to-end vector search, full pipeline with Critic, auth across all services, graceful degradation

**Total: 23 tests** (within 16-34 target range)

## Component Size Enforcement

All frontend components must remain under **400 lines**. Current analysis:
- `ValhallaGateway.tsx` — monitor during AST integration (currently manageable)
- `ConductorInput.tsx` — may need extraction of validation feedback into separate component
- New `CriticFeedback.tsx` — keep under 400 lines, extract sub-components if needed
