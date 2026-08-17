import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Valhalla</span>
      <h2>Script Safety Analyzer</h2>
      <div className="markdown-body">
        <p>Regex-based structural analysis for Python scripts. Detects 5 categories of dangerous patterns.</p>
        <p><FileRef path="src/lib/valhalla-analyzer.ts" /></p>

        <h3>Detection Categories</h3>
        <PropTable rows={[
          { name: 'infinite-loop', type: 'critical', desc: 'while True without break/return — will hang execution' },
          { name: 'dangerous-import', type: 'critical/warning', desc: 'os, subprocess, shutil, socket, ctypes, etc.' },
          { name: 'destructive-call', type: 'critical', desc: 'os.remove, shutil.rmtree, subprocess.call, os.system, etc.' },
          { name: 'system-escape', type: 'critical', desc: 'eval(), exec(), __import__(), getattr with dunders' },
          { name: 'network-operation', type: 'warning', desc: 'requests.get/post, urllib, socket connections' },
        ]} />

        <h3>Scoring</h3>
        <p>Base score: <strong>100</strong>. Each critical finding: <strong>-30</strong>. Each warning: <strong>-10</strong>. Score ≤ 0 clamped to 0. Script is <strong>safe</strong> only if critical count = 0.</p>

        <CodeBlock code={`function analyzeScript(sourceCode: string): SafetyReport

interface SafetyReport {
  safe: boolean;     // true only if 0 criticals
  score: number;     // 0-100
  findings: SafetyFinding[];
  summary: string;   // Human-readable summary
}

function getSafetyBadge(report: SafetyReport): 'green' | 'yellow' | 'red'`} />
      </div>
    </div>
  );
}