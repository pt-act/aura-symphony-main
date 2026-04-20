/**
 * Federated Learning Tests
 *
 * Tests differential privacy, local training, FedAvg aggregation,
 * and gradient clipping.
 */
import { describe, it, expect } from 'vitest';
import {
  computeNoiseScale,
  gaussianNoise,
  clipGradient,
  addDPNoise,
  computeLocalUpdates,
  generateFederatedUpdate,
  aggregateUpdates,
  createGlobalModel,
  _testing,
  type GlobalModel,
} from '../lib/federated-learning';
import {
  createKnowledgeState,
  recordObservation,
  DEFAULT_BKT_PARAMS,
} from '../lib/knowledge-tracing';

const { anonymizeId, clamp } = _testing;

// ─── Differential Privacy ────────────────────────────────────────────────

describe('computeNoiseScale', () => {
  it('computes positive noise scale', () => {
    const sigma = computeNoiseScale(1.0, 1e-5, 1.0);
    expect(sigma).toBeGreaterThan(0);
  });

  it('increases noise for smaller epsilon (more privacy)', () => {
    const low_eps = computeNoiseScale(0.1, 1e-5, 1.0);
    const high_eps = computeNoiseScale(10.0, 1e-5, 1.0);
    expect(low_eps).toBeGreaterThan(high_eps);
  });

  it('scales with clip norm', () => {
    const small_clip = computeNoiseScale(1.0, 1e-5, 0.5);
    const large_clip = computeNoiseScale(1.0, 1e-5, 2.0);
    expect(large_clip).toBeGreaterThan(small_clip);
  });
});

describe('gaussianNoise', () => {
  it('generates noise with approximately correct distribution', () => {
    const samples = Array.from({ length: 10000 }, () => gaussianNoise(1.0));
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;

    // Mean should be approximately 0
    expect(Math.abs(mean)).toBeLessThan(0.1);
    // Variance should be approximately 1 (σ²)
    expect(Math.abs(variance - 1.0)).toBeLessThan(0.2);
  });
});

describe('clipGradient', () => {
  it('does not clip vectors within norm', () => {
    const vec = [0.3, 0.4];
    const clipped = clipGradient(vec, 1.0);
    expect(clipped[0]).toBeCloseTo(0.3, 5);
    expect(clipped[1]).toBeCloseTo(0.4, 5);
  });

  it('clips vectors exceeding norm', () => {
    const vec = [3.0, 4.0]; // norm = 5
    const clipped = clipGradient(vec, 1.0);
    const norm = Math.sqrt(clipped[0] ** 2 + clipped[1] ** 2);
    expect(norm).toBeCloseTo(1.0, 5);
  });

  it('preserves direction when clipping', () => {
    const vec = [6.0, 8.0]; // norm = 10
    const clipped = clipGradient(vec, 1.0);
    // Ratio should be preserved: 6/8 = 3/4
    expect(clipped[0] / clipped[1]).toBeCloseTo(6 / 8, 5);
  });
});

describe('addDPNoise', () => {
  it('adds noise to values', () => {
    const vec = [1.0, 2.0, 3.0];
    const noised = addDPNoise(vec, 0.1);
    // Values should be different (with overwhelming probability)
    const unchanged = vec.every((v, i) => v === noised[i]);
    // This could theoretically fail but probability is negligible
    expect(unchanged).toBe(false);
  });
});

// ─── Local Training ──────────────────────────────────────────────────────

describe('computeLocalUpdates', () => {
  it('skips concepts with insufficient observations', () => {
    const state = createKnowledgeState('user-1');
    recordObservation(state, 'concept-a', true, 1000);
    recordObservation(state, 'concept-a', true, 2000);
    // Only 2 observations, min is 10

    const globalModel = createGlobalModel();
    const deltas = computeLocalUpdates(state, globalModel);
    expect(Object.keys(deltas)).toHaveLength(0);
  });

  it('produces deltas for concepts with enough observations', () => {
    const state = createKnowledgeState('user-1');
    for (let i = 0; i < 15; i++) {
      recordObservation(state, 'concept-b', i % 3 !== 0, i * 1000);
    }

    const globalModel = createGlobalModel();
    const deltas = computeLocalUpdates(state, globalModel);
    expect(Object.keys(deltas)).toContain('concept-b');
    expect(deltas['concept-b'].weight).toBe(15);
  });
});

// ─── Federated Update ────────────────────────────────────────────────────

