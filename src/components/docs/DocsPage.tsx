import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Book, Code, Cpu, Layers, Terminal } from 'lucide-react';
import './DocsPage.css';

const DOCS_CONTENT = {
  intro: {
    title: "Introduction to Aura",
    content: `Aura is a next-generation media analysis and creation platform. It moves beyond traditional tool-based interfaces into a "zero-surface" paradigm where you orchestrate a symphony of specialized AI agents.

Instead of clicking through menus, you interact with The Conductor—a central intelligence that interprets your goals and delegates tasks to specialized Virtuosos.`
  },
  virtuosos: {
    title: "The Virtuosos",
    content: `Aura is powered by a multi-agent architecture. Each agent, or "Virtuoso," is an expert in a specific domain:

- **The Conductor:** The orchestrator. It parses your intent and routes tasks.
- **The Visionary:** The visual analyst. It uses Gemini's multimodal capabilities to extract deep insights from video frames and images.
- **The Scholar:** The researcher. It grounds analysis in real-world facts using Google Search.
- **The Artisan:** The creator. It uses Veo and Imagen to generate new media assets.
- **The Analyst:** The logician. It synthesizes data, creates structured courses, and tracks learning progress.
- **The Chronicler:** The documentarian. It summarizes sessions and exports data.`
  },
  valhalla: {
    title: "Project Valhalla",
    content: `Project Valhalla is Aura's bridge to the outside world. It allows the AI agents to control external creative software (like Blender, Ableton, or Figma) by generating and executing automation scripts in sandboxed environments.

To use Valhalla:
1. Open the Conductor input.
2. Type a command like "Launch Blender and create a neon cube."
3. The Valhalla Gateway will open, showing the generated script and a visual preview of the result.`
  },
  adaptive: {
    title: "Adaptive Learning",
    content: `Aura isn't just for analysis; it's an educational platform. The "Create Course" lens transforms any video into a structured learning module.

As you take quizzes, Aura tracks your performance in a Digital Learner Profile (DLP). If you struggle with a concept, the system adapts, offering remedial content and guided hints to ensure mastery.`
  },
  advanced: {
    title: "Advanced Capabilities",
    content: `Aura includes several advanced features designed for professional workflows and seamless interaction:

- **Semantic Video Search:** Ask the Conductor questions like "Where did they discuss the black hole?" and it will instantly drop markers on the timeline at the exact timestamps.
- **Voice-Activated Conductor:** Click the microphone icon or use the wake word to speak your commands naturally, achieving a true "zero-surface" experience.
- **WebWorker Processing:** Heavy media processing (like frame extraction) is offloaded to background threads, ensuring the UI remains buttery smooth.
- **NLE Integration:** Export your timeline, annotations, and generated assets directly to Premiere Pro, Final Cut Pro, or DaVinci Resolve via FCPXML, EDL, or CSV.
- **Agent Studio (Custom Virtuosos):** Build your own custom AI agents. Define their system prompts, capabilities, and models to fit your exact niche, and they will be instantly available to the Conductor.`
  }
};

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<keyof typeof DOCS_CONTENT>('intro');

  return (
    <div className="docs-container">
      <header className="docs-header">
        <div className="logo">
          <div className="logo-orb"></div>
          <h1>Aura Docs</h1>
        </div>
        <Link to="/" className="back-link">
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </header>

      <div className="docs-layout">
        <aside className="docs-sidebar">
          <nav>
            <ul>
              <li>
                <button 
                  className={activeSection === 'intro' ? 'active' : ''} 
                  onClick={() => setActiveSection('intro')}
                >
                  <Book size={16} /> Introduction
                </button>
              </li>
              <li>
                <button 
                  className={activeSection === 'virtuosos' ? 'active' : ''} 
                  onClick={() => setActiveSection('virtuosos')}
                >
                  <Cpu size={16} /> The Virtuosos
                </button>
              </li>
              <li>
                <button 
                  className={activeSection === 'valhalla' ? 'active' : ''} 
                  onClick={() => setActiveSection('valhalla')}
                >
                  <Terminal size={16} /> Project Valhalla
                </button>
              </li>
              <li>
                <button 
                  className={activeSection === 'adaptive' ? 'active' : ''} 
                  onClick={() => setActiveSection('adaptive')}
                >
                  <Layers size={16} /> Adaptive Learning
                </button>
              </li>
              <li>
                <button 
                  className={activeSection === 'advanced' ? 'active' : ''} 
                  onClick={() => setActiveSection('advanced')}
                >
                  <Code size={16} /> Advanced Features
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="docs-content">
          <div className="docs-article">
            <h2>{DOCS_CONTENT[activeSection].title}</h2>
            <div className="markdown-body">
              {DOCS_CONTENT[activeSection].content.split('\n\n').map((paragraph, i) => {
                if (paragraph.startsWith('-')) {
                  return (
                    <ul key={i}>
                      {paragraph.split('\n').map((item, j) => {
                        const match = item.match(/^- \*\*(.*?)\*\* (.*)/);
                        if (match) {
                          return <li key={j}><strong>{match[1]}</strong> {match[2]}</li>;
                        }
                        return <li key={j}>{item.replace(/^- /, '')}</li>;
                      })}
                    </ul>
                  );
                }
                return <p key={i}>{paragraph}</p>;
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
