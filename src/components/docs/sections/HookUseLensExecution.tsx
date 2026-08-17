import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Hook</span>
      <h2>useLensExecution</h2>
      <div className="markdown-body">
        <p>Strategy-pattern dispatcher for all lens/mode execution. Routes to the appropriate handler module based on the selected lens type. Each lens type is an independent handler file registered in a central registry.</p>
        <p><FileRef path="src/hooks/useLensExecution.ts" /> · <FileRef path="src/lib/lens-handlers/registry.ts" /></p>
        <CodeBlock code={`const { handleSelectLens } = useLensExecution(deps);

// Execute a lens:
await handleSelectLens('Deep Analysis');                    // Built-in lens
await handleSelectLens('Custom', 'Analyze color theory');   // Custom prompt
await handleSelectLens('PDF Analysis', undefined, pdfFile); // PDF upload
await handleSelectLens('Chat', 'Hello');                    // Conversational
await handleSelectLens('Generate Video', 'A sunset');       // Artisan

// Handler modules (src/lib/lens-handlers/):
//   pdf-handler.ts, chat-handler.ts, media-handler.ts,
//   search-handler.ts, course-handler.ts, video-analysis-handler.ts
// Adding a new lens: create handler file → add to handlers[] in registry
// Runtime extensibility: registerHandler() for plugins`} />
        <Callout type="info">Text-based lens output is gated through the <code>useCriticGate</code> hook before display. If the Critic rejects the output, it triggers up to 2 retry cycles.</Callout>
      </div>
    </div>
  );
}