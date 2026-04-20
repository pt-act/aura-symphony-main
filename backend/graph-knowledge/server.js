/**
 * Aura Graph Knowledge Service
 *
 * Neo4j-backed service for managing the Digital Learner Profile (DLP)
 * and cross-video concept relationships.
 *
 * Endpoints:
 *   GET  /concepts/:name/related          — Get related concepts (graph traversal)
 *   GET  /learning-path                   — Get learning path to a target concept
 *   POST /relationships                   — Add a concept relationship
 *   POST /import/dlp                      — Import flat DLP data into graph
 *   GET  /users/:userId/concepts          — Get all concepts for a user
 *   GET  /health                          — Service health check
 */

import express from 'express';
import neo4j from 'neo4j-driver';

const PORT = parseInt(process.env.PORT || '3004');
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'aura-symphony';

// ─── Neo4j Driver ─────────────────────────────────────────────────

const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
  { disableLosslessIntegers: true },
);

async function runQuery(cypher, params = {}) {
  const session = driver.session();
  try {
    const result = await session.run(cypher, params);
    return result.records;
  } finally {
    await session.close();
  }
}

// ─── Schema Initialization ─────────────────────────────────────────

async function initSchema() {
  await runQuery(`
    CREATE CONSTRAINT concept_name_unique IF NOT EXISTS
    FOR (c:Concept) REQUIRE c.name IS UNIQUE
  `);
  await runQuery(`
    CREATE INDEX concept_user_idx IF NOT EXISTS
    FOR (c:Concept) ON (c.userId)
  `);
  console.log('[Graph Knowledge] Schema initialized');
}

// ─── Express App ───────────────────────────────────────────────────

const app = express();
app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
  try {
    await runQuery('RETURN 1 AS ok');
    res.json({ status: 'ok', neo4j: 'connected' });
  } catch (e) {
    res.status(503).json({ status: 'error', neo4j: e.message });
  }
});

