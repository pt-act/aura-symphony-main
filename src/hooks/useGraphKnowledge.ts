import {useCallback} from 'react';
import {
  getRelatedConcepts,
  getLearningPath,
  addRelationship,
  importDlpData,
  getUserConcepts,
  checkGraphBackendHealth,
  type ConceptNode,
  type ConceptRelationship,
  type LearningPath,
  type GraphQueryResult,
} from '../lib/graph-knowledge';

/**
 * Encapsulates graph-based knowledge queries for the DLP.
 * Falls back gracefully when graph backend is unavailable.
 */
export function useGraphKnowledge(userId?: string) {
  /**
   * Gets related concepts from the graph (cross-video traversal).
   */
  const findRelatedConcepts = useCallback(
    async (conceptName: string, depth = 2): Promise<GraphQueryResult> => {
      try {
        return await getRelatedConcepts(conceptName, depth);
      } catch (err) {
        console.warn('[Graph Knowledge] Query failed:', err);
        return {nodes: [], relationships: [], queryTimeMs: 0};
      }
    },
    [],
  );

  /**
   * Gets a learning path from current knowledge to a target concept.
   */
  const findLearningPath = useCallback(
    async (targetConcept: string): Promise<LearningPath> => {
      if (!userId) return {concepts: [], gaps: [], recommendedVideos: []};
      try {
        return await getLearningPath(targetConcept, userId);
      } catch (err) {
        console.warn('[Graph Knowledge] Learning path failed:', err);
        return {concepts: [], gaps: [], recommendedVideos: []};
      }
    },
    [userId],
  );

  /**
   * Gets all concepts the user has studied with mastery levels.
   */
  const getMyConcepts = useCallback(async (): Promise<ConceptNode[]> => {
    if (!userId) return [];
    try {
      return await getUserConcepts(userId);
    } catch (err) {
      console.warn('[Graph Knowledge] User concepts failed:', err);
      return [];
    }
  }, [userId]);

  /**
   * Adds a concept relationship to the graph.
   */
  const linkConcepts = useCallback(async (relationship: ConceptRelationship) => {
    try {
      await addRelationship(relationship);
    } catch (err) {
      console.warn('[Graph Knowledge] Add relationship failed:', err);
    }
  }, []);

  /**
   * Imports flat DLP data into the graph.
   */
  const migrateDlp = useCallback(
    async (dlpData: Record<string, {mastery: number; lastUpdated: string}>) => {
      if (!userId) return {imported: 0, errors: 0};
      try {
        return await importDlpData(dlpData, userId);
      } catch (err) {
        console.warn('[Graph Knowledge] DLP import failed:', err);
        return {imported: 0, errors: 0};
      }
    },
    [userId],
  );

  return {
    findRelatedConcepts,
    findLearningPath,
    getMyConcepts,
    linkConcepts,
    migrateDlp,
    checkHealth: checkGraphBackendHealth,
  };
}
