/**
 * Valhalla Sandbox Tests
 *
 * Tests the safety analysis integration and sandbox configuration.
 * Actual Pyodide execution requires browser WASM; these tests
 * validate the deterministic pre-execution logic.
 */
import { describe, it, expect } from 'vitest';
import { _testing } from '../lib/valhalla-sandbox';

const { BLOCKED_MODULES, MAX_EXECUTION_MS, generateSandboxSetup } = _testing;

describe('Valhalla Sandbox configuration', () => {
  it('blocks dangerous modules', () => {
    expect(BLOCKED_MODULES).toContain('subprocess');
    expect(BLOCKED_MODULES).toContain('os');
    expect(BLOCKED_MODULES).toContain('sys');
    expect(BLOCKED_MODULES).toContain('socket');
    expect(BLOCKED_MODULES).toContain('ctypes');
    expect(BLOCKED_MODULES).toContain('shutil');
  });

  it('has a reasonable execution timeout', () => {
    expect(MAX_EXECUTION_MS).toBeGreaterThanOrEqual(10_000);
    expect(MAX_EXECUTION_MS).toBeLessThanOrEqual(120_000);
  });

  it('generates valid sandbox setup code', () => {
    const setup = generateSandboxSetup();
    expect(setup).toContain('_sandboxed_import');
    expect(setup).toContain('_blocked_modules');
    expect(setup).toContain('builtins.__import__');
    expect(setup).toContain("matplotlib.use('Agg')");
  });

  it('blocks all required modules in setup code', () => {
    const setup = generateSandboxSetup();
    for (const mod of ['subprocess', 'os', 'sys', 'socket']) {
      expect(setup).toContain(`'${mod}'`);
    }
  });
});