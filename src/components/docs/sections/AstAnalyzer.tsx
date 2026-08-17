import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Valhalla</span>
      <h2>AST Deep Analysis</h2>
      <div className="markdown-body">
        <p>Extends the regex analyzer with structural AST parsing for patterns that regex alone cannot catch.</p>
        <p><FileRef path="src/lib/valhalla-ast-analyzer.ts" /></p>

        <h3>Additional Detections</h3>
        <ul>
          <li><code>getattr(obj, '__class__')</code> — dynamic dunder access</li>
          <li><code>globals()['os']</code> — dictionary-based module access bypass</li>
          <li><code>__builtins__</code> access — can bypass import restrictions</li>
          <li><code>open()</code> with dynamic paths — potential file system escape</li>
        </ul>

        <CodeBlock code={`// Deep analysis merges regex + AST findings, deduplicating by line + category
function analyzeScriptDeep(sourceCode: string): SafetyReport`} />
      </div>
    </div>
  );
}