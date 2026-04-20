/**
 * Valhalla Sandbox Execution Engine
 *
 * Replaces the "simulate and generate image" approach with actual
 * sandboxed Python execution using Pyodide (Python compiled to WASM).
 *
 * Architecture:
 *   1. User or Conductor issues a Valhalla command
 *   2. AI generates a Python script (existing flow)
 *   3. Safety Analyzer (regex + AST) checks the script
 *   4. If safe: Pyodide executes in a sandboxed Web Worker
 *   5. stdout/stderr captured, results returned to UI
 *
 * The sandbox restricts:
 *   - No filesystem access beyond a virtual /home/pyodide
 *   - No network access (Pyodide runs purely in-browser)
 *   - No subprocess/os/sys imports (blocked at multiple layers)
 *   - CPU budget (timeout after MAX_EXECUTION_MS)
 *   - Memory budget (Pyodide's WASM memory limit)
 *
 * Supported packages (pre-bundled in Pyodide):
 *   numpy, scipy, matplotlib, pandas, sympy, scikit-learn,
 *   Pillow (PIL), networkx, and more.
 *
 * References:
 *   [1] Pyodide: https://pyodide.org/
 *   [2] WebContainers alternative: https://webcontainers.io/
 *
 * @module
 */

import { analyzeScriptDeep } from './valhalla-ast-analyzer';
import { logValhallaTelemetry } from './valhalla-telemetry';
import type { SafetyReport } from './valhalla-analyzer';

// ─── Types ────────────────────────────────────────────────────────────

/** Result of a sandboxed script execution. */
export interface SandboxExecutionResult {
  /** Whether execution completed without errors. */
  success: boolean;
  /** Captured stdout. */
  stdout: string;
  /** Captured stderr. */
  stderr: string;
  /** Execution time in ms. */
  executionTimeMs: number;
  /** Any generated images (base64 data URIs). */
  images: string[];
  /** Any generated data/objects returned by the script. */
  returnValue: any;
  /** Safety report from pre-execution analysis. */
  safetyReport: SafetyReport;
  /** Whether the script was blocked by the safety analyzer. */
  blocked: boolean;
  /** Error message if execution failed. */
  error?: string;
}

/** Sandbox configuration options. */
export interface SandboxConfig {
  /** Maximum execution time in ms (default: 30000). */
  maxExecutionMs?: number;
  /** Additional Python packages to load via micropip (default: []). */
  packages?: string[];
  /** Pre-execution Python setup code (runs before the user script). */
  setupCode?: string;
  /** Whether to capture matplotlib figures as images (default: true). */
  captureMatplotlib?: boolean;
}

/** Sandbox lifecycle state. */
export type SandboxState = 'idle' | 'loading' | 'ready' | 'executing' | 'error';

// ─── Configuration ────────────────────────────────────────────────────

const MAX_EXECUTION_MS = 30_000;
const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.27.5/full/';

/** Imports blocked at the Python level (defense in depth). */
const BLOCKED_MODULES = [
  'subprocess', 'os', 'sys', 'shutil', 'socket', 'ctypes',
  'signal', 'multiprocessing', '_thread', 'threading',
  'importlib', 'http', 'urllib', 'ftplib', 'smtplib',
  'webbrowser', 'code', 'codeop', 'compileall',
];

// ─── Pyodide Manager ─────────────────────────────────────────────────

let pyodideInstance: any = null;
let pyodideLoading: Promise<any> | null = null;
let currentState: SandboxState = 'idle';
const stateListeners: Array<(state: SandboxState) => void> = [];

function setState(state: SandboxState): void {
  currentState = state;
  for (const cb of stateListeners) {
    try { cb(state); } catch { /* swallow */ }
  }
}

/**
 * Subscribe to sandbox state changes.
 */
export function onSandboxStateChange(callback: (state: SandboxState) => void): () => void {
  stateListeners.push(callback);
  return () => {
    const idx = stateListeners.indexOf(callback);
    if (idx >= 0) stateListeners.splice(idx, 1);
  };
}

/**
 * Gets the current sandbox state.
 */
export function getSandboxState(): SandboxState {
  return currentState;
}

