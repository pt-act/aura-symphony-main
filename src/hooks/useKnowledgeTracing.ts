/**
 * useKnowledgeTracing Hook
 *
 * Provides BKT-based knowledge tracing for the Digital Learner Profile.
 * Replaces flat mastery scores with calibrated probability-of-mastery estimates.
 *
 * Usage:
 *   const kt = useKnowledgeTracing(userId);
 *   kt.recordAnswer('algebra', true);
 *   const mastery = kt.getMastery('algebra'); // → 0.73
 *   const recs = kt.getRecommendations(['algebra', 'calculus', 'trig']);
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  createKnowledgeState,
  recordObservation,
  getCurrentMastery,
  recommendNextConcepts,
  migrateFromFlatMastery,
  applyTemporalDecay,
  type KnowledgeState,
  type ConceptMastery,
  type ContentRecommendation,
} from '../lib/knowledge-tracing';

const STORAGE_KEY_PREFIX = 'aura-kt-';

/**
 * Persists knowledge state to localStorage.
 */
function saveState(state: KnowledgeState): void {
  try {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${state.userId}`,
      JSON.stringify(state),
    );
  } catch {
    console.warn('[KnowledgeTracing] Failed to persist state');
  }
}

/**
 * Loads knowledge state from localStorage.
 */
function loadState(userId: string): KnowledgeState | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (!raw) return null;
    return JSON.parse(raw) as KnowledgeState;
  } catch {
    return null;
  }
}

export function useKnowledgeTracing(
  userId?: string,
  prerequisiteMap: Record<string, string[]> = {},
) {
  const [state, setState] = useState<KnowledgeState>(
    () => (userId ? loadState(userId) : null) ?? createKnowledgeState(userId ?? 'anonymous'),
  );
  const stateRef = useRef(state);
  stateRef.current = state;

  // Reload state when userId changes
  useEffect(() => {
    if (!userId) return;
    const loaded = loadState(userId);
    if (loaded) {
      setState(loaded);
    } else {
      setState(createKnowledgeState(userId));
    }
  }, [userId]);

  // Auto-save on state change
  useEffect(() => {
    if (state.userId && state.userId !== 'anonymous') {
      saveState(state);
    }
  }, [state]);

  /**
   * Records a student answer for a concept.
   */
  const recordAnswer = useCallback(
    (conceptId: string, correct: boolean, timestamp?: number) => {
      setState((prev) => {
        const next = { ...prev, concepts: { ...prev.concepts } };
        // Deep-copy the specific concept to avoid mutation
        if (next.concepts[conceptId]) {
          next.concepts[conceptId] = {
            ...next.concepts[conceptId],
            history: [...next.concepts[conceptId].history],
          };
        }
        const prereqs = prerequisiteMap[conceptId] ?? [];
        recordObservation(next, conceptId, correct, timestamp ?? Date.now(), prereqs);
        return next;
      });
    },
    [prerequisiteMap],
  );

  /**
   * Gets current mastery for a concept (with temporal decay applied).
   */
  const getMastery = useCallback(
    (conceptId: string): number => {
      return getCurrentMastery(stateRef.current, conceptId);
    },
    [],
  );

  /**
   * Gets full mastery details for a concept.
   */
  const getConceptDetail = useCallback(
    (conceptId: string): ConceptMastery | null => {
      const concept = stateRef.current.concepts[conceptId];
      if (!concept) return null;

      // Apply decay for current reading
      const decayed = applyTemporalDecay(
        concept.pMastery,
        concept.lastPracticed,
        Date.now(),
        concept.params.pL0,
      );

      return { ...concept, pMastery: decayed };
    },
    [],
  );

  /**
   * Gets all concept masteries as a flat map (for DLP display).
   */
  const getAllMasteries = useCallback(
    (): Record<string, { mastery: number; confidence: [number, number]; observations: number }> => {
      const result: Record<string, { mastery: number; confidence: [number, number]; observations: number }> = {};
      const now = Date.now();
      const concepts = stateRef.current.concepts;

      for (const id of Object.keys(concepts)) {
        const concept = concepts[id];
        const decayed = applyTemporalDecay(
          concept.pMastery,
          concept.lastPracticed,
          now,
          concept.params.pL0,
        );
        result[id] = {
          mastery: decayed,
          confidence: [concept.confidenceLow, concept.confidenceHigh],
          observations: concept.observations,
        };
      }

      return result;
    },
    [],
  );

  /**
   * Gets adaptive content recommendations.
   */
  const getRecommendations = useCallback(
    (
      availableConcepts: string[],
      goalConcepts?: string[],
    ): ContentRecommendation[] => {
      return recommendNextConcepts(
        stateRef.current,
        availableConcepts,
        goalConcepts,
        prerequisiteMap,
      );
    },
    [prerequisiteMap],
  );

  /**
   * Migrates a flat DLP mastery map to BKT state.
   */
  const migrateFromDLP = useCallback(
    (flatMastery: Record<string, { mastery: number; lastUpdated: string }>) => {
      if (!userId) return;
      const migrated = migrateFromFlatMastery(userId, flatMastery);
      setState(migrated);
    },
    [userId],
  );

  /**
   * Resets knowledge state for the user.
   */
  const reset = useCallback(() => {
    const fresh = createKnowledgeState(userId ?? 'anonymous');
    setState(fresh);
  }, [userId]);

  return {
    state,
    recordAnswer,
    getMastery,
    getConceptDetail,
    getAllMasteries,
    getRecommendations,
    migrateFromDLP,
    reset,
  };
}