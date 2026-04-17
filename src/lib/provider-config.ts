/**
 * Provider Configuration — shared between UI and API layer.
 *
 * This module is the single source of truth for reading/writing
 * the active AI provider settings persisted in localStorage.
 * It must NOT import React or any UI code so it can be used
 * from pure API modules (client.ts, etc.).
 */

export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  isActive: boolean;
}

const STORAGE_KEY = 'aura-symphony-providers';

const defaultProviders: ProviderConfig[] = [
  {
    id: 'google-default',
    name: 'Google AI (Default)',
    baseUrl: 'https://generativelanguage.googleapis.com',
    apiKey: '',
    model: 'gemini-2.5-pro',
    isActive: true,
  },
];

/** Load providers from localStorage (safe fallback to defaults). */
export function loadProviders(): ProviderConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore parse errors */ }
  return defaultProviders;
}

/** Persist providers to localStorage. Returns false silently on quota errors. */
export function saveProviders(providers: ProviderConfig[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(providers));
    return true;
  } catch (err) {
    // QuotaExceededError, SecurityError, etc.
    console.warn('Failed to save providers to localStorage:', err);
    return false;
  }
}

/** Return the currently active provider, or null. */
export function getActiveProvider(): ProviderConfig | null {
  const providers = loadProviders();
  return providers.find(p => p.isActive) || null;
}

/** The localStorage key — exported for ProviderSettingsCard backward compat. */
export { STORAGE_KEY };