// Get related concepts (graph traversal)
app.get('/concepts/:name/related', async (req, res) => {
  const conceptName = req.params.name;
  const depth = parseInt(req.query.depth || '2');
  const userId = req.query.userId;

  const start = Date.now();

  try {
    let cypher = `
      MATCH path = (c:Concept {name: $name})-[:RELATED_TO|PREREQUISITE_OF*1..${depth}]-(related:Concept)
    `;
    const params = { name: conceptName };

    if (userId) {
      cypher += ` WHERE c.userId = $userId AND related.userId = $userId `;
      params.userId = userId;
    }

    cypher += `
      RETURN DISTINCT related.name AS name, related.mastery AS mastery,
             related.lastStudied AS lastStudied,
             length(path) AS distance
      ORDER BY distance, related.mastery DESC
      LIMIT 50
    `;

    const records = await runQuery(cypher, params);

    const nodes = records.map(r => ({
      id: r.get('name'),
      name: r.get('name'),
      mastery: r.get('mastery') || 0,
      lastStudied: r.get('lastStudied') || '',
      sourceVideos: [],
    }));

    // Get relationships between these concepts
    const nodeNames = nodes.map(n => n.name);
    let relCypher = `
      MATCH (a:Concept)-[r:RELATED_TO|PREREQUISITE_OF]->(b:Concept)
      WHERE a.name IN $names AND b.name IN $names
    `;
    const relParams = { names: nodeNames };
    if (userId) {
      relCypher += ` AND a.userId = $userId AND b.userId = $userId `;
      relParams.userId = userId;
    }
    relCypher += ` RETURN a.name AS source, b.name AS target, type(r) AS type, r.strength AS strength `;

    const relRecords = await runQuery(relCypher, relParams);
    const relationships = relRecords.map(r => ({
      source: r.get('source'),
      target: r.get('target'),
      type: r.get('type'),
      strength: r.get('strength') || 0.5,
    }));

    res.json({
      nodes,
      relationships,
      queryTimeMs: Date.now() - start,
    });
  } catch (e) {
    console.error('[Graph] Related concepts error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Get learning path
app.get('/learning-path', async (req, res) => {
  const targetConcept = req.query.target;
  const userId = req.query.userId;

  if (!targetConcept || !userId) {
    return res.status(400).json({ error: 'target and userId are required' });
  }

  try {
    // Find prerequisites not yet mastered
    const records = await runQuery(`
      MATCH path = (prereq:Concept)-[:PREREQUISITE_OF*1..5]->(target:Concept {name: $target, userId: $userId})
      WHERE prereq.userId = $userId AND prereq.mastery < 0.8
      RETURN prereq.name AS name, prereq.mastery AS mastery,
             prereq.lastStudied AS lastStudied,
             length(path) AS depth
      ORDER BY depth DESC
    `, { target: targetConcept, userId });

    const gaps = records.map(r => ({
      id: r.get('name'),
      name: r.get('name'),
      mastery: r.get('mastery') || 0,
      lastStudied: r.get('lastStudied') || '',
      sourceVideos: [],
    }));

    res.json({
      concepts: [],
      gaps,
      recommendedVideos: [],
    });
  } catch (e) {
    console.error('[Graph] Learning path error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Add a concept relationship
app.post('/relationships', async (req, res) => {
  const { source, target, type, strength, videoId, userId } = req.body;

  if (!source || !target || !type) {
    return res.status(400).json({ error: 'source, target, and type are required' });
  }

  try {
    await runQuery(`
      MERGE (a:Concept {name: $source, userId: $userId})
      MERGE (b:Concept {name: $target, userId: $userId})
      MERGE (a)-[r:${type}]->(b)
      SET r.strength = $strength,
          r.videoId = $videoId
    `, {
      source,
      target,
      strength: strength || 0.5,
      videoId: videoId || null,
      userId: userId || 'default',
    });

    res.status(201).json({ status: 'created' });
  } catch (e) {
    console.error('[Graph] Add relationship error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Import flat DLP data
app.post('/import/dlp', async (req, res) => {
  const { concepts, userId } = req.body;

  if (!concepts || !userId) {
    return res.status(400).json({ error: 'concepts and userId are required' });
  }

  let imported = 0;
  let errors = 0;

  for (const concept of concepts) {
    try {
      await runQuery(`
        MERGE (c:Concept {name: $name, userId: $userId})
        SET c.mastery = $mastery,
            c.lastStudied = $lastStudied
      `, {
        name: concept.name,
        userId,
        mastery: concept.mastery || 0,
        lastStudied: concept.lastStudied || new Date().toISOString(),
      });
      imported++;
    } catch (e) {
      console.error(`[Graph] Import error for ${concept.name}:`, e);
      errors++;
    }
  }

  res.json({ imported, errors });
});

// Get user's concepts
app.get('/users/:userId/concepts', async (req, res) => {
  const { userId } = req.params;

  try {
    const records = await runQuery(`
      MATCH (c:Concept {userId: $userId})
      RETURN c.name AS name, c.mastery AS mastery, c.lastStudied AS lastStudied
      ORDER BY c.mastery DESC
    `, { userId });

    const concepts = records.map(r => ({
      id: r.get('name'),
      name: r.get('name'),
      mastery: r.get('mastery') || 0,
      lastStudied: r.get('lastStudied') || '',
      sourceVideos: [],
    }));

    res.json(concepts);
  } catch (e) {
    console.error('[Graph] User concepts error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Stats
app.get('/stats', async (req, res) => {
  try {
    const conceptCount = await runQuery('MATCH (c:Concept) RETURN count(c) AS count');
    const relCount = await runQuery('MATCH ()-[r]->() RETURN count(r) AS count');

    res.json({
      concepts: conceptCount[0]?.get('count') || 0,
      relationships: relCount[0]?.get('count') || 0,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Start ─────────────────────────────────────────────────────────

async function start() {
  try {
    await initSchema();
    app.listen(PORT, () => {
      console.log(`[Graph Knowledge] Listening on :${PORT}`);
      console.log(`[Graph Knowledge] Neo4j: ${NEO4J_URI}`);
    });
  } catch (e) {
    console.error('[Graph Knowledge] Failed to start:', e);
    process.exit(1);
  }
}

start();
