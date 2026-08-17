import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Learning</span>
      <h2>Course Generation</h2>
      <div className="markdown-body">
        <p>The "Create Course" lens transforms any video into a structured learning module using the Analyst Virtuoso.</p>

        <h3>Pipeline</h3>
        <CodeBlock code={`Video → Frame Extraction (WebWorker)
  → asyncCaptureFrames(start, end)
  → base64 JPEG frames (max N frames)
  → generateCourseModules(frames)
    → Gemini structured JSON output
    → { summary, keyMoments, quiz }
  → CourseView component (interactive)`} />

        <h3>Output Structure</h3>
        <ul>
          <li><strong>Summary:</strong> 2-3 sentences, each with a video timecode</li>
          <li><strong>Key Moments:</strong> 3-5 timestamped highlights</li>
          <li><strong>Quiz:</strong> 3 multiple-choice questions with explanations and timecodes</li>
        </ul>

        <h3>Learning Modules</h3>
        <p>Three module types render the course content:</p>
        <PropTable rows={[
          { name: 'TextModule', type: 'component', desc: 'Renders summary and key moments with clickable timecodes' },
          { name: 'VideoModule', type: 'component', desc: 'Video player synced to course timestamps' },
          { name: 'QuizModule', type: 'component', desc: 'Interactive multiple-choice with immediate feedback and DLP updates' },
        ]} />
      </div>
    </div>
  );
}