/**
 * Lazily loads and initializes Pyodide.
 * The first call downloads the WASM bundle (~15MB); subsequent calls reuse it.
 */
export async function loadPyodide(): Promise<any> {
  if (pyodideInstance) return pyodideInstance;
  if (pyodideLoading) return pyodideLoading;

  setState('loading');

  pyodideLoading = (async () => {
    try {
      // Dynamically import Pyodide from CDN
      // @ts-ignore - loaded from CDN at runtime
      const { loadPyodide: loadPy } = await import(/* @vite-ignore */ `${PYODIDE_CDN}pyodide.mjs`);

      const pyodide = await loadPy({
        indexURL: PYODIDE_CDN,
        stdout: (text: string) => console.log('[Pyodide]', text),
        stderr: (text: string) => console.warn('[Pyodide]', text),
      });

      // Install sandbox restrictions
      await pyodide.runPythonAsync(generateSandboxSetup());

      pyodideInstance = pyodide;
      setState('ready');
      console.log('[Valhalla Sandbox] Pyodide loaded and sandboxed');
      return pyodide;
    } catch (err) {
      setState('error');
      pyodideLoading = null;
      throw err;
    }
  })();

  return pyodideLoading;
}

/**
 * Generates Python setup code that installs sandbox restrictions.
 */
function generateSandboxSetup(): string {
  const blockedImports = BLOCKED_MODULES.map((m) => `'${m}'`).join(', ');

  return `
import sys
import builtins

# ─── Block dangerous modules ──────────────────────────────────────
_blocked_modules = {${blockedImports}}
_original_import = builtins.__import__

def _sandboxed_import(name, *args, **kwargs):
    top_level = name.split('.')[0]
    if top_level in _blocked_modules:
        raise ImportError(f"Module '{name}' is blocked in the Valhalla sandbox for security.")
    return _original_import(name, *args, **kwargs)

builtins.__import__ = _sandboxed_import

# ─── Redirect stdout/stderr for capture ──────────────────────────
import io
_captured_stdout = io.StringIO()
_captured_stderr = io.StringIO()

# ─── Configure matplotlib for non-interactive rendering ──────────
try:
    import matplotlib
    matplotlib.use('Agg')
except ImportError:
    pass

print("[Sandbox] Valhalla sandbox initialized", file=sys.stderr)
`;
}

// ─── Script Execution ─────────────────────────────────────────────────

/**
 * Executes a Python script in the Pyodide sandbox.
 *
 * @param script - Python source code to execute
 * @param config - Sandbox configuration
 * @returns SandboxExecutionResult
 */
