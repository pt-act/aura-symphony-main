import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Data</span>
      <h2>Graph Data Model</h2>
      <div className="markdown-body">
        <p>The knowledge graph models concept relationships for the Digital Learner Profile.</p>
        <CodeBlock code={`interface ConceptNode {
  id: string;
  name: string;
  mastery: number;        // 0-1
  lastStudied: string;    // ISO timestamp
  sourceVideos: string[]; // Video IDs
}

interface ConceptRelationship {
  source: string;         // Concept name
  target: string;
  type: 'RELATED_TO' | 'PREREQUISITE_OF' | 'MASTERED' | 'STUDIED' | 'APPEARS_IN';
  strength: number;       // 0-1
  videoId?: string;
}

interface LearningPath {
  concepts: ConceptNode[];
  gaps: ConceptNode[];              // Prerequisites not yet mastered
  recommendedVideos: Array<{
    videoId: string; concept: string; reason: string;
  }>;
}`} />
      </div>
    </div>
  );
}