/**
 * Aura Graph Knowledge Service (SQLite fallback)
 *
 * When Neo4j is unavailable, this service uses SQLite with recursive CTEs
 * for concept relationship traversal. API-compatible with the Neo4j version.
 *
 * Endpoints match the Neo4j service exactly — client code needs no changes.
 */

import express from 'express';
import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';

const PORT = parseInt(process.env.PORT || '4004');
const DB_PATH = process.env.DB_PATH || join(process.cwd(), 'data', 'graph.db');

// Ensure data directory exists
mkdirSync(dirname(DB_PATH), { recursive: true });

// ─── Database Setup ────────────────────────────────────────────────

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS concepts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    user_id TEXT NOT NULL DEFAULT 'default',
    mastery REAL DEFAULT 0,
    last_studied TEXT,
    source_videos TEXT DEFAULT '[]',
    UNIQUE(name, user_id)
  );

  CREATE TABLE IF NOT EXISTS relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    strength REAL DEFAULT 0.5,
    video_id TEXT,
    FOREIGN KEY (source_id) REFERENCES concepts(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES concepts(id) ON DELETE CASCADE,
    UNIQUE(source_id, target_id, type)
  );

  CREATE INDEX IF NOT EXISTS idx_concepts_user ON concepts(user_id);
  CREATE INDEX IF NOT EXISTS idx_concepts_name ON concepts(name);
  CREATE INDEX IF NOT EXISTS idx_rel_source ON relationships(source_id);
  CREATE INDEX IF NOT EXISTS idx_rel_target ON relationships(target_id);
