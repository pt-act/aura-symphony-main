/**
 * CLIP Embeddings Tests
 *
 * Tests the multimodal result merging logic (deterministic).
 * Actual CLIP API calls are integration-tested against the backend.
 */
import { describe, it, expect } from 'vitest';
import { _testing } from '../lib/clip-embeddings';
import type { SearchResult } from '../lib/vector-search';

const { mergeResults, TEXT_WEIGHT, VISUAL_WEIGHT } = _testing;

describe('mergeResults', () => {
  it('merges text and visual results', () => {
    const textResults: SearchResult[] = [
      { chunk: { id: 't1', videoId: 'v1', content: 'Hello', timestamp: 10, endTime: 15, type: 'transcript' }, similarity: 0.9 },
      { chunk: { id: 't2', videoId: 'v1', content: 'World', timestamp: 30, endTime: 35, type: 'transcript' }, similarity: 0.7 },
    ];
    const visualResults = [
      { frameId: 'f1', videoId: 'v1', timestamp: 10, similarity: 0.85, modality: 'image' as const },
      { frameId: 'f2', videoId: 'v1', timestamp: 60, similarity: 0.6, modality: 'image' as const },
    ];

    const merged = mergeResults(textResults, visualResults, 10);

    // Timestamp 10 should appear with source 'both' and boosted score
    const both = merged.find((r) => Math.round(r.timestamp) === 10);
    expect(both).toBeDefined();
    expect(both!.source).toBe('both');
    expect(both!.score).toBeGreaterThan(0.9 * TEXT_WEIGHT); // boosted by visual

    // Timestamp 60 should be visual-only
    const visual = merged.find((r) => Math.round(r.timestamp) === 60);
    expect(visual).toBeDefined();
    expect(visual!.source).toBe('visual');
  });

  it('sorts by score descending', () => {
    const textResults: SearchResult[] = [
      { chunk: { id: 't1', videoId: 'v1', content: 'Low', timestamp: 10, endTime: 15, type: 'transcript' }, similarity: 0.3 },
      { chunk: { id: 't2', videoId: 'v1', content: 'High', timestamp: 20, endTime: 25, type: 'transcript' }, similarity: 0.9 },
    ];

    const merged = mergeResults(textResults, [], 10);
    expect(merged[0].timestamp).toBe(20); // Higher similarity first
  });

  it('respects maxResults limit', () => {
    const textResults: SearchResult[] = Array.from({ length: 20 }, (_, i) => ({
      chunk: { id: `t${i}`, videoId: 'v1', content: `Item ${i}`, timestamp: i * 10, endTime: i * 10 + 5, type: 'transcript' as const },
      similarity: Math.random(),
    }));

    const merged = mergeResults(textResults, [], 5);
    expect(merged.length).toBeLessThanOrEqual(5);
  });

  it('handles empty inputs', () => {
    expect(mergeResults([], [], 10)).toEqual([]);
    expect(mergeResults([], [{ frameId: 'f1', videoId: 'v1', timestamp: 5, similarity: 0.8, modality: 'image' as const }], 10)).toHaveLength(1);
  });

  it('uses correct weights', () => {
    expect(TEXT_WEIGHT).toBeGreaterThan(0);
    expect(VISUAL_WEIGHT).toBeGreaterThan(0);
    expect(TEXT_WEIGHT + VISUAL_WEIGHT).toBe(1.0);
  });
});