/**
 * Plugin Marketplace Tests
 *
 * Tests local catalog, plugin lifecycle, telemetry, and publishing.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  searchMarketplace,
  publishPlugin,
  getInstalledPlugins,
  uninstallPlugin,
  getPluginTelemetry,
  _testing,
  type MarketplaceEntry,
} from '../lib/plugin-marketplace';

const { localCatalog, computeSHA256, MAX_HANDLER_SIZE } = _testing;

// Helper to create a test entry
function createTestEntry(id: string, overrides?: Partial<MarketplaceEntry>): MarketplaceEntry {
  return {
    id,
    manifest: {
      name: `Test Plugin ${id}`,
      version: '1.0.0',
      description: 'A test plugin',
      capabilities: ['test'],
      inputs: [],
      outputs: [],
      author: 'test-author',
    },
    metadata: {
      id,
      name: `Test Plugin ${id}`,
      title: 'Test',
      description: 'A test plugin',
      model: 'gemini-2.5-flash',
      capabilities: ['test'],
      color: '#FF0000',
      icon: 'Zap',
    },
    handlerUrl: '',
    handlerHash: '',
    installs: 0,
    rating: 0,
    ratingCount: 0,
    verified: false,
    publishedAt: new Date().toISOString(),
    tags: ['test'],
    ...overrides,
  };
}

beforeEach(() => {
  localCatalog.clear();
});

// ─── Publishing ─────────────────────────────────────────────────────────

describe('publishPlugin', () => {
  it('publishes a plugin to the local catalog', async () => {
    const entry = createTestEntry('plugin_test1');
    const result = await publishPlugin(entry);
    expect(result.success).toBe(true);
    expect(localCatalog.has('plugin_test1')).toBe(true);
  });

  it('rejects plugins without required fields', async () => {
    const entry = createTestEntry('');
    entry.metadata.id = '';
    const result = await publishPlugin(entry);
    expect(result.success).toBe(false);
  });

  it('rejects plugins with invalid ID prefix', async () => {
    const entry = createTestEntry('bad_prefix');
    const result = await publishPlugin(entry);
    expect(result.success).toBe(false);
    expect(result.error).toContain('plugin_');
  });
});

// ─── Search ──────────────────────────────────────────────────────────────

describe('searchMarketplace', () => {
  it('returns all plugins when no filter', async () => {
    await publishPlugin(createTestEntry('plugin_a'));
    await publishPlugin(createTestEntry('plugin_b'));

    const results = await searchMarketplace();
    expect(results.length).toBe(2);
  });

  it('filters by query', async () => {
    await publishPlugin(createTestEntry('plugin_alpha', { tags: ['video'] }));
    await publishPlugin(createTestEntry('plugin_beta', { tags: ['audio'] }));

    const results = await searchMarketplace({ query: 'alpha' });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('plugin_alpha');
  });

  it('filters by tags', async () => {
    await publishPlugin(createTestEntry('plugin_c', { tags: ['video', 'analysis'] }));
    await publishPlugin(createTestEntry('plugin_d', { tags: ['audio'] }));

    const results = await searchMarketplace({ tags: ['video'] });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('plugin_c');
  });

  it('filters by verified status', async () => {
    await publishPlugin(createTestEntry('plugin_e', { verified: true }));
    await publishPlugin(createTestEntry('plugin_f', { verified: false }));

    const verified = await searchMarketplace({ verified: true });
    expect(verified.length).toBe(1);
    expect(verified[0].id).toBe('plugin_e');
  });

  it('sorts by installs', async () => {
    await publishPlugin(createTestEntry('plugin_g', { installs: 100 }));
    await publishPlugin(createTestEntry('plugin_h', { installs: 500 }));

    const results = await searchMarketplace({ sortBy: 'installs' });
    expect(results[0].installs).toBeGreaterThan(results[1].installs);
  });

  it('respects limit', async () => {
    for (let i = 0; i < 10; i++) {
      await publishPlugin(createTestEntry(`plugin_lim${i}`));
    }
    const results = await searchMarketplace({ limit: 3 });
    expect(results.length).toBe(3);
  });
});

// ─── Telemetry ───────────────────────────────────────────────────────────

describe('getPluginTelemetry', () => {
  it('returns empty stats for unknown plugin', () => {
    const stats = getPluginTelemetry('unknown');
    expect(stats.totalExecutions).toBe(0);
    expect(stats.successRate).toBe(100);
  });
});

// ─── Utilities ───────────────────────────────────────────────────────────

describe('computeSHA256', () => {
  it('computes consistent hash', async () => {
    const hash1 = await computeSHA256('hello world');
    const hash2 = await computeSHA256('hello world');
    expect(hash1).toBe(hash2);
  });

  it('produces different hashes for different inputs', async () => {
    const hash1 = await computeSHA256('hello');
    const hash2 = await computeSHA256('world');
    expect(hash1).not.toBe(hash2);
  });

  it('returns a 64-character hex string', async () => {
    const hash = await computeSHA256('test');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('MAX_HANDLER_SIZE', () => {
  it('is a reasonable limit', () => {
    expect(MAX_HANDLER_SIZE).toBeGreaterThan(10_000);
    expect(MAX_HANDLER_SIZE).toBeLessThanOrEqual(1_000_000);
  });
});