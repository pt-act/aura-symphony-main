import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Hook</span>
      <h2>useKnowledgeTracing</h2>
      <div className="markdown-body">
        <p>React hook wrapping the Bayesian Knowledge Tracing engine. Persists BKT state to <code>localStorage</code>, provides adaptive content recommendations, and migrates from flat DLP mastery scores.</p>
        <p><FileRef path="src/hooks/useKnowledgeTracing.ts" /> · <FileRef path="src/lib/knowledge-tracing.ts" /></p>
        <CodeBlock code={`const { updateMastery, getRecommendations, bktState } = useKnowledgeTracing(userId);

// updateMastery(concept, correct, prerequisites?)
// getRecommendations(count?) → ContentRecommendation[]
//   reasons: 'low-mastery' | 'high-uncertainty' | 'prerequisite-gap' | 'decay'`} />
      </div>
    </div>
  );
}