/**
 * Plugin Marketplace
 *
 * A registry service where third-party developers publish custom Virtuosos.
 * Builds on the existing `virtuoso-plugin-api.ts` contract, adding:
 *   - Remote plugin discovery and installation
 *   - Sandboxed execution (isolated function scope)
 *   - Telemetry integration per-plugin
 *   - Version management and compatibility checks
 *   - User ratings and usage statistics
 *
 * Architecture:
 *   MarketplaceRegistry (this module)
 *     ├── PluginCatalog    → browsable list of available plugins
 *     ├── PluginInstaller  → fetch, validate, sandbox, register
 *     ├── PluginSandbox    → isolated execution environment
 *     └── PluginTelemetry  → per-plugin usage tracking
 *
 * Plugin Distribution Format:
 *   Each plugin is a JSON manifest + a JavaScript handler function
 *   served from a CDN or the marketplace API. The handler runs in
 *   a restricted scope with access only to the PluginTask API.
 *
 * @module
 */

import {
  registerPlugin,
  unregisterPlugin,
  getPlugin,
  listPlugins,
  executePluginTask,
  type VirtuosoPlugin,
  type PluginMetadata,
  type PluginTask,
  type PluginResult,
  type PluginManifest,
} from './virtuoso-plugin-api';
import { startTimer } from './telemetry';

// ─── Types ────────────────────────────────────────────────────────────

/** A plugin listing in the marketplace catalog. */
export interface MarketplaceEntry {
  /** Unique plugin identifier. */
  id: string;
  /** Plugin manifest (self-description). */
  manifest: PluginManifest;
  /** Plugin metadata for registration. */
  metadata: PluginMetadata;
  /** URL to fetch the plugin handler code. */
  handlerUrl: string;
  /** SHA-256 hash of the handler code (for integrity verification). */
  handlerHash: string;
  /** Number of installations. */
  installs: number;
  /** Average user rating (0–5). */
  rating: number;
  /** Number of ratings. */
  ratingCount: number;
  /** Whether this plugin is verified by the Aura team. */
  verified: boolean;
  /** Publication timestamp. */
  publishedAt: string;
  /** Tags for discovery. */
  tags: string[];
}

/** Result of installing a plugin. */
export interface InstallResult {
  success: boolean;
  pluginId: string;
  error?: string;
}

/** Plugin execution telemetry record. */
export interface PluginTelemetryRecord {
  pluginId: string;
  taskName: string;
  success: boolean;
  durationMs: number;
  timestamp: string;
  error?: string;
}

/** Search filters for the marketplace. */
export interface MarketplaceSearchFilter {
  query?: string;
  tags?: string[];
  verified?: boolean;
  sortBy?: 'installs' | 'rating' | 'recent';
  limit?: number;
}

// ─── Configuration ────────────────────────────────────────────────────

const MARKETPLACE_API_URL = typeof import.meta !== 'undefined'
  ? (import.meta as any).env?.VITE_MARKETPLACE_URL ?? ''
  : '';

/** Minimum required API version for compatible plugins. */
const MIN_API_VERSION = '1.0.0';

/** Maximum handler code size in bytes. */
const MAX_HANDLER_SIZE = 500_000; // 500KB

// ─── In-Memory Catalog (fallback when API is unavailable) ────────────

const localCatalog = new Map<string, MarketplaceEntry>();
const installedPlugins = new Map<string, { entry: MarketplaceEntry; installedAt: number }>();
const telemetryLog: PluginTelemetryRecord[] = [];
const MAX_TELEMETRY_RECORDS = 500;

// ─── Plugin Discovery ─────────────────────────────────────────────────

/**
 * Searches the marketplace for available plugins.
 */
