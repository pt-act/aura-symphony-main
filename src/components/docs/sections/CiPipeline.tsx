import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Operations</span>
      <h2>CI/CD Pipeline</h2>
      <div className="markdown-body">
        <p><FileRef path=".github/workflows/ci.yml" /></p>

        <h3>Pipeline Jobs</h3>
        <PropTable rows={[
          { name: 'frontend-tests', type: 'ubuntu-latest', desc: 'Vitest unit tests + TypeScript type check (Node 22)' },
          { name: 'vector-search-tests', type: 'ubuntu-latest', desc: 'pytest for Python vector search service (Python 3.12)' },
          { name: 'backend-integration-tests', type: 'ubuntu-latest', desc: 'Starts media pipeline + graph knowledge, runs health checks + Vitest' },
          { name: 'build', type: 'ubuntu-latest', desc: 'Production build (depends on frontend-tests). Checks dist/ output.' },
          { name: 'lint-python', type: 'ubuntu-latest', desc: 'Ruff linter + format check on Python backend' },
        ]} />

        <h3>Triggers</h3>
        <ul>
          <li><strong>Push</strong> to <code>main</code> or <code>develop</code></li>
          <li><strong>Pull requests</strong> targeting <code>main</code></li>
        </ul>
      </div>
    </div>
  );
}