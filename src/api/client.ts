import {GoogleGenAI} from '@google/genai';
import * as pdfjsLib from 'pdfjs-dist';
import {getActiveProvider} from '../lib/provider-config';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.mjs';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

/** Default client using the environment API key — always available as fallback. */
export const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

/**
 * Returns a GoogleGenAI client configured for the currently active provider.
 *
 * - If the user has configured a custom provider in Settings with an API key,
 *   a fresh client is created using that key.
 * - If the custom provider has no key set, it falls back to the env-based
 *   default `ai` client (which uses the Gemini API key from .env).
 * - If no custom provider is active, returns the default `ai` client.
 *
 * Google AI SDK auto-detects base URL; for truly custom endpoints
 * (Ollama, local LLMs), a proxy or OpenAI-compatible adapter is needed.
 */
export function getAI(): GoogleGenAI {
  const active = getActiveProvider();
  if (!active) return ai;

  const apiKey = active.apiKey?.trim();
  if (!apiKey) return ai;

  return new GoogleGenAI({apiKey});
}

/**
 * Returns the model string that should be used for content generation.
 *
 * - If the user has an active provider with a custom model set, returns that.
 * - Otherwise returns the registry's default model for the given virtuoso.
 */
export function getEffectiveModel(registryModel: string): string {
  const active = getActiveProvider();
  if (!active) return registryModel;

  const customModel = active.model?.trim();
  if (!customModel) return registryModel;

  return customModel;
}

/** Result of testing a provider connection. */
export interface TestConnectionResult {
  ok: boolean;
  modelCount: number;
  modelFound: boolean;
  error: string;
}

/**
 * Tests a provider's API key by making a lightweight `models.list()` call.
 * If a model name is provided, also verifies that model exists in the list.
 * Returns a structured result suitable for UI display.
 */
export async function testProviderConnection(
  apiKey: string,
  model?: string,
): Promise<TestConnectionResult> {
  const key = apiKey?.trim();
  if (!key) {
    return {ok: false, modelCount: 0, modelFound: false, error: 'No API key provided.'};
  }

  // Race against a 10-second timeout so the UI never hangs indefinitely
  let timerId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => reject(new Error('Connection timed out after 10s.')), 10_000);
  });

  try {
    const testAI = new GoogleGenAI({apiKey: key});

    const pager = await Promise.race([testAI.models.list(), timeout]);
    clearTimeout(timerId);

    const startMs = Date.now();
    let count = 0;
    let modelFound = false;
    for await (const m of pager) {
      count++;
      if (model && (m.name === model || m.name?.endsWith(`/${model}`))) {
        modelFound = true;
      }
      if (count >= 50 || Date.now() - startMs > 10_000) break;
    }

    // If user specified a model but it wasn't found in the list
    if (model && !modelFound) {
      return {ok: false, modelCount: count, modelFound: false, error: `API key valid, but model "${model}" not found. Available: ${count} models.`};
    }

    return {ok: true, modelCount: count, modelFound, error: ''};
  } catch (err: any) {
    clearTimeout(timerId);
    const msg = err?.message || String(err);
    if (msg.includes('timed out')) {
      return {ok: false, modelCount: 0, modelFound: false, error: 'Connection timed out — check your network and base URL.'};
    }
    if (msg.includes('API_KEY') || msg.includes('401') || msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
      return {ok: false, modelCount: 0, modelFound: false, error: 'Invalid API key or insufficient permissions.'};
    }
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('ECONNREFUSED')) {
      return {ok: false, modelCount: 0, modelFound: false, error: 'Network error — check your connection and base URL.'};
    }
    return {ok: false, modelCount: 0, modelFound: false, error: msg.slice(0, 120)};
  }
}