describe('generateFederatedUpdate', () => {
  it('generates an update with privacy parameters', () => {
    const state = createKnowledgeState('user-1');
    for (let i = 0; i < 20; i++) {
      recordObservation(state, 'concept-c', true, i * 1000);
    }

    const globalModel = createGlobalModel();
    const update = generateFederatedUpdate(state, globalModel);

    expect(update.clientId).toMatch(/^anon-/);
    expect(update.round).toBe(0);
    expect(update.privacyParams.epsilon).toBe(1.0);
    expect(update.privacyParams.noiseScale).toBeGreaterThan(0);
    expect(update.localSampleCount).toBeGreaterThan(0);
  });

  it('anonymizes the user ID', () => {
    const state = createKnowledgeState('sensitive-user-name');
    for (let i = 0; i < 15; i++) {
      recordObservation(state, 'concept-d', true, i * 1000);
    }

    const globalModel = createGlobalModel();
    const update = generateFederatedUpdate(state, globalModel);
    expect(update.clientId).not.toContain('sensitive');
    expect(update.clientId).toMatch(/^anon-/);
  });
});

// ─── Aggregation (FedAvg) ────────────────────────────────────────────────

describe('aggregateUpdates', () => {
  it('returns unchanged model for empty updates', () => {
    const model = createGlobalModel();
    const result = aggregateUpdates(model, []);
    expect(result.round).toBe(model.round);
  });

  it('aggregates deltas from multiple clients', () => {
    const model = createGlobalModel();

    const updates = [
      {
        clientId: 'a',
        round: 0,
        deltas: {
          'math': { dpL0: 0.05, dpTransit: 0.02, dpGuess: -0.01, dpSlip: 0.0, weight: 20 },
        },
        localSampleCount: 20,
        privacyParams: { epsilon: 1, delta: 1e-5, clipNorm: 1, noiseScale: 0.1 },
        timestamp: Date.now(),
      },
      {
        clientId: 'b',
        round: 0,
        deltas: {
          'math': { dpL0: 0.03, dpTransit: 0.04, dpGuess: 0.01, dpSlip: -0.01, weight: 30 },
        },
        localSampleCount: 30,
        privacyParams: { epsilon: 1, delta: 1e-5, clipNorm: 1, noiseScale: 0.1 },
        timestamp: Date.now(),
      },
    ];

    const result = aggregateUpdates(model, updates);
    expect(result.round).toBe(1);
    expect(result.totalContributors).toBe(2);
    expect(result.params['math']).toBeDefined();

    // Weighted average: (0.05*20 + 0.03*30) / 50 = 0.038
    const expectedPL0 = DEFAULT_BKT_PARAMS.pL0 + (0.05 * 20 + 0.03 * 30) / 50;
    expect(result.params['math'].pL0).toBeCloseTo(expectedPL0, 2);
  });

  it('clamps aggregated parameters', () => {
    const model = createGlobalModel();

    const updates = [
      {
        clientId: 'extreme',
        round: 0,
        deltas: {
          'x': { dpL0: 10, dpTransit: 10, dpGuess: 10, dpSlip: 10, weight: 100 },
        },
        localSampleCount: 100,
        privacyParams: { epsilon: 1, delta: 1e-5, clipNorm: 1, noiseScale: 0.1 },
        timestamp: Date.now(),
      },
    ];

    const result = aggregateUpdates(model, updates);
    expect(result.params['x'].pL0).toBeLessThanOrEqual(1);
    expect(result.params['x'].pTransit).toBeLessThanOrEqual(0.5);
    expect(result.params['x'].pGuess).toBeLessThanOrEqual(0.5);
    expect(result.params['x'].pSlip).toBeLessThanOrEqual(0.3);
  });
});

// ─── Utilities ───────────────────────────────────────────────────────────

describe('anonymizeId', () => {
  it('produces consistent hashes', () => {
    expect(anonymizeId('user1')).toBe(anonymizeId('user1'));
  });

  it('produces different hashes for different users', () => {
    expect(anonymizeId('alice')).not.toBe(anonymizeId('bob'));
  });

  it('starts with anon- prefix', () => {
    expect(anonymizeId('user')).toMatch(/^anon-/);
  });
});

describe('clamp', () => {
  it('clamps to [0, 1] by default', () => {
    expect(clamp(-1)).toBe(0);
    expect(clamp(2)).toBe(1);
    expect(clamp(0.5)).toBe(0.5);
  });
});