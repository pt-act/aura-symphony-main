/**
 * Knowledge Tracing Module
 *
 * Implements Bayesian Knowledge Tracing (BKT) with extensions inspired by
 * Deep Knowledge Tracing (DKT). Replaces the flat mastery scores in the
 * DigitalLearnerProfile with calibrated probability-of-mastery estimates.
 *
 * BKT Model Parameters (per knowledge component):
 *   p(L₀)  — prior probability the student already knows the skill
 *   p(T)   — probability of learning the skill on each opportunity
 *   p(G)   — probability of guessing correctly without knowing
 *   p(S)   — probability of slipping (making an error despite knowing)
 *
 * After each observation (correct/incorrect), Bayesian update produces
 * a posterior p(Lₙ) ∈ [0, 1] representing calibrated mastery.
 *
 * Extensions beyond vanilla BKT:
 *   - Temporal decay: mastery decays over time when no practice occurs
 *   - Prerequisite graph: upstream concept mastery biases p(T)
 *   - Confidence intervals: reports uncertainty for principled selection
 *   - Adaptive content selection: selects next concept to maximize learning
 *
 * References:
 *   [1] Corbett & Anderson (1995) "Knowledge Tracing"
 *   [2] Piech et al. (2015) "Deep Knowledge Tracing"
 *   [3] Baker et al. (2008) "More Accurate Student Modeling via BKT"
 *
 * @module
 */

// ─── Types ────────────────────────────────────────────────────────────

/** BKT model parameters for a single knowledge component (concept). */
export interface BKTParams {
  /** Prior probability of mastery (before any observations). */
  pL0: number;
  /** Probability of learning on each opportunity. */
  pTransit: number;
  /** Probability of guessing correctly without mastery. */
  pGuess: number;
  /** Probability of slipping (error despite mastery). */
  pSlip: number;
}

/** Default BKT parameters (empirically reasonable starting values). */
export const DEFAULT_BKT_PARAMS: Readonly<BKTParams> = {
  pL0: 0.1,
  pTransit: 0.15,
  pGuess: 0.25,
  pSlip: 0.1,
};

/** A single student interaction with a knowledge component. */
export interface Observation {
  /** Was the student's response correct? */
  correct: boolean;
  /** Unix timestamp (ms) of the observation. */
  timestamp: number;
}

/** Mastery state for a single concept. */
export interface ConceptMastery {
  /** Concept identifier. */
  conceptId: string;
  /** Calibrated probability of mastery p(Lₙ) ∈ [0, 1]. */
  pMastery: number;
  /** Number of practice opportunities observed. */
  observations: number;
  /** Observation history (most recent N). */
  history: Observation[];
  /** BKT parameters (may be individualized). */
  params: BKTParams;
  /** Unix timestamp (ms) of last observation. */
  lastPracticed: number;
  /** Lower bound of 95% confidence interval. */
  confidenceLow: number;
  /** Upper bound of 95% confidence interval. */
  confidenceHigh: number;
}

/** Full student knowledge state. */
export interface KnowledgeState {
  userId: string;
  concepts: Record<string, ConceptMastery>;
  lastUpdated: number;
}

/** Content selection recommendation. */
export interface ContentRecommendation {
  conceptId: string;
  reason: 'low-mastery' | 'high-uncertainty' | 'prerequisite-gap' | 'decay';
  priority: number; // 0–1, higher = more urgent
  currentMastery: number;
}

// ─── BKT Core Algorithm ──────────────────────────────────────────────

/**
 * Bayesian Knowledge Tracing update step.
 *
 * Given a prior p(Lₙ₋₁), an observation (correct/incorrect), and model
 * parameters, computes the posterior p(Lₙ).
 *
 * @param pLn - Current mastery estimate p(Lₙ₋₁)
 * @param correct - Whether the student answered correctly
 * @param params - BKT model parameters
 * @returns Updated mastery estimate p(Lₙ)
 */
