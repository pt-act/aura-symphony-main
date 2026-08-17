import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
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