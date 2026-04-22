/**
 * Aura API Proxy
 *
 * Thin Express proxy between the frontend and Google Gemini API.
 * Eliminates client-side API key exposure.
 *
 * Features:
 * - API key stays server-side (never sent to client)
 * - Sliding-window rate limiter (per IP)
 * - Usage metering (tokens, request counts)
 * - Health check with uptime & usage stats
 *
 * Endpoints:
 *   POST /api/generate       — Proxy for models.generateContent
 *   POST /api/chat           — Proxy for multi-turn chat
 *   POST /api/search         — Proxy for search-grounded generation
 *   GET  /api/health         — Health check + usage stats
 *   GET  /api/usage          — Detailed usage metrics
 */

import { fileURLToPath } from 'url';
import express from 'express';
import { GoogleGenAI } from '@google/genai';

const PORT = parseInt(process.env.PORT || '3005');
const API_KEY = process.env.GEMINI_API_KEY || '';
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');   // 1 minute
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '30');                   // 30 req/min
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

const ai = new GoogleGenAI({ apiKey: API_KEY || 'placeholder' });

// ─── Rate Limiter (sliding window, per-IP) ─────────────────────

const rateBuckets = new Map();      // ip → { timestamps: number[] }

function rateLimit(ip) {
  const now = Date.now();
  let bucket = rateBuckets.get(ip);
  if (!bucket) {
    bucket = { timestamps: [] };
    rateBuckets.set(ip, bucket);
  }

  // Purge expired entries
  bucket.timestamps = bucket.timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (bucket.timestamps.length >= RATE_LIMIT_MAX) {
    const oldestValid = bucket.timestamps[0];
    const retryAfter = Math.ceil((oldestValid + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }

  bucket.timestamps.push(now);
  return { allowed: true, remaining: RATE_LIMIT_MAX - bucket.timestamps.length };
}

// Periodic cleanup of stale IPs
setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of rateBuckets) {
    bucket.timestamps = bucket.timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (bucket.timestamps.length === 0) rateBuckets.delete(ip);
  }
}, 60_000);

// ─── Usage Metering ────────────────────────────────────────────

const usage = {
  totalRequests: 0,
  totalErrors: 0,
  byEndpoint: {},        // path → { requests, errors, totalLatencyMs }
  byModel: {},           // model → count
  startedAt: Date.now(),
};

function recordUsage(endpoint, model, latencyMs, isError = false) {
  usage.totalRequests++;
  if (isError) usage.totalErrors++;

  if (!usage.byEndpoint[endpoint]) {
    usage.byEndpoint[endpoint] = { requests: 0, errors: 0, totalLatencyMs: 0 };
  }
  const ep = usage.byEndpoint[endpoint];
  ep.requests++;
  if (isError) ep.errors++;
  ep.totalLatencyMs += latencyMs;

  if (model) {
    usage.byModel[model] = (usage.byModel[model] || 0) + 1;
  }
}

// ─── Express App ───────────────────────────────────────────────

const app = express();
app.use(express.json({ limit: '50mb' }));

// CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Request-ID');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Rate limiting middleware
app.use('/api/generate', rateLimitMiddleware);
app.use('/api/chat', rateLimitMiddleware);
app.use('/api/search', rateLimitMiddleware);

function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const result = rateLimit(ip);
  if (!result.allowed) {
    res.setHeader('Retry-After', result.retryAfter);
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: result.retryAfter,
    });
  }
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  next();
}

// ─── POST /api/generate — Proxy for generateContent ────────────

app.post('/api/generate', async (req, res) => {
  const start = Date.now();
  const { model, contents, config } = req.body;

  if (!model || !contents) {
    return res.status(400).json({ error: 'model and contents are required' });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: config || {},
    });

    const latency = Date.now() - start;
    recordUsage('/api/generate', model, latency);

    res.json({
      text: response.text,
      candidates: response.candidates,
      functionCalls: response.functionCalls,
      usageMetadata: response.usageMetadata,
    });
  } catch (err) {
    const latency = Date.now() - start;
    recordUsage('/api/generate', model, latency, true);
    console.error('[API Proxy] Generate error:', err.message);
    res.status(502).json({ error: err.message?.slice(0, 200) });
  }
});

// ─── POST /api/chat — Proxy for multi-turn chat ───────────────

app.post('/api/chat', async (req, res) => {
  const start = Date.now();
  const { model, message, history, config } = req.body;

  if (!model || !message) {
    return res.status(400).json({ error: 'model and message are required' });
  }

  try {
    const chat = ai.chats.create({
      model,
      history: history || [],
      config: config || {},
    });

    const response = await chat.sendMessage({ message });
    const latency = Date.now() - start;
    recordUsage('/api/chat', model, latency);

    res.json({ text: response.text });
  } catch (err) {
    const latency = Date.now() - start;
    recordUsage('/api/chat', model, latency, true);
    console.error('[API Proxy] Chat error:', err.message);
    res.status(502).json({ error: err.message?.slice(0, 200) });
  }
});

// ─── POST /api/search — Proxy for search-grounded generation ──

app.post('/api/search', async (req, res) => {
  const start = Date.now();
  const { model, contents, config } = req.body;

  if (!model || !contents) {
    return res.status(400).json({ error: 'model and contents are required' });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        ...config,
        tools: [{ googleSearch: {} }],
      },
    });

    const latency = Date.now() - start;
    recordUsage('/api/search', model, latency);

    res.json({
      text: response.text,
      candidates: response.candidates,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [],
    });
  } catch (err) {
    const latency = Date.now() - start;
    recordUsage('/api/search', model, latency, true);
    console.error('[API Proxy] Search error:', err.message);
    res.status(502).json({ error: err.message?.slice(0, 200) });
  }
});

// ─── GET /api/health ───────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor((Date.now() - usage.startedAt) / 1000),
    totalRequests: usage.totalRequests,
    totalErrors: usage.totalErrors,
    activeRateBuckets: rateBuckets.size,
  });
});

// ─── GET /api/usage — Detailed usage metrics ──────────────────

app.get('/api/usage', (req, res) => {
  const endpointStats = {};
  for (const [path, stats] of Object.entries(usage.byEndpoint)) {
    endpointStats[path] = {
      ...stats,
      avgLatencyMs: stats.requests > 0
        ? Math.round(stats.totalLatencyMs / stats.requests)
        : 0,
    };
  }

  res.json({
    uptime: Math.floor((Date.now() - usage.startedAt) / 1000),
    totalRequests: usage.totalRequests,
    totalErrors: usage.totalErrors,
    errorRate: usage.totalRequests > 0
      ? (usage.totalErrors / usage.totalRequests * 100).toFixed(2) + '%'
      : '0%',
    byEndpoint: endpointStats,
    byModel: usage.byModel,
    rateLimit: {
      windowMs: RATE_LIMIT_WINDOW_MS,
      maxRequests: RATE_LIMIT_MAX,
      activeBuckets: rateBuckets.size,
    },
  });
});

// Only start the server and enforce API-key requirement when run directly.
// When imported as a module (e.g. by vitest), skip both so tests can import
// rateLimit / usage without triggering process.exit or port conflicts.
const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  if (!API_KEY) {
    console.error('[API Proxy] FATAL: GEMINI_API_KEY not set. Exiting.');
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`[API Proxy] Listening on :${PORT}`);
    console.log(`[API Proxy] Rate limit: ${RATE_LIMIT_MAX} req / ${RATE_LIMIT_WINDOW_MS / 1000}s`);
    console.log(`[API Proxy] Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
  });
}

export { app, rateLimit, usage };