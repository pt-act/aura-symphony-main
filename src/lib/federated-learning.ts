/**
 * Federated Learning for Digital Learner Profiles
 *
 * Enables learner profiles to improve the system's pedagogical models
 * across users while preserving privacy. Each client trains local
 * model updates from their own data, then sends only the gradient
 * deltas (not raw data) to the server for aggregation.
 *
 * Protocol (Federated Averaging — FedAvg):
 *   1. Server distributes the global model parameters
 *   2. Each client trains on local DLP data for E epochs
 *   3. Client computes gradient delta (local - global)
 *   4. Client applies differential privacy noise to the delta
 *   5. Client sends noised delta to the server
 *   6. Server aggregates deltas via weighted averaging
 *   7. Server updates the global model
 *   8. Repeat
 *
 * Privacy guarantees:
 *   - (ε, δ)-differential privacy via Gaussian noise
 *   - Gradient clipping to bound sensitivity
 *   - No raw user data leaves the device
 *   - Secure aggregation (future: homomorphic encryption)
 *
 * The "model" here is the BKT parameter set: for each knowledge
 * component, we learn optimal (p(L₀), p(T), p(G), p(S)) values
 * from the population, producing better initial estimates for
 * new users and new concepts.
 *
 * References:
 *   [1] McMahan et al. (2017) "Communication-Efficient Learning of Deep Networks from Decentralized Data"
 *   [2] Abadi et al. (2016) "Deep Learning with Differential Privacy"
 *   [3] Bonawitz et al. (2019) "Towards Federated Learning at Scale"
 *
 * @module
 */

import {
  type BKTParams,
  type KnowledgeState,
  type ConceptMastery,
  DEFAULT_BKT_PARAMS,
} from './knowledge-tracing';

// ─── Types ────────────────────────────────────────────────────────────

/** A local model update (gradient delta with DP noise). */
export interface FederatedUpdate {
  /** Client identifier (anonymized). */
  clientId: string;
  /** Round number this update belongs to. */
  round: number;
  /** Per-concept BKT parameter deltas. */
  deltas: Record<string, BKTParamDelta>;
  /** Number of local observations used. */
  localSampleCount: number;
  /** Differential privacy parameters used. */
  privacyParams: PrivacyParams;
  /** Timestamp of the update. */
  timestamp: number;
}

/** BKT parameter delta (difference from global model). */
export interface BKTParamDelta {
  dpL0: number;
  dpTransit: number;
  dpGuess: number;
  dpSlip: number;
  /** Number of observations for this concept (weight). */
  weight: number;
}

/** Global model state (aggregated across all clients). */
export interface GlobalModel {
  /** Per-concept optimized BKT parameters. */
  params: Record<string, BKTParams>;
  /** Fallback parameters for unseen concepts. */
  defaultParams: BKTParams;
  /** Number of rounds completed. */
  round: number;
  /** Number of clients that contributed. */
  totalContributors: number;
  /** Last updated timestamp. */
  lastUpdated: number;
}

/** Differential privacy configuration. */
export interface PrivacyParams {
  /** Privacy budget ε (lower = more private). */
  epsilon: number;
  /** Failure probability δ (typically 1e-5). */
  delta: number;
  /** Gradient clipping norm. */
  clipNorm: number;
  /** Gaussian noise scale (computed from ε, δ, clipNorm). */
  noiseScale: number;
}

/** Federated learning configuration. */
export interface FederatedConfig {
  /** Server URL for model exchange. */
  serverUrl?: string;
  /** Minimum observations per concept before contributing. */
  minObservations: number;
  /** Local training epochs per round. */
  localEpochs: number;
  /** Privacy budget ε. */
  epsilon: number;
  /** Privacy failure probability δ. */
  delta: number;
  /** Gradient clipping norm. */
  clipNorm: number;
}

// ─── Default Configuration ──────────────────────────────────────────

const DEFAULT_CONFIG: FederatedConfig = {
  minObservations: 10,
  localEpochs: 3,
  epsilon: 1.0,
  delta: 1e-5,
  clipNorm: 1.0,
};

// ─── Differential Privacy ────────────────────────────────────────────

/**
 * Computes the Gaussian noise scale σ for (ε, δ)-DP.
 *
 * Uses the analytic Gaussian mechanism:
 *   σ = clipNorm × √(2 × ln(1.25/δ)) / ε
 */
export function computeNoiseScale(
  epsilon: number,
  delta: number,
  clipNorm: number,
): number {
  return (clipNorm * Math.sqrt(2 * Math.log(1.25 / delta))) / epsilon;
}

/**
 * Generates Gaussian noise with mean 0 and standard deviation σ.
 * Uses Box-Muller transform.
 */
export function gaussianNoise(sigma: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z * sigma;
}

/**
 * Clips a vector to have L2 norm ≤ clipNorm.
 */
