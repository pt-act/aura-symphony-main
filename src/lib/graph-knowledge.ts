/**
 * Graph Knowledge Service
 *
 * Client-side interface for the Neo4j graph database managing
 * the Digital Learner Profile (DLP) and cross-video concept relationships.
 *
 * Enables the Analyst Virtuoso to:
 * - Query concept relationships across all studied videos
 * - Identify prerequisite gaps in a learner's knowledge graph
 * - Generate personalized learning paths
 *
 * Falls back to flat Firestore DLP if backend unavailable.
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface ConceptNode {
  id: string;
  name: string;
  mastery: number; // 0-1
  lastStudied: string; // ISO timestamp
  sourceVideos: string[]; // video IDs where this concept appears
}

export interface ConceptRelationship {
  source: string; // concept name
  target: string; // concept name
  type: 'RELATED_TO' | 'PREREQUISITE_OF' | 'MASTERED' | 'STUDIED' | 'APPEARS_IN';
  strength: number; // 0-1
  videoId?: string;
}

export interface LearningPath {
  concepts: ConceptNode[];
  gaps: ConceptNode[]; // prerequisites not yet mastered
  recommendedVideos: { videoId: string; concept: string; reason: string }[];
}

export interface GraphQueryResult {
  nodes: ConceptNode[];
  relationships: ConceptRelationship[];
  queryTimeMs: number;
}

// ─── Configuration ───────────────────────────────────────────────────

const GRAPH_BACKEND_URL =
  import.meta.env.VITE_GRAPH_BACKEND_URL || '';

// ─── Graph queries ───────────────────────────────────────────────────

/**
 * Gets all concepts related to a given concept.
 *
 * @param conceptName - The concept to explore
 * @param depth - How many relationship hops to traverse (default 2)
 */
export async function getRelatedConcepts(
  conceptName: string,
  depth = 2
): Promise<GraphQueryResult> {
  const start = performance.now();

  if (!GRAPH_BACKEND_URL) {
    return { nodes: [], relationships: [], queryTimeMs: 0 };
  }

  const response = await fetch(
    `${GRAPH_BACKEND_URL}/concepts/${encodeURIComponent(conceptName)}/related?depth=${depth}`
  );

  if (!response.ok) {
    throw new Error(`Graph query failed: ${response.status}`);
  }

  const data = await response.json();
  return {
    ...data,
    queryTimeMs: performance.now() - start,
  };
}

/**
 * Gets a learning path from current knowledge to a target concept.
 *
 * @param targetConcept - The concept the learner wants to master
 * @param userId - Learner's user ID
 */
export async function getLearningPath(
  targetConcept: string,
  userId: string
): Promise<LearningPath> {
  if (!GRAPH_BACKEND_URL) {
    return { concepts: [], gaps: [], recommendedVideos: [] };
  }

  const response = await fetch(
    `${GRAPH_BACKEND_URL}/learning-path?target=${encodeURIComponent(targetConcept)}&userId=${encodeURIComponent(userId)}`
  );

  if (!response.ok) {
    throw new Error(`Learning path query failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Adds a concept relationship to the graph.
 *
 * @param relationship - The relationship to add
 */
export async function addRelationship(
  relationship: ConceptRelationship
): Promise<void> {
  if (!GRAPH_BACKEND_URL) return;

  const response = await fetch(`${GRAPH_BACKEND_URL}/relationships`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(relationship),
  });

  if (!response.ok) {
    throw new Error(`Failed to add relationship: ${response.status}`);
  }
}

/**
 * Batch imports DLP data from flat Firestore documents into the graph.
 *
 * @param dlpData - Flat DLP data from Firestore
 * @param userId - Learner's user ID
 */
export async function importDlpData(
  dlpData: Record<string, { mastery: number; lastUpdated: string }>,
  userId: string
): Promise<{ imported: number; errors: number }> {
  if (!GRAPH_BACKEND_URL) {
    return { imported: 0, errors: 0 };
  }

  const concepts = Object.entries(dlpData).map(([name, data]) => ({
    name,
    mastery: data.mastery,
    lastStudied: data.lastUpdated,
    userId,
  }));

  const response = await fetch(`${GRAPH_BACKEND_URL}/import/dlp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ concepts }),
  });

  if (!response.ok) {
    throw new Error(`DLP import failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Gets all concepts a user has studied, with mastery levels.
 *
 * @param userId - Learner's user ID
 */
export async function getUserConcepts(userId: string): Promise<ConceptNode[]> {
  if (!GRAPH_BACKEND_URL) return [];

  const response = await fetch(
    `${GRAPH_BACKEND_URL}/users/${encodeURIComponent(userId)}/concepts`
  );

  if (!response.ok) {
    throw new Error(`Failed to get user concepts: ${response.status}`);
  }

  return response.json();
}

// ─── Health check ────────────────────────────────────────────────────

export async function checkGraphBackendHealth(): Promise<boolean> {
  if (!GRAPH_BACKEND_URL) return false;

  try {
    const response = await fetch(`${GRAPH_BACKEND_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
