import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Backend</span>
      <h2>API Proxy Service</h2>
      <div className="markdown-body">
        <p>Express proxy that keeps the Gemini API key server-side, adding rate limiting and usage metering. Eliminates client-side key exposure.</p>
        <p><FileRef path="backend/api-proxy/server.js" /></p>

        <h3>Endpoints</h3>
        <PropTable rows={[
          { name: 'POST /api/generate', type: 'JSON body', desc: 'Proxy for generateContent. Forwards to Gemini with server-side key.' },
          { name: 'POST /api/chat', type: 'JSON body', desc: 'Multi-turn chat proxy' },
          { name: 'POST /api/search', type: 'JSON body', desc: 'Grounded search proxy (Scholar)' },
          { name: 'GET /api/health', type: '—', desc: 'Health check' },
          { name: 'GET /api/usage', type: '—', desc: 'Per-endpoint stats (count, errors, avg latency) + per-model counts' },
        ]} />

        <h3>Rate Limiting</h3>
        <p>Sliding-window per-IP limiter. Default: <strong>30 req/min</strong>. Returns <code>429</code> with <code>Retry-After</code> header. Stale IPs pruned every 60s.</p>

        <Callout type="tip">Set <code>VITE_API_PROXY_URL=http://localhost:3005</code> in the frontend <code>.env</code> to enable. When unset, the frontend calls Gemini directly (backward compatible).</Callout>
      </div>
    </div>
  );
}