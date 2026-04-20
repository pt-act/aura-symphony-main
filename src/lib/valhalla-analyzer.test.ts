import {describe, it, expect} from 'vitest';
import {analyzeScript, getSafetyBadge, type SafetyReport} from './valhalla-analyzer';

// ─── analyzeScript ─────────────────────────────────────────────────

describe('analyzeScript', () => {
  // --- Safe scripts ---
  it('returns safe for a benign script', () => {
    const report = analyzeScript(`
import math

def calculate_area(radius):
    return math.pi * radius ** 2

print(calculate_area(5))
    `);
    expect(report.safe).toBe(true);
    expect(report.score).toBe(100);
    expect(report.findings).toHaveLength(0);
    expect(report.summary).toContain('passed all safety checks');
  });

  it('returns safe for empty script', () => {
    const report = analyzeScript('');
    expect(report.safe).toBe(true);
    expect(report.score).toBe(100);
  });

  it('returns safe for script with only comments', () => {
    const report = analyzeScript(`
# This is a comment
# Another comment
    `);
    expect(report.safe).toBe(true);
    expect(report.score).toBe(100);
  });

  // --- Dangerous imports ---
  it('flags import of os as critical', () => {
    const report = analyzeScript(`
import os
os.getcwd()
    `);
    expect(report.safe).toBe(false);
    const finding = report.findings.find((f) => f.category === 'dangerous-import');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('critical');
    expect(finding!.message).toContain('os');
  });

  it('flags import of subprocess as critical', () => {
    const report = analyzeScript(`
import subprocess
subprocess.run(['ls'])
    `);
    expect(report.safe).toBe(false);
    const finding = report.findings.find(
      (f) => f.category === 'dangerous-import' && f.match.includes('subprocess'),
    );
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('critical');
  });

  it('flags from-import of os as critical', () => {
    const report = analyzeScript(`
from os import path
    `);
    expect(report.safe).toBe(false);
    const finding = report.findings.find((f) => f.category === 'dangerous-import');
    expect(finding).toBeDefined();
  });

  it('flags import of socket as warning', () => {
    const report = analyzeScript(`
import socket
s = socket.socket()
    `);
    const finding = report.findings.find(
      (f) => f.category === 'dangerous-import' && f.match.includes('socket'),
    );
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('warning');
  });

  it('flags import of ctypes as warning', () => {
    const report = analyzeScript(`
import ctypes
    `);
    const finding = report.findings.find((f) => f.category === 'dangerous-import');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('warning');
  });

  // --- Destructive calls ---
  it('flags os.remove() as critical', () => {
    const report = analyzeScript(`
import os
os.remove('/tmp/file.txt')
    `);
    expect(report.safe).toBe(false);
    const finding = report.findings.find((f) => f.category === 'destructive-call');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('critical');
  });

  it('flags shutil.rmtree() as critical', () => {
    const report = analyzeScript(`
import shutil
shutil.rmtree('/tmp/dir')
    `);
    const finding = report.findings.find(
      (f) => f.category === 'destructive-call' && f.match.includes('rmtree'),
    );
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('critical');
  });

  it('flags subprocess.call() as critical', () => {
    const report = analyzeScript(`
import subprocess
subprocess.call(['rm', '-rf', '/'])
    `);
    const finding = report.findings.find(
      (f) => f.category === 'destructive-call' && f.match.includes('subprocess.call'),
    );
    expect(finding).toBeDefined();
  });

  it('flags subprocess.run() as critical', () => {
    const report = analyzeScript(`
import subprocess
subprocess.run(['ls'])
    `);
    const finding = report.findings.find(
      (f) => f.category === 'destructive-call' && f.match.includes('subprocess.run'),
    );
    expect(finding).toBeDefined();
  });

  it('flags os.system() as critical', () => {
    const report = analyzeScript(`
import os
os.system('ls')
    `);
    const finding = report.findings.find(
      (f) => f.category === 'destructive-call' && f.match.includes('os.system'),
    );
    expect(finding).toBeDefined();
  });

  // --- System escape ---
  it('flags eval() as critical', () => {
    const report = analyzeScript(`
eval('print(1)')
    `);
    expect(report.safe).toBe(false);
    const finding = report.findings.find((f) => f.category === 'system-escape');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('critical');
  });

  it('flags exec() as critical', () => {
    const report = analyzeScript(`
exec('x = 1')
    `);
    const finding = report.findings.find((f) => f.category === 'system-escape');
    expect(finding).toBeDefined();
  });

  it('flags __import__() as critical', () => {
    const report = analyzeScript(`
mod = __import__('os')
    `);
    const finding = report.findings.find((f) => f.category === 'system-escape');
    expect(finding).toBeDefined();
  });

  it('flags getattr with dunder as critical', () => {
    const report = analyzeScript(`
val = getattr(obj, '__class__')
    `);
    const finding = report.findings.find((f) => f.category === 'system-escape');
    expect(finding).toBeDefined();
  });

  // --- Network operations ---
  it('flags requests.get() as warning', () => {
    const report = analyzeScript(`
import requests
requests.get('https://example.com')
    `);
    const finding = report.findings.find((f) => f.category === 'network-operation');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('warning');
  });

  it('flags urllib.request.urlopen() as warning', () => {
    const report = analyzeScript(`
import urllib.request
urllib.request.urlopen('https://example.com')
    `);
    const finding = report.findings.find((f) => f.category === 'network-operation');
    expect(finding).toBeDefined();
  });

  // --- Infinite loop detection ---
  it('flags while True without break as critical', () => {
    const report = analyzeScript(`
while True:
    print('looping')
    `);
    expect(report.safe).toBe(false);
    const finding = report.findings.find((f) => f.category === 'infinite-loop');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('critical');
  });

  it('accepts while True with break', () => {
    const report = analyzeScript(`
while True:
    if condition:
        break
    `);
    const loopFinding = report.findings.find((f) => f.category === 'infinite-loop');
    expect(loopFinding).toBeUndefined();
  });

  it('accepts while True with return', () => {
    const report = analyzeScript(`
def run():
    while True:
        if done:
            return result
    `);
    const loopFinding = report.findings.find((f) => f.category === 'infinite-loop');
    expect(loopFinding).toBeUndefined();
  });

  it('flags while True at end of file (no break)', () => {
    const report = analyzeScript(`
x = 1
while True:
    x += 1`);
    const finding = report.findings.find((f) => f.category === 'infinite-loop');
    expect(finding).toBeDefined();
  });

  // --- Score calculation ---
  it('calculates score correctly for mixed findings', () => {
    const report = analyzeScript(`
import os
os.remove('/tmp/file')
os.rmdir('/tmp/dir')
    `);
    // 3 criticals: import os (dangerous-import), os.remove (destructive-call), os.rmdir (destructive-call)
    expect(report.score).toBe(10);
    expect(report.safe).toBe(false);
  });

  it('calculates score with warnings only', () => {
    const report = analyzeScript(`
import requests
requests.get('https://example.com')
    `);
    // 1 warning = 100 - 10 = 90
    expect(report.score).toBe(90);
    expect(report.safe).toBe(true);
  });

  it('floor score at 0', () => {
    const report = analyzeScript(`
import os
import subprocess
os.remove('/f')
subprocess.call(['rm'])
eval('x')
exec('y')
__import__('z')
    `);
    // Many criticals — score should not go below 0
    expect(report.score).toBeGreaterThanOrEqual(0);
  });

  // --- Summary messages ---
  it('generates correct summary for clean script', () => {
    const report = analyzeScript('print("hello")');
    expect(report.summary).toBe('Script passed all safety checks.');
  });

  it('generates correct summary for warnings-only script', () => {
    const report = analyzeScript(`
import requests
requests.get('https://example.com')
    `);
    expect(report.summary).toContain('warning(s)');
    expect(report.summary).toContain('caution');
  });

  it('generates correct summary for critical script', () => {
    const report = analyzeScript(`
import os
os.remove('/file')
    `);
    expect(report.summary).toContain('critical');
    expect(report.summary).toContain('blocked');
  });

  // --- Line number tracking ---
  it('reports correct line numbers', () => {
    const report = analyzeScript(`# comment
import os  # line 2
x = 1      # line 3
os.remove('/f')  # line 4
    `);
    const importFinding = report.findings.find((f) => f.category === 'dangerous-import');
    expect(importFinding!.line).toBe(2);

    const destructiveFinding = report.findings.find((f) => f.category === 'destructive-call');
    expect(destructiveFinding!.line).toBe(4);
  });

  // --- Comments are ignored ---
  it('does not flag dangerous patterns in comments', () => {
    const report = analyzeScript(`
# os.remove('/etc/passwd')
# eval('malicious')
# import subprocess
print('safe')
    `);
    expect(report.findings).toHaveLength(0);
  });
});

// ─── getSafetyBadge ────────────────────────────────────────────────

describe('getSafetyBadge', () => {
  it('returns green for fully clean report', () => {
    const report: SafetyReport = {
      safe: true,
      score: 100,
      findings: [],
      summary: 'Safe',
    };
    expect(getSafetyBadge(report)).toBe('green');
  });

  it('returns yellow for safe report with warnings', () => {
    const report: SafetyReport = {
      safe: true,
      score: 90,
      findings: [
        {line: 1, severity: 'warning', category: 'network', message: 'test', match: 'test'},
      ],
      summary: 'Caution',
    };
    expect(getSafetyBadge(report)).toBe('yellow');
  });

  it('returns red for unsafe report', () => {
    const report: SafetyReport = {
      safe: false,
      score: 40,
      findings: [
        {line: 1, severity: 'critical', category: 'destructive', message: 'test', match: 'test'},
      ],
      summary: 'Blocked',
    };
    expect(getSafetyBadge(report)).toBe('red');
  });
});
