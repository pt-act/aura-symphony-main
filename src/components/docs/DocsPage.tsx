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

import {
  SectionIntroduction, SectionQuickStart, SectionProjectStructure,
  SectionConfiguration, SectionSystemOverview, SectionSymphonyBus,
  SectionTaskLifecycle, SectionEventReference, SectionVirtuosoRegistry,
  SectionConductor, SectionVisionary, SectionScholar, SectionArtisan,
  SectionAnalyst, SectionChronicler, SectionCritic,
  SectionFunctionDeclarations, SectionSchemaValidation, SectionConductorValidator,
  SectionHookUseSymphony, SectionHookUseLensExecution, SectionHookUseCriticGate,
  SectionHookUsePerceptionEngine, SectionHookUseCustomVirtuosos,
  SectionHookUseVectorSearch, SectionHookUseStreaming, SectionHookUseKnowledgeTracing,
  SectionSemanticChunking, SectionKnowledgeTracing, SectionStreamingResponses,
  SectionReActPlanner, SectionWorkerPool, SectionCrdtCollaboration,
  SectionClipEmbeddings, SectionPluginMarketplace, SectionFederatedLearning,
  SectionOfflinePwa, SectionApiProxyService, SectionClipEmbeddingsService,
  SectionBackendOverview, SectionVectorSearchService, SectionGraphKnowledgeService,
  SectionMediaPipelineService, SectionDockerDeployment, SectionTypescriptTypes,
  SectionFirestoreSchema, SectionVectorChunkModel, SectionGraphDataModel,
  SectionValhallaOverview, SectionScriptSafety, SectionAstAnalyzer,
  SectionPluginApi, SectionCustomVirtuosos, SectionProviderConfig,
  SectionDlpOverview, SectionCourseGeneration, SectionBiofeedback,
  SectionTelemetry, SectionTaskPersistence, SectionCiPipeline, SectionTesting,
} from './sections';

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


