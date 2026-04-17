import {describe, it, expect, vi, beforeEach} from 'vitest';
import {loadProviders, saveProviders, getActiveProvider, STORAGE_KEY} from './provider-config';
import type {ProviderConfig} from './provider-config';

// ─── localStorage mock ──────────────────────────────────────────────
// provider-config.ts uses localStorage directly.  In Node.js there is
// no Storage global, so we stub localStorage with a simple in-memory
// object via vi.stubGlobal.  This avoids requiring a jsdom environment.

const store = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => { store.set(key, value); },
  removeItem: (key: string) => { store.delete(key); },
  clear: () => { store.clear(); },
  get length() { return store.size; },
  key: (_index: number) => null,
};

beforeEach(() => {
  store.clear();
  vi.stubGlobal('localStorage', mockLocalStorage);
});

// ─── loadProviders() ─────────────────────────────────────────────────

describe('loadProviders', () => {
  it('returns default providers when localStorage is empty', () => {
    const result = loadProviders();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('google-default');
    expect(result[0].model).toBe('gemini-2.5-pro');
    expect(result[0].isActive).toBe(true);
  });

  it('returns stored providers when localStorage has valid data', () => {
    const custom: ProviderConfig[] = [
      {id: 'custom-1', name: 'Custom', baseUrl: 'https://example.com', apiKey: 'sk-test', model: 'gpt-4o', isActive: true},
    ];
    store.set(STORAGE_KEY, JSON.stringify(custom));

    const result = loadProviders();
    expect(result).toEqual(custom);
  });

  it('returns default providers when stored JSON is malformed', () => {
    store.set(STORAGE_KEY, '{not valid json}');

    const result = loadProviders();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('google-default');
  });

  it('returns parsed value as-is when stored JSON is valid but not an array', () => {
    store.set(STORAGE_KEY, JSON.stringify({oops: 'not an array'}));

    // loadProviders only catches parse errors — it does not validate
    // the shape of the parsed value.  A valid JSON object gets returned
    // even though it's not ProviderConfig[].
    const result = loadProviders();
    expect(Array.isArray(result)).toBe(false);
    // This documents a known gap: callers should validate the result.
  });

  it('returns default providers when localStorage.getItem throws', () => {
    // Temporarily replace getItem with a throwing function
    const originalGetItem = mockLocalStorage.getItem;
    mockLocalStorage.getItem = () => { throw new Error('SecurityError: localStorage blocked'); };

    try {
      const result = loadProviders();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('google-default');
    } finally {
      mockLocalStorage.getItem = originalGetItem;
    }
  });
});

// ─── saveProviders() ──────────────────────────────────────────────────

describe('saveProviders', () => {
  it('persists providers to localStorage as JSON and returns true', () => {
    const providers: ProviderConfig[] = [
      {id: 'a', name: 'A', baseUrl: '', apiKey: 'key-a', model: 'model-a', isActive: false},
      {id: 'b', name: 'B', baseUrl: '', apiKey: 'key-b', model: 'model-b', isActive: true},
    ];

    const result = saveProviders(providers);

    expect(result).toBe(true);
    expect(store.get(STORAGE_KEY)).toBe(JSON.stringify(providers));
  });

  it('overwrites previous storage when called again', () => {
    const first: ProviderConfig[] = [
      {id: 'first', name: 'First', baseUrl: '', apiKey: '', model: '', isActive: true},
    ];
    const second: ProviderConfig[] = [
      {id: 'second', name: 'Second', baseUrl: '', apiKey: '', model: '', isActive: true},
    ];

    saveProviders(first);
    saveProviders(second);

    expect(store.get(STORAGE_KEY)).toBe(JSON.stringify(second));
  });

  it('persists an empty array', () => {
    saveProviders([]);

    expect(store.get(STORAGE_KEY)).toBe('[]');
  });

  it('returns false when localStorage.setItem throws (quota/security errors)', () => {
    const originalSetItem = mockLocalStorage.setItem;
    mockLocalStorage.setItem = () => { throw new DOMException('QuotaExceededError', 'QuotaExceededError'); };

    try {
      const result = saveProviders([{id: 'x', name: 'X', baseUrl: '', apiKey: '', model: '', isActive: true}]);
      expect(result).toBe(false);
    } finally {
      mockLocalStorage.setItem = originalSetItem;
    }
  });

  it('returns false and warns when SecurityError blocks localStorage', () => {
    const originalSetItem = mockLocalStorage.setItem;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockLocalStorage.setItem = () => { throw new Error('SecurityError: localStorage blocked'); };

    try {
      const result = saveProviders([{id: 'x', name: 'X', baseUrl: '', apiKey: '', model: '', isActive: true}]);
      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to save providers to localStorage:', expect.any(Error),
      );
    } finally {
      mockLocalStorage.setItem = originalSetItem;
      warnSpy.mockRestore();
    }
  });
});

// ─── getActiveProvider() ─────────────────────────────────────────────

describe('getActiveProvider', () => {
  it('returns null when no providers are active', () => {
    const providers: ProviderConfig[] = [
      {id: 'a', name: 'A', baseUrl: '', apiKey: '', model: '', isActive: false},
      {id: 'b', name: 'B', baseUrl: '', apiKey: '', model: '', isActive: false},
    ];
    store.set(STORAGE_KEY, JSON.stringify(providers));

    expect(getActiveProvider()).toBeNull();
  });

  it('returns the active provider when exactly one is active', () => {
    const activeProvider: ProviderConfig = {
      id: 'active', name: 'Active', baseUrl: 'https://api.example.com', apiKey: 'sk-key', model: 'gpt-4o', isActive: true,
    };
    const providers: ProviderConfig[] = [
      {id: 'inactive', name: 'Inactive', baseUrl: '', apiKey: '', model: '', isActive: false},
      activeProvider,
    ];
    store.set(STORAGE_KEY, JSON.stringify(providers));

    const result = getActiveProvider();
    expect(result).toEqual(activeProvider);
  });

  it('returns the first active provider when multiple are active', () => {
    const providers: ProviderConfig[] = [
      {id: 'first', name: 'First', baseUrl: '', apiKey: '', model: 'model-1', isActive: true},
      {id: 'second', name: 'Second', baseUrl: '', apiKey: '', model: 'model-2', isActive: true},
    ];
    store.set(STORAGE_KEY, JSON.stringify(providers));

    const result = getActiveProvider();
    expect(result).not.toBeNull();
    expect(result!.id).toBe('first');
  });

  it('returns the default active provider when localStorage is empty', () => {
    // localStorage is empty (store is cleared in beforeEach)
    const result = getActiveProvider();
    expect(result).not.toBeNull();
    expect(result!.id).toBe('google-default');
    expect(result!.isActive).toBe(true);
  });

  it('returns null when stored providers have no active flag', () => {
    // Providers exist but none have isActive: true
    const providers = [
      {id: 'a', name: 'A', baseUrl: '', apiKey: '', model: ''}, // missing isActive
    ];
    store.set(STORAGE_KEY, JSON.stringify(providers));

    // find(p => p.isActive) returns undefined since isActive is undefined (falsy)
    expect(getActiveProvider()).toBeNull();
  });
});
