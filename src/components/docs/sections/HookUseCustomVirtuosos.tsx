import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Hook</span>
      <h2>useCustomVirtuosos</h2>
      <div className="markdown-body">
        <p>CRUD operations for user-defined custom Virtuosos, persisted to Firestore. Validates profiles before saving and registers them in the runtime <code>VIRTUOSO_REGISTRY</code>.</p>
        <p><FileRef path="src/hooks/useCustomVirtuosos.ts" /></p>
        <CodeBlock code={`const { customVirtuosos, saveCustomVirtuoso, deleteCustomVirtuoso } = useCustomVirtuosos(user);

// Validation: id must start with 'custom_', cannot overwrite built-in Virtuosos`} />
      </div>
    </div>
  );
}