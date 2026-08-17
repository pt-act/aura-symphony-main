import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Backend</span>
      <h2>Graph Knowledge Service</h2>
      <div className="markdown-body">
        <p>Express service using SQLite with recursive CTEs for concept relationship traversal. API-compatible with the Neo4j version — client code requires no changes when switching backends.</p>
        <p><FileRef path="backend/graph-knowledge/server-sqlite.js" /></p>

        <h3>Endpoints</h3>
        <PropTable rows={[
          { name: 'GET /concepts/:name/related', type: '?depth=2&userId', desc: 'Get related concepts via recursive CTE traversal (up to 50 results)' },
          { name: 'GET /learning-path', type: '?target&userId', desc: 'Find prerequisite gaps (mastery < 0.8, max 5 hops)' },
          { name: 'POST /relationships', type: 'JSON body', desc: 'Add concept relationship (auto-creates missing concepts)' },
          { name: 'POST /import/dlp', type: 'JSON body', desc: 'Batch import DLP data from Firestore' },
          { name: 'GET /users/:userId/concepts', type: '—', desc: 'Get all concepts for a user, sorted by mastery' },
          { name: 'GET /health', type: '—', desc: 'Health check with concept/relationship counts' },
        ]} />

        <h3>Schema</h3>
        <CodeBlock title="SQLite Schema" language="sql" code={`CREATE TABLE concepts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT 'default',
  mastery REAL DEFAULT 0,
  last_studied TEXT,
  source_videos TEXT DEFAULT '[]',
  UNIQUE(name, user_id)
);

CREATE TABLE relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER REFERENCES concepts(id) ON DELETE CASCADE,
  target_id INTEGER REFERENCES concepts(id) ON DELETE CASCADE,
  type TEXT NOT NULL,  -- RELATED_TO | PREREQUISITE_OF | MASTERED | STUDIED
  strength REAL DEFAULT 0.5,
  video_id TEXT,
  UNIQUE(source_id, target_id, type)
);`} />
      </div>
    </div>
  );
}