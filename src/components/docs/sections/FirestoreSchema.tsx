import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Data</span>
      <h2>Firestore Schema & Security Rules</h2>
      <div className="markdown-body">
        <p><FileRef path="firestore.rules" /></p>

        <h3>Collections</h3>
        <PropTable rows={[
          { name: 'users/{userId}', type: 'UserDoc', desc: 'User profile + DLP. Owner-only read/write. Validated: uid, email, displayName, photoURL, digitalLearnerProfile.' },
          { name: 'insights/{insightId}', type: 'InsightDoc', desc: 'Analysis results. Owner-only CRUD. Validated: id (number), title, type, data (map), userId.' },
          { name: 'annotations/{annotationId}', type: 'AnnotationDoc', desc: 'Timeline annotations. Owner-only. Validated: id, time, text (max 1000 chars), userId.' },
          { name: 'presentations/{id}', type: 'PresentationDoc', desc: 'Creator Studio presentations. Max 50 slides. Owner-only.' },
          { name: 'custom_virtuosos/{id}', type: 'VirtuosoDoc', desc: 'Custom agent definitions. Validated: all fields. systemInstruction max 5000 chars.' },
        ]} />

        <h3>Security Model</h3>
        <ul>
          <li><strong>Authentication required</strong> for all writes</li>
          <li><strong>Owner-only access</strong> — <code>request.auth.uid == resource.data.userId</code></li>
          <li><strong>Admin override</strong> — users with <code>role: 'admin'</code> can read/delete any document</li>
          <li><strong>Field-level validation</strong> — <code>hasOnlyAllowedFields()</code> prevents injection of extra fields</li>
          <li><strong>Default deny</strong> — <code>match /{'{'}path=**{'}'} {'{'} allow read, write: if false; {'}'}</code></li>
        </ul>
      </div>
    </div>
  );
}