export function bktUpdate(
  pLn: number,
  correct: boolean,
  params: BKTParams = DEFAULT_BKT_PARAMS,
): number {
  const { pTransit, pGuess, pSlip } = params;

  // Step 1: Compute the posterior given the observation (Bayes' rule)
  let pLnGivenObs: number;

  if (correct) {
    // p(Lₙ | correct) = p(correct | Lₙ) * p(Lₙ) / p(correct)
    // p(correct | Lₙ) = 1 - pSlip
    // p(correct | ¬Lₙ) = pGuess
    const pCorrect = pLn * (1 - pSlip) + (1 - pLn) * pGuess;
    pLnGivenObs = pCorrect > 0 ? (pLn * (1 - pSlip)) / pCorrect : pLn;
  } else {
    // p(Lₙ | incorrect) = p(incorrect | Lₙ) * p(Lₙ) / p(incorrect)
    // p(incorrect | Lₙ) = pSlip
    // p(incorrect | ¬Lₙ) = 1 - pGuess
    const pIncorrect = pLn * pSlip + (1 - pLn) * (1 - pGuess);
    pLnGivenObs = pIncorrect > 0 ? (pLn * pSlip) / pIncorrect : pLn;
  }

  // Step 2: Account for learning (transit) during this opportunity
  // p(Lₙ) = p(Lₙ|obs) + (1 - p(Lₙ|obs)) * p(T)
  const pLnNew = pLnGivenObs + (1 - pLnGivenObs) * pTransit;

  return clamp(pLnNew);
}

/**
 * Processes a sequence of observations to compute the final mastery.
 */
export function bktSequence(
  pL0: number,
  observations: Observation[],
  params: BKTParams = DEFAULT_BKT_PARAMS,
): number {
  let pLn = pL0;
  for (const obs of observations) {
    pLn = bktUpdate(pLn, obs.correct, params);
  }
  return pLn;
}

// ─── Temporal Decay ───────────────────────────────────────────────────

/** Half-life for mastery decay in milliseconds (14 days). */
const DECAY_HALF_LIFE_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Applies exponential temporal decay to mastery.
 *
 * Mastery decays toward p(L₀) when the student hasn't practiced.
 * Uses a configurable half-life (default 14 days).
 *
 * @param pMastery - Current mastery estimate
 * @param lastPracticed - Unix timestamp (ms) of last practice
 * @param now - Current time (ms)
 * @param pL0 - Baseline mastery to decay toward
 * @param halfLifeMs - Decay half-life in ms
 * @returns Decayed mastery estimate
 */
export function applyTemporalDecay(
  pMastery: number,
  lastPracticed: number,
  now: number = Date.now(),
  pL0: number = DEFAULT_BKT_PARAMS.pL0,
  halfLifeMs: number = DECAY_HALF_LIFE_MS,
): number {
  if (lastPracticed >= now) return pMastery;

  const elapsed = now - lastPracticed;
  const decayFactor = Math.pow(0.5, elapsed / halfLifeMs);

  // Decay toward baseline, not toward zero
  const decayed = pL0 + (pMastery - pL0) * decayFactor;
  return clamp(decayed);
}

// ─── Confidence Interval ──────────────────────────────────────────────

/**
 * Computes approximate 95% confidence interval for mastery.
 *
 * Uses the Agresti-Coull interval adapted for BKT posteriors.
 * Uncertainty decreases as number of observations increases.
 *
 * @param pMastery - Point estimate of mastery
 * @param n - Number of observations
 * @returns [lower, upper] bounds
 */
export function computeConfidenceInterval(
  pMastery: number,
  n: number,
): [number, number] {
  if (n === 0) return [0, 1];

  // Agresti-Coull adjustment
  const z = 1.96; // 95% CI
  const nAdj = n + z * z;
  const pAdj = (pMastery * n + z * z / 2) / nAdj;
  const halfWidth = z * Math.sqrt((pAdj * (1 - pAdj)) / nAdj);

  return [
    clamp(pAdj - halfWidth),
    clamp(pAdj + halfWidth),
  ];
}

// ─── Prerequisite-aware transit ───────────────────────────────────────

/**
 * Adjusts the transit probability based on prerequisite concept mastery.
 *
 * If a concept has prerequisites, the effective p(T) is scaled by
 * the average mastery of prerequisites. This models the intuition
 * that you learn faster when you have strong foundations.
 *
 * @param baseTransit - Base transit probability
 * @param prerequisiteMasteries - Array of prerequisite concept mastery values
 * @returns Adjusted transit probability
 */