export async function searchMarketplace(
  filter?: MarketplaceSearchFilter,
): Promise<MarketplaceEntry[]> {
  // Try remote marketplace first
  if (MARKETPLACE_API_URL) {
    try {
      const params = new URLSearchParams();
      if (filter?.query) params.set('q', filter.query);
      if (filter?.tags) params.set('tags', filter.tags.join(','));
      if (filter?.verified !== undefined) params.set('verified', String(filter.verified));
      if (filter?.sortBy) params.set('sort', filter.sortBy);
      if (filter?.limit) params.set('limit', String(filter.limit));

      const response = await fetch(`${MARKETPLACE_API_URL}/plugins?${params}`, {
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        return data.plugins ?? [];
      }
    } catch {
      // Fall through to local catalog
    }
  }

  // Fallback to local catalog
  let results = Array.from(localCatalog.values());

  if (filter?.query) {
    const q = filter.query.toLowerCase();
    results = results.filter(
      (e) =>
        e.metadata.name.toLowerCase().includes(q) ||
        e.metadata.description.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  if (filter?.tags) {
    results = results.filter((e) =>
      filter.tags!.some((t) => e.tags.includes(t)),
    );
  }

  if (filter?.verified !== undefined) {
    results = results.filter((e) => e.verified === filter.verified);
  }

  // Sort
  switch (filter?.sortBy) {
    case 'installs':
      results.sort((a, b) => b.installs - a.installs);
      break;
    case 'rating':
      results.sort((a, b) => b.rating - a.rating);
      break;
    case 'recent':
      results.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      break;
  }

  if (filter?.limit) {
    results = results.slice(0, filter.limit);
  }

  return results;
}

/**
 * Gets details for a specific plugin.
 */
export async function getMarketplaceEntry(
  pluginId: string,
): Promise<MarketplaceEntry | null> {
  if (MARKETPLACE_API_URL) {
    try {
      const response = await fetch(`${MARKETPLACE_API_URL}/plugins/${pluginId}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) return response.json();
    } catch { /* fallthrough */ }
  }

  return localCatalog.get(pluginId) ?? null;
}

// ─── Plugin Installation ──────────────────────────────────────────────

/**
 * Installs a plugin from the marketplace.
 *
 * 1. Fetches the plugin handler code from the CDN
 * 2. Verifies the code hash (integrity check)
 * 3. Creates a sandboxed handler function
 * 4. Registers with the Virtuoso plugin system
 *
 * @param entry - Marketplace entry to install
 * @returns Installation result
 */
export async function installPlugin(entry: MarketplaceEntry): Promise<InstallResult> {
  const pluginId = entry.id;

  // Check if already installed
  if (getPlugin(pluginId)) {
    return { success: false, pluginId, error: 'Plugin already installed.' };
  }

  try {
    // Fetch handler code
    let handlerCode: string;

    if (entry.handlerUrl) {
      const response = await fetch(entry.handlerUrl, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch handler: ${response.status}`);
      }
      handlerCode = await response.text();

      // Size check
      if (handlerCode.length > MAX_HANDLER_SIZE) {
        throw new Error(`Handler code exceeds ${MAX_HANDLER_SIZE} byte limit.`);
      }

      // Integrity check
      if (entry.handlerHash) {
        const hash = await computeSHA256(handlerCode);
        if (hash !== entry.handlerHash) {
          throw new Error('Handler integrity check failed (hash mismatch).');
        }
      }
    } else {
      throw new Error('No handler URL provided.');
    }

    // Create sandboxed handler
    const handler = createSandboxedHandler(handlerCode, pluginId);

    // Register with the plugin system
    const plugin: VirtuosoPlugin = {
      metadata: entry.metadata,
      handler,
      version: entry.manifest.version,
      author: entry.manifest.author,
    };

    registerPlugin(plugin);
    installedPlugins.set(pluginId, { entry, installedAt: Date.now() });

    console.log(`[Marketplace] Installed: ${entry.metadata.name} v${entry.manifest.version}`);
    return { success: true, pluginId };
  } catch (err: any) {
    console.error(`[Marketplace] Install failed for ${pluginId}:`, err.message);
    return { success: false, pluginId, error: err.message };
  }
}

/**
 * Uninstalls a plugin.
 */
export function uninstallPlugin(pluginId: string): boolean {
  const removed = unregisterPlugin(pluginId);
  installedPlugins.delete(pluginId);
  if (removed) {
    console.log(`[Marketplace] Uninstalled: ${pluginId}`);
  }
  return removed;
}

/**
 * Lists all installed marketplace plugins.
 */
export function getInstalledPlugins(): Array<{
  pluginId: string;
  entry: MarketplaceEntry;
  installedAt: number;
}> {
  return Array.from(installedPlugins.entries()).map(([id, info]) => ({
    pluginId: id,
    ...info,
  }));
}

// ─── Sandboxed Handler ────────────────────────────────────────────────

/**
 * Creates a sandboxed handler function from plugin code.
 *
 * The sandbox:
 *   - Runs the handler in a restricted Function scope
 *   - Denies access to window, document, fetch, eval, XMLHttpRequest
 *   - Provides only the PluginTask and a minimal API surface
 *   - Enforces a per-execution timeout
 */
function createSandboxedHandler(
  code: string,
  pluginId: string,
): (task: PluginTask) => Promise<PluginResult> {
  return async (task: PluginTask): Promise<PluginResult> => {
    const timer = startTimer();

    try {
      // Create a restricted global scope
      const sandboxGlobals: Record<string, any> = {
        // Blocked globals
        window: undefined,
        document: undefined,
        fetch: undefined,
        XMLHttpRequest: undefined,
        eval: undefined,
        Function: undefined,
        importScripts: undefined,
        // Allowed utilities
        console: {
          log: (...args: any[]) => console.log(`[Plugin:${pluginId}]`, ...args),
          warn: (...args: any[]) => console.warn(`[Plugin:${pluginId}]`, ...args),
          error: (...args: any[]) => console.error(`[Plugin:${pluginId}]`, ...args),
        },
        JSON,
        Math,
        Date,
        Array,
        Object,
        String,
        Number,
        Boolean,
        Map,
        Set,
        Promise,
        RegExp,
        Error,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        // Task context
        task,
      };

      // Build the handler function in a restricted scope
      const handlerFn = new globalThis.Function(
        ...Object.keys(sandboxGlobals),
        `"use strict";\n${code}\nif (typeof handler === 'function') return handler(task);`,
      );

      // Execute with timeout
      const timeoutMs = 30_000;
      const result = await Promise.race([
        handlerFn(...Object.values(sandboxGlobals)),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Plugin execution timed out')), timeoutMs),
        ),
      ]);

      const durationMs = timer.elapsed();

      // Log telemetry
      recordPluginTelemetry({
        pluginId,
        taskName: task.taskName,
        success: true,
        durationMs,
        timestamp: new Date().toISOString(),
      });

      return result ?? { result: null };
    } catch (err: any) {
      const durationMs = timer.elapsed();

      recordPluginTelemetry({
        pluginId,
        taskName: task.taskName,
        success: false,
        durationMs,
        timestamp: new Date().toISOString(),
        error: err.message,
      });

      throw err;
    }
  };
}

// ─── Plugin Publishing ────────────────────────────────────────────────

/**
 * Publishes a plugin to the marketplace (local catalog or remote API).
 * Used by plugin developers during development.
 */
export async function publishPlugin(
  entry: MarketplaceEntry,
): Promise<{ success: boolean; error?: string }> {
  // Validate manifest
  if (!entry.metadata.id || !entry.manifest.name || !entry.manifest.version) {
    return { success: false, error: 'Missing required manifest fields.' };
  }

  if (!entry.metadata.id.startsWith('plugin_') && !entry.metadata.id.startsWith('custom_')) {
    return { success: false, error: 'Plugin ID must start with "plugin_" or "custom_".' };
  }

  // Try remote API
  if (MARKETPLACE_API_URL) {
    try {
      const response = await fetch(`${MARKETPLACE_API_URL}/plugins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      if (response.ok) return { success: true };
      const error = await response.text();
      return { success: false, error };
    } catch (err: any) {
      // Fall through to local
    }
  }

  // Local catalog
  localCatalog.set(entry.id, entry);
  console.log(`[Marketplace] Published locally: ${entry.metadata.name} v${entry.manifest.version}`);
  return { success: true };
}

// ─── Telemetry ────────────────────────────────────────────────────────

function recordPluginTelemetry(record: PluginTelemetryRecord): void {
  telemetryLog.push(record);
  if (telemetryLog.length > MAX_TELEMETRY_RECORDS) {
    telemetryLog.shift();
  }
}

/**
 * Gets aggregated telemetry for a specific plugin.
 */
export function getPluginTelemetry(pluginId: string): {
  totalExecutions: number;
  successRate: number;
  avgDurationMs: number;
  recentErrors: string[];
} {
  const records = telemetryLog.filter((r) => r.pluginId === pluginId);
  const total = records.length;
  if (total === 0) {
    return { totalExecutions: 0, successRate: 100, avgDurationMs: 0, recentErrors: [] };
  }

  const successes = records.filter((r) => r.success).length;
  const avgDuration = records.reduce((sum, r) => sum + r.durationMs, 0) / total;
  const errors = records
    .filter((r) => !r.success && r.error)
    .slice(-5)
    .map((r) => r.error!);

  return {
    totalExecutions: total,
    successRate: Math.round((successes / total) * 100),
    avgDurationMs: Math.round(avgDuration),
    recentErrors: errors,
  };
}

/**
 * Gets telemetry for all installed plugins.
 */
export function getAllPluginTelemetry(): Record<string, ReturnType<typeof getPluginTelemetry>> {
  const result: Record<string, ReturnType<typeof getPluginTelemetry>> = {};
  for (const pluginId of installedPlugins.keys()) {
    result[pluginId] = getPluginTelemetry(pluginId);
  }
  return result;
}

// ─── Utilities ────────────────────────────────────────────────────────

/**
 * Computes SHA-256 hash of a string using Web Crypto API.
 */
async function computeSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ─── Exports for testing ──────────────────────────────────────────────

export const _testing = {
  localCatalog,
  installedPlugins,
  telemetryLog,
  computeSHA256,
  createSandboxedHandler,
  MAX_HANDLER_SIZE,
};