import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Book, Code, Cpu, Layers, Terminal,
  Music, Eye, Palette, Search, Mic, Zap, Video, Wand2,
  FileText, Shield, GraduationCap, Globe, Database,
  Server, Settings, ChevronRight, ChevronDown, Hash,
  GitBranch, Activity, AlertTriangle, CheckCircle,
  Package, Workflow, Braces, Plug, HardDrive, Lock,
  Network, TestTube, Rocket, BookOpen, Radio, ArrowRight
} from 'lucide-react';
import './DocsPage.css';

/* ═══════════════════════════════════════════════════════════════════
   NAVIGATION STRUCTURE
   ═══════════════════════════════════════════════════════════════════ */

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const NAV_TREE: NavItem[] = [
  {
    key: 'getting-started', label: 'Getting Started', icon: <Rocket size={15} />,
    children: [
      { key: 'introduction', label: 'Introduction', icon: <Book size={14} /> },
      { key: 'quickstart', label: 'Quick Start', icon: <Zap size={14} /> },
      { key: 'project-structure', label: 'Project Structure', icon: <GitBranch size={14} /> },
      { key: 'configuration', label: 'Configuration', icon: <Settings size={14} /> },
    ],
  },
  {
    key: 'architecture', label: 'Architecture', icon: <Layers size={15} />,
    children: [
      { key: 'system-overview', label: 'System Overview', icon: <Network size={14} /> },
      { key: 'symphony-bus', label: 'Symphony Bus', icon: <Radio size={14} /> },
      { key: 'task-lifecycle', label: 'Task Lifecycle', icon: <Activity size={14} /> },
      { key: 'event-reference', label: 'Event Reference', icon: <Braces size={14} /> },
    ],
  },
  {
    key: 'virtuosos', label: 'Virtuosos', icon: <Music size={15} />,
    children: [
      { key: 'virtuoso-registry', label: 'Registry & Profiles', icon: <Database size={14} /> },
      { key: 'conductor', label: 'The Conductor', icon: <Music size={14} /> },
      { key: 'visionary', label: 'The Visionary', icon: <Eye size={14} /> },
      { key: 'scholar', label: 'The Scholar', icon: <Globe size={14} /> },
      { key: 'artisan', label: 'The Artisan', icon: <Palette size={14} /> },
      { key: 'analyst', label: 'The Analyst', icon: <Cpu size={14} /> },
      { key: 'chronicler', label: 'The Chronicler', icon: <FileText size={14} /> },
      { key: 'critic', label: 'The Critic', icon: <Shield size={14} /> },
    ],
  },
  {
    key: 'conductor-ref', label: 'Conductor Reference', icon: <Wand2 size={15} />,
    children: [
      { key: 'function-declarations', label: 'Function Declarations', icon: <Code size={14} /> },
      { key: 'schema-validation', label: 'Schema Validation (Zod)', icon: <CheckCircle size={14} /> },
      { key: 'conductor-validator', label: 'Validation Middleware', icon: <AlertTriangle size={14} /> },
    ],
  },
  {
    key: 'hooks-ref', label: 'Hooks Reference', icon: <Workflow size={15} />,
    children: [
      { key: 'hook-useSymphony', label: 'useSymphony', icon: <Hash size={14} /> },
      { key: 'hook-useLensExecution', label: 'useLensExecution', icon: <Hash size={14} /> },
      { key: 'hook-useCriticGate', label: 'useCriticGate', icon: <Hash size={14} /> },
      { key: 'hook-useStreaming', label: 'useStreaming', icon: <Hash size={14} /> },
      { key: 'hook-useKnowledgeTracing', label: 'useKnowledgeTracing', icon: <Hash size={14} /> },
      { key: 'hook-usePerceptionEngine', label: 'usePerceptionEngine', icon: <Hash size={14} /> },
      { key: 'hook-useCustomVirtuosos', label: 'useCustomVirtuosos', icon: <Hash size={14} /> },
      { key: 'hook-useVectorSearch', label: 'useVectorSearch', icon: <Hash size={14} /> },
    ],
  },
  {
    key: 'advanced', label: 'Advanced Systems', icon: <Zap size={15} />,
    children: [
      { key: 'semantic-chunking', label: 'Semantic Chunking', icon: <Layers size={14} /> },
      { key: 'knowledge-tracing', label: 'Bayesian Knowledge Tracing', icon: <GraduationCap size={14} /> },
      { key: 'streaming-responses', label: 'Streaming Responses', icon: <Radio size={14} /> },
      { key: 'react-planner', label: 'ReAct Planner', icon: <Workflow size={14} /> },
      { key: 'worker-pool', label: 'WebWorker Pool', icon: <Cpu size={14} /> },
      { key: 'crdt-collaboration', label: 'CRDT Collaboration', icon: <Network size={14} /> },
      { key: 'clip-embeddings', label: 'CLIP Embeddings', icon: <Eye size={14} /> },
      { key: 'plugin-marketplace', label: 'Plugin Marketplace', icon: <Package size={14} /> },
      { key: 'federated-learning', label: 'Federated Learning', icon: <Globe size={14} /> },
      { key: 'offline-pwa', label: 'Offline-First PWA', icon: <HardDrive size={14} /> },
    ],
  },
  {
    key: 'backend', label: 'Backend Services', icon: <Server size={15} />,
    children: [
      { key: 'backend-overview', label: 'Service Overview', icon: <HardDrive size={14} /> },
      { key: 'api-proxy-service', label: 'API Proxy (Express)', icon: <Shield size={14} /> },
      { key: 'vector-search-service', label: 'Vector Search (Python)', icon: <Search size={14} /> },
      { key: 'graph-knowledge-service', label: 'Graph Knowledge (SQLite)', icon: <GitBranch size={14} /> },
      { key: 'media-pipeline-service', label: 'Media Pipeline (FFmpeg)', icon: <Video size={14} /> },
      { key: 'clip-embeddings-service', label: 'CLIP Embeddings (Python)', icon: <Eye size={14} /> },
      { key: 'docker-deployment', label: 'Docker & Compose', icon: <Package size={14} /> },
    ],
  },
  {
    key: 'data-models', label: 'Data Models', icon: <Database size={15} />,
    children: [
      { key: 'typescript-types', label: 'TypeScript Interfaces', icon: <Braces size={14} /> },
      { key: 'firestore-schema', label: 'Firestore Schema', icon: <Lock size={14} /> },
      { key: 'vector-chunk-model', label: 'Vector Chunk Model', icon: <Search size={14} /> },
      { key: 'graph-data-model', label: 'Graph Data Model', icon: <GitBranch size={14} /> },
    ],
  },
  {
    key: 'valhalla', label: 'Project Valhalla', icon: <Terminal size={15} />,
    children: [
      { key: 'valhalla-overview', label: 'Overview & PMDE', icon: <Terminal size={14} /> },
      { key: 'script-safety', label: 'Script Safety Analyzer', icon: <Shield size={14} /> },
      { key: 'ast-analyzer', label: 'AST Deep Analysis', icon: <Code size={14} /> },
    ],
  },
  {
    key: 'extensibility', label: 'Extensibility', icon: <Plug size={15} />,
    children: [
      { key: 'plugin-api', label: 'Plugin API', icon: <Plug size={14} /> },
      { key: 'custom-virtuosos', label: 'Custom Virtuosos', icon: <Wand2 size={14} /> },
      { key: 'provider-config', label: 'Provider Configuration', icon: <Settings size={14} /> },
    ],
  },
  {
    key: 'adaptive-learning', label: 'Adaptive Learning', icon: <GraduationCap size={15} />,
    children: [
      { key: 'dlp-overview', label: 'Digital Learner Profile', icon: <GraduationCap size={14} /> },
      { key: 'course-generation', label: 'Course Generation', icon: <BookOpen size={14} /> },
      { key: 'biofeedback', label: 'Biofeedback Integration', icon: <Activity size={14} /> },
    ],
  },
  {
    key: 'operations', label: 'Operations', icon: <Activity size={15} />,
    children: [
      { key: 'telemetry', label: 'Telemetry & Observability', icon: <Activity size={14} /> },
      { key: 'task-persistence', label: 'Task Persistence (IDB)', icon: <HardDrive size={14} /> },
      { key: 'ci-pipeline', label: 'CI/CD Pipeline', icon: <Rocket size={14} /> },
      { key: 'testing', label: 'Testing Strategy', icon: <TestTube size={14} /> },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════
   CODE BLOCK
   ═══════════════════════════════════════════════════════════════════ */

function CodeBlock({ code, language = 'typescript', title }: { code: string; language?: string; title?: string }) {
  return (
    <div className="code-block-wrapper">
      {title && <div className="code-block-title">{title}</div>}
      <pre className="code-block"><code>{code.trim()}</code></pre>
    </div>
  );
}

function PropTable({ rows }: { rows: Array<{ name: string; type: string; desc: string; default?: string }> }) {
  return (
    <div className="prop-table-wrapper">
      <table className="prop-table">
        <thead>
          <tr><th>Name</th><th>Type</th><th>Description</th><th>Default</th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.name}>
              <td><code>{r.name}</code></td>
              <td><code className="type-badge">{r.type}</code></td>
              <td>{r.desc}</td>
              <td>{r.default ? <code>{r.default}</code> : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Callout({ type = 'info', children }: { type?: 'info' | 'warn' | 'tip'; children: React.ReactNode }) {
  const icons = { info: <Book size={14} />, warn: <AlertTriangle size={14} />, tip: <CheckCircle size={14} /> };
  return <div className={`callout callout-${type}`}>{icons[type]}<div>{children}</div></div>;
}

function FileRef({ path }: { path: string }) {
  return <code className="file-ref">{path}</code>;
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN DOCS PAGE
   ═══════════════════════════════════════════════════════════════════ */

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('introduction');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['getting-started']));
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-expand parent when child selected
  useEffect(() => {
    for (const group of NAV_TREE) {
      if (group.children?.some(c => c.key === activeSection)) {
        setExpandedGroups(prev => new Set([...prev, group.key]));
        break;
      }
    }
  }, [activeSection]);

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const filteredNav = searchQuery.trim()
    ? NAV_TREE.map(g => ({
        ...g,
        children: g.children?.filter(c =>
          c.label.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(g => (g.children?.length ?? 0) > 0)
    : NAV_TREE;

  return (
    <div className="docs-container">
      <header className="docs-header">
        <div className="logo">
          <div className="logo-orb" />
          <h1>Aura Docs</h1>
          <span className="version-badge">v0.1.0</span>
        </div>
        <Link to="/" className="back-link"><ArrowLeft size={14} /> Back to Home</Link>
      </header>

      <div className="docs-layout">
        <aside className="docs-sidebar">
          <div className="sidebar-search">
            <Search size={13} />
            <input
              type="text"
              placeholder="Search docs…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <nav>
            {filteredNav.map(group => (
              <div key={group.key} className="nav-group">
                <button
                  className="nav-group-toggle"
                  onClick={() => toggleGroup(group.key)}
                >
                  {expandedGroups.has(group.key) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  {group.icon}
                  <span>{group.label}</span>
                </button>
                {expandedGroups.has(group.key) && group.children && (
                  <ul className="nav-children">
                    {group.children.map(child => (
                      <li key={child.key}>
                        <button
                          className={activeSection === child.key ? 'active' : ''}
                          onClick={() => setActiveSection(child.key)}
                        >
                          {child.icon} {child.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </nav>
        </aside>

        <main className="docs-content">
          {renderSection(activeSection)}
        </main>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION ROUTER
   ═══════════════════════════════════════════════════════════════════ */

function renderSection(key: string) {
  const sections: Record<string, () => React.ReactNode> = {
    'introduction': SectionIntroduction,
    'quickstart': SectionQuickStart,
    'project-structure': SectionProjectStructure,
    'configuration': SectionConfiguration,
    'system-overview': SectionSystemOverview,
    'symphony-bus': SectionSymphonyBus,
    'task-lifecycle': SectionTaskLifecycle,
    'event-reference': SectionEventReference,
    'virtuoso-registry': SectionVirtuosoRegistry,
    'conductor': SectionConductor,
    'visionary': SectionVisionary,
    'scholar': SectionScholar,
    'artisan': SectionArtisan,
    'analyst': SectionAnalyst,
    'chronicler': SectionChronicler,
    'critic': SectionCritic,
    'function-declarations': SectionFunctionDeclarations,
    'schema-validation': SectionSchemaValidation,
    'conductor-validator': SectionConductorValidator,
    'hook-useSymphony': SectionHookUseSymphony,
    'hook-useLensExecution': SectionHookUseLensExecution,
    'hook-useCriticGate': SectionHookUseCriticGate,
    'hook-useStreaming': SectionHookUseStreaming,
    'hook-useKnowledgeTracing': SectionHookUseKnowledgeTracing,
    'hook-usePerceptionEngine': SectionHookUsePerceptionEngine,
    'hook-useCustomVirtuosos': SectionHookUseCustomVirtuosos,
    'hook-useVectorSearch': SectionHookUseVectorSearch,
    'semantic-chunking': SectionSemanticChunking,
    'knowledge-tracing': SectionKnowledgeTracing,
    'streaming-responses': SectionStreamingResponses,
    'react-planner': SectionReActPlanner,
    'worker-pool': SectionWorkerPool,
    'crdt-collaboration': SectionCrdtCollaboration,
    'clip-embeddings': SectionClipEmbeddings,
    'plugin-marketplace': SectionPluginMarketplace,
    'federated-learning': SectionFederatedLearning,
    'offline-pwa': SectionOfflinePwa,
    'backend-overview': SectionBackendOverview,
    'api-proxy-service': SectionApiProxyService,
    'vector-search-service': SectionVectorSearchService,
    'graph-knowledge-service': SectionGraphKnowledgeService,
    'media-pipeline-service': SectionMediaPipelineService,
    'clip-embeddings-service': SectionClipEmbeddingsService,
    'docker-deployment': SectionDockerDeployment,
    'typescript-types': SectionTypescriptTypes,
    'firestore-schema': SectionFirestoreSchema,
    'vector-chunk-model': SectionVectorChunkModel,
    'graph-data-model': SectionGraphDataModel,
    'valhalla-overview': SectionValhallaOverview,
    'script-safety': SectionScriptSafety,
    'ast-analyzer': SectionAstAnalyzer,
    'plugin-api': SectionPluginApi,
    'custom-virtuosos': SectionCustomVirtuosos,
    'provider-config': SectionProviderConfig,
    'dlp-overview': SectionDlpOverview,
    'course-generation': SectionCourseGeneration,
    'biofeedback': SectionBiofeedback,
    'telemetry': SectionTelemetry,
    'task-persistence': SectionTaskPersistence,
    'ci-pipeline': SectionCiPipeline,
    'testing': SectionTesting,
  };
  const render = sections[key];
  return render ? render() : <div className="docs-article"><h2>Section not found</h2></div>;
}

/* ═══════════════════════════════════════════════════════════════════
   GETTING STARTED
   ═══════════════════════════════════════════════════════════════════ */

function SectionIntroduction() {
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

function SectionQuickStart() {
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

function SectionProjectStructure() {
  return (
    <div className="docs-article">
      <span className="article-label">Reference</span>
      <h2>Project Structure</h2>
      <div className="markdown-body">
        <CodeBlock title="Directory Layout" code={`aura-symphony/
├── backend/
│   ├── api-proxy/              # Gemini API proxy (Express, :3005)
│   │   ├── server.js           # Rate limiting, usage metering
│   │   └── server.test.js
│   ├── clip-embeddings/        # CLIP multimodal embeddings (FastAPI, :3006)
│   │   ├── server.py           # ViT-B/32 + ChromaDB
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   ├── graph-knowledge/        # SQLite graph service (Node.js/Express)
│   │   ├── server-sqlite.js    # SQLite impl with recursive CTEs
│   │   ├── server.js           # Neo4j impl (requires Neo4j)
│   │   └── server.test.js
│   ├── media-pipeline/         # FFmpeg processing service
│   │   ├── server.js           # Express + WebSocket
│   │   ├── server.test.js
│   │   └── websocket.test.js
│   └── vector-search/          # Semantic search (Python/FastAPI)
│       ├── server.py           # ChromaDB vector store
│       └── test_server.py
├── docs/
│   ├── AGENTS.md               # AI-First Design principles
│   ├── UI_UX.md                # Complete UI/UX specification
│   └── VISION.md               # Project vision & Pantheon architecture
├── e2e/
│   └── aura.spec.ts            # Playwright end-to-end tests
├── src/
│   ├── api/
│   │   ├── client.ts           # GoogleGenAI client factory
│   │   ├── api.ts              # Unified re-export barrel
│   │   ├── firebase.ts         # Firebase Auth helpers
│   │   ├── firebaseConfig.ts   # Firebase project config
│   │   ├── firestoreService.ts # Firestore CRUD operations
│   │   ├── valhalla.ts         # Valhalla command execution
│   │   └── virtuosos/          # ← Individual agent implementations
│   │       ├── conductor.ts    #   Intent parsing & delegation
│   │       ├── visionary.ts    #   Video/image analysis
│   │       ├── scholar.ts      #   Google Search grounding
│   │       ├── artisan.ts      #   Veo/Imagen generation
│   │       ├── analyst.ts      #   Course & structured reasoning
│   │       ├── chronicler.ts   #   TTS, transcription, export
│   │       └── critic.ts       #   Quality evaluation gate
│   ├── components/
│   │   ├── analysis/           # Video analysis UI (timeline, insights, charts)
│   │   ├── conductor/          # ConductorInput (command bar)
│   │   ├── course/             # Adaptive learning views
│   │   ├── creator/            # Creator Studio (presentations)
│   │   ├── docs/               # ← This documentation site
│   │   ├── landing/            # Landing page
│   │   ├── lenses/             # Lens palette & prompt modals
│   │   ├── settings/           # Provider settings UI
│   │   ├── shared/             # Modals, OrchestraVisualizer, LiveConversation
│   │   ├── valhalla/           # ValhallaGateway component
│   │   └── virtuosos/          # CustomVirtuosoBuilder
│   ├── hooks/                  # ← React hooks (state management)
│   │   ├── useKnowledgeTracing.ts  # BKT-based adaptive learning
│   │   ├── useStreaming.ts     # Streaming response hook
│   │   └── ...
│   ├── lib/                    # ← Core libraries & utilities
│   │   ├── crdt-collaboration.ts   # Yjs CRDT sessions
│   │   ├── clip-embeddings.ts      # Multimodal RAG client
│   │   ├── federated-learning.ts   # FedAvg + differential privacy
│   │   ├── knowledge-tracing.ts    # Bayesian Knowledge Tracing
│   │   ├── lens-handlers/          # Strategy pattern handlers
│   │   ├── offline-sync.ts         # PWA offline mutation queue
│   │   ├── plugin-marketplace.ts   # Plugin registry + sandbox
│   │   ├── react-planner.ts        # ReAct planning loop
│   │   ├── semantic-chunker.ts     # Adaptive semantic chunking
│   │   ├── valhalla-sandbox.ts     # Pyodide WASM execution
│   │   ├── worker-pool.ts          # WebWorker pool + work-stealing
│   │   └── ...
│   ├── services/
│   │   └── virtuosos.ts        # VIRTUOSO_REGISTRY (agent profiles)
│   ├── styles/
│   │   └── index.css           # Global styles
│   ├── workers/
│   │   └── media.worker.ts     # WebWorker for frame/PDF processing
│   ├── App.tsx                 # Router: / → Landing, /docs → Docs, /app → Workspace
│   ├── Workspace.tsx           # Main application shell
│   └── types.ts                # Shared TypeScript interfaces
├── docker-compose.yml          # Full backend orchestration
├── firestore.rules             # Security rules with domain validators
├── package.json
├── tsconfig.json
└── vite.config.ts`} />
      </div>
    </div>
  );
}

function SectionConfiguration() {
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

/* ═══════════════════════════════════════════════════════════════════
   ARCHITECTURE
   ═══════════════════════════════════════════════════════════════════ */

function SectionSystemOverview() {
  return (
    <div className="docs-article">
      <span className="article-label">Architecture</span>
      <h2>System Overview</h2>
      <div className="markdown-body">
        <p>Aura Symphony is a polyglot microservices architecture with a rich client frontend. The system decomposes into multiple tiers:</p>
        <CodeBlock title="Architecture Diagram" code={`┌─────────────────────────────────────────────────────────┐
│                 Frontend (React 19 + Vite 6)             │
│                                                          │
│  ┌──────────┐   ┌────────────────┐   ┌────────────────┐ │
│  │Conductor │◀─▶│  Symphony Bus  │◀─▶│ Virtuosos (7)  │ │
│  │  Input   │   │  (EventTarget) │   │ + Plugin Market │ │
│  └──────────┘   └───────┬────────┘   └────────────────┘ │
│                         │ Events / Commission Chains      │
│  ┌──────────────────────▼──────────────────────────────┐ │
│  │  Zod Validation · Critic Gate · ReAct Planner       │ │
│  │  BKT Knowledge Tracing · Streaming · CRDT (Yjs)    │ │
│  │  Worker Pool · Pyodide Sandbox · Offline Sync (PWA) │ │
│  │  Semantic Chunker · Federated Learning              │ │
│  └─────────────────────────────────────────────────────┘ │
└───┬──────────┬──────────┬──────────┬──────────┬──────────┘
    │REST      │REST      │WS+REST   │REST      │REST
┌───▼────┐ ┌───▼───┐ ┌────▼─────┐ ┌──▼──────┐ ┌─▼──────────┐
│ Vector │ │ Graph │ │  Media   │ │  API    │ │  CLIP      │
│ Search │ │ Know. │ │ Pipeline │ │ Proxy   │ │ Embeddings │
│ :3001  │ │ :4004 │ │ :3002/03 │ │ :3005   │ │ :3006      │
└────────┘ └───────┘ └──────────┘ └─────────┘ └────────────┘
               │                        │
┌──────────────▼────────────────────────▼──────────────────┐
│              Firebase (Auth + Firestore)                 │
│              Google Gemini API (via proxy or direct)      │
└──────────────────────────────────────────────────────────┘`} />

        <h3>Design Decisions</h3>
        <ul>
          <li><strong>API key security:</strong> A backend API proxy (<code>:3005</code>) keeps the Gemini key server-side with rate limiting and usage metering. Users can also configure keys via the in-app Settings panel (stored in <code>localStorage</code>). Direct browser-to-Gemini calls remain as a fallback.</li>
          <li><strong>Strategy-pattern dispatch:</strong> <code>useLensExecution</code> uses a handler registry where each lens type is an independent module. New lenses are added by creating a handler file and registering it.</li>
          <li><strong>Graceful degradation:</strong> All backend services are optional. When unavailable, the frontend falls back to browser-local alternatives (WebWorker for media, Gemini context-window for search, flat Firestore for DLP).</li>
          <li><strong>Polyglot backends:</strong> Python for vector search and CLIP embeddings (ML ecosystem), Node.js for I/O-intensive media pipeline and graph queries.</li>
          <li><strong>Real-time collaboration:</strong> Yjs CRDT enables conflict-free multi-user editing with WebSocket transport and IndexedDB persistence.</li>
          <li><strong>Offline-first:</strong> Service Worker caching + IndexedDB mutation queue enables full offline operation with background sync on reconnect.</li>
        </ul>
      </div>
    </div>
  );
}

function SectionSymphonyBus() {
  return (
    <div className="docs-article">
      <span className="article-label">Architecture</span>
      <h2>Symphony Bus</h2>
      <div className="markdown-body">
        <p>The <code>SymphonyBus</code> is the system's central nervous system — a custom event bus extending <code>EventTarget</code> that provides decoupled communication between all components and AI agents.</p>

        <p><FileRef path="src/lib/symphonyBus.ts" /></p>

        <CodeBlock title="SymphonyBus API" code={`class SymphonyBus extends EventTarget {
  // Subscribe to events
  listen(type: string, listener: EventListenerOrEventListenerObject): void;
  
  // Unsubscribe from events
  unlisten(type: string, listener: EventListenerOrEventListenerObject): void;
  
  // Dispatch typed events
  dispatch<T>(type: string, detail: T): void;
  
  // Commission a Virtuoso task (with telemetry)
  commission(virtuosoId: VirtuosoType, taskName: string, taskId?: string | number): string | number;
  
  // Report task result (success or error)
  reportResult(taskId: string | number, virtuosoId: VirtuosoType | string,
               success: boolean, result: unknown, durationMs?: number): void;
  
  // Chain a child task from a parent (agent-to-agent delegation)
  chainCommission(parentId: string | number, childVirtuoso: VirtuosoType,
                  childTaskName: string, context?: Record<string, unknown>): string;
}`} />

        <h3>Commission Chaining</h3>
        <p>The <code>chainCommission</code> method creates hierarchical task IDs of the form <code>parentId::childVirtuoso::randomId</code>, implicitly encoding a DAG of agent execution. This enables multi-step orchestration where one Virtuoso delegates sub-tasks to another.</p>

        <CodeBlock code={`// Example: Conductor delegates to Scholar
const parentId = symphonyBus.commission(VirtuosoType.CONDUCTOR, 'Process Query');
const childId = symphonyBus.chainCommission(
  parentId,
  VirtuosoType.SCHOLAR,
  'Web Research',
  { query: 'quantum computing breakthroughs 2026' }
);`} />

        <Callout type="info">The singleton <code>symphonyBus</code> instance is exported from the module and shared across the entire application. Import it with <code>{'import { symphonyBus } from "../lib/symphonyBus"'}</code>.</Callout>
      </div>
    </div>
  );
}

function SectionTaskLifecycle() {
  return (
    <div className="docs-article">
      <span className="article-label">Architecture</span>
      <h2>Task Lifecycle</h2>
      <div className="markdown-body">
        <p>Every Virtuoso operation follows a standardized lifecycle managed by the Symphony Bus:</p>

        <CodeBlock title="Task State Machine" code={`                ┌─────────────┐
                │   CREATED   │
                └──────┬──────┘
                       │ commission()
                ┌──────▼──────┐
                │   RUNNING   │◀─── TASK_START event
                └───┬─────┬───┘
                    │     │
           success  │     │  error
                    │     │
            ┌───────▼─┐ ┌─▼───────┐
            │ SUCCESS │ │  ERROR  │
            └────┬────┘ └────┬────┘
                 │           │
                 └─────┬─────┘
                       │ auto-clear after 5s
                 ┌─────▼─────┐
                 │  REMOVED  │
                 └───────────┘`} />

        <h3>Task Interface</h3>
        <CodeBlock code={`interface Task {
  id: string | number;
  name: string;
  virtuosoId: VirtuosoType;
  status: 'running' | 'success' | 'error';
  progress?: number;       // 0-100
  result?: unknown;
  error?: string;
  createdAt: number;       // Date.now()
}`} />

        <h3>Persistence</h3>
        <p>Tasks are persisted to IndexedDB (database: <code>aura-symphony</code>, store: <code>tasks</code>) so they survive page refreshes. Tasks older than 24 hours are automatically pruned. See <FileRef path="src/lib/task-persistence.ts" />.</p>
      </div>
    </div>
  );
}

function SectionEventReference() {
  return (
    <div className="docs-article">
      <span className="article-label">Architecture</span>
      <h2>Event Reference</h2>
      <div className="markdown-body">
        <h3>Core Events</h3>
        <PropTable rows={[
          { name: 'task:start', type: 'CustomEvent', desc: 'Fired when a Virtuoso is commissioned. Detail: { id, name, virtuosoId }' },
          { name: 'task:progress', type: 'CustomEvent', desc: 'Progress update during long-running tasks. Detail: { id, progress }' },
          { name: 'task:success', type: 'CustomEvent', desc: 'Task completed successfully. Detail: { id, result }' },
          { name: 'task:error', type: 'CustomEvent', desc: 'Task failed. Detail: { id, error: string }' },
          { name: 'commission:chain', type: 'CustomEvent', desc: 'Agent-to-agent delegation. Detail: { parentId, childId, childVirtuoso, childTaskName, context, createdAt }' },
        ]} />

        <h3>Application Events</h3>
        <PropTable rows={[
          { name: 'LAUNCH_VALHALLA', type: 'CustomEvent', desc: 'Requests Valhalla Gateway to open. Detail: { tool: string }' },
        ]} />

        <h3>Subscribing to Events</h3>
        <CodeBlock code={`import { symphonyBus, Events } from '../lib/symphonyBus';

symphonyBus.listen(Events.TASK_SUCCESS, (event: Event) => {
  const { id, result } = (event as CustomEvent).detail;
  console.log(\`Task \${id} completed:\`, result);
});`} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   VIRTUOSOS
   ═══════════════════════════════════════════════════════════════════ */

function SectionVirtuosoRegistry() {
  return (
    <div className="docs-article">
      <span className="article-label">Agents</span>
      <h2>Virtuoso Registry & Profiles</h2>
      <div className="markdown-body">
        <p>All Virtuoso profiles are defined in <FileRef path="src/services/virtuosos.ts" /> as the <code>VIRTUOSO_REGISTRY</code> — a mutable <code>Record&lt;string, VirtuosoProfile&gt;</code> that serves as the single source of truth for agent configuration.</p>

        <CodeBlock title="VirtuosoProfile Interface" code={`interface VirtuosoProfile {
  id: VirtuosoType | string;
  name: string;                  // "The Conductor"
  title: string;                 // "Orchestra Lead"
  model: string;                 // "gemini-2.5-pro"
  description: string;
  systemInstruction: string;     // System prompt for the LLM
  capabilities: string[];        // ["intent-parsing", "delegation"]
  color: string;                 // "#8AB4F8" (hex color for UI)
  icon: string;                  // Lucide icon name
  config?: VirtuosoConfig;       // Optional: tools, thinkingConfig
  userId?: string;               // Set for custom virtuosos
  createdAt?: string | FieldValue;
}`} />

        <h3>Built-in Virtuosos</h3>
        <PropTable rows={[
          { name: 'conductor', type: 'gemini-2.5-pro', desc: 'Intent parsing, task delegation, orchestration' },
          { name: 'visionary', type: 'gemini-2.5-pro', desc: 'Video/image analysis, object detection, PDF analysis' },
          { name: 'scholar', type: 'gemini-2.5-flash', desc: 'Google Search grounding, fact-checking, citations' },
          { name: 'artisan', type: 'veo-3.1-fast', desc: 'Video generation (Veo), image generation (Imagen 4.0), image editing' },
          { name: 'analyst', type: 'gemini-2.5-pro', desc: 'Course generation, structured reasoning, data extraction' },
          { name: 'chronicler', type: 'gemini-2.5-flash', desc: 'TTS (text-to-speech), audio transcription, report generation' },
          { name: 'critic', type: 'gemini-2.5-pro', desc: 'Quality evaluation, hallucination detection, adversarial feedback' },
        ]} />

        <Callout type="tip">Custom Virtuosos are registered at runtime by mutating <code>VIRTUOSO_REGISTRY[customId] = profile</code>. The Conductor dynamically reads all registry entries to build its available lens list.</Callout>
      </div>
    </div>
  );
}

function VirtuosoDoc({ label, name, file, model, capabilities, configNote, apiSignatures, description }: {
  label: string; name: string; file: string; model: string; capabilities: string[];
  configNote?: string; apiSignatures: string; description: string;
}) {
  return (
    <div className="docs-article">
      <span className="article-label">{label}</span>
      <h2>{name}</h2>
      <div className="markdown-body">
        <p>{description}</p>
        <p><FileRef path={file} /></p>
        <PropTable rows={[
          { name: 'Model', type: model, desc: 'Default model (overridden by active provider config)' },
          { name: 'Capabilities', type: 'string[]', desc: capabilities.join(', ') },
        ]} />
        {configNote && <Callout type="info">{configNote}</Callout>}
        <h3>API Signatures</h3>
        <CodeBlock code={apiSignatures} />
      </div>
    </div>
  );
}

function SectionConductor() {
  return <VirtuosoDoc
    label="Agent"
    name="The Conductor"
    file="src/api/virtuosos/conductor.ts"
    model="gemini-2.5-pro"
    capabilities={['intent-parsing', 'delegation', 'orchestration']}
    configNote="The Conductor dynamically injects all other Virtuosos' descriptions into its system prompt so it knows what agents are available for delegation."
    description="The Conductor is the central intelligence of the system. It parses natural language user queries, selects the appropriate Virtuoso(s), and executes tasks via Gemini Function Calling. It supports 17 function declarations (see Conductor Reference)."
    apiSignatures={`// Intent parsing with function calling
async function runConductorQuery(query: string): Promise<GenerateContentResponse>

// Multi-turn conversational chat
async function runChat(
  message: string,
  history: ChatMessage[],
  context?: string
): Promise<string>`}
  />;
}

function SectionVisionary() {
  return <VirtuosoDoc
    label="Agent"
    name="The Visionary"
    file="src/api/virtuosos/visionary.ts"
    model="gemini-2.5-pro"
    capabilities={['video-analysis', 'image-analysis', 'object-detection', 'pdf-analysis']}
    configNote="When a custom Virtuoso has Google Search tools configured, the Visionary merges them into its tool config with includeServerSideToolInvocations: true."
    description="The Visionary specializes in multimodal analysis of video frames, images, and PDF documents. It sends extracted frames as inline base64 data alongside text prompts to Gemini's multimodal endpoint."
    apiSignatures={`// PDF analysis (extracts text via WebWorker, then queries Gemini)
async function runPdfQuery(
  prompt: string,
  file: { mimeType: string; data: string }
): Promise<string>

// Video/image analysis with function calling
async function runVideoQuery(
  prompt: string,
  frames: string[],          // base64 JPEG frames
  functions: FunctionDeclaration[],
  useThinkingBudget?: boolean,  // Enables 32K thinking tokens
  virtuosoId?: string        // Override virtuoso identity
): Promise<GenerateContentResponse>`}
  />;
}

function SectionScholar() {
  return <VirtuosoDoc
    label="Agent"
    name="The Scholar"
    file="src/api/virtuosos/scholar.ts"
    model="gemini-2.5-flash"
    capabilities={['web-search', 'fact-checking', 'grounding']}
    configNote='Uses the Google Search grounding tool: config.tools = [{ googleSearch: {} }]. The response includes groundingMetadata with source URLs.'
    description="The Scholar grounds analysis in real-world facts using Google Search. It returns both the generated text and an array of grounding chunks with source URLs for citation."
    apiSignatures={`async function runSearchGroundedQuery(
  prompt: string
): Promise<{
  text: string;
  sources: GroundingChunk[];  // { web: { uri, title } }
}>`}
  />;
}

function SectionArtisan() {
  return <VirtuosoDoc
    label="Agent"
    name="The Artisan"
    file="src/api/virtuosos/artisan.ts"
    model="veo-3.1-fast-generate-preview"
    capabilities={['video-generation', 'image-generation', 'media-editing']}
    configNote="Video generation is non-blocking — it runs in the background via performVideoGeneration() and dispatches results via the Symphony Bus when complete. Image generation and editing are synchronous."
    description="The Artisan creates new media assets using Veo 3.1 (video generation), Imagen 4.0 (image generation), and Gemini Flash Image (image editing with multimodal output)."
    apiSignatures={`// Video generation (async, background)
function generateVideo(
  taskId: string | number,
  prompt: string,
  aspectRatio: '16:9' | '9:16',
  image?: { mimeType: string; data: string }  // Optional reference image
): string | number

// Image generation via Imagen 4.0
async function generateImage(
  prompt: string,
  aspectRatio: '1:1' | '16:9' | '9:16'
): Promise<string>  // Returns data:image/jpeg;base64,...

// Image editing via Gemini Flash Image
async function editImage(
  prompt: string,
  image: { mimeType: string; data: string }
): Promise<string>  // Returns data:image/png;base64,...`}
  />;
}

function SectionAnalyst() {
  return <VirtuosoDoc
    label="Agent"
    name="The Analyst"
    file="src/api/virtuosos/analyst.ts"
    model="gemini-2.5-pro"
    capabilities={['reasoning', 'data-extraction', 'synthesis', 'course-generation']}
    configNote="Uses Gemini's thinkingConfig with includeThinkingProcess: true for transparent chain-of-thought reasoning. Course generation uses responseMimeType: 'application/json' with a detailed responseSchema for structured output."
    description="The Analyst performs structured reasoning, data extraction, and generates adaptive courses from video content. It produces JSON-structured output with summaries, key moments, and quizzes, all linked to video timecodes."
    apiSignatures={`// Generate structured course from video frames
async function generateCourseModules(
  frames: string[]  // base64 JPEG frames
): Promise<{
  summary: Array<{ time: string; text: string }>;
  keyMoments: Array<{ time: string; text: string }>;
  quiz: Array<{
    question: string;
    options: string[];
    answer: string;
    explanation: string;
    time: string;  // "HH:MM:SS"
  }>;
}>`}
  />;
}

function SectionChronicler() {
  return <VirtuosoDoc
    label="Agent"
    name="The Chronicler"
    file="src/api/virtuosos/chronicler.ts"
    model="gemini-2.5-flash"
    capabilities={['summarization', 'report-generation', 'export-formatting', 'tts', 'transcription']}
    description="The Chronicler handles documentation, speech synthesis, and audio transcription. It uses Gemini's TTS model for voice generation and the Flash model for audio-to-text transcription."
    apiSignatures={`// Text-to-speech via Gemini TTS
async function generateSpeech(text: string): Promise<string>  // base64 audio

// Audio transcription
async function transcribeAudio(
  audio: { mimeType: string; data: string }
): Promise<string>  // Transcribed text`}
  />;
}

function SectionCritic() {
  return (
    <div className="docs-article">
      <span className="article-label">Agent</span>
      <h2>The Critic</h2>
      <div className="markdown-body">
        <p>The Critic is an adversarial quality gate that evaluates all Virtuoso output before delivery. It scores on three dimensions (Relevance, Factual Consistency, Quality) and can trigger correction loops.</p>
        <p><FileRef path="src/api/virtuosos/critic.ts" /></p>

        <h3>Evaluation Dimensions</h3>
        <PropTable rows={[
          { name: 'relevance', type: '0-10', desc: 'Does the output directly address the user\'s request?' },
          { name: 'factualConsistency', type: '0-10', desc: 'Are claims accurate and supported?' },
          { name: 'quality', type: '0-10', desc: 'Is the output well-structured, useful, and complete?' },
        ]} />
        <p>A score of <strong>7+</strong> on all three dimensions is a <strong>PASS</strong>. Below 7 on any dimension triggers correction.</p>

        <h3>API</h3>
        <CodeBlock code={`// Evaluate output quality
async function evaluateOutput(
  originalPrompt: string,
  virtuosoOutput: string,
  virtuosoType: string
): Promise<CriticEvaluation>

interface CriticEvaluation {
  passed: boolean;
  score: number;          // 0-100 composite
  relevance: number;      // 0-10
  factualConsistency: number;
  quality: number;
  feedback: string;
  specificIssues: string[];
  timestamp: string;
}

// Build correction prompt for retry
function buildCriticCorrectionPrompt(
  originalPrompt: string,
  evaluation: CriticEvaluation,
  virtuosoType: string
): string`} />

        <Callout type="warn">On Critic failure (e.g., network error), the system defaults to <strong>pass</strong> with a score of 50 to avoid blocking the user. This is a deliberate fail-open strategy.</Callout>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CONDUCTOR REFERENCE
   ═══════════════════════════════════════════════════════════════════ */

function SectionFunctionDeclarations() {
  return (
    <div className="docs-article">
      <span className="article-label">Conductor</span>
      <h2>Function Declarations</h2>
      <div className="markdown-body">
        <p>The Conductor has <strong>17 function declarations</strong> registered with Gemini's Function Calling API. These define the actions the LLM can invoke.</p>
        <p><FileRef path="src/lib/conductor-functions.ts" /></p>

        <h3>Content Analysis</h3>
        <PropTable rows={[
          { name: 'generate_summary', type: '{}', desc: 'Summarize video content into a paragraph' },
          { name: 'list_key_moments', type: '{}', desc: 'Extract key moments as bullet points' },
          { name: 'generate_instructions', type: '{}', desc: 'Create step-by-step guide from video' },
          { name: 'create_haiku', type: '{}', desc: 'Write a haiku inspired by the video' },
          { name: 'search_video', type: '{query: string}', desc: 'Semantic search within video for content/objects/actions' },
          { name: 'custom_video_analysis', type: '{instructions: string}', desc: 'Custom analysis with specific instructions' },
        ]} />

        <h3>Content Creation</h3>
        <PropTable rows={[
          { name: 'create_mermaid_diagram', type: '{topic: string}', desc: 'Generate Mermaid.js diagram' },
          { name: 'create_chart', type: '{metric: string}', desc: 'Generate chart data for a metric over time' },
          { name: 'generate_image', type: '{prompt, aspect_ratio?}', desc: 'Generate image via Imagen 4.0' },
          { name: 'edit_image', type: '{prompt: string}', desc: 'Edit uploaded image with text instructions' },
          { name: 'generate_video', type: '{prompt, aspect_ratio?}', desc: 'Generate video via Veo 3.1' },
        ]} />

        <h3>Playback & Annotation</h3>
        <PropTable rows={[
          { name: 'seekToTime', type: '{timeInSeconds: number}', desc: 'Seek video to specific timestamp' },
          { name: 'setPlaybackSpeed', type: '{speed: number}', desc: 'Set playback speed (0.5, 1, 1.5, 2)' },
          { name: 'addAnnotation', type: '{timeInSeconds, text}', desc: 'Add annotation at timestamp' },
          { name: 'setSelectionRange', type: '{startTime, endTime}', desc: 'Set timeline selection range' },
        ]} />

        <h3>External</h3>
        <PropTable rows={[
          { name: 'web_search', type: '{query: string}', desc: 'Search the web via Scholar' },
          { name: 'launch_valhalla', type: '{tool: string}', desc: 'Open Valhalla Gateway for external tool' },
          { name: 'applyLens', type: '{lensName, customPrompt?}', desc: 'Apply a Virtuoso lens to video' },
        ]} />
      </div>
    </div>
  );
}

function SectionSchemaValidation() {
  return (
    <div className="docs-article">
      <span className="article-label">Conductor</span>
      <h2>Schema Validation (Zod)</h2>
      <div className="markdown-body">
        <p>Every Conductor function call is validated against a Zod schema before execution. This prevents hallucinated parameters from reaching application state.</p>
        <p><FileRef path="src/lib/conductor-schemas.ts" /></p>

        <h3>Schema Design Principles</h3>
        <ul>
          <li><strong><code>.strict()</code></strong> on all schemas — rejects any extra properties the LLM hallucinates.</li>
          <li><strong><code>.min(1)</code></strong> on required strings — prevents empty string arguments.</li>
          <li><strong><code>.min(0)</code></strong> on timestamps — prevents negative time values.</li>
          <li><strong><code>.refine()</code></strong> on ranges — ensures <code>endTime &gt; startTime</code>.</li>
        </ul>

        <CodeBlock title="Example: SetSelectionRange Schema" code={`const SetSelectionRangeSchema = z
  .object({
    startTime: z.number().min(0, 'startTime must be >= 0'),
    endTime: z.number().min(0, 'endTime must be >= 0'),
  })
  .refine(data => data.endTime > data.startTime, {
    message: 'endTime must be greater than startTime',
    path: ['endTime'],
  });`} />

        <h3>Schema Registry</h3>
        <p>All schemas are registered in <code>conductorSchemas: Record&lt;string, z.ZodSchema&gt;</code>, mapping function names to their validation schemas. This enables O(1) lookup in the validation middleware.</p>
      </div>
    </div>
  );
}

function SectionConductorValidator() {
  return (
    <div className="docs-article">
      <span className="article-label">Conductor</span>
      <h2>Validation Middleware</h2>
      <div className="markdown-body">
        <p>The validation middleware sits between the LLM response and function execution, catching malformed calls before they reach state.</p>
        <p><FileRef path="src/lib/conductor-validator.ts" /></p>

        <CodeBlock title="Validation Flow" code={`LLM Response → validateConductorCall(name, args) → {
  success: true  → execute function
  success: false → buildCorrectionPrompt() → re-prompt LLM
  unknown func   → "Conductor hallucinated a tool that does not exist"
}`} />

        <h3>API</h3>
        <CodeBlock code={`function validateConductorCall(
  functionName: string,
  args: unknown
): ValidationResult

type ValidationResult =
  | { success: true; functionName: string; args: T }
  | { success: false; functionName: string; errors: ZodIssue[]; errorMessage: string }

function buildCorrectionPrompt(
  functionName: string,
  originalArgs: unknown,
  errors: ZodIssue[]
): string  // Prompt for LLM self-correction`} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HOOKS REFERENCE
   ═══════════════════════════════════════════════════════════════════ */

function SectionHookUseSymphony() {
  return (
    <div className="docs-article">
      <span className="article-label">Hook</span>
      <h2>useSymphony</h2>
      <div className="markdown-body">
        <p>Subscribes to the Symphony Bus and maintains a reactive list of all active tasks. Auto-clears completed/errored tasks after 5 seconds. Restores persisted tasks from IndexedDB on mount.</p>
        <p><FileRef path="src/hooks/useSymphony.ts" /></p>
        <CodeBlock code={`const { tasks } = useSymphony();
// tasks: Task[] — all active tasks with status, progress, result`} />
      </div>
    </div>
  );
}

function SectionHookUseLensExecution() {
  return (
    <div className="docs-article">
      <span className="article-label">Hook</span>
      <h2>useLensExecution</h2>
      <div className="markdown-body">
        <p>Strategy-pattern dispatcher for all lens/mode execution. Routes to the appropriate handler module based on the selected lens type. Each lens type is an independent handler file registered in a central registry.</p>
        <p><FileRef path="src/hooks/useLensExecution.ts" /> · <FileRef path="src/lib/lens-handlers/registry.ts" /></p>
        <CodeBlock code={`const { handleSelectLens } = useLensExecution(deps);

// Execute a lens:
await handleSelectLens('Deep Analysis');                    // Built-in lens
await handleSelectLens('Custom', 'Analyze color theory');   // Custom prompt
await handleSelectLens('PDF Analysis', undefined, pdfFile); // PDF upload
await handleSelectLens('Chat', 'Hello');                    // Conversational
await handleSelectLens('Generate Video', 'A sunset');       // Artisan

// Handler modules (src/lib/lens-handlers/):
//   pdf-handler.ts, chat-handler.ts, media-handler.ts,
//   search-handler.ts, course-handler.ts, video-analysis-handler.ts
// Adding a new lens: create handler file → add to handlers[] in registry
// Runtime extensibility: registerHandler() for plugins`} />
        <Callout type="info">Text-based lens output is gated through the <code>useCriticGate</code> hook before display. If the Critic rejects the output, it triggers up to 2 retry cycles.</Callout>
      </div>
    </div>
  );
}

function SectionHookUseCriticGate() {
  return (
    <div className="docs-article">
      <span className="article-label">Hook</span>
      <h2>useCriticGate</h2>
      <div className="markdown-body">
        <p>Provides a reusable quality gate for any Virtuoso output. Runs the Critic evaluation and optionally triggers retry loops with correction prompts.</p>
        <p><FileRef path="src/hooks/useCriticGate.ts" /></p>
        <CodeBlock code={`const { criticGate, lastEvaluation, isEvaluating } = useCriticGate();

const result = await criticGate(
  userPrompt,         // Original user request
  virtuosoOutput,     // Output to evaluate
  'Analyst',          // Which Virtuoso produced it
  retryFn?            // Optional: (correctionPrompt) => Promise<string>
);

// result: { output, evaluation, wasRevised }`} />
        <p>Max retries: <strong>2</strong>. If the Critic still fails after retries, the last output is returned anyway.</p>
      </div>
    </div>
  );
}

function SectionHookUsePerceptionEngine() {
  return (
    <div className="docs-article">
      <span className="article-label">Hook</span>
      <h2>usePerceptionEngine</h2>
      <div className="markdown-body">
        <p>Real-time facial expression detection using <code>face-api.js</code>. Loads TinyFaceDetector and FaceExpressionNet models, then runs detection every 1.5 seconds on the video element.</p>
        <p><FileRef path="src/hooks/usePerceptionEngine.ts" /></p>
        <CodeBlock code={`const { isLoading, expression } = usePerceptionEngine(videoRef);

// expression: { type: 'happy' | 'sad' | 'neutral' | ..., probability: 0.0-1.0 } | null`} />
        <Callout type="info">Models are loaded from <code>https://justadudewhohacks.github.io/face-api.js/weights</code>. The hook only activates when the video element has <code>readyState &gt;= 3</code>.</Callout>
      </div>
    </div>
  );
}

function SectionHookUseCustomVirtuosos() {
  return (
    <div className="docs-article">
      <span className="article-label">Hook</span>
      <h2>useCustomVirtuosos</h2>
      <div className="markdown-body">
        <p>CRUD operations for user-defined custom Virtuosos, persisted to Firestore. Validates profiles before saving and registers them in the runtime <code>VIRTUOSO_REGISTRY</code>.</p>
        <p><FileRef path="src/hooks/useCustomVirtuosos.ts" /></p>
        <CodeBlock code={`const { customVirtuosos, saveCustomVirtuoso, deleteCustomVirtuoso } = useCustomVirtuosos(user);

// Validation: id must start with 'custom_', cannot overwrite built-in Virtuosos`} />
      </div>
    </div>
  );
}

function SectionHookUseVectorSearch() {
  return (
    <div className="docs-article">
      <span className="article-label">Hook</span>
      <h2>useVectorSearch</h2>
      <div className="markdown-body">
        <p>Wraps the vector search client library for React components. Provides semantic search across indexed video content with automatic fallback to Gemini context-window search when the backend is unavailable.</p>
        <p><FileRef path="src/hooks/useVectorSearch.ts" /></p>
        <p>See <strong>Vector Search Service</strong> under Backend Services for the full client API.</p>
      </div>
    </div>
  );
}

function SectionHookUseStreaming() {
  return (
    <div className="docs-article">
      <span className="article-label">Hook</span>
      <h2>useStreaming</h2>
      <div className="markdown-body">
        <p>Pipes streaming Gemini responses directly into Insight state, reducing perceived latency by 60-80%. Supports all 6 Virtuoso APIs with <code>AbortController</code> cancellation.</p>
        <p><FileRef path="src/hooks/useStreaming.ts" /> · <FileRef path="src/api/streaming.ts" /></p>
        <CodeBlock code={`const { streamResponse, isStreaming, cancel } = useStreaming();

// StreamOptions:
//   onChunk(text: string)    — called per token
//   onComplete(full: string) — called when stream ends
//   onError(err: Error)      — called on failure
//   signal: AbortSignal      — for cancellation`} />
      </div>
    </div>
  );
}

function SectionHookUseKnowledgeTracing() {
  return (
    <div className="docs-article">
      <span className="article-label">Hook</span>
      <h2>useKnowledgeTracing</h2>
      <div className="markdown-body">
        <p>React hook wrapping the Bayesian Knowledge Tracing engine. Persists BKT state to <code>localStorage</code>, provides adaptive content recommendations, and migrates from flat DLP mastery scores.</p>
        <p><FileRef path="src/hooks/useKnowledgeTracing.ts" /> · <FileRef path="src/lib/knowledge-tracing.ts" /></p>
        <CodeBlock code={`const { updateMastery, getRecommendations, bktState } = useKnowledgeTracing(userId);

// updateMastery(concept, correct, prerequisites?)
// getRecommendations(count?) → ContentRecommendation[]
//   reasons: 'low-mastery' | 'high-uncertainty' | 'prerequisite-gap' | 'decay'`} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ADVANCED SYSTEMS (Phases 2-3)
   ═══════════════════════════════════════════════════════════════════ */

function SectionSemanticChunking() {
  return (
    <div className="docs-article">
      <span className="article-label">Advanced</span>
      <h2>Adaptive Semantic Chunking</h2>
      <div className="markdown-body">
        <p>Replaces fixed 100-word windows with topic-boundary-aware chunking. Uses a 5-step pipeline with no API calls — all embeddings computed locally via FNV-1a hash-based bigrams.</p>
        <p><FileRef path="src/lib/semantic-chunker.ts" /></p>
        <CodeBlock code={`Pipeline:
  1. Sentence splitting (regex-based)
  2. FNV-1a hash-based bigram embedding (128-dim)
  3. Pairwise cosine similarity between adjacent sentences
  4. Percentile-based break detection (low similarity = topic change)
  5. Merge/balance (enforce min/max chunk sizes)

// API
adaptiveChunkTranscript(transcript, videoId, config?): VideoChunk[]
chunkTranscript(transcript, videoId): VideoChunk[]  // wrapper
chunkTranscriptFixed(...)  // legacy fixed chunker preserved`} />
      </div>
    </div>
  );
}

function SectionKnowledgeTracing() {
  return (
    <div className="docs-article">
      <span className="article-label">Advanced</span>
      <h2>Bayesian Knowledge Tracing</h2>
      <div className="markdown-body">
        <p>Full BKT implementation with 4 parameters per knowledge component: <code>p(L₀)</code> initial mastery, <code>p(T)</code> transition, <code>p(G)</code> guess, <code>p(S)</code> slip. Extensions include temporal decay, prerequisite-aware scaling, and confidence intervals.</p>
        <p><FileRef path="src/lib/knowledge-tracing.ts" /></p>
        <CodeBlock code={`BKT Parameters (per concept):
  p(L₀) = 0.1   // initial probability of mastery
  p(T)  = 0.2   // probability of learning per opportunity
  p(G)  = 0.25  // probability of correct guess
  p(S)  = 0.1   // probability of slip

Extensions:
  - Exponential temporal decay (14-day half-life)
  - Prerequisite-aware transit scaling
  - Agresti-Coull confidence intervals
  - Adaptive content selection engine (4 recommendation reasons)`} />
      </div>
    </div>
  );
}

function SectionStreamingResponses() {
  return (
    <div className="docs-article">
      <span className="article-label">Advanced</span>
      <h2>Streaming Responses</h2>
      <div className="markdown-body">
        <p>Uses Gemini's <code>generateContentStream</code> to display partial results as they arrive. Wrappers exist for all 6 Virtuoso APIs with <code>StreamOptions</code> callbacks and <code>AbortController</code> cancellation.</p>
        <p><FileRef path="src/api/streaming.ts" /></p>
        <CodeBlock code={`// Streaming wrappers for each Virtuoso:
streamPdfAnalysis(frames, query, options)
streamSearch(query, options)
streamChat(message, history, options)
streamVideoAnalysis(frames, lensType, query, options)
streamCourse(frames, options)
streamTranscription(frames, options)

// Generic:
streamGenerate(model, contents, options)`} />
      </div>
    </div>
  );
}

function SectionReActPlanner() {
  return (
    <div className="docs-article">
      <span className="article-label">Advanced</span>
      <h2>ReAct Hierarchical Planner</h2>
      <div className="markdown-body">
        <p>Reason + Act loop for complex multi-step queries. The Conductor detects complexity via <code>isComplexQuery()</code> heuristic and routes to a ReAct loop instead of single-pass dispatch.</p>
        <p><FileRef path="src/lib/react-planner.ts" /></p>
        <CodeBlock code={`ReAct Loop:
  THINK → PLAN → ACT → OBSERVE → ADAPT (repeat)

  isComplexQuery(query): boolean  // heuristic routing
  generatePlan(query, context): Plan  // JSON-mode LLM response
  executeStep(step): StepResult  // executeValidatedCall
  adaptPlan(plan, observation): Plan  // replanning on failure

Bounds: MAX_ITERATIONS=6, MAX_ACTIONS=8
Simple queries → existing single-pass dispatcher`} />
      </div>
    </div>
  );
}

function SectionWorkerPool() {
  return (
    <div className="docs-article">
      <span className="article-label">Advanced</span>
      <h2>WebWorker Pool</h2>
      <div className="markdown-body">
        <p>N-worker pool (<code>hardwareConcurrency</code>, max 8) with least-loaded selection and work-stealing scheduler. Replaces the singleton SharedWorker for frame extraction.</p>
        <p><FileRef path="src/lib/worker-pool.ts" /></p>
        <CodeBlock code={`const pool = new WorkerPool(workerUrl, { maxWorkers: 8 });

// Submit individual tasks
const result = await pool.submit(task);

// Parallel frame processing (splits across workers)
const frames = await processFramesParallel(bitmaps);

// Work-stealing: 100ms interval, LIFO steal / FIFO local
// Batch submission with round-robin distribution
// Full lifecycle: stats, drain, terminate`} />
      </div>
    </div>
  );
}

function SectionCrdtCollaboration() {
  return (
    <div className="docs-article">
      <span className="article-label">Advanced</span>
      <h2>CRDT Collaborative Editing</h2>
      <div className="markdown-body">
        <p>Real-time collaboration via <strong>Yjs</strong> CRDTs. <code>CollaborationSession</code> wraps a <code>Y.Doc</code> with 6 shared types and WebSocket transport with auto-reconnect.</p>
        <p><FileRef path="src/lib/crdt-collaboration.ts" /></p>
        <CodeBlock code={`Shared CRDT Types:
  annotations: Y.Map    // Timeline annotations
  insights: Y.Array     // Analysis insights
  dlp: Y.Map            // Digital Learner Profile
  chat: Y.Array         // Chat messages
  cursors: Y.Map        // Peer cursor positions
  metadata: Y.Map       // Session metadata

Features:
  - WebSocketTransport with auto-reconnect
  - SessionManager for multi-room support
  - Change events with local/remote origin tracking
  - State export/import for snapshots
  - UndoManager per session
  - y-indexeddb persistence
  - Peer color assignment for cursor visualization`} />
      </div>
    </div>
  );
}

function SectionClipEmbeddings() {
  return (
    <div className="docs-article">
      <span className="article-label">Advanced</span>
      <h2>CLIP Multimodal RAG</h2>
      <div className="markdown-body">
        <p>Client-side fusion search combining text and visual embeddings. Uses CLIP ViT-B/32 on the backend for frame-level visual search.</p>
        <p><FileRef path="src/lib/clip-embeddings.ts" /> · <FileRef path="backend/clip-embeddings/server.py" /></p>
        <CodeBlock code={`Fusion Search:
  Text results (40% weight) + Visual results (60% weight)
  "Both" boost: timestamps appearing in both modalities get score bonus

Pipeline: frame → CLIP embedding → ChromaDB → cosine search
Batch processing for video-level indexing

Example: "find the frame where the speaker points at the whiteboard"
  → embedding-based retrieval, not LLM re-analysis`} />
      </div>
    </div>
  );
}

function SectionPluginMarketplace() {
  return (
    <div className="docs-article">
      <span className="article-label">Advanced</span>
      <h2>Plugin Marketplace</h2>
      <div className="markdown-body">
        <p>Registry with local catalog + remote API fallback. Supports search/filter, SHA-256 integrity verification, and sandboxed handler execution.</p>
        <p><FileRef path="src/lib/plugin-marketplace.ts" /></p>
        <CodeBlock code={`Installation Pipeline:
  1. Fetch handler code from registry
  2. SHA-256 integrity verification
  3. Create sandboxed handler (restricted Function scope)
     - Blocks: window, document, fetch, eval, XMLHttpRequest
  4. Register with Virtuoso system

Search: by query, tags, verified status
Sort: by installs, rating, or recency
Publishing: ID must start with 'plugin_' or 'custom_'
Per-plugin telemetry tracking`} />
      </div>
    </div>
  );
}

function SectionFederatedLearning() {
  return (
    <div className="docs-article">
      <span className="article-label">Advanced</span>
      <h2>Federated Learning</h2>
      <div className="markdown-body">
        <p>FedAvg protocol for BKT parameter optimization across clients with (ε, δ)-differential privacy. Enables the AI tutor to improve as more students use it while preserving individual privacy.</p>
        <p><FileRef path="src/lib/federated-learning.ts" /></p>
        <CodeBlock code={`Protocol:
  1. Clients train BKT parameters locally (grid search MLE)
  2. L2 gradient clipping for sensitivity bounding
  3. Gaussian noise injection (calibrated ε, δ)
  4. Weighted aggregation across heterogeneous clients
  5. User ID anonymization (one-way hash)

Privacy: (ε, δ)-differential privacy with analytic mechanism
Aggregation: FedAvg with per-client sample weighting`} />
      </div>
    </div>
  );
}

function SectionOfflinePwa() {
  return (
    <div className="docs-article">
      <span className="article-label">Advanced</span>
      <h2>Offline-First PWA</h2>
      <div className="markdown-body">
        <p>Service Worker + IndexedDB mutation queue for full offline operation with background sync on reconnect.</p>
        <p><FileRef path="src/lib/offline-sync.ts" /> · <FileRef path="public/sw.js" /></p>
        <CodeBlock code={`Service Worker Caching Strategies:
  Cache-First: /assets/, fonts, images (static)
  Network-First: /api/ calls
  Stale-While-Revalidate: CDN resources

IndexedDB Mutation Queue:
  - FIFO ordering
  - Optimistic sync with exponential backoff (max 5 retries)
  - Auto-sync on reconnect (online/offline detection)
  - Frame/transcript caching with 7-day TTL
  - Background sync via SW sync event`} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BACKEND SERVICES
   ═══════════════════════════════════════════════════════════════════ */

function SectionApiProxyService() {
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

function SectionClipEmbeddingsService() {
  return (
    <div className="docs-article">
      <span className="article-label">Backend</span>
      <h2>CLIP Embeddings Service</h2>
      <div className="markdown-body">
        <p>FastAPI backend using CLIP ViT-B/32 (via <code>transformers</code> + <code>torch</code>) for multimodal embedding generation and visual search.</p>
        <p><FileRef path="backend/clip-embeddings/server.py" /></p>

        <h3>Endpoints</h3>
        <PropTable rows={[
          { name: 'POST /embed/image', type: 'multipart', desc: 'Generate CLIP embedding for an uploaded image' },
          { name: 'POST /embed/text', type: 'JSON body', desc: 'Generate CLIP embedding for text' },
          { name: 'POST /embed/batch', type: 'multipart', desc: 'Batch embed multiple images' },
          { name: 'POST /search/visual', type: 'multipart', desc: 'Visual similarity search across indexed frames' },
          { name: 'GET /health', type: '—', desc: 'Health check' },
        ]} />

        <p>Storage: ChromaDB with cosine distance. Docker service on port <strong>3006</strong>.</p>
      </div>
    </div>
  );
}

function SectionBackendOverview() {
  return (
    <div className="docs-article">
      <span className="article-label">Backend</span>
      <h2>Service Overview</h2>
      <div className="markdown-body">
        <p>Aura Symphony includes five backend microservices, all orchestrated via Docker Compose. Each service has health checks, graceful degradation, and is fully testable in isolation.</p>

        <PropTable rows={[
          { name: 'API Proxy', type: 'Node.js / Express', desc: 'Gemini API proxy with rate limiting (30 req/min), usage metering, key isolation', default: ':3005' },
          { name: 'Vector Search', type: 'Python / FastAPI', desc: 'Semantic search with ChromaDB embeddings + adaptive chunking', default: ':3001' },
          { name: 'Graph Knowledge', type: 'Node.js / Express', desc: 'Concept graph with SQLite recursive CTEs', default: ':4004' },
          { name: 'Media Pipeline', type: 'Node.js / Express', desc: 'FFmpeg frame extraction + WebSocket progress', default: ':3002 / WS :3003' },
          { name: 'CLIP Embeddings', type: 'Python / FastAPI', desc: 'Multimodal RAG with CLIP ViT-B/32 + ChromaDB for visual search', default: ':3006' },
        ]} />

        <Callout type="tip">All backends are optional. When their URLs are not configured, the frontend falls back to browser-local alternatives. Set <code>VITE_API_PROXY_URL</code>, <code>VITE_VECTOR_BACKEND_URL</code>, <code>VITE_GRAPH_BACKEND_URL</code>, and <code>VITE_MEDIA_BACKEND_URL</code> to enable them.</Callout>
      </div>
    </div>
  );
}

function SectionVectorSearchService() {
  return (
    <div className="docs-article">
      <span className="article-label">Backend</span>
      <h2>Vector Search Service</h2>
      <div className="markdown-body">
        <p>Python FastAPI service using ChromaDB for semantic video search. Uses cosine similarity with HNSW index.</p>
        <p><FileRef path="backend/vector-search/server.py" /></p>

        <h3>Endpoints</h3>
        <PropTable rows={[
          { name: 'POST /ingest', type: 'IngestRequest', desc: 'Batch ingest video chunks for embedding. Returns { ingested, errors }' },
          { name: 'GET /search', type: 'query params', desc: 'Semantic search. Params: query, videoId?, minSimilarity=0.7, maxResults=10' },
          { name: 'GET /health', type: '—', desc: 'Health check with collection count' },
          { name: 'GET /stats', type: '—', desc: 'Collection statistics (total chunks, videos, types)' },
          { name: 'DELETE /clear', type: '—', desc: 'Clear all indexed data (development only)' },
        ]} />

        <h3>Client-Side Chunking</h3>
        <p><FileRef path="src/lib/vector-search.ts" /> and <FileRef path="src/lib/semantic-chunker.ts" /> provide chunking utilities:</p>
        <CodeBlock code={`// Adaptive semantic chunking (default — splits on topic boundaries)
chunkTranscript(transcript, videoId): VideoChunk[]
// Pipeline: sentence split → FNV-1a bigram embedding (128-dim) →
//   pairwise cosine similarity → percentile break detection → merge/balance

// Legacy fixed chunking (preserved for compatibility)
chunkTranscriptFixed(transcript, videoId, chunkSize=100, overlap=20): VideoChunk[]

// Frame description chunking
chunkFrameDescriptions(frames, videoId): VideoChunk[]

// Semantic search (falls back to Gemini if no backend)
vectorSearch(query, videoId?): Promise<VectorSearchResponse>

// Batch ingestion
ingestChunks(chunks): Promise<void>  // Batched at 50 chunks per request`} />
      </div>
    </div>
  );
}

function SectionGraphKnowledgeService() {
  return (
    <div className="docs-article">
      <span className="article-label">Backend</span>
      <h2>Graph Knowledge Service</h2>
      <div className="markdown-body">
        <p>Express service using SQLite with recursive CTEs for concept relationship traversal. API-compatible with the Neo4j version — client code requires no changes when switching backends.</p>
        <p><FileRef path="backend/graph-knowledge/server-sqlite.js" /></p>

        <h3>Endpoints</h3>
        <PropTable rows={[
          { name: 'GET /concepts/:name/related', type: '?depth=2&userId', desc: 'Get related concepts via recursive CTE traversal (up to 50 results)' },
          { name: 'GET /learning-path', type: '?target&userId', desc: 'Find prerequisite gaps (mastery < 0.8, max 5 hops)' },
          { name: 'POST /relationships', type: 'JSON body', desc: 'Add concept relationship (auto-creates missing concepts)' },
          { name: 'POST /import/dlp', type: 'JSON body', desc: 'Batch import DLP data from Firestore' },
          { name: 'GET /users/:userId/concepts', type: '—', desc: 'Get all concepts for a user, sorted by mastery' },
          { name: 'GET /health', type: '—', desc: 'Health check with concept/relationship counts' },
        ]} />

        <h3>Schema</h3>
        <CodeBlock title="SQLite Schema" language="sql" code={`CREATE TABLE concepts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT 'default',
  mastery REAL DEFAULT 0,
  last_studied TEXT,
  source_videos TEXT DEFAULT '[]',
  UNIQUE(name, user_id)
);

CREATE TABLE relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER REFERENCES concepts(id) ON DELETE CASCADE,
  target_id INTEGER REFERENCES concepts(id) ON DELETE CASCADE,
  type TEXT NOT NULL,  -- RELATED_TO | PREREQUISITE_OF | MASTERED | STUDIED
  strength REAL DEFAULT 0.5,
  video_id TEXT,
  UNIQUE(source_id, target_id, type)
);`} />
      </div>
    </div>
  );
}

function SectionMediaPipelineService() {
  return (
    <div className="docs-article">
      <span className="article-label">Backend</span>
      <h2>Media Pipeline Service</h2>
      <div className="markdown-body">
        <p>Express + WebSocket service for heavy media processing. Uses FFmpeg for frame extraction and audio extraction. Reports progress via WebSocket.</p>
        <p><FileRef path="backend/media-pipeline/server.js" /></p>

        <h3>Endpoints</h3>
        <PropTable rows={[
          { name: 'POST /jobs', type: 'JSON body', desc: 'Submit video processing job. Returns 202 with jobId. Params: videoUrl, videoId, frameInterval, extractAudio, transcribe' },
          { name: 'GET /jobs/:id', type: '—', desc: 'Get job status (queued/processing/completed/failed + progress)' },
          { name: 'GET /jobs/:id/frames', type: '—', desc: 'Get extracted frames for completed job' },
          { name: 'GET /health', type: '—', desc: 'Health check with active/total job counts' },
        ]} />

        <h3>WebSocket Protocol</h3>
        <p>Connect to <code>ws://host:3003?jobId=...</code> for real-time progress updates:</p>
        <CodeBlock code={`// Progress message format
{
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;     // 0-100
  frameCount?: number;  // On completion
  error?: string;       // On failure
}`} />
      </div>
    </div>
  );
}

function SectionDockerDeployment() {
  return (
    <div className="docs-article">
      <span className="article-label">Backend</span>
      <h2>Docker & Compose</h2>
      <div className="markdown-body">
        <p><FileRef path="docker-compose.yml" /> orchestrates all backend services with health checks and persistent volumes.</p>
        <CodeBlock title="docker-compose.yml services" code={`services:
  neo4j:           # Neo4j Community 5 (:7474, :7687)
  vector-search:   # FastAPI + ChromaDB (:3001)
  media-pipeline:  # Express + FFmpeg (:3002, WS :3003)
  graph-knowledge: # Express + SQLite/Neo4j (:3004)
  api-proxy:       # Gemini API proxy with rate limiting (:3005)
  clip-embeddings: # CLIP ViT-B/32 + ChromaDB (:3006)

volumes:
  neo4j-data:    # Persistent graph storage
  vector-data:   # Persistent ChromaDB embeddings
  media-temp:    # Temporary frame extraction`} />

        <CodeBlock title="Quick Start" language="bash" code={`docker compose up -d
# Health checks:
curl http://localhost:3001/health  # Vector Search
curl http://localhost:3002/health  # Media Pipeline
curl http://localhost:3004/health  # Graph Knowledge
curl http://localhost:3005/api/health  # API Proxy
curl http://localhost:3006/health  # CLIP Embeddings`} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DATA MODELS
   ═══════════════════════════════════════════════════════════════════ */

function SectionTypescriptTypes() {
  return (
    <div className="docs-article">
      <span className="article-label">Data</span>
      <h2>TypeScript Interfaces</h2>
      <div className="markdown-body">
        <p><FileRef path="src/types.ts" /></p>
        <CodeBlock code={`// Core content types
interface Annotation { id: number; time: number; text: string; }

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  file?: ChatMessageFile;
}

interface ChatMessageFile {
  name: string; mimeType: string; data: string; dataUrl: string;
}

// Digital Learner Profile
interface DigitalLearnerProfile {
  knowledgeGraph: {
    [concept: string]: { mastery: number; lastUpdated: string; };
  };
}

// Insight card (analysis results)
interface Insight {
  id: number;
  title: string;
  type: Mode | 'Chat' | 'Annotations' | 'DLP' | 'Quiz' | 'Create Course';
  data: InsightData;   // Discriminated union (see below)
  isList: boolean;
  isLoading: boolean;
}

// Discriminated union for insight data
type InsightData =
  | ChatMessage[] | QuizQuestion[] | DigitalLearnerProfile
  | Annotation[] | string
  | { timecodes: Array<{ time: number; text: string }> }
  | Record<string, unknown> | null;

// Quiz
interface QuizQuestion {
  question: string; options: string[];
  answer: string; explanation: string; time: string;
}

// Presentations (Creator Studio)
interface Slide {
  id: string; content: string; speakerNotes: string;
  backgroundImage: string | null; backgroundColor: string;
}

interface Presentation {
  id?: string; userId: string; name: string;
  slides: Slide[]; createdAt: FieldValue | string | null;
  lastUpdated: FieldValue | string | null;
}`} />
      </div>
    </div>
  );
}

function SectionFirestoreSchema() {
  return (
    <div className="docs-article">
      <span className="article-label">Data</span>
      <h2>Firestore Schema & Security Rules</h2>
      <div className="markdown-body">
        <p><FileRef path="firestore.rules" /></p>

        <h3>Collections</h3>
        <PropTable rows={[
          { name: 'users/{userId}', type: 'UserDoc', desc: 'User profile + DLP. Owner-only read/write. Validated: uid, email, displayName, photoURL, digitalLearnerProfile.' },
          { name: 'insights/{insightId}', type: 'InsightDoc', desc: 'Analysis results. Owner-only CRUD. Validated: id (number), title, type, data (map), userId.' },
          { name: 'annotations/{annotationId}', type: 'AnnotationDoc', desc: 'Timeline annotations. Owner-only. Validated: id, time, text (max 1000 chars), userId.' },
          { name: 'presentations/{id}', type: 'PresentationDoc', desc: 'Creator Studio presentations. Max 50 slides. Owner-only.' },
          { name: 'custom_virtuosos/{id}', type: 'VirtuosoDoc', desc: 'Custom agent definitions. Validated: all fields. systemInstruction max 5000 chars.' },
        ]} />

        <h3>Security Model</h3>
        <ul>
          <li><strong>Authentication required</strong> for all writes</li>
          <li><strong>Owner-only access</strong> — <code>request.auth.uid == resource.data.userId</code></li>
          <li><strong>Admin override</strong> — users with <code>role: 'admin'</code> can read/delete any document</li>
          <li><strong>Field-level validation</strong> — <code>hasOnlyAllowedFields()</code> prevents injection of extra fields</li>
          <li><strong>Default deny</strong> — <code>match /{'{'}path=**{'}'} {'{'} allow read, write: if false; {'}'}</code></li>
        </ul>
      </div>
    </div>
  );
}

function SectionVectorChunkModel() {
  return (
    <div className="docs-article">
      <span className="article-label">Data</span>
      <h2>Vector Chunk Model</h2>
      <div className="markdown-body">
        <p>Video content is chunked and embedded for semantic retrieval.</p>
        <CodeBlock code={`interface VideoChunk {
  id: string;          // "{videoId}-chunk-{index}"
  videoId: string;
  content: string;     // Text content (transcript or frame description)
  timestamp: number;   // Start time in seconds
  endTime: number;     // End time in seconds
  type: 'transcript' | 'frame_description';
  metadata?: Record<string, unknown>;
}

interface SearchResult {
  chunk: VideoChunk;
  similarity: number;  // 0-1 (cosine similarity)
}

interface VectorSearchResponse {
  query: string;
  results: SearchResult[];
  searchTimeMs: number;
  source: 'vector' | 'fallback';
}`} />

        <h3>Chunking Parameters</h3>
        <PropTable rows={[
          { name: 'chunkSize', type: 'number', desc: 'Words per chunk', default: '100' },
          { name: 'overlap', type: 'number', desc: 'Overlapping words between chunks', default: '20' },
          { name: 'minChunkSize', type: 'number', desc: 'Minimum words to create a chunk', default: '10' },
          { name: 'minSimilarity', type: 'number', desc: 'Minimum cosine similarity threshold', default: '0.7' },
          { name: 'maxResults', type: 'number', desc: 'Maximum search results returned', default: '10' },
          { name: 'batchSize', type: 'number', desc: 'Chunks per ingestion batch', default: '50' },
        ]} />
      </div>
    </div>
  );
}

function SectionGraphDataModel() {
  return (
    <div className="docs-article">
      <span className="article-label">Data</span>
      <h2>Graph Data Model</h2>
      <div className="markdown-body">
        <p>The knowledge graph models concept relationships for the Digital Learner Profile.</p>
        <CodeBlock code={`interface ConceptNode {
  id: string;
  name: string;
  mastery: number;        // 0-1
  lastStudied: string;    // ISO timestamp
  sourceVideos: string[]; // Video IDs
}

interface ConceptRelationship {
  source: string;         // Concept name
  target: string;
  type: 'RELATED_TO' | 'PREREQUISITE_OF' | 'MASTERED' | 'STUDIED' | 'APPEARS_IN';
  strength: number;       // 0-1
  videoId?: string;
}

interface LearningPath {
  concepts: ConceptNode[];
  gaps: ConceptNode[];              // Prerequisites not yet mastered
  recommendedVideos: Array<{
    videoId: string; concept: string; reason: string;
  }>;
}`} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   VALHALLA
   ═══════════════════════════════════════════════════════════════════ */

function SectionValhallaOverview() {
  return (
    <div className="docs-article">
      <span className="article-label">Valhalla</span>
      <h2>Overview & Principle of Most Direct Execution</h2>
      <div className="markdown-body">
        <p>Project Valhalla allows AI agents to control external creative software (Blender, Ableton, Figma) by generating and executing automation scripts. It follows the <strong>Principle of Most Direct Execution (PMDE)</strong>: API/scripting first, then CLI, with GUI automation as a fallback.</p>
        <p><FileRef path="src/api/valhalla.ts" /></p>

        <h3>Execution Flow</h3>
        <CodeBlock code={`User command → Conductor → launch_valhalla(tool)
→ executeValhallaCommand(toolName, command)
  1. Script Generation: Gemini generates Python script for target tool
  2. Safety Analysis: analyzeScriptDeep() checks for dangerous patterns
  3. Visual Preview: Gemini generates rendered preview image
  4. User Approval: Script + preview shown in ValhallaGateway UI
  5. Sandboxed Execution: Pyodide (Python-in-WASM) with 3-layer security
→ Result: { script, imageUrl, logs }

Pyodide Sandbox (src/lib/valhalla-sandbox.ts):
  Layer 1: Regex + AST pre-check (analyzeScriptDeep)
  Layer 2: Python-level import blocking (18 dangerous modules)
  Layer 3: 30-second execution timeout
  State: idle → loading → ready → executing
  Features: matplotlib figure capture as base64 PNG, prewarmSandbox()`} />

        <h3>API</h3>
        <CodeBlock code={`async function executeValhallaCommand(
  toolName: string,  // "Blender", "Ableton", etc.
  command: string    // "Create a neon cube"
): Promise<ValhallaResponse>

interface ValhallaResponse {
  script: string;      // Generated Python/shell script
  imageUrl?: string;   // Preview render (base64 data URL)
  logs: string[];      // Execution log entries
}`} />
      </div>
    </div>
  );
}

function SectionScriptSafety() {
  return (
    <div className="docs-article">
      <span className="article-label">Valhalla</span>
      <h2>Script Safety Analyzer</h2>
      <div className="markdown-body">
        <p>Regex-based structural analysis for Python scripts. Detects 5 categories of dangerous patterns.</p>
        <p><FileRef path="src/lib/valhalla-analyzer.ts" /></p>

        <h3>Detection Categories</h3>
        <PropTable rows={[
          { name: 'infinite-loop', type: 'critical', desc: 'while True without break/return — will hang execution' },
          { name: 'dangerous-import', type: 'critical/warning', desc: 'os, subprocess, shutil, socket, ctypes, etc.' },
          { name: 'destructive-call', type: 'critical', desc: 'os.remove, shutil.rmtree, subprocess.call, os.system, etc.' },
          { name: 'system-escape', type: 'critical', desc: 'eval(), exec(), __import__(), getattr with dunders' },
          { name: 'network-operation', type: 'warning', desc: 'requests.get/post, urllib, socket connections' },
        ]} />

        <h3>Scoring</h3>
        <p>Base score: <strong>100</strong>. Each critical finding: <strong>-30</strong>. Each warning: <strong>-10</strong>. Score ≤ 0 clamped to 0. Script is <strong>safe</strong> only if critical count = 0.</p>

        <CodeBlock code={`function analyzeScript(sourceCode: string): SafetyReport

interface SafetyReport {
  safe: boolean;     // true only if 0 criticals
  score: number;     // 0-100
  findings: SafetyFinding[];
  summary: string;   // Human-readable summary
}

function getSafetyBadge(report: SafetyReport): 'green' | 'yellow' | 'red'`} />
      </div>
    </div>
  );
}

function SectionAstAnalyzer() {
  return (
    <div className="docs-article">
      <span className="article-label">Valhalla</span>
      <h2>AST Deep Analysis</h2>
      <div className="markdown-body">
        <p>Extends the regex analyzer with structural AST parsing for patterns that regex alone cannot catch.</p>
        <p><FileRef path="src/lib/valhalla-ast-analyzer.ts" /></p>

        <h3>Additional Detections</h3>
        <ul>
          <li><code>getattr(obj, '__class__')</code> — dynamic dunder access</li>
          <li><code>globals()['os']</code> — dictionary-based module access bypass</li>
          <li><code>__builtins__</code> access — can bypass import restrictions</li>
          <li><code>open()</code> with dynamic paths — potential file system escape</li>
        </ul>

        <CodeBlock code={`// Deep analysis merges regex + AST findings, deduplicating by line + category
function analyzeScriptDeep(sourceCode: string): SafetyReport`} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   EXTENSIBILITY
   ═══════════════════════════════════════════════════════════════════ */

function SectionPluginApi() {
  return (
    <div className="docs-article">
      <span className="article-label">Extensibility</span>
      <h2>Plugin API</h2>
      <div className="markdown-body">
        <p>Third-party developers can create custom Virtuosos that integrate seamlessly with the Conductor and Symphony Bus.</p>
        <p><FileRef path="src/lib/virtuoso-plugin-api.ts" /></p>

        <CodeBlock title="Registering a Plugin" code={`import { registerPlugin } from './lib/virtuoso-plugin-api';

registerPlugin({
  metadata: {
    id: 'plugin_cinematographer',
    name: 'The Cinematographer',
    title: 'Shot Composition Expert',
    description: 'Analyzes camera angles and shot composition.',
    model: 'gemini-2.5-pro',
    capabilities: ['shot-analysis', 'composition-critique'],
    color: '#FF6B35',
    icon: 'Camera',
  },
  version: '1.0.0',
  author: 'Your Name',
  handler: async (task) => {
    // Custom implementation using task.query, task.context
    return { result: 'analysis data' };
  },
});`} />

        <h3>Plugin API Functions</h3>
        <PropTable rows={[
          { name: 'registerPlugin(plugin)', type: 'void', desc: 'Register a plugin. Adds to VIRTUOSO_REGISTRY. Throws if ID already registered.' },
          { name: 'unregisterPlugin(id)', type: 'boolean', desc: 'Remove a plugin by ID' },
          { name: 'getPlugin(id)', type: 'VirtuosoPlugin?', desc: 'Get registered plugin by ID' },
          { name: 'listPlugins()', type: 'VirtuosoPlugin[]', desc: 'List all registered plugins' },
          { name: 'executePluginTask(id, task)', type: 'Promise<PluginResult>', desc: 'Execute task with Symphony Bus integration' },
        ]} />

        <Callout type="tip">Plugin IDs should start with <code>custom_</code> or <code>plugin_</code> to avoid conflicts with built-in Virtuosos. The Plugin Manifest interface enables self-documenting plugins via introspection.</Callout>
      </div>
    </div>
  );
}

function SectionCustomVirtuosos() {
  return (
    <div className="docs-article">
      <span className="article-label">Extensibility</span>
      <h2>Custom Virtuosos (Agent Studio)</h2>
      <div className="markdown-body">
        <p>Users can create custom AI agents through the Agent Studio UI. Custom Virtuosos are persisted to Firestore and registered at runtime.</p>

        <h3>Creation Flow</h3>
        <ol>
          <li>Open Agent Studio from the Workspace</li>
          <li>Define: name, title, system instruction, model, capabilities, color, icon</li>
          <li>Save → validates, writes to Firestore, registers in <code>VIRTUOSO_REGISTRY</code></li>
          <li>Custom Virtuoso appears in the Conductor's available lenses immediately</li>
        </ol>

        <h3>Validation Rules</h3>
        <ul>
          <li>ID must be provided and be a string</li>
          <li>Name and system instruction are required</li>
          <li>Model selection is required</li>
          <li>Cannot overwrite built-in Virtuosos (unless ID starts with <code>custom_</code>)</li>
          <li>Firestore rules limit <code>systemInstruction</code> to 5,000 characters</li>
        </ul>
      </div>
    </div>
  );
}

function SectionProviderConfig() {
  return (
    <div className="docs-article">
      <span className="article-label">Extensibility</span>
      <h2>Provider Configuration</h2>
      <div className="markdown-body">
        <p>Users can configure custom AI providers (different API keys, models, or endpoints) via the Settings modal.</p>
        <p><FileRef path="src/lib/provider-config.ts" /></p>

        <h3>Provider Resolution Chain</h3>
        <CodeBlock code={`getAI() resolution:
  1. Check active provider in localStorage
  2. If active provider has apiKey → return new GoogleGenAI({ apiKey })
  3. Otherwise → return default client (process.env.API_KEY)

getEffectiveModel(registryModel) resolution:
  1. Check active provider for custom model
  2. If custom model set → return custom model
  3. Otherwise → return registryModel (from VirtuosoProfile)`} />

        <h3>Connection Testing</h3>
        <p><code>testProviderConnection(apiKey, model?)</code> makes a lightweight <code>models.list()</code> call with a 10-second timeout. If a model name is provided, verifies it exists in the returned list.</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ADAPTIVE LEARNING
   ═══════════════════════════════════════════════════════════════════ */

function SectionDlpOverview() {
  return (
    <div className="docs-article">
      <span className="article-label">Learning</span>
      <h2>Digital Learner Profile</h2>
      <div className="markdown-body">
        <p>The DLP tracks per-concept mastery across all videos a user has studied. It powers adaptive content selection and learning path recommendations.</p>

        <CodeBlock code={`interface DigitalLearnerProfile {
  knowledgeGraph: {
    [concept: string]: {
      mastery: number;       // 0-1 (0 = unknown, 1 = mastered)
      lastUpdated: string;   // ISO timestamp
    };
  };
}`} />

        <h3>Storage Tiers</h3>
        <ul>
          <li><strong>Flat storage (default):</strong> Firestore document at <code>users/{'{'}userId{'}'}.digitalLearnerProfile</code></li>
          <li><strong>Graph storage (optional):</strong> Neo4j/SQLite backend with concept relationships and cross-video traversal</li>
        </ul>

        <h3>Mastery Update Logic</h3>
        <p>Quiz performance updates mastery scores. Correct answers increase mastery; incorrect answers decrease it. The DLP Monitor component (<FileRef path="src/components/analysis/DlpMonitor.tsx" />) visualizes the knowledge graph in real-time.</p>
      </div>
    </div>
  );
}

function SectionCourseGeneration() {
  return (
    <div className="docs-article">
      <span className="article-label">Learning</span>
      <h2>Course Generation</h2>
      <div className="markdown-body">
        <p>The "Create Course" lens transforms any video into a structured learning module using the Analyst Virtuoso.</p>

        <h3>Pipeline</h3>
        <CodeBlock code={`Video → Frame Extraction (WebWorker)
  → asyncCaptureFrames(start, end)
  → base64 JPEG frames (max N frames)
  → generateCourseModules(frames)
    → Gemini structured JSON output
    → { summary, keyMoments, quiz }
  → CourseView component (interactive)`} />

        <h3>Output Structure</h3>
        <ul>
          <li><strong>Summary:</strong> 2-3 sentences, each with a video timecode</li>
          <li><strong>Key Moments:</strong> 3-5 timestamped highlights</li>
          <li><strong>Quiz:</strong> 3 multiple-choice questions with explanations and timecodes</li>
        </ul>

        <h3>Learning Modules</h3>
        <p>Three module types render the course content:</p>
        <PropTable rows={[
          { name: 'TextModule', type: 'component', desc: 'Renders summary and key moments with clickable timecodes' },
          { name: 'VideoModule', type: 'component', desc: 'Video player synced to course timestamps' },
          { name: 'QuizModule', type: 'component', desc: 'Interactive multiple-choice with immediate feedback and DLP updates' },
        ]} />
      </div>
    </div>
  );
}

function SectionBiofeedback() {
  return (
    <div className="docs-article">
      <span className="article-label">Learning</span>
      <h2>Biofeedback Integration</h2>
      <div className="markdown-body">
        <p>Aura includes an experimental biofeedback system using the <code>usePerceptionEngine</code> hook and the <code>BiofeedbackMonitor</code> component.</p>
        <p><FileRef path="src/components/course/BiofeedbackMonitor.tsx" /></p>

        <h3>Architecture</h3>
        <ul>
          <li><strong>Face Detection:</strong> TinyFaceDetector from face-api.js (runs every 1.5s)</li>
          <li><strong>Expression Classification:</strong> FaceExpressionNet detects: happy, sad, angry, fearful, disgusted, surprised, neutral</li>
          <li><strong>Consent:</strong> <code>ConsentModal</code> shown before camera activation</li>
        </ul>

        <Callout type="warn">Biofeedback is opt-in and requires explicit user consent. Camera data never leaves the browser — all processing is client-side via face-api.js models.</Callout>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   OPERATIONS
   ═══════════════════════════════════════════════════════════════════ */

function SectionTelemetry() {
  return (
    <div className="docs-article">
      <span className="article-label">Operations</span>
      <h2>Telemetry & Observability</h2>
      <div className="markdown-body">
        <p>Structured JSON logging for all Virtuoso operations, function calls, and system events.</p>
        <p><FileRef path="src/lib/telemetry.ts" /></p>

        <CodeBlock title="Log Entry Structure" code={`interface LogEntry {
  timestamp: string;     // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error';
  component: string;     // 'symphony', 'conductor', 'valhalla', 'search'
  event: string;         // 'virtuoso:commission', 'query:executed', etc.
  data: Record<string, unknown>;
  duration?: number;     // milliseconds
  error?: string;
  traceId?: string;
}`} />

        <h3>Log Sinks</h3>
        <p>Console sink is enabled by default in development. Production sinks can be added via <code>addLogSink()</code>.</p>

        <h3>Available Log Functions</h3>
        <PropTable rows={[
          { name: 'logVirtuosoCommission', type: 'info', desc: 'Logs when a Virtuoso is commissioned' },
          { name: 'logVirtuosoResult', type: 'info/error', desc: 'Logs task completion with duration' },
          { name: 'logConductorQuery', type: 'info', desc: 'Logs Conductor query with function calls and attempt count' },
          { name: 'logValidationFailure', type: 'warn', desc: 'Logs Zod validation failures with error details' },
          { name: 'logSearchExecuted', type: 'info', desc: 'Logs vector/fallback search with result count and duration' },
          { name: 'logValhallaAnalysis', type: 'info/warn', desc: 'Logs script safety analysis results' },
        ]} />
      </div>
    </div>
  );
}

function SectionTaskPersistence() {
  return (
    <div className="docs-article">
      <span className="article-label">Operations</span>
      <h2>Task Persistence (IndexedDB)</h2>
      <div className="markdown-body">
        <p>Tasks survive page refreshes via IndexedDB. The <code>aura-symphony</code> database stores tasks in the <code>tasks</code> object store.</p>
        <p><FileRef path="src/lib/task-persistence.ts" /></p>

        <h3>API</h3>
        <PropTable rows={[
          { name: 'persistTask(task)', type: 'Promise<void>', desc: 'Upsert a task to IndexedDB' },
          { name: 'removeTask(taskId)', type: 'Promise<void>', desc: 'Delete a task from IndexedDB' },
          { name: 'loadPersistedTasks()', type: 'Promise<Task[]>', desc: 'Load all tasks younger than 24 hours' },
          { name: 'clearPersistedTasks()', type: 'Promise<void>', desc: 'Clear all persisted tasks (debugging)' },
          { name: 'pruneStaleTasks(maxAgeMs?)', type: 'Promise<number>', desc: 'Remove completed/errored tasks older than maxAge. Default: 24h. Returns count pruned.' },
        ]} />
      </div>
    </div>
  );
}

function SectionCiPipeline() {
  return (
    <div className="docs-article">
      <span className="article-label">Operations</span>
      <h2>CI/CD Pipeline</h2>
      <div className="markdown-body">
        <p><FileRef path=".github/workflows/ci.yml" /></p>

        <h3>Pipeline Jobs</h3>
        <PropTable rows={[
          { name: 'frontend-tests', type: 'ubuntu-latest', desc: 'Vitest unit tests + TypeScript type check (Node 22)' },
          { name: 'vector-search-tests', type: 'ubuntu-latest', desc: 'pytest for Python vector search service (Python 3.12)' },
          { name: 'backend-integration-tests', type: 'ubuntu-latest', desc: 'Starts media pipeline + graph knowledge, runs health checks + Vitest' },
          { name: 'build', type: 'ubuntu-latest', desc: 'Production build (depends on frontend-tests). Checks dist/ output.' },
          { name: 'lint-python', type: 'ubuntu-latest', desc: 'Ruff linter + format check on Python backend' },
        ]} />

        <h3>Triggers</h3>
        <ul>
          <li><strong>Push</strong> to <code>main</code> or <code>develop</code></li>
          <li><strong>Pull requests</strong> targeting <code>main</code></li>
        </ul>
      </div>
    </div>
  );
}

function SectionTesting() {
  return (
    <div className="docs-article">
      <span className="article-label">Operations</span>
      <h2>Testing Strategy</h2>
      <div className="markdown-body">
        <h3>Test Files (438 tests across 20 files)</h3>
        <PropTable rows={[
          { name: 'src/api/client.test.ts', type: 'Vitest', desc: 'API client factory, provider resolution, connection testing' },
          { name: 'src/lib/conductor-validator.test.ts', type: 'Vitest', desc: 'Zod schema validation: valid calls, invalid args, hallucinated functions, correction prompts' },
          { name: 'src/lib/conductor-schemas.test.ts', type: 'Vitest', desc: 'All 18 schemas: valid/invalid/edge cases, .strict() enforcement, property-based testing' },
          { name: 'src/lib/provider-config.test.ts', type: 'Vitest', desc: 'Provider CRUD, localStorage persistence, active provider resolution' },
          { name: 'src/lib/valhalla-analyzer.test.ts', type: 'Vitest', desc: 'Script safety: infinite loops, dangerous imports, destructive calls, system escapes, network ops' },
          { name: 'src/lib/vector-search.test.ts', type: 'Vitest', desc: 'Adaptive semantic chunking, frame description chunking' },
          { name: 'src/lib/symphonyBus.test.ts', type: 'Vitest', desc: 'Event dispatch, listen/unlisten, commission, reportResult, chainCommission' },
          { name: 'src/lib/telemetry.test.ts', type: 'Vitest', desc: 'Log sinks, timer utility, all 6 log functions' },
          { name: 'src/lib/lens-handlers/registry.test.ts', type: 'Vitest', desc: 'Handler resolution, fallback, runtime registration' },
          { name: 'src/api/proxy-client.test.ts', type: 'Vitest', desc: 'Proxy detection when unconfigured' },
          { name: 'src/__tests__/semantic-chunker.test.ts', type: 'Vitest', desc: 'Adaptive chunking pipeline, FNV-1a embedding, break detection' },
          { name: 'src/__tests__/knowledge-tracing.test.ts', type: 'Vitest', desc: 'BKT update, temporal decay, prerequisite scaling, content selection' },
          { name: 'src/__tests__/react-planner.test.ts', type: 'Vitest', desc: 'Complex query detection, ReAct loop, plan generation' },
          { name: 'src/__tests__/worker-pool.test.ts', type: 'Vitest', desc: 'Worker pool lifecycle, work-stealing, batch submission' },
          { name: 'src/__tests__/crdt-collaboration.test.ts', type: 'Vitest', desc: 'CRDT sessions, shared types, change events, state export/import' },
          { name: 'src/__tests__/valhalla-sandbox.test.ts', type: 'Vitest', desc: 'Pyodide safety rejection, sandbox state machine' },
          { name: 'src/__tests__/clip-embeddings.test.ts', type: 'Vitest', desc: 'Fusion search scoring, result merging' },
          { name: 'src/__tests__/plugin-marketplace.test.ts', type: 'Vitest', desc: 'Search, filtering, installation, sandboxing, integrity verification' },
          { name: 'src/__tests__/federated-learning.test.ts', type: 'Vitest', desc: 'Differential privacy, gradient clipping, FedAvg aggregation, MLE' },
          { name: 'src/__tests__/offline-sync.test.ts', type: 'Vitest', desc: 'Queue operations, sync execution, cache management' },
        ]} />
        <p><em>Plus 3 backend test files and 1 E2E Playwright spec.</em></p>

        <h3>Running Tests</h3>
        <CodeBlock language="bash" code={`# Frontend unit tests
npm test

# Python backend tests
cd backend/vector-search && python -m pytest test_server.py -v

# E2E tests (requires running dev server)
npx playwright test`} />
      </div>
    </div>
  );
}
