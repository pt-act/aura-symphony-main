/**
 * Shared CORS middleware for Aura backend services.
 *
 * - Validates origin against allowlist
 * - Sets proper CORS headers
 * - Handles preflight OPTIONS requests
 * - Adds X-Request-ID tracking header
 *
 * Usage:
 *   import { corsMiddleware } from '../shared/cors.js';
 *   app.use(corsMiddleware());
 */

import { randomUUID } from 'crypto';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
];

/**
 * Creates CORS middleware with configurable origin allowlist.
 *
 * @param {Object} options
 * @param {string[]} [options.allowedOrigins] - Allowed origins (default: localhost:3000, 5173)
 * @param {string[]} [options.allowedMethods] - Allowed HTTP methods
 * @param {number}   [options.maxAge] - Preflight cache duration in seconds
 */
export function corsMiddleware(options = {}) {
  const allowedOrigins = options.allowedOrigins
    || (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
    || DEFAULT_ALLOWED_ORIGINS;

  const allowedMethods = options.allowedMethods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
  const maxAge = options.maxAge || 86400;

  // Use a Set for O(1) lookup
  const originSet = new Set(
    allowedOrigins.length > 0 ? allowedOrigins : DEFAULT_ALLOWED_ORIGINS
  );

  return (req, res, next) => {
    const origin = req.headers.origin;

    // Add request tracking ID
    const requestId = req.headers['x-request-id'] || randomUUID();
    res.setHeader('X-Request-ID', requestId);

    // Validate origin
    if (origin && (originSet.has(origin) || originSet.has('*'))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }

    res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
    res.setHeader('Access-Control-Max-Age', String(maxAge));
    res.setHeader('Access-Control-Expose-Headers', 'X-Request-ID');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  };
}