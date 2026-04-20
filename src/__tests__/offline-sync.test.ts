/**
 * Offline Sync Tests
 *
 * Tests the offline sync configuration and event system.
 * IndexedDB operations are tested at the integration level.
 */
import { describe, it, expect } from 'vitest';
import { _testing } from '../lib/offline-sync';

const {
  MUTATIONS_STORE,
  CACHE_STORE,
  MAX_RETRY_ATTEMPTS,
  SYNC_INTERVAL_MS,
  DEFAULT_CACHE_TTL_MS,
  MAX_CACHE_SIZE,
} = _testing;

describe('Offline sync configuration', () => {
  it('has correct store names', () => {
    expect(MUTATIONS_STORE).toBe('mutations');
    expect(CACHE_STORE).toBe('cache');
  });

  it('has reasonable retry limits', () => {
    expect(MAX_RETRY_ATTEMPTS).toBeGreaterThanOrEqual(3);
    expect(MAX_RETRY_ATTEMPTS).toBeLessThanOrEqual(10);
  });

  it('has reasonable sync interval', () => {
    expect(SYNC_INTERVAL_MS).toBeGreaterThanOrEqual(10_000);
    expect(SYNC_INTERVAL_MS).toBeLessThanOrEqual(120_000);
  });

  it('has reasonable cache TTL', () => {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    expect(DEFAULT_CACHE_TTL_MS).toBe(sevenDays);
  });

  it('has reasonable max cache size', () => {
    const hundredMB = 100 * 1024 * 1024;
    expect(MAX_CACHE_SIZE).toBe(hundredMB);
  });
});