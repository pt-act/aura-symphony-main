/**
 * ReAct Planner Tests
 *
 * Validates query complexity detection and plan structure.
 * LLM-dependent functions (generatePlan, replan, executeReactPlan) are
 * tested at the integration level; here we test the deterministic logic.
 */
import { describe, it, expect } from 'vitest';
import { isComplexQuery, _testing } from '../lib/react-planner';

const { MAX_ITERATIONS, MAX_ACTIONS, SIMPLE_QUERY_THRESHOLD } = _testing;

// ─── isComplexQuery ────────────────────────────────────────────────────

describe('isComplexQuery', () => {
  it('returns false for short queries', () => {
    expect(isComplexQuery('summarize this')).toBe(false);
    expect(isComplexQuery('what is shown?')).toBe(false);
    expect(isComplexQuery('play video')).toBe(false);
  });

  it('detects "and then" patterns', () => {
    expect(isComplexQuery('summarize the video and then search for related topics')).toBe(true);
  });

  it('detects "first then" patterns', () => {
    expect(isComplexQuery('first analyze the video then create a quiz')).toBe(true);
  });

  it('detects comparison queries', () => {
    expect(isComplexQuery('compare the approaches discussed in this lecture with standard methods')).toBe(true);
  });

  it('detects multi-action queries', () => {
    expect(isComplexQuery('analyze the key moments and search the web for background information')).toBe(true);
  });

  it('detects step-by-step requests', () => {
    expect(isComplexQuery('please go through this step by step and explain each concept')).toBe(true);
  });

  it('detects "combine" requests', () => {
    expect(isComplexQuery('combine the analysis results with web search to create a comprehensive report')).toBe(true);
  });

  it('does not false-positive on normal-length queries', () => {
    // Longer but not actually multi-step
    expect(isComplexQuery('what is the main topic discussed in this educational video about physics')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isComplexQuery('')).toBe(false);
  });
});

// ─── Configuration constants ───────────────────────────────────────────

describe('ReAct planner configuration', () => {
  it('has sensible iteration limits', () => {
    expect(MAX_ITERATIONS).toBeGreaterThanOrEqual(3);
    expect(MAX_ITERATIONS).toBeLessThanOrEqual(10);
  });

  it('has sensible action limits', () => {
    expect(MAX_ACTIONS).toBeGreaterThanOrEqual(3);
    expect(MAX_ACTIONS).toBeLessThanOrEqual(15);
  });

  it('has a reasonable simple query threshold', () => {
    expect(SIMPLE_QUERY_THRESHOLD).toBeGreaterThan(10);
    expect(SIMPLE_QUERY_THRESHOLD).toBeLessThan(100);
  });
});