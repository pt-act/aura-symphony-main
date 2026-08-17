import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Extensibility</span>
      <h2>Provider Configuration</h2>
      <div className="markdown-body">
        <p>Users can configure custom AI providers (different API keys, models, or endpoints) via the Settings modal.</p>
        <p><FileRef path="src/lib/provider-config.ts" /></p>

        <h3>Provider Resolution Chain</h3>
        <CodeBlock code={`getAI() resolution:
  1. Check active provider in localStorage
  2. If active provider has apiKey → return new GoogleGenAI({ apiKey })
  3. Otherwise → return default client (process.env.API_KEY)

getEffectiveModel(registryModel) resolution:
  1. Check active provider for custom model
  2. If custom model set → return custom model
  3. Otherwise → return registryModel (from VirtuosoProfile)`} />

        <h3>Connection Testing</h3>
        <p><code>testProviderConnection(apiKey, model?)</code> makes a lightweight <code>models.list()</code> call with a 10-second timeout. If a model name is provided, verifies it exists in the returned list.</p>
      </div>
    </div>
  );
}