import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Overview</span>
      <h2>Introduction to Aura Symphony</h2>
      <div className="markdown-body">
        <p>Aura Symphony is a <strong>zero-surface, multi-agent platform</strong> for deep video analysis, generative media creation, and adaptive learning. It replaces traditional tool-based UIs with an orchestral paradigm: you speak your intent, and a central AI — the <strong>Conductor</strong> — delegates work to specialized agents called <strong>Virtuosos</strong>.</p>

        <h3>Core Principles</h3>
        <ul>
          <li><strong>Zero-Surface Interaction</strong> — No menus, no panels. Speak or type your intent. The Conductor handles routing.</li>
          <li><strong>Multi-Agent Orchestration</strong> — Seven specialized agents (Conductor, Visionary, Scholar, Artisan, Analyst, Chronicler, Critic) collaborate via the Symphony Bus.</li>
          <li><strong>Event-Driven Architecture</strong> — All agent communication flows through the <code>SymphonyBus</code>, an <code>EventTarget</code>-based event bus with task lifecycle tracking.</li>
          <li><strong>Defense-in-Depth AI Safety</strong> — Zod schema validation on all LLM function calls + Critic agent adversarial quality gate + Valhalla static analysis.</li>
          <li><strong>Professional Output</strong> — Export to FCPXML (Final Cut Pro), EDL, CSV, Markdown, PDF. NLE-grade timecode handling.</li>
        </ul>

        <h3>Technology Stack</h3>
        <PropTable rows={[
          { name: 'Frontend', type: 'React 19 + Vite 6', desc: 'SPA with TypeScript, Framer Motion, D3, Lucide icons', default: '—' },
          { name: 'AI SDK', type: '@google/genai', desc: 'Gemini 2.5 Pro/Flash, Veo 3.1, Imagen 4.0', default: '—' },
          { name: 'Auth & DB', type: 'Firebase', desc: 'Firestore, Firebase Auth (Google OAuth)', default: '—' },
          { name: 'Vector Search', type: 'FastAPI + ChromaDB', desc: 'Python backend for semantic video search', default: 'Port 3001' },
          { name: 'Graph DB', type: 'SQLite / Neo4j', desc: 'Concept relationship traversal for DLP', default: 'Port 4004' },
          { name: 'Media Pipeline', type: 'Express + FFmpeg', desc: 'Cloud-side frame extraction and transcription', default: 'Port 3002' },
          { name: 'Validation', type: 'Zod 4', desc: 'Runtime schema validation for all Conductor function calls', default: '—' },
        ]} />
      </div>
    </div>
  );
}