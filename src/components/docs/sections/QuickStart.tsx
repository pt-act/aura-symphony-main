import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Setup</span>
      <h2>Quick Start</h2>
      <div className="markdown-body">
        <h3>Prerequisites</h3>
        <ul>
          <li>Node.js 18+ (22 recommended)</li>
          <li>A Google Gemini API key — <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">get one here</a></li>
          <li>Python 3.12+ (for vector search backend, optional)</li>
          <li>Docker (for full backend stack, optional)</li>
        </ul>

        <h3>1. Clone & Install</h3>
        <CodeBlock language="bash" code={`git clone <repo-url> && cd aura-symphony
npm install`} />

        <h3>2. Environment Setup</h3>
        <CodeBlock language="bash" code={`cp .env.example .env
# Edit .env and add:
GEMINI_API_KEY=AIzaSy...your_actual_key`} />

        <Callout type="tip"><strong>Alternative:</strong> Skip the <code>.env</code> file entirely — open the app, click the ⚙️ <strong>Settings</strong> icon, and add your API key in the <strong>AI Provider Settings</strong> panel. This is the recommended approach as keys stay in <code>localStorage</code> and are never embedded in the build.</Callout>

        <Callout type="info">If using <code>.env</code>: Vite reads <code>GEMINI_API_KEY</code> and injects it as <code>process.env.API_KEY</code> at build time via the <code>define</code> config in <code>vite.config.ts</code>. This is used as a fallback when no in-app provider is configured.</Callout>

        <h3>3. Start Development Server</h3>
        <CodeBlock language="bash" code={`npm run dev
# App runs at http://localhost:3000`} />

        <h3>4. (Optional) Start Backend Services</h3>
        <CodeBlock language="bash" code={`# Full stack with Docker Compose
docker compose up -d

# Or individual services:
cd backend/vector-search && pip install -r requirements.txt && uvicorn server:app --port 3001
cd backend/graph-knowledge && npm install && node server-sqlite.js
cd backend/media-pipeline && npm install && node server.js`} />

        <h3>Available Scripts</h3>
        <PropTable rows={[
          { name: 'npm run dev', type: 'command', desc: 'Start Vite dev server with HMR' },
          { name: 'npm run build', type: 'command', desc: 'Production build to dist/' },
          { name: 'npm run preview', type: 'command', desc: 'Preview production build locally' },
          { name: 'npm run lint', type: 'command', desc: 'TypeScript type checking (tsc --noEmit)' },
          { name: 'npm test', type: 'command', desc: 'Run Vitest unit tests' },
        ]} />
      </div>
    </div>
  );
}