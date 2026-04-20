/**
 * Knowledge Tracing (BKT) Tests
 *
 * Validates Bayesian Knowledge Tracing: update step, sequence processing,
 * temporal decay, confidence intervals, prerequisite adjustment,
 * adaptive content selection, and migration from flat mastery.
 */
import { describe, it, expect } from 'vitest';
import {
  bktUpdate,
  bktSequence,
  applyTemporalDecay,
  computeConfidenceInterval,
  adjustTransitByPrereqs,
  createKnowledgeState,
  recordObservation,
  getCurrentMastery,
  recommendNextConcepts,
  migrateFromFlatMastery,
  DEFAULT_BKT_PARAMS,
  _testing,
} from '../lib/knowledge-tracing';

const { clamp, DECAY_HALF_LIFE_MS } = _testing;

// ─── bktUpdate ─────────────────────────────────────────────────────────

describe('bktUpdate', () => {
  it('increases mastery on correct answer', () => {
    const before = 0.3;
    const after = bktUpdate(before, true);
    expect(after).toBeGreaterThan(before);
  });

  it('decreases mastery on incorrect answer', () => {
    const before = 0.8;
    const after = bktUpdate(before, false);
    expect(after).toBeLessThan(before);
  });

  it('returns value in [0, 1]', () => {
    // Edge cases
    expect(bktUpdate(0, true)).toBeGreaterThanOrEqual(0);
    expect(bktUpdate(0, true)).toBeLessThanOrEqual(1);
    expect(bktUpdate(1, false)).toBeGreaterThanOrEqual(0);
    expect(bktUpdate(1, false)).toBeLessThanOrEqual(1);
    expect(bktUpdate(0, false)).toBeGreaterThanOrEqual(0);
    expect(bktUpdate(1, true)).toBeLessThanOrEqual(1);
  });

  it('converges toward 1.0 with consecutive correct answers', () => {
    let p = 0.1;
    for (let i = 0; i < 20; i++) {
      p = bktUpdate(p, true);
    }
    expect(p).toBeGreaterThan(0.9);
  });

  it('converges toward 0 with consecutive incorrect answers', () => {
    let p = 0.9;
    for (let i = 0; i < 30; i++) {
      p = bktUpdate(p, false);
    }
    // Won't reach exactly 0 due to transit, but should be very low
    expect(p).toBeLessThan(0.3);
  });

  it('uses custom parameters', () => {
    const params = { pL0: 0.5, pTransit: 0.3, pGuess: 0.1, pSlip: 0.05 };
    const after = bktUpdate(0.3, true, params);
    // Higher transit → should learn faster
    expect(after).toBeGreaterThan(bktUpdate(0.3, true, DEFAULT_BKT_PARAMS));
  });
});

// ─── bktSequence ───────────────────────────────────────────────────────

describe('bktSequence', () => {
  it('processes a sequence of observations', () => {
    const observations = [
      { correct: true, timestamp: 1000 },
      { correct: true, timestamp: 2000 },
      { correct: false, timestamp: 3000 },
      { correct: true, timestamp: 4000 },
    ];
    const result = bktSequence(0.1, observations);
    expect(result).toBeGreaterThan(0.1);
    expect(result).toBeLessThanOrEqual(1);
  });

  it('returns initial mastery for empty sequence', () => {
    expect(bktSequence(0.3, [])).toBe(0.3);
  });

  it('equals sequential bktUpdate calls', () => {
    const obs = [
      { correct: true, timestamp: 1000 },
      { correct: false, timestamp: 2000 },
    ];
    const sequential = bktUpdate(bktUpdate(0.2, true), false);
    const batch = bktSequence(0.2, obs);
    expect(batch).toBeCloseTo(sequential, 10);
  });
});

// ─── applyTemporalDecay ───────────────────────────────────────────────

describe('applyTemporalDecay', () => {
  it('does not decay when time has not passed', () => {
    const now = Date.now();
    expect(applyTemporalDecay(0.8, now, now)).toBeCloseTo(0.8, 5);
  });

  it('decays to halfway after one half-life', () => {
    const now = Date.now();
    const decayed = applyTemporalDecay(
      0.9,
      now - DECAY_HALF_LIFE_MS,
      now,
      0.1,
    );
    // (0.9 - 0.1) * 0.5 + 0.1 = 0.5
    expect(decayed).toBeCloseTo(0.5, 1);
  });

  it('approaches baseline after many half-lives', () => {
    const now = Date.now();
    const decayed = applyTemporalDecay(
      0.9,
      now - 10 * DECAY_HALF_LIFE_MS,
      now,
      0.1,
    );
    expect(decayed).toBeCloseTo(0.1, 1);
  });

  it('does not decay below baseline', () => {
    const now = Date.now();
    const decayed = applyTemporalDecay(
      0.2,
      now - 100 * DECAY_HALF_LIFE_MS,
      now,
      0.1,
    );
    expect(decayed).toBeGreaterThanOrEqual(0.1);
  });

  it('handles future timestamps gracefully', () => {
    const now = Date.now();
    expect(applyTemporalDecay(0.8, now + 10000, now)).toBe(0.8);
  });
});