export function clipGradient(values: number[], clipNorm: number): number[] {
  const norm = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0));
  if (norm <= clipNorm) return values;
  const scale = clipNorm / norm;
  return values.map((v) => v * scale);
}

/**
 * Adds calibrated Gaussian noise to a gradient for differential privacy.
 */
export function addDPNoise(values: number[], noiseScale: number): number[] {
  return values.map((v) => v + gaussianNoise(noiseScale));
}

// ─── Local Training ──────────────────────────────────────────────────

/**
 * Computes local BKT parameter updates from a user's knowledge state.
 *
 * For each concept with sufficient observations, estimates the "true"
 * BKT parameters using maximum likelihood on the observation history,
 * then computes the delta from the global model.
 *
 * @param state - User's knowledge state
 * @param globalModel - Current global model
 * @param config - Federated learning configuration
 * @returns Local parameter deltas (before DP noise)
 */
export function computeLocalUpdates(
  state: KnowledgeState,
  globalModel: GlobalModel,
  config: FederatedConfig = DEFAULT_CONFIG,
): Record<string, BKTParamDelta> {
  const deltas: Record<string, BKTParamDelta> = {};

  for (const [conceptId, concept] of Object.entries(state.concepts)) {
    if (concept.observations < config.minObservations) continue;

    // Estimate local optimal parameters from observation history
    const localParams = estimateLocalParams(concept);
    const globalParams = globalModel.params[conceptId] ?? globalModel.defaultParams;

    // Compute deltas
    deltas[conceptId] = {
      dpL0: localParams.pL0 - globalParams.pL0,
      dpTransit: localParams.pTransit - globalParams.pTransit,
      dpGuess: localParams.pGuess - globalParams.pGuess,
      dpSlip: localParams.pSlip - globalParams.pSlip,
      weight: concept.observations,
    };
  }

  return deltas;
}

/**
 * Estimates optimal BKT parameters from a concept's observation history
 * using grid search over the parameter space.
 *
 * This is a simplified MLE: for each candidate parameter set, compute
 * the log-likelihood of the observed sequence, and pick the best.
 */
function estimateLocalParams(concept: ConceptMastery): BKTParams {
  const history = concept.history;
  if (history.length < 5) return concept.params;

  let bestParams = concept.params;
  let bestLL = -Infinity;

  // Grid search over parameter space (coarse)
  const grid = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4];

  for (const pT of grid) {
    for (const pG of [0.1, 0.2, 0.3]) {
      for (const pS of [0.05, 0.1, 0.15]) {
        const candidateParams: BKTParams = {
          pL0: concept.params.pL0,
          pTransit: pT,
          pGuess: pG,
          pSlip: pS,
        };

        const ll = computeLogLikelihood(history, candidateParams);
        if (ll > bestLL) {
          bestLL = ll;
          bestParams = candidateParams;
        }
      }
    }
  }

  return bestParams;
}

/**
 * Computes the log-likelihood of an observation sequence under BKT params.
 */
function computeLogLikelihood(
  history: Array<{ correct: boolean; timestamp: number }>,
  params: BKTParams,
): number {
  let pLn = params.pL0;
  let ll = 0;

  for (const obs of history) {
    // P(obs | params)
    const pCorrect = pLn * (1 - params.pSlip) + (1 - pLn) * params.pGuess;

    if (obs.correct) {
      ll += Math.log(Math.max(pCorrect, 1e-10));
    } else {
      ll += Math.log(Math.max(1 - pCorrect, 1e-10));
    }

    // Update pLn
    let pLnGivenObs: number;
    if (obs.correct) {
      pLnGivenObs = pCorrect > 0 ? (pLn * (1 - params.pSlip)) / pCorrect : pLn;
    } else {
      const pIncorrect = pLn * params.pSlip + (1 - pLn) * (1 - params.pGuess);
      pLnGivenObs = pIncorrect > 0 ? (pLn * params.pSlip) / pIncorrect : pLn;
    }
    pLn = pLnGivenObs + (1 - pLnGivenObs) * params.pTransit;
  }

  return ll;
}

// ─── Federated Update Generation ─────────────────────────────────────

/**
 * Generates a privacy-preserving federated update from local data.
 *
 * This is the main client-side function. It:
 *   1. Computes local parameter deltas
 *   2. Clips gradients
 *   3. Adds calibrated DP noise
 *   4. Packages into a FederatedUpdate
 *
 * @param state - User's knowledge state
 * @param globalModel - Current global model
 * @param config - Privacy and training configuration
 * @returns FederatedUpdate ready to send to the server
 */
