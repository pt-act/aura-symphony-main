import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
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