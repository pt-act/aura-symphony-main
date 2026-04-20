/**
 * Proxy Client Tests
 *
 * Tests the proxy detection and URL resolution logic.
 */

import {describe, it, expect, vi} from 'vitest';

describe('Proxy Client', () => {
  it('isProxyEnabled returns false when no URL configured', async () => {
    const {isProxyEnabled} = await import('./proxy-client');
    // In test env, VITE_API_PROXY_URL is not set
    expect(isProxyEnabled()).toBe(false);
  });

  it('getProxyUrl returns empty string when not configured', async () => {
    const {getProxyUrl} = await import('./proxy-client');
    expect(getProxyUrl()).toBe('');
  });
});