export function adjustTransitByPrereqs(
  baseTransit: number,
  prerequisiteMasteries: number[],
): number {
  if (prerequisiteMasteries.length === 0) return baseTransit;

  const avgPrereqMastery =
    prerequisiteMasteries.reduce((sum, m) => sum + m, 0) /
    prerequisiteMasteries.length;

  // Scale transit: [0.3x, 1.3x] based on avg prerequisite mastery
  const scaleFactor = 0.3 + avgPrereqMastery;
  return clamp(baseTransit * scaleFactor, 0, 0.5);
}

// ─── Knowledge State Manager ──────────────────────────────────────────

/** Maximum observation history to retain per concept. */
const MAX_HISTORY = 50;

/**
 * Creates an initial empty knowledge state for a user.
 */
export function createKnowledgeState(userId: string): KnowledgeState {
  return {
    userId,
    concepts: {},
    lastUpdated: Date.now(),
  };
}

/**
 * Records an observation for a concept, updating the mastery estimate.
 *
 * @param state - Current knowledge state (mutated in place for performance)
 * @param conceptId - The concept being practiced
 * @param correct - Whether the response was correct
 * @param timestamp - When the observation occurred
 * @param prerequisiteIds - IDs of prerequisite concepts (for transit adjustment)
 * @returns Updated concept mastery
 */
export function recordObservation(
  state: KnowledgeState,
  conceptId: string,
  correct: boolean,
  timestamp: number = Date.now(),
  prerequisiteIds: string[] = [],
): ConceptMastery {
  // Initialize concept if first encounter
  if (!state.concepts[conceptId]) {
    const [lo, hi] = computeConfidenceInterval(DEFAULT_BKT_PARAMS.pL0, 0);
    state.concepts[conceptId] = {
      conceptId,
      pMastery: DEFAULT_BKT_PARAMS.pL0,
      observations: 0,
      history: [],
      params: { ...DEFAULT_BKT_PARAMS },
      lastPracticed: timestamp,
      confidenceLow: lo,
      confidenceHigh: hi,
    };
  }

  const concept = state.concepts[conceptId];

  // Apply temporal decay before updating
  concept.pMastery = applyTemporalDecay(
    concept.pMastery,
    concept.lastPracticed,
    timestamp,
    concept.params.pL0,
  );

  // Adjust transit probability based on prerequisites
  const prereqMasteries = prerequisiteIds
    .map((id) => state.concepts[id]?.pMastery ?? DEFAULT_BKT_PARAMS.pL0)
    .filter((m) => m !== undefined);

  const effectiveParams: BKTParams = {
    ...concept.params,
    pTransit: adjustTransitByPrereqs(concept.params.pTransit, prereqMasteries),
  };

  // BKT update
  concept.pMastery = bktUpdate(concept.pMastery, correct, effectiveParams);
  concept.observations++;
  concept.lastPracticed = timestamp;

  // Update history (bounded)
  concept.history.push({ correct, timestamp });
  if (concept.history.length > MAX_HISTORY) {
    concept.history = concept.history.slice(-MAX_HISTORY);
  }

  // Update confidence interval
  const [lo, hi] = computeConfidenceInterval(concept.pMastery, concept.observations);
  concept.confidenceLow = lo;
  concept.confidenceHigh = hi;

  state.lastUpdated = timestamp;
  return concept;
}

/**
 * Gets the current mastery for a concept, applying temporal decay.
 */
export function getCurrentMastery(
  state: KnowledgeState,
  conceptId: string,
  now: number = Date.now(),
): number {
  const concept = state.concepts[conceptId];
  if (!concept) return DEFAULT_BKT_PARAMS.pL0;

  return applyTemporalDecay(
    concept.pMastery,
    concept.lastPracticed,
    now,
    concept.params.pL0,
  );
}

// ─── Adaptive Content Selection ───────────────────────────────────────

/**
 * Recommends which concepts the student should practice next.
 *
 * Selection criteria (by priority):
 *   1. Prerequisite gaps: concepts needed for goals but not yet mastered
 *   2. High uncertainty: concepts with wide confidence intervals
 *   3. Temporal decay: concepts not practiced recently
 *   4. Low mastery: concepts below the mastery threshold
 *
 * @param state - Current knowledge state
 * @param availableConcepts - Pool of concepts to choose from
 * @param goalConcepts - Optional: concepts the student wants to master
 * @param prerequisiteMap - Optional: concept → prerequisite concept IDs
 * @param now - Current time
 * @returns Sorted list of recommendations (highest priority first)
 */
