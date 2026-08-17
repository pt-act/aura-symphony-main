import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Advanced</span>
      <h2>Federated Learning</h2>
      <div className="markdown-body">
        <p>FedAvg protocol for BKT parameter optimization across clients with (ε, δ)-differential privacy. Enables the AI tutor to improve as more students use it while preserving individual privacy.</p>
        <p><FileRef path="src/lib/federated-learning.ts" /></p>
        <CodeBlock code={`Protocol:
  1. Clients train BKT parameters locally (grid search MLE)
  2. L2 gradient clipping for sensitivity bounding
  3. Gaussian noise injection (calibrated ε, δ)
  4. Weighted aggregation across heterogeneous clients
  5. User ID anonymization (one-way hash)

Privacy: (ε, δ)-differential privacy with analytic mechanism
Aggregation: FedAvg with per-client sample weighting`} />
      </div>
    </div>
  );
}