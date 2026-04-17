import {describe, it, expect, vi, beforeEach} from 'vitest';
import {ai, getAI, getEffectiveModel, testProviderConnection, TestConnectionResult} from './client';

// ─── Mock @google/genai ─────────────────────────────────────────────
//
// testProviderConnection creates `new GoogleGenAI({apiKey})` and then
// calls `.models.list()`.  We mock the constructor so we control what
// `models.list()` returns.
//
// IMPORTANT: client.ts has a top-level `new GoogleGenAI(...)` that runs
// at import time, so the mock factory MUST be hoisted above the import
// using vi.hoisted().  vitest automatically hoists vi.mock() calls, but
// the mock factory references `mockListFn` which must also be hoisted.

const {mockListFn} = vi.hoisted(() => ({
  mockListFn: vi.fn<() => Promise<AsyncIterable<{name: string}>>>(),
}));

vi.mock('@google/genai', () => {
  // Class-based mock so `new GoogleGenAI(...)` works at import time.
  // Captures apiKey on the instance for test assertions.
  class MockGoogleGenAI {
    __apiKey: string;
    models: {list: () => Promise<AsyncIterable<{name: string}>>};
    constructor({apiKey}: {apiKey: string}) {
      this.__apiKey = apiKey;
      this.models = {list: () => mockListFn()};
    }
  }
  return {GoogleGenAI: MockGoogleGenAI};
});

// Also mock pdfjs-dist to avoid worker-src side effects at import time
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {workerSrc: ''},
}));

// Mock provider-config so getAI/getEffectiveModel can be tested in isolation
const {mockGetActiveProvider} = vi.hoisted(() => ({
  mockGetActiveProvider: vi.fn<() => import('../lib/provider-config').ProviderConfig | null>(),
}));

vi.mock('../lib/provider-config', () => ({
  getActiveProvider: () => mockGetActiveProvider(),
  // Export stubs so client.ts can still import them without error
  loadProviders: vi.fn(),
  saveProviders: vi.fn(),
  STORAGE_KEY: 'aura-symphony-providers',
}));

// ─── Helpers ──────────────────────────────────────────────────────────

