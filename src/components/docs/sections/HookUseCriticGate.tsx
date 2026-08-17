import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Hook</span>
      <h2>useCriticGate</h2>
      <div className="markdown-body">
        <p>Provides a reusable quality gate for any Virtuoso output. Runs the Critic evaluation and optionally triggers retry loops with correction prompts.</p>
        <p><FileRef path="src/hooks/useCriticGate.ts" /></p>
        <CodeBlock code={`const { criticGate, lastEvaluation, isEvaluating } = useCriticGate();

const result = await criticGate(
  userPrompt,         // Original user request
  virtuosoOutput,     // Output to evaluate
  'Analyst',          // Which Virtuoso produced it
  retryFn?            // Optional: (correctionPrompt) => Promise<string>
);

// result: { output, evaluation, wasRevised }`} />
        <p>Max retries: <strong>2</strong>. If the Critic still fails after retries, the last output is returned anyway.</p>
      </div>
    </div>
  );
}