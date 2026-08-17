import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Learning</span>
      <h2>Biofeedback Integration</h2>
      <div className="markdown-body">
        <p>Aura includes an experimental biofeedback system using the <code>usePerceptionEngine</code> hook and the <code>BiofeedbackMonitor</code> component.</p>
        <p><FileRef path="src/components/course/BiofeedbackMonitor.tsx" /></p>

        <h3>Architecture</h3>
        <ul>
          <li><strong>Face Detection:</strong> TinyFaceDetector from face-api.js (runs every 1.5s)</li>
          <li><strong>Expression Classification:</strong> FaceExpressionNet detects: happy, sad, angry, fearful, disgusted, surprised, neutral</li>
          <li><strong>Consent:</strong> <code>ConsentModal</code> shown before camera activation</li>
        </ul>

        <Callout type="warn">Biofeedback is opt-in and requires explicit user consent. Camera data never leaves the browser — all processing is client-side via face-api.js models.</Callout>
      </div>
    </div>
  );
}