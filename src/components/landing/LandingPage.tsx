import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, BookOpen, Music, Eye, Palette, Cpu, Terminal, Search, Mic, Zap, Video, Wand2 } from 'lucide-react';
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
        <section className="hero-section">
          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="badge">Project Valhalla Integrated</div>
            <h2 className="hero-title">
              Orchestrate Your Media.<br/>
              <span className="gradient-text">Command the AI Symphony.</span>
            </h2>
            <p className="hero-subtitle">
              Aura is a zero-surface, multi-agent platform for deep video analysis, generative media creation, and adaptive learning. Step into the conductor's shoes and let the Virtuosos do the heavy lifting.
            </p>
            <div className="hero-actions">
              <Link to="/app" className="cta-button primary">
                <Play size={20} />
                Enter Workspace
              </Link>
              <Link to="/docs" className="cta-button secondary">
                <BookOpen size={20} />
                Read the Docs
              </Link>
            </div>
          </motion.div>

          <motion.div 
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <div className="mock-interface">
              <div className="mock-header">
                <div className="dots"><span></span><span></span><span></span></div>
              </div>
              <div className="mock-body">
                <div className="mock-sidebar"></div>
                <div className="mock-main">
                  <div className="mock-video">
                    <div className="play-icon"><Play size={32} /></div>
                  </div>
                  <div className="mock-timeline"></div>
                </div>
                <div className="mock-conductor">
                  <div className="pulse-ring"></div>
                  <Music size={24} color="#8AB4F8" />
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="features-section">
          <div className="section-header">
            <h3>Meet the Virtuosos</h3>
            <p>A specialized ensemble of AI agents ready to execute your creative vision.</p>
          </div>
          <div className="features-grid">
            <FeatureCard 
              icon={<Music size={24} color="#8AB4F8" />}
              title="The Conductor"
              description="The central intelligence. Interprets your natural language commands and delegates tasks across the Symphony Bus."
            />
            <FeatureCard 
              icon={<Eye size={24} color="#F27D26" />}
              title="The Visionary"
              description="Deep multi-modal analysis. Extracts insights, detects objects, and understands the visual composition of your media."
            />
            <FeatureCard 
              icon={<Palette size={24} color="#A142F4" />}
              title="The Artisan"
              description="Generative media creation. Powered by Veo and Imagen to craft new video and image assets on demand."
            />
            <FeatureCard 
              icon={<Cpu size={24} color="#4285F4" />}
              title="The Analyst"
              description="Logic and reasoning. Synthesizes complex data, generates structured educational courses, and tracks adaptive learning."
            />
          </div>
        </section>

        <section className="features-section" style={{ background: 'var(--bg-secondary)', marginTop: '4rem', padding: '4rem 2rem' }}>
          <div className="section-header">
            <h3>Next-Generation Capabilities</h3>
            <p>Aura has been upgraded with powerful new features to supercharge your workflow.</p>
          </div>
          <div className="features-grid">
            <FeatureCard 
              icon={<Search size={24} color="#34a853" />}
              title="Semantic Video Search"
              description="Ask 'Where did they discuss the black hole?' and the Conductor instantly drops markers at the exact timestamps."
            />
            <FeatureCard 
              icon={<Mic size={24} color="#ea4335" />}
              title="Voice-Activated Conductor"
              description="A true 'zero-surface' experience. Speak your commands naturally while watching the video to direct the AI."
            />
            <FeatureCard 
              icon={<Zap size={24} color="#fbbc04" />}
              title="WebWorker Processing"
              description="Buttery smooth performance. Heavy media processing is offloaded to background threads so the UI never freezes."
            />
            <FeatureCard 
              icon={<Video size={24} color="#4285f4" />}
              title="NLE Integration"
              description="Export your timeline, annotations, and generated assets directly to Premiere Pro or Final Cut Pro via FCPXML/EDL."
            />
            <FeatureCard 
              icon={<Wand2 size={24} color="#a142f4" />}
              title="Agent Studio"
              description="Build your own custom AI agents. Define their system prompts, capabilities, and models to fit your exact niche."
            />
          </div>
        </section>

        <section className="valhalla-section">
          <div className="valhalla-content">
            <h3>Project Valhalla</h3>
            <p>Break out of the browser. Aura can now control external creative software like Blender and Ableton through sandboxed automation scripts generated on the fly.</p>
            <Link to="/docs#valhalla" className="text-link">Learn how it works &rarr;</Link>
          </div>
          <div className="valhalla-visual">
            <Terminal size={48} color="#4ade80" />
            <div className="code-snippet">
              <code>&gt; Launching Blender...</code>
              <code>&gt; Generating Python script...</code>
              <code>&gt; Executing render...</code>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>&copy; 2026 Aura Symphony. Built with Google Gemini.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h4>{title}</h4>
      <p>{description}</p>
    </div>
  );
}
