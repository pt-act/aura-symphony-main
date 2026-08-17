import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
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