import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Agent</span>
      <h2>The Critic</h2>
      <div className="markdown-body">
        <p>The Critic is an adversarial quality gate that evaluates all Virtuoso output before delivery. It scores on three dimensions (Relevance, Factual Consistency, Quality) and can trigger correction loops.</p>
        <p><FileRef path="src/api/virtuosos/critic.ts" /></p>

        <h3>Evaluation Dimensions</h3>
        <PropTable rows={[
          { name: 'relevance', type: '0-10', desc: 'Does the output directly address the user\'s request?' },
          { name: 'factualConsistency', type: '0-10', desc: 'Are claims accurate and supported?' },
          { name: 'quality', type: '0-10', desc: 'Is the output well-structured, useful, and complete?' },
        ]} />
        <p>A score of <strong>7+</strong> on all three dimensions is a <strong>PASS</strong>. Below 7 on any dimension triggers correction.</p>

        <h3>API</h3>
        <CodeBlock code={`// Evaluate output quality
async function evaluateOutput(
  originalPrompt: string,
  virtuosoOutput: string,
  virtuosoType: string
): Promise<CriticEvaluation>

interface CriticEvaluation {
  passed: boolean;
  score: number;          // 0-100 composite
  relevance: number;      // 0-10
  factualConsistency: number;
  quality: number;
  feedback: string;
  specificIssues: string[];
  timestamp: string;
}

// Build correction prompt for retry
function buildCriticCorrectionPrompt(
  originalPrompt: string,
  evaluation: CriticEvaluation,
  virtuosoType: string
): string`} />

        <Callout type="warn">On Critic failure (e.g., network error), the system defaults to <strong>pass</strong> with a score of 50 to avoid blocking the user. This is a deliberate fail-open strategy.</Callout>
      </div>
    </div>
  );
}