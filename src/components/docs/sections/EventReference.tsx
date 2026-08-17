import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Architecture</span>
      <h2>Event Reference</h2>
      <div className="markdown-body">
        <h3>Core Events</h3>
        <PropTable rows={[
          { name: 'task:start', type: 'CustomEvent', desc: 'Fired when a Virtuoso is commissioned. Detail: { id, name, virtuosoId }' },
          { name: 'task:progress', type: 'CustomEvent', desc: 'Progress update during long-running tasks. Detail: { id, progress }' },
          { name: 'task:success', type: 'CustomEvent', desc: 'Task completed successfully. Detail: { id, result }' },
          { name: 'task:error', type: 'CustomEvent', desc: 'Task failed. Detail: { id, error: string }' },
          { name: 'commission:chain', type: 'CustomEvent', desc: 'Agent-to-agent delegation. Detail: { parentId, childId, childVirtuoso, childTaskName, context, createdAt }' },
        ]} />

        <h3>Application Events</h3>
        <PropTable rows={[
          { name: 'LAUNCH_VALHALLA', type: 'CustomEvent', desc: 'Requests Valhalla Gateway to open. Detail: { tool: string }' },
        ]} />

        <h3>Subscribing to Events</h3>
        <CodeBlock code={`import { symphonyBus, Events } from '../lib/symphonyBus';

symphonyBus.listen(Events.TASK_SUCCESS, (event: Event) => {
  const { id, result } = (event as CustomEvent).detail;
  console.log(\`Task \${id} completed:\`, result);
});`} />
      </div>
    </div>
  );
}