// ─── computeConfidenceInterval ────────────────────────────────────────

describe('computeConfidenceInterval', () => {
  it('returns [0, 1] for zero observations', () => {
    const [lo, hi] = computeConfidenceInterval(0.5, 0);
    expect(lo).toBe(0);
    expect(hi).toBe(1);
  });

  it('narrows with more observations', () => {
    const [lo5, hi5] = computeConfidenceInterval(0.7, 5);
    const [lo50, hi50] = computeConfidenceInterval(0.7, 50);
    expect(hi5 - lo5).toBeGreaterThan(hi50 - lo50);
  });

  it('returns values in [0, 1]', () => {
    for (const p of [0, 0.1, 0.5, 0.9, 1]) {
      for (const n of [1, 5, 10, 50]) {
        const [lo, hi] = computeConfidenceInterval(p, n);
        expect(lo).toBeGreaterThanOrEqual(0);
        expect(hi).toBeLessThanOrEqual(1);
        expect(lo).toBeLessThanOrEqual(hi);
      }
    }
  });
});

// ─── adjustTransitByPrereqs ───────────────────────────────────────────

describe('adjustTransitByPrereqs', () => {
  it('returns base transit when no prerequisites', () => {
    expect(adjustTransitByPrereqs(0.15, [])).toBe(0.15);
  });

  it('increases transit when prerequisites are mastered', () => {
    const adjusted = adjustTransitByPrereqs(0.15, [0.9, 0.95]);
    expect(adjusted).toBeGreaterThan(0.15);
  });

  it('decreases transit when prerequisites are not mastered', () => {
    const adjusted = adjustTransitByPrereqs(0.15, [0.1, 0.05]);
    expect(adjusted).toBeLessThan(0.15);
  });

  it('returns value clamped to [0, 0.5]', () => {
    const adjusted = adjustTransitByPrereqs(0.4, [1.0, 1.0, 1.0]);
    expect(adjusted).toBeLessThanOrEqual(0.5);
    expect(adjusted).toBeGreaterThanOrEqual(0);
  });
});

// ─── recordObservation ────────────────────────────────────────────────

describe('recordObservation', () => {
  it('initializes a new concept on first observation', () => {
    const state = createKnowledgeState('user-1');
    const result = recordObservation(state, 'algebra', true, 1000);
    expect(result.conceptId).toBe('algebra');
    expect(result.observations).toBe(1);
    expect(result.pMastery).toBeGreaterThan(DEFAULT_BKT_PARAMS.pL0);
  });

  it('updates existing concept mastery', () => {
    const state = createKnowledgeState('user-1');
    recordObservation(state, 'algebra', true, 1000);
    const m1 = state.concepts['algebra'].pMastery;

    recordObservation(state, 'algebra', true, 2000);
    expect(state.concepts['algebra'].pMastery).toBeGreaterThan(m1);
    expect(state.concepts['algebra'].observations).toBe(2);
  });

  it('applies prerequisite adjustment', () => {
    const state = createKnowledgeState('user-1');
    // Pre-master a prerequisite
    for (let i = 0; i < 10; i++) {
      recordObservation(state, 'arithmetic', true, i * 1000);
    }

    // Now learn algebra (with arithmetic as prerequisite)
    const result = recordObservation(state, 'algebra', true, 20000, ['arithmetic']);
    
    // Compare with learning without prerequisite
    const state2 = createKnowledgeState('user-2');
    const result2 = recordObservation(state2, 'algebra', true, 20000, []);
    
    // Should learn faster with mastered prerequisite
    expect(result.pMastery).toBeGreaterThanOrEqual(result2.pMastery);
  });

  it('maintains bounded history', () => {
    const state = createKnowledgeState('user-1');
    for (let i = 0; i < 100; i++) {
      recordObservation(state, 'concept', i % 2 === 0, i * 1000);
    }
    expect(state.concepts['concept'].history.length).toBeLessThanOrEqual(_testing.MAX_HISTORY);
  });

  it('updates confidence interval', () => {
    const state = createKnowledgeState('user-1');
    recordObservation(state, 'concept', true, 1000);
    const concept = state.concepts['concept'];
    expect(concept.confidenceLow).toBeLessThan(concept.pMastery);
    expect(concept.confidenceHigh).toBeGreaterThan(concept.pMastery);
  });
});

// ─── getCurrentMastery ────────────────────────────────────────────────

