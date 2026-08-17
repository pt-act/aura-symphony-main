import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Learning</span>
      <h2>Digital Learner Profile</h2>
      <div className="markdown-body">
        <p>The DLP tracks per-concept mastery across all videos a user has studied. It powers adaptive content selection and learning path recommendations.</p>

        <CodeBlock code={`interface DigitalLearnerProfile {
  knowledgeGraph: {
    [concept: string]: {
      mastery: number;       // 0-1 (0 = unknown, 1 = mastered)
      lastUpdated: string;   // ISO timestamp
    };
  };
}`} />

        <h3>Storage Tiers</h3>
        <ul>
          <li><strong>Flat storage (default):</strong> Firestore document at <code>users/{'{'}userId{'}'}.digitalLearnerProfile</code></li>
          <li><strong>Graph storage (optional):</strong> Neo4j/SQLite backend with concept relationships and cross-video traversal</li>
        </ul>

        <h3>Mastery Update Logic</h3>
        <p>Quiz performance updates mastery scores. Correct answers increase mastery; incorrect answers decrease it. The DLP Monitor component (<FileRef path="src/components/analysis/DlpMonitor.tsx" />) visualizes the knowledge graph in real-time.</p>
      </div>
    </div>
  );
}