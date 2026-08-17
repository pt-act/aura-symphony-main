import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Setup</span>
      <h2>Configuration Reference</h2>
      <div className="markdown-body">
        <h3>Environment Variables</h3>
        <PropTable rows={[
          { name: 'GEMINI_API_KEY', type: 'string', desc: 'Google Gemini API key (fallback). Injected as process.env.API_KEY at build time. Not required if an in-app provider is configured.', default: 'Fallback' },
          { name: 'VITE_API_PROXY_URL', type: 'string', desc: 'URL of the backend API proxy for Gemini calls (e.g., http://localhost:3005). Eliminates client-side key exposure.', default: '"" (disabled)' },
          { name: 'VITE_VECTOR_BACKEND_URL', type: 'string', desc: 'URL of the vector search backend (e.g., http://localhost:3001)', default: '"" (disabled)' },
          { name: 'VITE_GRAPH_BACKEND_URL', type: 'string', desc: 'URL of the graph knowledge backend (e.g., http://localhost:4004)', default: '"" (disabled)' },
          { name: 'VITE_MEDIA_BACKEND_URL', type: 'string', desc: 'URL of the media pipeline backend (e.g., http://localhost:3002)', default: '"" (disabled)' },
        ]} />

        <Callout type="tip">The recommended way to configure API keys is via the in-app <strong>Settings panel</strong> (⚙️ icon). This stores keys in <code>localStorage</code> and avoids embedding them in the build. The <code>.env</code> file is used only as a fallback when no in-app provider is active.</Callout>

        <Callout type="warn">When backend URLs are empty, the system falls back gracefully: vector search uses Gemini's context window directly, graph queries return empty results, and media processing uses the browser-side WebWorker.</Callout>

        <h3>Provider Configuration</h3>
        <p>Users can configure custom AI providers via the Settings modal. Provider configs are persisted in <code>localStorage</code> under key <code>aura-symphony-providers</code>.</p>
        <CodeBlock title="ProviderConfig interface (src/lib/provider-config.ts)" code={`interface ProviderConfig {
  id: string;          // e.g., 'google-default'
  name: string;        // e.g., 'Google AI (Default)'
  baseUrl: string;     // API base URL
  apiKey: string;      // Provider API key
  model: string;       // Default model override
  isActive: boolean;   // Only one provider active at a time
}`} />

        <h3>Firebase Configuration</h3>
        <p>Firebase project config lives in <FileRef path="src/api/firebaseConfig.ts" />. Auth uses Google OAuth via <code>signInWithPopup</code>. Firestore security rules are in <FileRef path="firestore.rules" /> with per-collection field-level validation.</p>

        <h3>Vite Build Config</h3>
        <p><FileRef path="vite.config.ts" /> injects the API key via <code>define: {'{'} 'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY) {'}'}</code>.</p>
      </div>
    </div>
  );
}