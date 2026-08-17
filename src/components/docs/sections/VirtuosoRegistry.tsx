import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
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