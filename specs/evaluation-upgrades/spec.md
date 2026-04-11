# Aura Symphony: Evaluation Upgrades Specification

## Goal
Transform Aura Symphony from a robust prototype into an enterprise-grade multi-agent media platform by implementing 6 strategic improvements identified in the architectural evaluation. These improvements address algorithmic efficiency, scalability bottlenecks, and advanced AI safety mechanisms.

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                 Client (React)                   │
│  Conductor ←→ SymphonyBus ←→ Virtuosos          │
│  Zod Validation Layer (NEW)                      │
│  Vector Search Client (NEW)                      │
└──────────────────┬──────────────────────────────┘
                   │ WebSocket + REST
┌──────────────────▼──────────────────────────────┐
│              Backend Services (NEW)              │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Vector   │  │ Media    │  │ Valhalla      │  │
│  │ Search   │  │ Pipeline │  │ Sandbox+AST   │  │
│  │ (RAG)    │  │ (FFmpeg) │  │               │  │
│  └────┬─────┘  └────┬─────┘  └───────┬───────┘  │
│       │              │                │          │
│  ┌────▼──────────────▼────────────────▼───────┐  │
│  │         Auth Layer (Firebase)              │  │
│  └────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│              Data Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Vector   │  │ Firestore│  │ Neo4j Graph   │  │
│  │ DB       │  │ (existing│  │ (DLP +        │  │
│  │ (Pinecone│  │ )        │  │  annotations) │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
└─────────────────────────────────────────────────┘
```

## User Stories

**US-1**: As a video editor, I want semantic search on my videos to return results in under 2 seconds regardless of video length, so I can quickly find relevant moments during pre-production.

**US-2**: As a user, I want the Conductor to never fail silently when it misunderstands my request, so I get clear feedback and the system self-corrects.

**US-3**: As a content creator, I want to process hour-long videos without my browser crashing, so I can work with professional-length media.

**US-4**: As a learner, I want the system to understand relationships between concepts across all the videos I've studied, so it can recommend relevant content I haven't seen.

**US-5**: As a user, I want generated courses and media outputs to be validated before delivery, so I receive high-quality results that match my intent.

**US-6**: As a developer using Valhalla, I want assurance that generated scripts won't contain infinite loops or destructive commands, so I can safely execute automation scripts.

## Specific Requirements

### Functional Requirements

| ID | Requirement | Phase |
|----|-------------|-------|
| FR-1 | Backend vector search service with multimodal embedding generation | I |
| FR-2 | Zod schema validation on all 20 conductor function calls | I |
| FR-3 | Graceful re-prompting when LLM returns invalid function call | I |
| FR-4 | Cloud media processing pipeline accepting signed video URLs | II |
| FR-5 | WebSocket push for async processing results to client | II |
| FR-6 | Neo4j graph model for Digital Learner Profile | II |
| FR-7 | Cross-video concept relationship queries via graph traversal | II |
| FR-8 | New Critic Virtuoso with output evaluation capability | III |
| FR-9 | Adversarial loop: Critic re-routes to originating Virtuoso on failure | III |
| FR-10 | AST parser for Valhalla-generated scripts | III |
| FR-11 | Telemetry collection for Valhalla script execution | III |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | Vector search latency (p95) | < 2 seconds |
| NFR-2 | Schema validation overhead | < 50ms per call |
| NFR-3 | Media processing throughput | 1 hour video in < 10 minutes |
| NFR-4 | Graph query latency | < 500ms for cross-video traversal |
| NFR-5 | Critic evaluation latency | < 3 seconds |
| NFR-6 | AST parse time | < 100ms per script |
| NFR-7 | Client memory usage during processing | < 512MB (down from unbounded) |
| NFR-8 | System availability | 99.5% uptime for backend services |

## Visual Design

No UI changes required for Phase I (validation is invisible to user; vector search changes backend only). Phase II and III may add:
- Processing progress indicator for cloud media pipeline
- Critic feedback visualization in Agent Studio
- Valhalla safety badge (green/yellow/red) on generated scripts

## Existing Code to Leverage

| Component | File | How to Reuse |
|-----------|------|-------------|
| SymphonyBus | `src/lib/symphonyBus.ts` | Add WebSocket transport layer, extend events for backend communication |
| Conductor Functions | `src/lib/conductor-functions.ts` | Wrap each FunctionDeclaration with Zod schema, add validation layer |
| Virtuoso Types | `src/services/virtuosos.ts` | Add `critic` to VirtuosoType enum |
| Virtuoso Implementations | `src/api/virtuosos/*.ts` | Pattern for new Critic Virtuoso |
| Media Worker | `src/workers/media.worker.ts` | Reference for backend pipeline design; client becomes thin proxy |
| Analysis State Hook | `src/hooks/useAnalysisState.ts` | Extend to integrate vector search results |
| Video State Hook | `src/hooks/useVideoState.ts` | Extend for WebSocket-based async processing |
| Conductor Input | `src/components/conductor/ConductorInput.tsx` | Add validation error feedback UX |
| Valhalla Gateway | `src/components/valhalla/ValhallaGateway.tsx` | Add AST validation step before execution |

## Out of Scope

- **Replacing Firebase Auth** — existing auth remains, backend services authenticate via Firebase tokens
- **Rewriting existing Virtuosos** — Critic is additive, existing agents unchanged
- **Mobile client** — desktop browser remains primary target
- **Real-time collaboration** — single-user sessions only for now
- **Replacing Gemini** — still the primary LLM, optimization is in retrieval not generation
- **Full NLE replacement** — Aura remains middleware for pre-production, not a video editor

## Quality Gates

- [ ] Consciousness Gate 1: Alignment validated ✅
- [ ] Schema validation catches 100% of malformed function calls
- [ ] Vector search returns relevant results (cosine similarity > 0.7)
- [ ] AST parser rejects all test cases with infinite loops and destructive calls
- [ ] Critic agent reduces hallucination rate by > 50% in evaluation suite
- [ ] All backend services have health checks and graceful degradation
