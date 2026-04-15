import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Book, Code, Cpu, Layers, Terminal,
  Music, Eye, Palette, Search, Mic, Zap, Video, Wand2,
  FileText, Shield, GraduationCap, Globe
} from 'lucide-react';
import './DocsPage.css';

type SectionKey = 'intro' | 'virtuosos' | 'valhalla' | 'adaptive' | 'advanced';

const SECTIONS: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
  { key: 'intro', label: 'Introduction', icon: <Book size={16} /> },
  { key: 'virtuosos', label: 'The Virtuosos', icon: <Cpu size={16} /> },
  { key: 'valhalla', label: 'Project Valhalla', icon: <Terminal size={16} /> },
  { key: 'adaptive', label: 'Adaptive Learning', icon: <GraduationCap size={16} /> },
  { key: 'advanced', label: 'Advanced Features', icon: <Code size={16} /> },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>('intro');

  return (
    <div className="docs-container">
      <header className="docs-header">
        <div className="logo">
          <div className="logo-orb"></div>
          <h1>Aura Docs</h1>
        </div>
        <Link to="/" className="back-link">
          <ArrowLeft size={14} />
          Back to Home
        </Link>
      </header>

      <div className="docs-layout">
        <aside className="docs-sidebar">
          <nav>
            <span className="sidebar-label">Documentation</span>
            <ul>
              {SECTIONS.map(s => (
                <li key={s.key}>
                  <button
                    className={activeSection === s.key ? 'active' : ''}
                    onClick={() => setActiveSection(s.key)}
                  >
                    {s.icon} {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="docs-content">
          {activeSection === 'intro' && <IntroSection />}
          {activeSection === 'virtuosos' && <VirtuososSection />}
          {activeSection === 'valhalla' && <ValhallaSection />}
          {activeSection === 'adaptive' && <AdaptiveSection />}
          {activeSection === 'advanced' && <AdvancedSection />}
        </main>
      </div>
    </div>
  );
}

/* ─── Sections ─── */

function IntroSection() {
  return (
    <div className="docs-article">
      <span className="article-label">Overview</span>
      <h2>Introduction to Aura</h2>
      <div className="markdown-body">
        <p>
          Aura is a multi-agent media analysis and creation platform. It replaces
          traditional tool-based UIs with a <strong>zero-surface paradigm</strong>:
          you speak your intent, and a central AI — the Conductor — delegates the
          work to specialized agents called Virtuosos.
        </p>
        <p>
          Each Virtuoso is an expert in a single domain: visual analysis, research,
          generation, reasoning, documentation, or quality control. The Conductor
          interprets your natural language commands and routes tasks through the
          Symphony Bus, ensuring every agent works in concert.
        </p>

        <ul>
          <li><strong>Zero-surface interaction</strong> — no menus or panels to click through. Speak or type your intent.</li>
          <li><strong>Multi-agent orchestration</strong> — six specialized agents collaborate on every task.</li>
          <li><strong>Professional output</strong> — export to NLE formats, structured reports, and adaptive courses.</li>
          <li><strong>Extensible architecture</strong> — build custom Virtuosos through the Agent Studio.</li>
        </ul>
      </div>
    </div>
  );
}

function VirtuososSection() {
  const virtuosos = [
    {
      icon: <Music size={18} color="#8AB4F8" />,
      name: 'The Conductor',
      role: 'Orchestra Lead',
      model: 'gemini-2.5-pro',
      desc: 'Parses natural language intent and routes tasks across the Symphony Bus. The central intelligence of every session.',
    },
    {
      icon: <Eye size={18} color="#F27D26" />,
      name: 'The Visionary',
      role: 'Visual Analyst',
      model: 'gemini-2.5-pro',
      desc: 'Multi-modal frame analysis — composition, color theory, object detection, and temporal pattern recognition across video and images.',
    },
    {
      icon: <Globe size={18} color="#34A853" />,
      name: 'The Scholar',
      role: 'Research Specialist',
      model: 'gemini-2.5-flash',
      desc: 'Grounds analysis in real-world facts via Google Search. Verifies claims, finds context, and cites sources with URLs.',
    },
    {
      icon: <Palette size={18} color="#A142F4" />,
      name: 'The Artisan',
      role: 'Media Creator',
      model: 'veo-3.1-fast',
      desc: 'Generative media creation powered by Veo and Imagen. Crafts video and image assets from natural language prompts.',
    },
    {
      icon: <Cpu size={18} color="#4285F4" />,
      name: 'The Analyst',
      role: 'Logic Specialist',
      model: 'gemini-2.5-pro',
      desc: 'Deep reasoning, structured data extraction, and adaptive course generation with learner profiling and progress tracking.',
    },
    {
      icon: <Shield size={18} color="#EA4335" />,
      name: 'The Critic',
      role: 'Quality Evaluator',
      model: 'gemini-2.5-pro',
      desc: 'Evaluates every output for relevance, factual consistency, and quality. Catches hallucinations before delivery.',
    },
    {
      icon: <FileText size={18} color="#FBBC04" />,
      name: 'The Chronicler',
      role: 'Documentation Lead',
      model: 'gemini-2.5-flash',
      desc: 'Summarizes analysis sessions, organizes insights into structured reports, and exports data to Markdown, PDF, or NLE formats.',
    },
  ];

  return (
    <div className="docs-article">
      <span className="article-label">Architecture</span>
      <h2>The Virtuosos</h2>
      <div className="markdown-body">
        <p>
          Aura's power comes from specialization. Each Virtuoso is a dedicated AI
          agent fine-tuned for a single domain. The Conductor selects and delegates
          based on your intent — you never have to choose which model to use.
        </p>
      </div>
      <div className="virtuoso-grid">
        {virtuosos.map(v => (
          <div className="virtuoso-card" key={v.name}>
            <div className="v-header">
              <div className="v-icon">{v.icon}</div>
              <div>
                <div className="v-name">{v.name}</div>
                <div className="v-role">{v.role} · {v.model}</div>
              </div>
            </div>
            <p>{v.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ValhallaSection() {
  return (
    <div className="docs-article">
      <span className="article-label">Automation</span>
      <h2>Project Valhalla</h2>
      <div className="markdown-body">
        <p>
          Valhalla is Aura's bridge to the outside world. It allows AI agents to
          control external creative software — Blender, Ableton, Figma, or any
          CLI-driven tool — by generating and executing automation scripts in
          sandboxed environments.
        </p>
        <p>
          The generated scripts run in isolated sandboxes with resource limits and
          network controls. You see a live preview of what the AI is doing before
          the final output is produced.
        </p>
      </div>
      <div className="feature-list">
        <div className="feature-list-item">
          <div className="fl-icon"><Terminal size={16} color="#8AB4F8" /></div>
          <div className="fl-content">
            <h4>Sandboxed Execution</h4>
            <p>Every script runs in an isolated environment with CPU, memory, and network constraints.</p>
          </div>
        </div>
        <div className="feature-list-item">
          <div className="fl-icon"><Code size={16} color="#8AB4F8" /></div>
          <div className="fl-content">
            <h4>Script Generation</h4>
            <p>The AI writes Python or shell scripts tailored to the target application's API.</p>
          </div>
        </div>
        <div className="feature-list-item">
          <div className="fl-icon"><Eye size={16} color="#8AB4F8" /></div>
          <div className="fl-content">
            <h4>Visual Preview</h4>
            <p>See output previews before committing to the final render or export.</p>
          </div>
        </div>
      </div>
      <div className="markdown-body" style={{ marginTop: '1.5rem' }}>
        <p>
          <strong>To use Valhalla:</strong> Open the Conductor input and type a
          command like <code>Launch Blender and create a neon cube</code>. The
          Valhalla Gateway opens showing the generated script and preview.
        </p>
      </div>
    </div>
  );
}

function AdaptiveSection() {
  return (
    <div className="docs-article">
      <span className="article-label">Education</span>
      <h2>Adaptive Learning</h2>
      <div className="markdown-body">
        <p>
          Aura transforms any video into a structured learning experience. The
          "Create Course" lens generates modules with text, quizzes, and visual
          aids from your media content.
        </p>
        <p>
          As you progress through quizzes, Aura maintains a <strong>Digital Learner
          Profile (DLP)</strong> that tracks your performance at the concept level.
          If you struggle with a topic, the system adapts — offering remedial
          content, guided hints, and alternative explanations to ensure mastery.
        </p>
      </div>
      <div className="feature-list">
        <div className="feature-list-item">
          <div className="fl-icon"><GraduationCap size={16} color="#8AB4F8" /></div>
          <div className="fl-content">
            <h4>Course Generation</h4>
            <p>The Analyst decomposes video content into structured modules with text, visuals, and quizzes.</p>
          </div>
        </div>
        <div className="feature-list-item">
          <div className="fl-icon"><Cpu size={16} color="#8AB4F8" /></div>
          <div className="fl-content">
            <h4>Learner Profiling</h4>
            <p>Performance tracking at the concept level. The system knows what you know and what you don't.</p>
          </div>
        </div>
        <div className="feature-list-item">
          <div className="fl-icon"><Wand2 size={16} color="#8AB4F8" /></div>
          <div className="fl-content">
            <h4>Adaptive Remediation</h4>
            <p>Struggling concepts trigger alternative explanations, hints, and supplementary material.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdvancedSection() {
  const features = [
    {
      icon: <Search size={16} color="#8AB4F8" />,
      title: 'Semantic Video Search',
      desc: 'Ask natural language questions about video content. The Conductor analyzes frames and transcripts to drop markers at exact timestamps.',
    },
    {
      icon: <Mic size={16} color="#8AB4F8" />,
      title: 'Voice-Activated Conductor',
      desc: 'Click the microphone or use a wake word to speak commands naturally while watching. True zero-surface interaction.',
    },
    {
      icon: <Zap size={16} color="#8AB4F8" />,
      title: 'WebWorker Processing',
      desc: 'Frame extraction, transcription, and analysis run in background threads. The UI stays buttery smooth regardless of workload.',
    },
    {
      icon: <Video size={16} color="#8AB4F8" />,
      title: 'NLE Integration',
      desc: 'Export timelines, annotations, and assets to Premiere Pro, Final Cut Pro, or DaVinci Resolve via FCPXML, EDL, or CSV.',
    },
    {
      icon: <Wand2 size={16} color="#8AB4F8" />,
      title: 'Agent Studio',
      desc: 'Build custom Virtuosos. Define system prompts, capabilities, and models. They go live to the Conductor immediately.',
    },
    {
      icon: <Layers size={16} color="#8AB4F8" />,
      title: 'Symphony Bus',
      desc: 'The event-driven backbone connecting all Virtuosos. Tasks flow through typed events, enabling parallel execution and composition.',
    },
  ];

  return (
    <div className="docs-article">
      <span className="article-label">Reference</span>
      <h2>Advanced Features</h2>
      <div className="markdown-body">
        <p>
          Aura includes several capabilities designed for professional workflows
          and seamless interaction beyond standard analysis.
        </p>
      </div>
      <div className="feature-list">
        {features.map(f => (
          <div className="feature-list-item" key={f.title}>
            <div className="fl-icon">{f.icon}</div>
            <div className="fl-content">
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