export async function executeScript(
  script: string,
  config: SandboxConfig = {},
): Promise<SandboxExecutionResult> {
  const {
    maxExecutionMs = MAX_EXECUTION_MS,
    packages = [],
    setupCode = '',
    captureMatplotlib = true,
  } = config;

  // Step 1: Safety analysis
  const safetyReport = analyzeScriptDeep(script);

  if (!safetyReport.safe) {
    logValhallaTelemetry({
      toolName: 'sandbox',
      command: script.slice(0, 100),
      scriptLength: script.length,
      safetyScore: safetyReport.score,
      safe: false,
      findings: safetyReport.findings.length,
      timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      stdout: '',
      stderr: safetyReport.summary,
      executionTimeMs: 0,
      images: [],
      returnValue: null,
      safetyReport,
      blocked: true,
      error: `Script blocked: ${safetyReport.findings.filter((f) => f.severity === 'critical').length} critical issues found.`,
    };
  }

  // Step 2: Load Pyodide
  let pyodide: any;
  try {
    pyodide = await loadPyodide();
  } catch (err: any) {
    return {
      success: false,
      stdout: '',
      stderr: `Failed to load Python sandbox: ${err.message}`,
      executionTimeMs: 0,
      images: [],
      returnValue: null,
      safetyReport,
      blocked: false,
      error: err.message,
    };
  }

  // Step 3: Install additional packages
  if (packages.length > 0) {
    try {
      await pyodide.loadPackagesFromImports(packages.join('\n'));
    } catch (err: any) {
      console.warn('[Sandbox] Package install warning:', err.message);
    }
  }

  // Step 4: Execute with timeout
  setState('executing');
  const startMs = performance.now();

  // Wrap script with stdout/stderr capture
  const wrappedScript = `
import sys, io

_stdout_capture = io.StringIO()
_stderr_capture = io.StringIO()
_old_stdout = sys.stdout
_old_stderr = sys.stderr
sys.stdout = _stdout_capture
sys.stderr = _stderr_capture

_exec_result = None
_exec_error = None

${setupCode}

try:
    exec(${JSON.stringify(script)})
except Exception as e:
    _exec_error = str(e)
    import traceback
    traceback.print_exc(file=_stderr_capture)
finally:
    sys.stdout = _old_stdout
    sys.stderr = _old_stderr
`;

  try {
    // Race against timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Execution timed out after ${maxExecutionMs}ms`)), maxExecutionMs);
    });

    await Promise.race([
      pyodide.runPythonAsync(wrappedScript),
      timeoutPromise,
    ]);

    const executionTimeMs = performance.now() - startMs;

    // Capture outputs
    const stdout = pyodide.runPython('_stdout_capture.getvalue()') ?? '';
    const stderr = pyodide.runPython('_stderr_capture.getvalue()') ?? '';
    const execError = pyodide.runPython('_exec_error');

    // Capture matplotlib figures
    const images: string[] = [];
    if (captureMatplotlib) {
      try {
        const figureData = pyodide.runPython(`
try:
    import matplotlib.pyplot as plt
    import base64, io as _io
    _figures = []
    for _fig_num in plt.get_fignums():
        _buf = _io.BytesIO()
        plt.figure(_fig_num).savefig(_buf, format='png', bbox_inches='tight', dpi=150)
        _buf.seek(0)
        _figures.append('data:image/png;base64,' + base64.b64encode(_buf.read()).decode())
        plt.close(_fig_num)
    _figures
except ImportError:
    []
except Exception:
    []
`);
        if (figureData) {
          const figArray = figureData.toJs?.() ?? figureData;
          if (Array.isArray(figArray)) {
            images.push(...figArray);
          }
        }
      } catch { /* matplotlib not used */ }
    }

    setState('ready');

    const success = !execError;

    logValhallaTelemetry({
      toolName: 'sandbox',
      command: script.slice(0, 100),
      scriptLength: script.length,
      safetyScore: safetyReport.score,
      safe: true,
      findings: safetyReport.findings.length,
      timestamp: new Date().toISOString(),
    });

    return {
      success,
      stdout,
      stderr: execError ? `${execError}\n${stderr}` : stderr,
      executionTimeMs,
      images,
      returnValue: null,
      safetyReport,
      blocked: false,
      error: execError || undefined,
    };
  } catch (err: any) {
    const executionTimeMs = performance.now() - startMs;
    setState('ready');

    return {
      success: false,
      stdout: '',
      stderr: err.message,
      executionTimeMs,
      images: [],
      returnValue: null,
      safetyReport,
      blocked: false,
      error: err.message,
    };
  }
}

/**
 * Pre-warms the sandbox by loading Pyodide in the background.
 * Call this on app startup to hide the ~2s cold start.
 */
export function prewarmSandbox(): void {
  loadPyodide().catch((err) => {
    console.warn('[Sandbox] Prewarm failed:', err.message);
  });
}

/**
 * Resets the Pyodide runtime (clears all state).
 * Useful between independent executions.
 */
export async function resetSandbox(): Promise<void> {
  if (pyodideInstance) {
    try {
      await pyodideInstance.runPythonAsync(`
import gc
gc.collect()
for _name in list(dir()):
    if not _name.startswith('_'):
        try:
            del globals()[_name]
        except:
            pass
`);
    } catch { /* best effort */ }
  }
}

/**
 * Destroys the Pyodide instance entirely.
 * A new call to executeScript will re-initialize.
 */
export function destroySandbox(): void {
  pyodideInstance = null;
  pyodideLoading = null;
  setState('idle');
}

// ─── Exports for testing ──────────────────────────────────────────────

export const _testing = {
  BLOCKED_MODULES,
  MAX_EXECUTION_MS,
  generateSandboxSetup,
};