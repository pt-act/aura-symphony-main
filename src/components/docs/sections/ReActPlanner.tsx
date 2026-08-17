import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Advanced</span>
      <h2>ReAct Hierarchical Planner</h2>
      <div className="markdown-body">
        <p>Reason + Act loop for complex multi-step queries. The Conductor detects complexity via <code>isComplexQuery()</code> heuristic and routes to a ReAct loop instead of single-pass dispatch.</p>
        <p><FileRef path="src/lib/react-planner.ts" /></p>
        <CodeBlock code={`ReAct Loop:
  THINK → PLAN → ACT → OBSERVE → ADAPT (repeat)

  isComplexQuery(query): boolean  // heuristic routing
  generatePlan(query, context): Plan  // JSON-mode LLM response
  executeStep(step): StepResult  // executeValidatedCall
  adaptPlan(plan, observation): Plan  // replanning on failure

Bounds: MAX_ITERATIONS=6, MAX_ACTIONS=8
Simple queries → existing single-pass dispatcher`} />
      </div>
    </div>
  );
}