`);

// ─── Prepared Statements ───────────────────────────────────────────

const stmts = {
  getConcept: db.prepare('SELECT * FROM concepts WHERE name = ? AND user_id = ?'),
  upsertConcept: db.prepare(`
    INSERT INTO concepts (name, user_id, mastery, last_studied)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(name, user_id) DO UPDATE SET mastery = ?, last_studied = ?
  `),
  getUserConcepts: db.prepare('SELECT * FROM concepts WHERE user_id = ? ORDER BY mastery DESC'),
  getConceptId: db.prepare('SELECT id FROM concepts WHERE name = ? AND user_id = ?'),
  insertRelationship: db.prepare(`
    INSERT OR REPLACE INTO relationships (source_id, target_id, type, strength, video_id)
    VALUES (?, ?, ?, ?, ?)
  `),
  getConceptCount: db.prepare('SELECT COUNT(*) as count FROM concepts'),
  getRelCount: db.prepare('SELECT COUNT(*) as count FROM relationships'),
  // Recursive CTE for graph traversal
  getRelated: db.prepare(`
    WITH RECURSIVE related(name, mastery, last_studied, distance, path) AS (
      SELECT c.name, c.mastery, c.last_studied, 0, ',' || c.name || ','
      FROM concepts c
      WHERE c.name = ? AND c.user_id = ?
      UNION
      SELECT c2.name, c2.mastery, c2.last_studied, r.distance + 1, r.path || c2.name || ','
      FROM related r
      JOIN concepts c1 ON c1.name = r.name AND c1.user_id = ?
      JOIN relationships rel ON rel.source_id = c1.id OR rel.target_id = c1.id
      JOIN concepts c2 ON (c2.id = rel.target_id OR c2.id = rel.source_id) AND c2.id != c1.id AND c2.user_id = ?
      WHERE r.distance < ? AND r.path NOT LIKE '%,' || c2.name || ',%'
    )
    SELECT DISTINCT name, mastery, last_studied, distance
    FROM related
    WHERE distance > 0
    ORDER BY distance, mastery DESC
    LIMIT 50
  `),
  // Learning path: find prerequisites not yet mastered
  getLearningPath: db.prepare(`
    WITH RECURSIVE prereqs(name, mastery, depth, path) AS (
      SELECT c.name, c.mastery, 0, ',' || c.name || ','
      FROM concepts c
      JOIN relationships rel ON rel.target_id = c.id
      JOIN concepts src ON src.id = rel.source_id AND src.user_id = ?
      WHERE c.name = ? AND c.user_id = ? AND rel.type = 'PREREQUISITE_OF'
      UNION
      SELECT c2.name, c2.mastery, p.depth + 1, p.path || c2.name || ','
      FROM prereqs p
      JOIN concepts c1 ON c1.name = p.name AND c1.user_id = ?
      JOIN relationships rel ON rel.target_id = c1.id AND rel.type = 'PREREQUISITE_OF'
      JOIN concepts c2 ON c2.id = rel.source_id AND c2.user_id = ?
      WHERE p.depth < 5 AND p.path NOT LIKE '%,' || c2.name || ',%'
    )
    SELECT name, mastery, depth FROM prereqs WHERE mastery < 0.8
    ORDER BY depth DESC
  `),
  getRelationships: db.prepare(`
    SELECT c1.name as source, c2.name as target, r.type, r.strength
    FROM relationships r
    JOIN concepts c1 ON c1.id = r.source_id
    JOIN concepts c2 ON c2.id = r.target_id
    WHERE c1.name IN (SELECT value FROM json_each(?)) AND c2.name IN (SELECT value FROM json_each(?))
    AND c1.user_id = ? AND c2.user_id = ?
  `),
};

// ─── Express App ───────────────────────────────────────────────────

const app = express();
app.use(express.json());

// CORS
import { corsMiddleware } from '../shared/cors.js';
app.use(corsMiddleware());

app.get('/health', (req, res) => {
  try {
    const concepts = stmts.getConceptCount.get();
    const rels = stmts.getRelCount.get();
    res.json({ status: 'ok', backend: 'sqlite', concepts: concepts.count, relationships: rels.count });
  } catch (e) {
    res.status(503).json({ status: 'error', error: e.message });
  }
});

// Get related concepts
app.get('/concepts/:name/related', (req, res) => {
  const conceptName = req.params.name;
  const depth = parseInt(req.query.depth || '2');
  const userId = req.query.userId || 'default';
  const start = Date.now();

  try {
    const records = stmts.getRelated.all(conceptName, userId, userId, userId, depth);

    const nodes = records.map(r => ({
      id: r.name,
      name: r.name,
      mastery: r.mastery || 0,
      lastStudied: r.last_studied || '',
      sourceVideos: [],
    }));

    const nodeNames = nodes.map(n => n.name);
    const relationships = nodeNames.length > 0
      ? stmts.getRelationships.all(JSON.stringify(nodeNames), JSON.stringify(nodeNames), userId, userId).map(r => ({
          source: r.source,
          target: r.target,
          type: r.type,
          strength: r.strength,
        }))
      : [];

    res.json({ nodes, relationships, queryTimeMs: Date.now() - start });
  } catch (e) {
    console.error('[Graph] Related concepts error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Get learning path
app.get('/learning-path', (req, res) => {
  const target = req.query.target;
  const userId = req.query.userId || 'default';
  if (!target) return res.status(400).json({ error: 'target is required' });

  try {
    const records = stmts.getLearningPath.all(userId, target, userId, userId, userId);
    const gaps = records.map(r => ({
      id: r.name,
      name: r.name,
      mastery: r.mastery || 0,
      lastStudied: '',
      sourceVideos: [],
    }));
    res.json({ concepts: [], gaps, recommendedVideos: [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add relationship
app.post('/relationships', (req, res) => {
  const { source, target, type, strength, videoId, userId } = req.body;
  if (!source || !target || !type) return res.status(400).json({ error: 'source, target, type required' });

  const uid = userId || 'default';
  try {
    // Ensure both concepts exist
    const ensureConcept = (name) => {
      const existing = stmts.getConcept.get(name, uid);
      if (!existing) stmts.upsertConcept.run(name, uid, 0, null, 0, null);
    };
    ensureConcept(source);
    ensureConcept(target);

    const src = stmts.getConceptId.get(source, uid);
    const tgt = stmts.getConceptId.get(target, uid);
    stmts.insertRelationship.run(src.id, tgt.id, type, strength || 0.5, videoId || null);

    res.status(201).json({ status: 'created' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Import DLP
app.post('/import/dlp', (req, res) => {
  const { concepts, userId } = req.body;
  if (!concepts || !userId) return res.status(400).json({ error: 'concepts and userId required' });

  let imported = 0, errors = 0;
  for (const c of concepts) {
    try {
      stmts.upsertConcept.run(c.name, userId, c.mastery || 0, c.lastStudied || new Date().toISOString(), c.mastery || 0, c.lastStudied);
      imported++;
    } catch (e) { errors++; }
  }
  res.json({ imported, errors });
});

// Get user concepts
app.get('/users/:userId/concepts', (req, res) => {
  try {
    const records = stmts.getUserConcepts.all(req.params.userId);
    res.json(records.map(r => ({
      id: r.name,
      name: r.name,
      mastery: r.mastery,
      lastStudied: r.last_studied || '',
      sourceVideos: JSON.parse(r.source_videos || '[]'),
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Stats
app.get('/stats', (req, res) => {
  const concepts = stmts.getConceptCount.get();
  const rels = stmts.getRelCount.get();
  res.json({ concepts: concepts.count, relationships: rels.count });
});

app.listen(PORT, () => {
  console.log(`[Graph Knowledge] SQLite fallback on :${PORT}`);
  console.log(`[Graph Knowledge] DB: ${DB_PATH}`);
});
