/**
 * API Proxy Client
 *
 * When VITE_API_PROXY_URL is configured, routes all Gemini calls through
 * the backend API proxy (backend/api-proxy) instead of calling Google
 * directly from the browser. This eliminates client-side API key exposure.
 *
 * Falls back to direct GoogleGenAI client when proxy is not configured.
 */

const PROXY_URL = import.meta.env.VITE_API_PROXY_URL || '';

/**
 * Returns true if the API proxy is configured and should be used.
 */
export function isProxyEnabled(): boolean {
  return PROXY_URL.length > 0;
}

/**
 * Returns the proxy base URL (empty string if not configured).
 */
export function getProxyUrl(): string {
  return PROXY_URL;
}

/**
 * Proxied generateContent call.
 * Sends request to the backend proxy instead of directly to Google.
 *
 * @param model - Gemini model name (e.g., 'gemini-2.5-pro')
 * @param contents - Content parts (same format as @google/genai)
 * @param config - Generation config (systemInstruction, tools, etc.)
 * @returns Proxy response with text, candidates, functionCalls
 */
export async function proxyGenerateContent(
  model: string,
  contents: unknown,
  config?: Record<string, unknown>,
): Promise<{
  text: string;
  candidates: unknown;
  functionCalls: Array<{ name: string; args: Record<string, unknown> }> | undefined;
  usageMetadata: unknown;
}> {
  const response = await fetch(`${PROXY_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, contents, config }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.error || `Proxy error: ${response.status}`);
  }

  return response.json();
}

/**
 * Proxied chat call.
 *
 * @param model - Gemini model name
 * @param message - Current message
 * @param history - Chat history
 * @param config - Generation config
 * @returns Response text
 */
export async function proxyChat(
  model: string,
  message: string,
  history: unknown[],
  config?: Record<string, unknown>,
): Promise<string> {
  const response = await fetch(`${PROXY_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, message, history, config }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.error || `Proxy error: ${response.status}`);
  }

  const data = await response.json();
  return data.text;
}

/**
 * Proxied search-grounded generation.
 *
 * @param model - Gemini model name
 * @param contents - Content/query
 * @param config - Generation config
 * @returns Response with text and sources
 */
export async function proxySearchGrounded(
  model: string,
  contents: unknown,
  config?: Record<string, unknown>,
): Promise<{ text: string; sources: unknown[] }> {
  const response = await fetch(`${PROXY_URL}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, contents, config }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.error || `Proxy error: ${response.status}`);
  }

  return response.json();
}

/**
 * Check proxy health.
 */
export async function checkProxyHealth(): Promise<boolean> {
  if (!isProxyEnabled()) return false;
  try {
    const res = await fetch(`${PROXY_URL}/api/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}