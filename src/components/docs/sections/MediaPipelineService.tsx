import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Backend</span>
      <h2>Media Pipeline Service</h2>
      <div className="markdown-body">
        <p>Express + WebSocket service for heavy media processing. Uses FFmpeg for frame extraction and audio extraction. Reports progress via WebSocket.</p>
        <p><FileRef path="backend/media-pipeline/server.js" /></p>

        <h3>Endpoints</h3>
        <PropTable rows={[
          { name: 'POST /jobs', type: 'JSON body', desc: 'Submit video processing job. Returns 202 with jobId. Params: videoUrl, videoId, frameInterval, extractAudio, transcribe' },
          { name: 'GET /jobs/:id', type: '—', desc: 'Get job status (queued/processing/completed/failed + progress)' },
          { name: 'GET /jobs/:id/frames', type: '—', desc: 'Get extracted frames for completed job' },
          { name: 'GET /health', type: '—', desc: 'Health check with active/total job counts' },
        ]} />

        <h3>WebSocket Protocol</h3>
        <p>Connect to <code>ws://host:3003?jobId=...</code> for real-time progress updates:</p>
        <CodeBlock code={`// Progress message format
{
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;     // 0-100
  frameCount?: number;  // On completion
  error?: string;       // On failure
}`} />
      </div>
    </div>
  );
}