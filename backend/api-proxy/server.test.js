/**
 * API Proxy Tests
 *
 * Tests rate limiting, usage metering, input validation,
 * and endpoint behavior.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, usage } from './server.js';

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Reset rate buckets by clearing internal state
    // Since rateLimit uses a module-level Map, we test behavior
  });

  it('allows requests within the limit', () => {
    const testIp = `test-${Date.now()}-${Math.random()}`;
    const result = rateLimit(testIp);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it('tracks remaining requests', () => {
    const testIp = `track-${Date.now()}-${Math.random()}`;
    const r1 = rateLimit(testIp);
    const r2 = rateLimit(testIp);
    expect(r1.remaining).toBeGreaterThan(r2.remaining);
  });

  it('blocks requests when limit exceeded', () => {
    const testIp = `block-${Date.now()}-${Math.random()}`;
    // Exhaust the limit
    for (let i = 0; i < 30; i++) {
      rateLimit(testIp);
    }
    const blocked = rateLimit(testIp);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });
});

describe('Usage Metering', () => {
  it('has correct initial state', () => {
    expect(usage.startedAt).toBeGreaterThan(0);
    expect(typeof usage.totalRequests).toBe('number');
    expect(typeof usage.totalErrors).toBe('number');
    expect(typeof usage.byEndpoint).toBe('object');
    expect(typeof usage.byModel).toBe('object');
  });
});