/**
 * Virtuoso Plugin API
 *
 * Defines the contract for third-party agent implementations to register
 * with the Aura Symphony platform. External developers can create custom
 * Virtuosos that integrate seamlessly with the Conductor and SymphonyBus.
 *
 * Usage:
 *   import {registerPlugin} from './lib/virtuoso-plugin-api';
 *
 *   registerPlugin({
 *     metadata: {
 *       id: 'custom_cinematographer',
 *       name: 'The Cinematographer',
 *       title: 'Shot Composition Expert',
 *       description: 'Analyzes camera angles and shot composition.',
 *       model: 'gemini-2.5-pro',
 *       capabilities: ['shot-analysis', 'composition-critique'],
 *       color: '#FF6B35',
 *       icon: 'Camera',
 *     },
 *     handler: async (task) => {
 *       // Custom implementation
 *       return { result: 'analysis data' };
 *     },
 *   });
 */

import {VirtuosoType, VirtuosoProfile, VIRTUOSO_REGISTRY} from '../services/virtuosos';
import {symphonyBus, Events} from './symphonyBus';

/** Metadata required to register a plugin Virtuoso. */
export interface PluginMetadata {
  id: string;
  name: string;
  title: string;
  description: string;
  model: string;
  capabilities: string[];
  color: string;
  icon: string;
  systemInstruction?: string;
}

/** Task passed to a plugin handler. */
export interface PluginTask {
  taskId: string;
  taskName: string;
  query: string;
  context?: Record<string, unknown>;
}

/** Result returned by a plugin handler. */
export interface PluginResult {
  result: unknown;
  metadata?: Record<string, unknown>;
}

/** A registered plugin with its handler. */
export interface VirtuosoPlugin {
  metadata: PluginMetadata;
  handler: (task: PluginTask) => Promise<PluginResult>;
  version: string;
  author?: string;
}

const plugins = new Map<string, VirtuosoPlugin>();

/**
 * Registers a plugin Virtuoso with the system.
 *
 * @param plugin - The plugin to register
 * @throws Error if a plugin with the same ID is already registered
 */
export function registerPlugin(plugin: VirtuosoPlugin): void {
  if (plugins.has(plugin.metadata.id)) {
    throw new Error(`Plugin "${plugin.metadata.id}" is already registered. Use updatePlugin() to modify.`);
  }

  // Validate metadata
  if (!plugin.metadata.id.startsWith('custom_') && !plugin.metadata.id.startsWith('plugin_')) {
    console.warn(`[PluginAPI] Plugin ID "${plugin.metadata.id}" should start with "custom_" or "plugin_" to avoid conflicts with built-in Virtuosos.`);
  }

  // Register in the Virtuoso registry
  const profile: VirtuosoProfile = {
    id: plugin.metadata.id,
    name: plugin.metadata.name,
    title: plugin.metadata.title,
    model: plugin.metadata.model,
    description: plugin.metadata.description,
    systemInstruction: plugin.metadata.systemInstruction || `You are ${plugin.metadata.name}, a custom Virtuoso. ${plugin.metadata.description}`,
    capabilities: plugin.metadata.capabilities,
    color: plugin.metadata.color,
    icon: plugin.metadata.icon,
  };

  VIRTUOSO_REGISTRY[plugin.metadata.id] = profile;
  plugins.set(plugin.metadata.id, plugin);

  console.log(`[PluginAPI] Registered plugin: ${plugin.metadata.name} (${plugin.metadata.id}) v${plugin.version}`);
}

/**
 * Unregisters a plugin Virtuoso.
 */
export function unregisterPlugin(pluginId: string): boolean {
  if (!plugins.has(pluginId)) return false;

  delete VIRTUOSO_REGISTRY[pluginId];
  plugins.delete(pluginId);

  console.log(`[PluginAPI] Unregistered plugin: ${pluginId}`);
  return true;
}

/**
 * Gets a registered plugin by ID.
 */
export function getPlugin(pluginId: string): VirtuosoPlugin | undefined {
  return plugins.get(pluginId);
}

/**
 * Lists all registered plugins.
 */
export function listPlugins(): VirtuosoPlugin[] {
  return Array.from(plugins.values());
}

/**
 * Executes a task using a registered plugin handler.
 * Integrates with the SymphonyBus for task lifecycle tracking.
 */
export async function executePluginTask(
  pluginId: string,
  task: PluginTask,
): Promise<PluginResult> {
  const plugin = plugins.get(pluginId);
  if (!plugin) {
    throw new Error(`Plugin "${pluginId}" is not registered.`);
  }

  symphonyBus.commission(
    pluginId as VirtuosoType,
    task.taskName,
    task.taskId,
  );

  const timer = {start: performance.now()};
  try {
    const result = await plugin.handler(task);
    const duration = performance.now() - timer.start;
    symphonyBus.reportResult(task.taskId, pluginId, true, result, duration);
    return result;
  } catch (err) {
    const duration = performance.now() - timer.start;
    symphonyBus.reportResult(task.taskId, pluginId, false, String(err), duration);
    throw err;
  }
}

/**
 * Manifest schema for plugin self-description.
 * Plugins should expose this via their own introspection endpoint.
 */
export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  inputs: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  outputs: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  author?: string;
  homepage?: string;
}
