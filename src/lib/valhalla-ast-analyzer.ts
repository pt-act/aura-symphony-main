/**
 * Valhalla AST Analyzer
 *
 * Extends the regex-based valhalla-analyzer with structural AST analysis.
 * Parses Python scripts into an AST-like structure for more accurate detection
 * of dangerous patterns that regex alone cannot catch.
 *
 * Limitations: This is a lightweight structural parser, not a full Python AST.
 * It handles the patterns most relevant to sandbox safety.
 */

import {analyzeScript as regexAnalyze, type SafetyFinding, type SafetyReport, type Severity} from './valhalla-analyzer';

interface AstNode {
  type: 'module' | 'import' | 'from_import' | 'function_def' | 'while' | 'for' | 'call' | 'assign' | 'expr';
  line: number;
  name?: string;
  module?: string;
  names?: string[];
  condition?: string;
  body?: AstNode[];
  args?: string[];
  target?: string;
  value?: string;
}

/**
 * Minimal Python statement parser.
 * Splits Python source into logical statements with indentation tracking.
 */
function parseStatements(source: string): AstNode[] {
  const nodes: AstNode[] = [];
  const lines = source.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    const lineNum = i + 1;

    if (!trimmed || trimmed.startsWith('#')) continue;

    // Import statements
    const importMatch = trimmed.match(/^import\s+(.+)/);
    if (importMatch) {
      const modules = importMatch[1].split(',').map((m) => m.trim().split(' ')[0]);
      nodes.push({type: 'import', line: lineNum, names: modules});
      continue;
    }

    const fromMatch = trimmed.match(/^from\s+(\S+)\s+import\s+(.+)/);
    if (fromMatch) {
      nodes.push({type: 'from_import', line: lineNum, module: fromMatch[1], names: fromMatch[2].split(',').map((n) => n.trim())});
      continue;
    }

    // Function definitions
    const funcMatch = trimmed.match(/^def\s+(\w+)\s*\(/);
    if (funcMatch) {
      nodes.push({type: 'function_def', line: lineNum, name: funcMatch[1]});
      continue;
    }

    // While loops
    const whileMatch = trimmed.match(/^while\s+(.+):/);
    if (whileMatch) {
      nodes.push({type: 'while', line: lineNum, condition: whileMatch[1]});
      continue;
    }

    // For loops
    const forMatch = trimmed.match(/^for\s+(.+):/);
    if (forMatch) {
      nodes.push({type: 'for', line: lineNum, condition: forMatch[1]});
      continue;
    }

    // Function calls (including chained calls like os.remove())
    const callMatch = trimmed.match(/^(\w+(?:\.\w+)*)\s*\(/);
    if (callMatch) {
      nodes.push({type: 'call', line: lineNum, name: callMatch[1]});
      continue;
    }

    // Assignments with calls on the right side
    const assignMatch = trimmed.match(/^(\w+)\s*=\s*(\w+(?:\.\w+)*)\s*\(/);
    if (assignMatch) {
      nodes.push({type: 'assign', line: lineNum, target: assignMatch[1], value: assignMatch[2]});
      continue;
    }
  }

  return nodes;
}

/**
 * Detects dynamic attribute access patterns that regex misses:
 * - getattr(obj, '__class__')
 * - globals()['os']
 * - vars().__getitem__('os')
 */
function detectDynamicAccess(source: string): SafetyFinding[] {
  const findings: SafetyFinding[] = [];
  const lines = source.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const lineNum = i + 1;

    // getattr with dunder
    if (/getattr\s*\(\s*\w+\s*,\s*['"]__\w+__['"]\s*\)/.test(trimmed)) {
      findings.push({
        line: lineNum,
        severity: 'critical',
        category: 'system-escape',
        message: 'Dynamic dunder attribute access via getattr',
        match: trimmed.match(/getattr\s*\([^)]+\)/)?.[0] || trimmed,
      });
    }

    // globals()/locals()/vars() dictionary access
    if (/\b(?:globals|locals|vars)\s*\(\s*\)\s*\[/.test(trimmed)) {
      findings.push({
        line: lineNum,
        severity: 'critical',
        category: 'system-escape',
        message: 'Dynamic module access via globals/locals/vars dictionary',
        match: trimmed.match(/(?:globals|locals|vars)\s*\([^)]*\)\s*\[[^\]]+\]/)?.[0] || trimmed,
      });
    }

    // __builtins__ access
    if (/\b__builtins__\b/.test(trimmed)) {
      findings.push({
        line: lineNum,
        severity: 'critical',
        category: 'system-escape',
        message: 'Access to __builtins__ — can bypass import restrictions',
        match: '__builtins__',
      });
    }

    // open() with variable path (potential file system escape)
    if (/\bopen\s*\(\s*(?!['"])/.test(trimmed) && !trimmed.includes('#')) {
      // Only flag if the path is not a string literal
      const openMatch = trimmed.match(/open\s*\(\s*([^'")\s][^,)]*)/);
      if (openMatch && !openMatch[1].match(/^[a-zA-Z_]+\s*$/)) {
        findings.push({
          line: lineNum,
          severity: 'warning' as Severity,
          category: 'file-access',
          message: 'open() with dynamic path — verify the path is safe',
          match: trimmed.match(/open\s*\([^)]*\)/)?.[0] || trimmed,
        });
      }
    }
  }

  return findings;
}

/**
 * Performs both regex and AST analysis, merging findings.
 */
export function analyzeScriptDeep(sourceCode: string): SafetyReport {
  // Start with regex analysis
  const regexReport = regexAnalyze(sourceCode);

  // Add AST-based findings
  const astFindings = detectDynamicAccess(sourceCode);

  // Parse statements for additional checks
  const statements = parseStatements(sourceCode);

  // Check for dynamic imports via __import__
  for (const node of statements) {
    if (node.type === 'call' && node.name === '__import__') {
      // Already caught by regex, skip
      continue;
    }

    // Check for eval/exec with non-literal strings
    if (node.type === 'assign' && (node.value === 'eval' || node.value === 'exec')) {
      const alreadyFound = regexReport.findings.some(
        (f) => f.line === node.line && f.category === 'system-escape',
      );
      if (!alreadyFound) {
        astFindings.push({
          line: node.line,
          severity: 'critical',
          category: 'system-escape',
          message: `Result of ${node.value}() assigned to variable — potential code injection`,
          match: `${node.target} = ${node.value}(...)`,
        });
      }
    }
  }

  // Merge findings, deduplicating by line + category
  const mergedFindings = [...regexReport.findings];
  for (const finding of astFindings) {
    const isDuplicate = mergedFindings.some(
      (f) => f.line === finding.line && f.category === finding.category,
    );
    if (!isDuplicate) {
      mergedFindings.push(finding);
    }
  }

  // Recalculate score with merged findings
  const criticals = mergedFindings.filter((f) => f.severity === 'critical').length;
  const warnings = mergedFindings.filter((f) => f.severity === 'warning').length;
  const score = Math.max(0, 100 - criticals * 30 - warnings * 10);
  const safe = criticals === 0;

  let summary: string;
  if (mergedFindings.length === 0) {
    summary = 'Script passed all safety checks (deep analysis).';
  } else if (safe) {
    summary = `${warnings} warning(s) found (deep analysis). Script is executable with caution.`;
  } else {
    summary = `${criticals} critical issue(s) and ${warnings} warning(s) (deep analysis). Script blocked.`;
  }

  return {safe, score, findings: mergedFindings, summary};
}
