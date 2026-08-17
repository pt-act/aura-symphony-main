import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Advanced</span>
      <h2>Bayesian Knowledge Tracing</h2>
      <div className="markdown-body">
        <p>Full BKT implementation with 4 parameters per knowledge component: <code>p(L₀)</code> initial mastery, <code>p(T)</code> transition, <code>p(G)</code> guess, <code>p(S)</code> slip. Extensions include temporal decay, prerequisite-aware scaling, and confidence intervals.</p>
        <p><FileRef path="src/lib/knowledge-tracing.ts" /></p>
        <CodeBlock code={`BKT Parameters (per concept):
  p(L₀) = 0.1   // initial probability of mastery
  p(T)  = 0.2   // probability of learning per opportunity
  p(G)  = 0.25  // probability of correct guess
  p(S)  = 0.1   // probability of slip

Extensions:
  - Exponential temporal decay (14-day half-life)
  - Prerequisite-aware transit scaling
  - Agresti-Coull confidence intervals
  - Adaptive content selection engine (4 recommendation reasons)`} />
      </div>
    </div>
  );
}