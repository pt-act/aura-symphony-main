import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Hook</span>
      <h2>usePerceptionEngine</h2>
      <div className="markdown-body">
        <p>Real-time facial expression detection using <code>face-api.js</code>. Loads TinyFaceDetector and FaceExpressionNet models, then runs detection every 1.5 seconds on the video element.</p>
        <p><FileRef path="src/hooks/usePerceptionEngine.ts" /></p>
        <CodeBlock code={`const { isLoading, expression } = usePerceptionEngine(videoRef);

// expression: { type: 'happy' | 'sad' | 'neutral' | ..., probability: 0.0-1.0 } | null`} />
        <Callout type="info">Models are loaded from <code>https://justadudewhohacks.github.io/face-api.js/weights</code>. The hook only activates when the video element has <code>readyState &gt;= 3</code>.</Callout>
      </div>
    </div>
  );
}