export function recommendNextConcepts(
  state: KnowledgeState,
  availableConcepts: string[],
  goalConcepts: string[] = [],
  prerequisiteMap: Record<string, string[]> = {},
  now: number = Date.now(),
): ContentRecommendation[] {
  const MASTERY_THRESHOLD = 0.7;
  const UNCERTAINTY_THRESHOLD = 0.3;
  const DECAY_DAYS_THRESHOLD = 7;

  const recommendations: ContentRecommendation[] = [];

  for (const conceptId of availableConcepts) {
    const concept = state.concepts[conceptId];
    const pMastery = concept
      ? applyTemporalDecay(concept.pMastery, concept.lastPracticed, now, concept.params.pL0)
      : DEFAULT_BKT_PARAMS.pL0;

    const observations = concept?.observations ?? 0;
    const [lo, hi] = computeConfidenceInterval(pMastery, observations);
    const uncertainty = hi - lo;

    const daysSincePractice = concept
      ? (now - concept.lastPracticed) / (24 * 60 * 60 * 1000)
      : Infinity;

    // Check if this is a prerequisite for any goal concept
    const isPrereqForGoal = goalConcepts.some((goalId) =>
      (prerequisiteMap[goalId] ?? []).includes(conceptId),
    );

    // Priority scoring
    let priority = 0;
    let reason: ContentRecommendation['reason'] = 'low-mastery';

    if (isPrereqForGoal && pMastery < MASTERY_THRESHOLD) {
      priority = 1.0 - pMastery; // Highest urgency
      reason = 'prerequisite-gap';
    } else if (uncertainty > UNCERTAINTY_THRESHOLD) {
      priority = 0.7 * uncertainty;
      reason = 'high-uncertainty';
    } else if (daysSincePractice > DECAY_DAYS_THRESHOLD) {
      priority = Math.min(0.6, daysSincePractice / 30);
      reason = 'decay';
    } else if (pMastery < MASTERY_THRESHOLD) {
      priority = 0.5 * (1 - pMastery);
      reason = 'low-mastery';
    }

    if (priority > 0.01) {
      recommendations.push({ conceptId, reason, priority, currentMastery: pMastery });
    }
  }

  // Sort by priority descending
  recommendations.sort((a, b) => b.priority - a.priority);
  return recommendations;
}

// ─── Migration: flat mastery → BKT ───────────────────────────────────

/**
 * Migrates a flat DigitalLearnerProfile mastery map to BKT knowledge state.
 *
 * The flat mastery score (0–10 or 0–1) is converted to an initial p(Lₙ)
 * with a synthetic observation history that produces the equivalent posterior.
 *
 * @param userId - User identifier
 * @param flatMastery - Concept → { mastery: number, lastUpdated: string }
 * @returns BKT-based KnowledgeState
 */
export function migrateFromFlatMastery(
  userId: string,
  flatMastery: Record<string, { mastery: number; lastUpdated: string }>,
): KnowledgeState {
  const state = createKnowledgeState(userId);

  for (const [conceptId, { mastery, lastUpdated }] of Object.entries(flatMastery)) {
    // Normalize mastery to [0, 1] (handle both 0–1 and 0–10 scales)
    const normalizedMastery = mastery > 1 ? mastery / 10 : mastery;
    const pMastery = clamp(normalizedMastery);

    const lastPracticedMs = new Date(lastUpdated).getTime() || Date.now();

    // Estimate synthetic observation count based on mastery level
    // Higher mastery → more observations assumed
    const syntheticObservations = Math.round(pMastery * 20);

    const [lo, hi] = computeConfidenceInterval(pMastery, syntheticObservations);

    state.concepts[conceptId] = {
      conceptId,
      pMastery,
      observations: syntheticObservations,
      history: [], // No real history from flat scores
      params: { ...DEFAULT_BKT_PARAMS },
      lastPracticed: lastPracticedMs,
      confidenceLow: lo,
      confidenceHigh: hi,
    };
  }

  return state;
}

// ─── Utilities ────────────────────────────────────────────────────────

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

// ─── Exports for testing ──────────────────────────────────────────────

export const _testing = {
  clamp,
  DECAY_HALF_LIFE_MS,
  MAX_HISTORY,
};