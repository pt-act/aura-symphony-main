import React from 'react';
import { Book, AlertTriangle, CheckCircle } from 'lucide-react';

export function CodeBlock({ code, language = 'typescript', title }: { code: string; language?: string; title?: string }) {
  return (
    <div className="code-block-wrapper">
      {title && <div className="code-block-title">{title}</div>}
      <pre className="code-block"><code>{code.trim()}</code></pre>
    </div>
  );
}

export function PropTable({ rows }: { rows: Array<{ name: string; type: string; desc: string; default?: string }> }) {
  return (
    <div className="prop-table-wrapper">
      <table className="prop-table">
        <thead>
          <tr><th>Name</th><th>Type</th><th>Description</th><th>Default</th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.name}>
              <td><code>{r.name}</code></td>
              <td><code className="type-badge">{r.type}</code></td>
              <td>{r.desc}</td>
              <td>{r.default ? <code>{r.default}</code> : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Callout({ type = 'info', children }: { type?: 'info' | 'warn' | 'tip'; children: React.ReactNode }) {
  const icons = { info: <Book size={14} />, warn: <AlertTriangle size={14} />, tip: <CheckCircle size={14} /> };
  return <div className={`callout callout-${type}`}>{icons[type]}<div>{children}</div></div>;
}

export function FileRef({ path }: { path: string }) {
  return <code className="file-ref">{path}</code>;
}

export function VirtuosoDoc({
  label, name, file, model, capabilities, configNote, description, apiSignatures
}: {
  label?: string; name: string; file?: string; model?: string;
  capabilities?: string[]; configNote?: string; description?: string;
  apiSignatures?: string;
}) {
  return (
    <div className="virtuoso-doc">
      <div className="virtuoso-header">
        <h3>{name}</h3>
        {label && <span className="virtuoso-label">{label}</span>}
      </div>
      {model && <p className="model-used"><strong>Model:</strong> {model}</p>}
      {file && <FileRef path={file} />}
      {capabilities && (
        <div className="capabilities">
          <strong>Capabilities:</strong>
          <ul>{capabilities.map(c => <li key={c}>{c}</li>)}</ul>
        </div>
      )}
      {configNote && <Callout type="info">{configNote}</Callout>}
      {description && <p>{description}</p>}
      {apiSignatures && <CodeBlock code={apiSignatures} />}
    </div>
  );
}