/** Creates an async iterable from an array of model objects. */
function asyncPager(models: {name: string}[]): AsyncIterable<{name: string}> {
  return {
    [Symbol.asyncIterator]() {
      let i = 0;
      return {
        async next() {
          if (i < models.length) return {value: models[i++], done: false};
          return {value: undefined, done: true};
        },
      };
    },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────

describe('testProviderConnection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Default: return one model
    mockListFn.mockResolvedValue(
      asyncPager([{name: 'models/gemini-2.5-pro'}]),
    );
  });

  // 1. Empty / whitespace-only API key
  it('returns error when API key is empty', async () => {
    const result = await testProviderConnection('');
    expect(result).toEqual<TestConnectionResult>({
      ok: false,
      modelCount: 0,
      modelFound: false,
      error: 'No API key provided.',
    });
  });

  it('returns error when API key is whitespace', async () => {
    const result = await testProviderConnection('   ');
    expect(result).toEqual<TestConnectionResult>({
      ok: false,
      modelCount: 0,
      modelFound: false,
      error: 'No API key provided.',
    });
  });

  // 2. Successful connection — no model specified
  it('returns ok when key is valid and no model filter requested', async () => {
    mockListFn.mockResolvedValue(
      asyncPager([
        {name: 'models/gemini-2.5-pro'},
        {name: 'models/gemini-2.5-flash'},
      ]),
    );
    const result = await testProviderConnection('valid-key');
    expect(result.ok).toBe(true);
    expect(result.modelCount).toBe(2);
    expect(result.error).toBe('');
  });

  // 3. Model found in the list
  it('returns ok with modelFound=true when requested model exists', async () => {
    mockListFn.mockResolvedValue(
      asyncPager([
        {name: 'models/gemini-2.5-pro'},
        {name: 'models/gemini-2.5-flash'},
      ]),
    );
    const result = await testProviderConnection('valid-key', 'gemini-2.5-pro');
    expect(result.ok).toBe(true);
    expect(result.modelFound).toBe(true);
    expect(result.modelCount).toBe(2);
  });

  // 4. Model name matches with short name (without "models/" prefix)
  it('matches model name even without models/ prefix', async () => {
    mockListFn.mockResolvedValue(
      asyncPager([{name: 'models/gemini-2.5-pro'}]),
    );
    const result = await testProviderConnection('valid-key', 'gemini-2.5-pro');
    expect(result.ok).toBe(true);
    expect(result.modelFound).toBe(true);
  });

  // 5. Model NOT found in the list
  it('returns failure when requested model is not in the list', async () => {
    mockListFn.mockResolvedValue(
      asyncPager([{name: 'models/gemini-2.5-pro'}]),
    );
    const result = await testProviderConnection('valid-key', 'nonexistent-model');
    expect(result.ok).toBe(false);
    expect(result.modelFound).toBe(false);
    expect(result.error).toContain('not found');
    expect(result.modelCount).toBe(1);
  });

  // 6. Auth error — API_KEY in message
  it('returns auth error when API_KEY appears in error message', async () => {
    mockListFn.mockRejectedValue(
      new Error('API_KEY_INVALID: Your API key is not valid'),
    );
    const result = await testProviderConnection('bad-key');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Invalid API key or insufficient permissions.');
  });

  // 7. Auth error — 403 status
  it('returns auth error when 403 appears in error message', async () => {
    mockListFn.mockRejectedValue(new Error('Request failed with 403'));
    const result = await testProviderConnection('bad-key');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Invalid API key or insufficient permissions.');
  });

  // 8. Auth error — PERMISSION_DENIED
  it('returns auth error when PERMISSION_DENIED appears in error message', async () => {
    mockListFn.mockRejectedValue(new Error('PERMISSION_DENIED for this resource'));
    const result = await testProviderConnection('bad-key');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Invalid API key or insufficient permissions.');
  });

  // 9. Network error — fetch / ECONNREFUSED
  it('returns network error when fetch/ECONNREFUSED in message', async () => {
    mockListFn.mockRejectedValue(new Error('fetch failed: ECONNREFUSED'));
    const result = await testProviderConnection('valid-key');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Network error — check your connection and base URL.');
  });

  it('returns network error when network appears in message', async () => {
    mockListFn.mockRejectedValue(new Error('network error'));
    const result = await testProviderConnection('valid-key');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Network error — check your connection and base URL.');
  });

  // 10. Timeout — make list() hang and use fake timers
  it('returns timeout error when connection times out', async () => {
    vi.useFakeTimers();
    try {
      // Make list() never resolve
      mockListFn.mockReturnValue(new Promise(() => {}));

      const promise = testProviderConnection('valid-key');

      // Advance past the 10s timeout
      await vi.advanceTimersByTimeAsync(10_500);

      const result = await promise;
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Connection timed out — check your network and base URL.');
    } finally {
      vi.useRealTimers();
    }
  });

  // 11. Unknown error
  it('returns truncated message for unknown errors', async () => {
    mockListFn.mockRejectedValue(new Error('Something completely unexpected happened'));
    const result = await testProviderConnection('valid-key');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Something completely unexpected happened');
  });

  // 12. Error without .message (non-Error thrown)
  it('handles non-Error thrown values', async () => {
    mockListFn.mockRejectedValue('string error');
    const result = await testProviderConnection('valid-key');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('string error');
  });

  // 13. Early exit at 50 models (pagination cap)
  it('caps iteration at 50 models', async () => {
    const models = Array.from({length: 60}, (_, i) => ({
      name: `models/model-${i}`,
    }));
    mockListFn.mockResolvedValue(asyncPager(models));

    const result = await testProviderConnection('valid-key');
    expect(result.ok).toBe(true);
    expect(result.modelCount).toBe(50); // capped, not 60
  });

  // 14. Time-based deadline exits iteration even before 50 items
  it('exits iteration when elapsed time exceeds 10s deadline', async () => {
    vi.useFakeTimers();
    try {
      // Create a slow async iterable that yields models with delays
      const models = Array.from({length: 20}, (_, i) => ({
        name: `models/model-${i}`,
      }));

      function slowPager(): AsyncIterable<{name: string}> {
        return {
          [Symbol.asyncIterator]() {
            let i = 0;
            return {
              async next() {
                // Each iteration advances real time by 1s
                await vi.advanceTimersByTimeAsync(1_000);
                if (i < models.length) return {value: models[i++], done: false};
                return {value: undefined, done: true};
              },
            };
          },
        };
      }

      mockListFn.mockResolvedValue(slowPager());

      const promise = testProviderConnection('valid-key');
      // Advance enough for the initial list() call + iterations
      // After ~12 iterations (12s), the deadline should trigger
      await vi.advanceTimersByTimeAsync(15_000);

      const result = await promise;
      expect(result.ok).toBe(true);
      // Should have exited before reaching all 20 models due to time deadline
      expect(result.modelCount).toBeLessThan(20);
      expect(result.modelCount).toBeGreaterThan(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

// ─── getAI() ───────────────────────────────────────────────────────────

describe('getAI', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the default ai client when no active provider', () => {
    mockGetActiveProvider.mockReturnValue(null);
    const result = getAI();
    expect(result).toBe(ai); // same singleton reference
  });

  it('returns the default ai client when active provider has no API key', () => {
    mockGetActiveProvider.mockReturnValue({
      id: 'test', name: 'Test', baseUrl: '', apiKey: '', model: 'gpt-4o', isActive: true,
    });
    const result = getAI();
    expect(result).toBe(ai);
  });

  it('returns the default ai client when active provider has whitespace-only API key', () => {
    mockGetActiveProvider.mockReturnValue({
      id: 'test', name: 'Test', baseUrl: '', apiKey: '   ', model: 'gpt-4o', isActive: true,
    });
    const result = getAI();
    expect(result).toBe(ai);
  });

  it('returns a new client instance when active provider has an API key', () => {
    mockGetActiveProvider.mockReturnValue({
      id: 'test', name: 'Test', baseUrl: '', apiKey: 'sk-custom-key', model: 'gpt-4o', isActive: true,
    });
    const result = getAI() as any;
    expect(result).not.toBe(ai); // different instance
    expect(result.__apiKey).toBe('sk-custom-key'); // correct key passed to constructor
    expect(result.models).toBeDefined();
  });
});

// ─── getEffectiveModel() ────────────────────────────────────────────────

describe('getEffectiveModel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the registry model when no active provider', () => {
    mockGetActiveProvider.mockReturnValue(null);
    expect(getEffectiveModel('gemini-2.5-pro')).toBe('gemini-2.5-pro');
  });

  it('returns the registry model when active provider has no custom model', () => {
    mockGetActiveProvider.mockReturnValue({
      id: 'test', name: 'Test', baseUrl: '', apiKey: 'sk-key', model: '', isActive: true,
    });
    expect(getEffectiveModel('gemini-2.5-pro')).toBe('gemini-2.5-pro');
  });

  it('returns the registry model when active provider has whitespace-only model', () => {
    mockGetActiveProvider.mockReturnValue({
      id: 'test', name: 'Test', baseUrl: '', apiKey: 'sk-key', model: '   ', isActive: true,
    });
    expect(getEffectiveModel('gemini-2.5-pro')).toBe('gemini-2.5-pro');
  });

  it('returns the custom model when active provider has one set', () => {
    mockGetActiveProvider.mockReturnValue({
      id: 'test', name: 'Test', baseUrl: '', apiKey: 'sk-key', model: 'gpt-4o', isActive: true,
    });
    expect(getEffectiveModel('gemini-2.5-pro')).toBe('gpt-4o');
  });

  it('trims whitespace from the custom model name', () => {
    mockGetActiveProvider.mockReturnValue({
      id: 'test', name: 'Test', baseUrl: '', apiKey: 'sk-key', model: '  gpt-4o  ', isActive: true,
    });
    expect(getEffectiveModel('gemini-2.5-pro')).toBe('gpt-4o');
  });
});
