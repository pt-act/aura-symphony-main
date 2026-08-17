import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Operations</span>
      <h2>Testing Strategy</h2>
      <div className="markdown-body">
        <h3>Test Files (438 tests across 20 files)</h3>
        <PropTable rows={[
          { name: 'src/api/client.test.ts', type: 'Vitest', desc: 'API client factory, provider resolution, connection testing' },
          { name: 'src/lib/conductor-validator.test.ts', type: 'Vitest', desc: 'Zod schema validation: valid calls, invalid args, hallucinated functions, correction prompts' },
          { name: 'src/lib/conductor-schemas.test.ts', type: 'Vitest', desc: 'All 18 schemas: valid/invalid/edge cases, .strict() enforcement, property-based testing' },
          { name: 'src/lib/provider-config.test.ts', type: 'Vitest', desc: 'Provider CRUD, localStorage persistence, active provider resolution' },
          { name: 'src/lib/valhalla-analyzer.test.ts', type: 'Vitest', desc: 'Script safety: infinite loops, dangerous imports, destructive calls, system escapes, network ops' },
          { name: 'src/lib/vector-search.test.ts', type: 'Vitest', desc: 'Adaptive semantic chunking, frame description chunking' },
          { name: 'src/lib/symphonyBus.test.ts', type: 'Vitest', desc: 'Event dispatch, listen/unlisten, commission, reportResult, chainCommission' },
          { name: 'src/lib/telemetry.test.ts', type: 'Vitest', desc: 'Log sinks, timer utility, all 6 log functions' },
          { name: 'src/lib/lens-handlers/registry.test.ts', type: 'Vitest', desc: 'Handler resolution, fallback, runtime registration' },
          { name: 'src/api/proxy-client.test.ts', type: 'Vitest', desc: 'Proxy detection when unconfigured' },
          { name: 'src/__tests__/semantic-chunker.test.ts', type: 'Vitest', desc: 'Adaptive chunking pipeline, FNV-1a embedding, break detection' },
          { name: 'src/__tests__/knowledge-tracing.test.ts', type: 'Vitest', desc: 'BKT update, temporal decay, prerequisite scaling, content selection' },
          { name: 'src/__tests__/react-planner.test.ts', type: 'Vitest', desc: 'Complex query detection, ReAct loop, plan generation' },
          { name: 'src/__tests__/worker-pool.test.ts', type: 'Vitest', desc: 'Worker pool lifecycle, work-stealing, batch submission' },
          { name: 'src/__tests__/crdt-collaboration.test.ts', type: 'Vitest', desc: 'CRDT sessions, shared types, change events, state export/import' },
          { name: 'src/__tests__/valhalla-sandbox.test.ts', type: 'Vitest', desc: 'Pyodide safety rejection, sandbox state machine' },
          { name: 'src/__tests__/clip-embeddings.test.ts', type: 'Vitest', desc: 'Fusion search scoring, result merging' },
          { name: 'src/__tests__/plugin-marketplace.test.ts', type: 'Vitest', desc: 'Search, filtering, installation, sandboxing, integrity verification' },
          { name: 'src/__tests__/federated-learning.test.ts', type: 'Vitest', desc: 'Differential privacy, gradient clipping, FedAvg aggregation, MLE' },
          { name: 'src/__tests__/offline-sync.test.ts', type: 'Vitest', desc: 'Queue operations, sync execution, cache management' },
        ]} />
        <p><em>Plus 3 backend test files and 1 E2E Playwright spec.</em></p>

        <h3>Running Tests</h3>
        <CodeBlock language="bash" code={`# Frontend unit tests
npm test

# Python backend tests
cd backend/vector-search && python -m pytest test_server.py -v

# E2E tests (requires running dev server)
npx playwright test`} />
      </div>
    </div>
  );
}