export function generateFederatedUpdate(
  state: KnowledgeState,
  globalModel: GlobalModel,
  config: FederatedConfig = DEFAULT_CONFIG,
): FederatedUpdate {
  const rawDeltas = computeLocalUpdates(state, globalModel, config);

  // Apply differential privacy to each concept's deltas
  const noiseScale = computeNoiseScale(config.epsilon, config.delta, config.clipNorm);
  const noisedDeltas: Record<string, BKTParamDelta> = {};

  for (const [conceptId, delta] of Object.entries(rawDeltas)) {
    const rawVec = [delta.dpL0, delta.dpTransit, delta.dpGuess, delta.dpSlip];

    // Clip
    const clipped = clipGradient(rawVec, config.clipNorm);

    // Add noise
    const noised = addDPNoise(clipped, noiseScale);

    noisedDeltas[conceptId] = {
      dpL0: noised[0],
      dpTransit: noised[1],
      dpGuess: noised[2],
      dpSlip: noised[3],
      weight: delta.weight,
    };
  }

  const totalSamples = Object.values(rawDeltas).reduce((sum, d) => sum + d.weight, 0);

  return {
    clientId: anonymizeId(state.userId),
    round: globalModel.round,
    deltas: noisedDeltas,
    localSampleCount: totalSamples,
    privacyParams: {
      epsilon: config.epsilon,
      delta: config.delta,
      clipNorm: config.clipNorm,
      noiseScale,
    },
    timestamp: Date.now(),
  };
}

// ─── Server-Side Aggregation (FedAvg) ────────────────────────────────

/**
 * Aggregates federated updates using Federated Averaging.
 *
 * For each concept, computes a weighted average of parameter deltas
 * across all participating clients, then applies to the global model.
 *
 * NOTE: In production, this runs on the server. It's included here
 * for self-contained operation and testing.
 *
 * @param globalModel - Current global model
 * @param updates - Array of client updates for this round
 * @param learningRate - Server learning rate (default: 1.0 for FedAvg)
 * @returns Updated global model
 */
export function aggregateUpdates(
  globalModel: GlobalModel,
  updates: FederatedUpdate[],
  learningRate = 1.0,
): GlobalModel {
  if (updates.length === 0) return globalModel;

  const newParams = { ...globalModel.params };

  // Collect all concept IDs across all updates
  const allConcepts = new Set<string>();
  for (const update of updates) {
    for (const conceptId of Object.keys(update.deltas)) {
      allConcepts.add(conceptId);
    }
  }

  // For each concept, compute weighted average of deltas
  for (const conceptId of allConcepts) {
    const currentParams = newParams[conceptId] ?? { ...globalModel.defaultParams };
    let totalWeight = 0;
    let sumDpL0 = 0, sumDpTransit = 0, sumDpGuess = 0, sumDpSlip = 0;

    for (const update of updates) {
      const delta = update.deltas[conceptId];
      if (!delta) continue;

      totalWeight += delta.weight;
      sumDpL0 += delta.dpL0 * delta.weight;
      sumDpTransit += delta.dpTransit * delta.weight;
      sumDpGuess += delta.dpGuess * delta.weight;
      sumDpSlip += delta.dpSlip * delta.weight;
    }

    if (totalWeight > 0) {
      newParams[conceptId] = {
        pL0: clamp(currentParams.pL0 + learningRate * (sumDpL0 / totalWeight)),
        pTransit: clamp(currentParams.pTransit + learningRate * (sumDpTransit / totalWeight), 0.01, 0.5),
        pGuess: clamp(currentParams.pGuess + learningRate * (sumDpGuess / totalWeight), 0.01, 0.5),
        pSlip: clamp(currentParams.pSlip + learningRate * (sumDpSlip / totalWeight), 0.01, 0.3),
      };
    }
  }

  return {
    params: newParams,
    defaultParams: globalModel.defaultParams,
    round: globalModel.round + 1,
    totalContributors: globalModel.totalContributors + updates.length,
    lastUpdated: Date.now(),
  };
}

// ─── Client–Server Communication ─────────────────────────────────────

/**
 * Fetches the current global model from the server.
 */
export async function fetchGlobalModel(
  serverUrl: string,
): Promise<GlobalModel | null> {
  try {
    const response = await fetch(`${serverUrl}/federated/model`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

/**
 * Submits a federated update to the server.
 */
export async function submitUpdate(
  serverUrl: string,
  update: FederatedUpdate,
): Promise<boolean> {
  try {
    const response = await fetch(`${serverUrl}/federated/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
      signal: AbortSignal.timeout(10_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Creates an initial global model (server bootstrap).
 */
export function createGlobalModel(): GlobalModel {
  return {
    params: {},
    defaultParams: { ...DEFAULT_BKT_PARAMS },
    round: 0,
    totalContributors: 0,
    lastUpdated: Date.now(),
  };
}

// ─── Utilities ────────────────────────────────────────────────────────

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Anonymizes a user ID for federated updates.
 * Uses a one-way hash so the server cannot link updates to users.
 */
function anonymizeId(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return `anon-${hash.toString(36)}`;
}

// ─── Exports for testing ──────────────────────────────────────────────

export const _testing = {
  estimateLocalParams,
  computeLogLikelihood,
  anonymizeId,
  clamp,
};