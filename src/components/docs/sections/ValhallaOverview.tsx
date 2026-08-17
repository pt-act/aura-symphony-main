import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
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