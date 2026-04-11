/**
 * Valhalla Script Safety Analyzer
 *
 * Parses Python scripts for dangerous patterns before execution.
 * Uses regex-based structural analysis (no Python runtime needed in browser).
 *
 * Detection categories:
 * - Infinite loops (while True without break)
 * - Destructive calls (os.remove, shutil.rmtree, etc.)
 * - Dangerous imports (subprocess, socket, ctypes, etc.)
 * - System escape patterns (eval, exec, __import__)
 * - Network operations (requests, urllib outbound)
 */

export type Severity = 'critical' | 'warning' | 'info';

export interface SafetyFinding {
  line: number;
  severity: Severity;
  category: string;
  message: string;
  match: string;
}

export interface SafetyReport {
  safe: boolean;
  score: number; // 0-100, 100 = perfectly safe
  findings: SafetyFinding[];
  summary: string;
}

// ─── Dangerous patterns ──────────────────────────────────────────────

const DANGEROUS_IMPORTS = [
  'subprocess',
  'os',
  'shutil',
  'sys',
  'socket',
  'ctypes',
  'signal',
  'multiprocessing',
  '_thread',
  'threading',
  'ctypes.util',
  'importlib',
  'compile',
];

const DESTRUCTIVE_CALLS = [
  /\bos\.remove\s*\(/,
  /\bos\.rmdir\s*\(/,
  /\bos\.removedirs\s*\(/,
  /\bshutil\.rmtree\s*\(/,
  /\bos\.unlink\s*\(/,
  /\bos\.system\s*\(/,
  /\bsubprocess\.(?:call|run|Popen|check_output|check_call)\s*\(/,
  /\bos\.popen\s*\(/,
  /\bos\.execl[pe]?\s*\(/,
  /\bos\.spawn[lvpe]?\s*\(/,
];

const SYSTEM_ESCAPE = [
  /\beval\s*\(/,
  /\bexec\s*\(/,
  /\b__import__\s*\(/,
  /\bcompile\s*\(/,
  /\bgetattr\s*\(\s*\w+\s*,\s*['"]__/,
  /\bsetattr\s*\(\s*\w+\s*,\s*['"]__/,
];

const NETWORK_OPERATIONS = [
  /\brequests\.(?:get|post|put|delete|head|patch)\s*\(/,
  /\burllib\.request\.urlopen\s*\(/,
  /\bsocket\.(?:socket|create_connection)\s*\(/,
  /\bhttp\.client\.HTTPConnection\s*\(/,
];

const INFINITE_LOOP_PATTERN =
  /\bwhile\s+True\s*:/;

// ─── Analysis engine ─────────────────────────────────────────────────

export function analyzeScript(sourceCode: string): SafetyReport {
  const findings: SafetyFinding[] = [];
  const lines = sourceCode.split('\n');

  // Track control flow for infinite loop detection
  let inWhileTrueBlock = false;
  let whileTrueStartLine = -1;
  let whileTrueHasBreak = false;
  let whileTrueIndent = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineNum = i + 1;

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    const currentIndent = line.search(/\S/);

    // ─── Infinite loop detection ────────────────────────────────
    if (INFINITE_LOOP_PATTERN.test(trimmed)) {
      inWhileTrueBlock = true;
      whileTrueStartLine = lineNum;
      whileTrueHasBreak = false;
      whileTrueIndent = currentIndent;
      continue;
    }

    if (inWhileTrueBlock) {
      // Check for break/return inside the loop
      if (currentIndent > whileTrueIndent) {
        if (/\bbreak\b/.test(trimmed) || /\breturn\b/.test(trimmed)) {
          whileTrueHasBreak = true;
        }
      } else {
        // We've exited the while block
        if (!whileTrueHasBreak) {
          findings.push({
            line: whileTrueStartLine,
            severity: 'critical',
            category: 'infinite-loop',
            message: 'while True loop without break or return — will hang execution',
            match: 'while True:',
          });
        }
        inWhileTrueBlock = false;
      }
    }

    // ─── Dangerous imports ──────────────────────────────────────
    const importMatch = trimmed.match(/^import\s+(\S+)|^from\s+(\S+)\s+import/);
    if (importMatch) {
      const moduleName = importMatch[1] || importMatch[2];
      if (DANGEROUS_IMPORTS.includes(moduleName)) {
        findings.push({
          line: lineNum,
          severity: moduleName === 'os' || moduleName === 'subprocess' ? 'critical' : 'warning',
          category: 'dangerous-import',
          message: `Import of "${moduleName}" provides system-level access`,
          match: trimmed,
        });
      }
    }

    // ─── Destructive calls ──────────────────────────────────────
    for (const pattern of DESTRUCTIVE_CALLS) {
      if (pattern.test(trimmed)) {
        findings.push({
          line: lineNum,
          severity: 'critical',
          category: 'destructive-call',
          message: 'Potentially destructive file or process operation',
          match: trimmed.match(pattern)?.[0] || trimmed,
        });
      }
    }

    // ─── System escape ──────────────────────────────────────────
    for (const pattern of SYSTEM_ESCAPE) {
      if (pattern.test(trimmed)) {
        findings.push({
          line: lineNum,
          severity: 'critical',
          category: 'system-escape',
          message: 'Dynamic code execution or introspection escape detected',
          match: trimmed.match(pattern)?.[0] || trimmed,
        });
      }
    }

    // ─── Network operations ─────────────────────────────────────
    for (const pattern of NETWORK_OPERATIONS) {
      if (pattern.test(trimmed)) {
        findings.push({
          line: lineNum,
          severity: 'warning',
          category: 'network-operation',
          message: 'Outbound network operation — may send data externally',
          match: trimmed.match(pattern)?.[0] || trimmed,
        });
      }
    }
  }

  // Handle while True at end of file
  if (inWhileTrueBlock && !whileTrueHasBreak) {
    findings.push({
      line: whileTrueStartLine,
      severity: 'critical',
      category: 'infinite-loop',
      message: 'while True loop without break or return — will hang execution',
      match: 'while True:',
    });
  }

  // ─── Score calculation ─────────────────────────────────────────
  const criticals = findings.filter((f) => f.severity === 'critical').length;
  const warnings = findings.filter((f) => f.severity === 'warning').length;
  const score = Math.max(0, 100 - criticals * 30 - warnings * 10);
  const safe = criticals === 0;

  // ─── Summary ──────────────────────────────────────────────────
  let summary: string;
  if (findings.length === 0) {
    summary = 'Script passed all safety checks.';
  } else if (safe) {
    summary = `${warnings} warning(s) found. Script is executable with caution.`;
  } else {
    summary = `${criticals} critical issue(s) and ${warnings} warning(s). Script blocked.`;
  }

  return { safe, score, findings, summary };
}

/**
 * Returns a UI-friendly badge color based on the safety report.
 */
export function getSafetyBadge(report: SafetyReport): 'green' | 'yellow' | 'red' {
  if (report.safe && report.findings.length === 0) return 'green';
  if (report.safe) return 'yellow';
  return 'red';
}
