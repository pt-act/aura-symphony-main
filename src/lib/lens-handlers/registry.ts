/**
 * Lens Handler Registry
 *
 * Maps lens/mode names to their handler implementations.
 * The dispatcher is a ~20-line lookup that delegates to the matched handler.
 *
 * To add a new lens:
 *   1. Create a file in lens-handlers/ implementing LensHandler
 *   2. Import it here and add to `handlers` array
 *   3. Done — the dispatcher auto-discovers it
 */

import type {LensHandler} from './types';
import {pdfHandler} from './pdf-handler';
import {chatHandler} from './chat-handler';
import {generateVideoHandler, generateImageHandler, editImageHandler, transcribeAudioHandler} from './media-handler';
import {webSearchHandler} from './search-handler';
import {courseHandler} from './course-handler';
import {videoAnalysisHandler} from './video-analysis-handler';

/** All registered handlers. Order matters: first match wins. */
const handlers: LensHandler[] = [
  pdfHandler,
  chatHandler,
  generateVideoHandler,
  generateImageHandler,
  editImageHandler,
  webSearchHandler,
  transcribeAudioHandler,
  courseHandler,
  // videoAnalysisHandler is the fallback — not included in normal lookup
];

/** Name → Handler lookup table, built once at module load */
const handlerMap = new Map<string, LensHandler>();
for (const handler of handlers) {
  for (const name of handler.names) {
    handlerMap.set(name, handler);
  }
}

/**
 * Resolves the handler for a given lens/mode name.
 * Falls back to videoAnalysisHandler if no specific handler is registered.
 *
 * @param modeName - The lens/mode name (e.g., 'PDF Analysis', 'Chat', 'Deep Analysis')
 * @returns The matching LensHandler
 */
export function resolveHandler(modeName: string): LensHandler {
  return handlerMap.get(modeName) || videoAnalysisHandler;
}

/**
 * Returns all registered handler names (for introspection / docs).
 */
export function listHandlerNames(): string[] {
  return [...handlerMap.keys()];
}

/**
 * Register a new handler at runtime (e.g., from plugins).
 */
export function registerHandler(handler: LensHandler): void {
  handlers.push(handler);
  for (const name of handler.names) {
    handlerMap.set(name, handler);
  }
}