describe('getCurrentMastery', () => {
  it('returns default for unknown concept', () => {
    const state = createKnowledgeState('user-1');
    expect(getCurrentMastery(state, 'unknown')).toBe(DEFAULT_BKT_PARAMS.pL0);
  });

  it('applies temporal decay', () => {
    const state = createKnowledgeState('user-1');
    const pastTime = Date.now() - DECAY_HALF_LIFE_MS;
    recordObservation(state, 'concept', true, pastTime);
    recordObservation(state, 'concept', true, pastTime + 1000);
    recordObservation(state, 'concept', true, pastTime + 2000);

    const raw = state.concepts['concept'].pMastery;
    const current = getCurrentMastery(state, 'concept');
    expect(current).toBeLessThan(raw);
  });
});

// ─── recommendNextConcepts ────────────────────────────────────────────

describe('recommendNextConcepts', () => {
  it('returns empty for empty concept pool', () => {
    const state = createKnowledgeState('user-1');
    expect(recommendNextConcepts(state, [])).toEqual([]);
  });

  it('recommends low-mastery concepts', () => {
    const state = createKnowledgeState('user-1');
    recordObservation(state, 'easy', true, 1000);
    recordObservation(state, 'easy', true, 2000);

    const recs = recommendNextConcepts(state, ['easy', 'hard', 'unknown']);
    // 'hard' and 'unknown' should have higher priority (lower mastery)
    expect(recs.length).toBeGreaterThan(0);
    const hardOrUnknown = recs.filter((r) => r.conceptId !== 'easy');
    expect(hardOrUnknown.length).toBeGreaterThan(0);
  });

  it('prioritizes prerequisite gaps for goal concepts', () => {
    const state = createKnowledgeState('user-1');
    const prereqMap = { calculus: ['algebra', 'trig'] };

    const recs = recommendNextConcepts(
      state,
      ['algebra', 'trig', 'history'],
      ['calculus'],
      prereqMap,
    );

    const prereqRecs = recs.filter((r) => r.reason === 'prerequisite-gap');
    expect(prereqRecs.length).toBeGreaterThan(0);
    expect(prereqRecs.every((r) => ['algebra', 'trig'].includes(r.conceptId))).toBe(true);
  });

  it('sorts by priority descending', () => {
    const state = createKnowledgeState('user-1');
    const recs = recommendNextConcepts(state, ['a', 'b', 'c', 'd']);
    for (let i = 0; i < recs.length - 1; i++) {
      expect(recs[i].priority).toBeGreaterThanOrEqual(recs[i + 1].priority);
    }
  });
});

// ─── migrateFromFlatMastery ───────────────────────────────────────────

describe('migrateFromFlatMastery', () => {
  it('converts flat mastery to BKT state', () => {
    const flat = {
      algebra: { mastery: 0.8, lastUpdated: '2024-01-15T10:00:00Z' },
      geometry: { mastery: 0.3, lastUpdated: '2024-01-10T10:00:00Z' },
    };
    const state = migrateFromFlatMastery('user-1', flat);
    expect(state.userId).toBe('user-1');
    expect(state.concepts['algebra'].pMastery).toBeCloseTo(0.8, 1);
    expect(state.concepts['geometry'].pMastery).toBeCloseTo(0.3, 1);
  });

  it('handles 0–10 scale', () => {
    const flat = {
      concept: { mastery: 7.5, lastUpdated: '2024-01-15T10:00:00Z' },
    };
    const state = migrateFromFlatMastery('user-1', flat);
    expect(state.concepts['concept'].pMastery).toBeCloseTo(0.75, 1);
  });

  it('clamps values to [0, 1]', () => {
    const flat = {
      a: { mastery: -0.5, lastUpdated: '2024-01-15T10:00:00Z' },
      b: { mastery: 15, lastUpdated: '2024-01-15T10:00:00Z' },
    };
    const state = migrateFromFlatMastery('user-1', flat);
    expect(state.concepts['a'].pMastery).toBeGreaterThanOrEqual(0);
    expect(state.concepts['b'].pMastery).toBeLessThanOrEqual(1);
  });

  it('assigns synthetic observation counts proportional to mastery', () => {
    const flat = {
      high: { mastery: 0.9, lastUpdated: '2024-01-15T10:00:00Z' },
      low: { mastery: 0.1, lastUpdated: '2024-01-15T10:00:00Z' },
    };
    const state = migrateFromFlatMastery('user-1', flat);
    expect(state.concepts['high'].observations).toBeGreaterThan(
      state.concepts['low'].observations,
    );
  });
});

// ─── Utility: clamp ────────────────────────────────────────────────────

describe('clamp', () => {
  it('clamps below minimum', () => expect(clamp(-0.5)).toBe(0));
  it('clamps above maximum', () => expect(clamp(1.5)).toBe(1));
  it('passes through valid values', () => expect(clamp(0.5)).toBe(0.5));
  it('handles boundaries', () => {
    expect(clamp(0)).toBe(0);
    expect(clamp(1)).toBe(1);
  });
});