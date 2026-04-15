import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Play, BookOpen, Music, Eye, Palette, Cpu,
  Search, Mic, Zap, Video, Wand2, Shield,
  FileText, GitBranch, Layers, Radio
} from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="logo">
          <div className="logo-orb"></div>
          <h1>Aura Symphony</h1>
        </div>
        <nav className="landing-nav">
          <Link to="/docs">Documentation</Link>
          <Link to="/app" className="cta-button small">Launch Workspace</Link>
        </nav>
      </header>

      <main className="landing-main">
        {/* ─── Hero ─── */}
        <section className="hero-section">
          <div className="hero-glow" />
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="badge">
              <Radio size={12} /> Multi-Agent Architecture
            </div>
            <h2 className="hero-title">
              Your media has depth.<br />
              <span className="gradient-text">Let the orchestra find it.</span>
            </h2>
            <p className="hero-subtitle">
              Aura is a zero-surface analysis platform where specialized AI agents —
              the Virtuosos — decompose video, image, and audio at a level no single model can.
              Speak your intent. The Conductor handles the rest.
            </p>
            <div className="hero-actions">
              <Link to="/app" className="cta-button primary">
                <Play size={18} />
                Enter Workspace
              </Link>
              <Link to="/docs" className="cta-button secondary">
                <BookOpen size={18} />
                Read the Docs
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mock-interface">
              <div className="mock-header">
                <div className="dots"><span></span><span></span><span></span></div>
              </div>
              <div className="mock-body">
                <div className="mock-sidebar" />
                <div className="mock-main">
                  <div className="mock-video">
                    <div className="play-icon"><Play size={32} /></div>
                  </div>
                  <div className="mock-timeline" />
                </div>
                <div className="mock-conductor">
                  <div className="pulse-ring" />
                  <Music size={22} color="#8AB4F8" />
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ─── The Virtuosos ─── */}
        <section className="features-section">
          <div className="section-header">
            <span className="section-label">The Ensemble</span>
            <h3>Meet the Virtuosos</h3>
            <p>
              Six specialized agents, each master of a single domain.
              The Conductor delegates. They execute.
            </p>
          </div>
          <div className="features-grid">
            <FeatureCard
              icon={<Music size={20} color="#8AB4F8" />}
              title="The Conductor"
              description="Interprets natural language intent and routes tasks across the Symphony Bus. The brain of every session."
            />
            <FeatureCard
              icon={<Eye size={20} color="#F27D26" />}
              title="The Visionary"
              description="Multi-modal frame analysis — composition, color theory, object detection, and temporal pattern recognition."
            />
            <FeatureCard
              icon={<Palette size={20} color="#A142F4" />}
              title="The Artisan"
              description="Generative media creation via Veo and Imagen. Produces video and image assets from natural language prompts."
            />
            <FeatureCard
              icon={<Cpu size={20} color="#4285F4" />}
              title="The Analyst"
              description="Deep reasoning, structured data extraction, and adaptive course generation with learner profiling."
            />
            <FeatureCard
              icon={<Shield size={20} color="#EA4335" />}
              title="The Critic"
              description="Quality gate — evaluates every output for relevance, factual consistency, and hallucination before delivery."
            />
            <FeatureCard
              icon={<FileText size={20} color="#FBBC04" />}
              title="The Chronicler"
              description="Summarizes sessions and exports structured reports to Markdown, PDF, or NLE-compatible formats."
            />
          </div>
        </section>

        {/* ─── Capabilities ─── */}
        <section className="capabilities-section">
          <div className="section-header">
            <span className="section-label">Capabilities</span>
            <h3>Built for professional workflows</h3>
            <p>
              Not a chatbot with a video player. A purpose-built analysis engine.
            </p>
          </div>
          <div className="capabilities-grid">
            <CapabilityCard
              icon={<Search size={18} color="#8AB4F8" />}
              title="Semantic Video Search"
              description="Ask 'Where do they discuss pricing?' — the Conductor drops timeline markers at the exact timestamps."
            />
            <CapabilityCard
              icon={<Mic size={18} color="#8AB4F8" />}
              title="Voice-Activated Conductor"
              description="Zero-surface interaction. Speak commands naturally while the video plays. No menus, no clicking."
            />
            <CapabilityCard
              icon={<Zap size={18} color="#8AB4F8" />}
              title="WebWorker Pipeline"
              description="Frame extraction, transcription, and analysis run in background threads. The UI never freezes."
            />
            <CapabilityCard
              icon={<Video size={18} color="#8AB4F8" />}
              title="NLE Export"
              description="Timeline, annotations, and generated assets export directly to Premiere, Final Cut, or Resolve."
            />
            <CapabilityCard
              icon={<Wand2 size={18} color="#8AB4F8" />}
              title="Agent Studio"
              description="Build custom Virtuosos. Define prompts, capabilities, and models — they're live to the Conductor instantly."
            />
            <CapabilityCard
              icon={<GitBranch size={18} color="#8AB4F8" />}
              title="Project Valhalla"
              description="Bridge to external tools. The AI controls Blender, Ableton, or Figma through sandboxed automation scripts."
            />
          </div>
        </section>

        {/* ─── Valhalla ─── */}
        <section className="valhalla-section">
          <motion.div
            className="valhalla-content"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="section-label">Project Valhalla</span>
            <h3>Break out of the browser</h3>
            <p>
              Aura generates and executes automation scripts in sandboxed
              environments — controlling Blender, Ableton, Figma, or any
              CLI-driven creative tool. The AI doesn't just analyze your work.
              It does the work.
            </p>
            <Link to="/docs#valhalla" className="text-link">
              Explore Valhalla &rarr;
            </Link>
          </motion.div>

          <motion.div
            className="valhalla-visual"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <div className="terminal-header">
              <span className="terminal-dot" />
              <span className="terminal-dot" />
              <span className="terminal-dot active" />
            </div>
            <div className="code-snippet">
              <span><span className="prompt">$</span> aura valhalla launch blender</span>
              <span><span className="prompt">&gt;</span> Initializing sandbox...</span>
              <span><span className="prompt">&gt;</span> Generating Python script...</span>
              <span><span className="prompt">&gt;</span> Executing render pipeline...</span>
              <span><span className="prompt">&gt;</span> Output: render_042.png ✓</span>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>&copy; 2026 Aura Symphony &middot; Multi-Agent Media Intelligence</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h4>{title}</h4>
      <p>{description}</p>
    </div>
  );
}

function CapabilityCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="capability-card">
      <div className="cap-header">
        <div className="cap-icon">{icon}</div>
        <h4>{title}</h4>
      </div>
      <p>{description}</p>
    </div>
  );
}
