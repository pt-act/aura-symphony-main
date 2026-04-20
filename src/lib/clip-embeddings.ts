/**
 * CLIP Embeddings for Multimodal RAG
 *
 * Adds visual search capability: "find the frame where the speaker
 * points at the whiteboard" → CLIP embedding-based retrieval instead
 * of re-analyzing all frames with the LLM.
 *
 * Architecture:
 *   1. During video ingestion, extract frames at regular intervals
 *   2. Send frames + text descriptions to the CLIP embedding endpoint
 *   3. Store both text and image embeddings in the vector DB
 *   4. At query time, embed the query text with CLIP text encoder
 *   5. Search both text and image embedding spaces
 *   6. Merge and rank results by combined similarity
 *
 * The CLIP model runs server-side (Python backend with transformers)
 * because the model is ~400MB and ONNX-in-browser is not practical
 * for real-time use. The client sends raw frames; the server returns
 * embedding vectors.
 *
 * Supported query modalities:
 *   - Text → Image: "a person writing on a whiteboard"
 *   - Text → Text: standard semantic search (existing)
 *   - Image → Image: find visually similar frames (via uploaded screenshot)
 *
 * References:
 *   [1] Radford et al. (2021) "Learning Transferable Visual Models From NLP Supervision"
 *   [2] OpenCLIP: https://github.com/mlfoundations/open_clip
 *
 * @module
 */

import type { VideoChunk, SearchResult } from './vector-search';

// ─── Types ────────────────────────────────────────────────────────────

/** A frame with its CLIP embedding. */
export interface FrameEmbedding {
  /** Frame identifier. */
  frameId: string;
  /** Video identifier. */
  videoId: string;
  /** Timestamp in the video (seconds). */
  timestamp: number;
  /** CLIP image embedding vector. */
  embedding: number[];
  /** Text description of the frame (if available). */
  description?: string;
  /** Base64 thumbnail (low-res, for preview). */
  thumbnail?: string;
}

/** Result of a multimodal search. */
export interface MultimodalSearchResult {
  /** Standard text-based results. */
  textResults: SearchResult[];
  /** CLIP visual search results. */
  visualResults: VisualSearchResult[];
  /** Merged and ranked results. */
  merged: MergedResult[];
  /** Total search time. */
  searchTimeMs: number;
}

/** A single visual search result. */
export interface VisualSearchResult {
  frameId: string;
  videoId: string;
  timestamp: number;
  similarity: number;
  description?: string;
  thumbnail?: string;
  modality: 'image';
}

/** Merged result combining text and visual scores. */
export interface MergedResult {
  /** Source of this result. */
  source: 'text' | 'visual' | 'both';
  /** Combined relevance score (0–1). */
  score: number;
  /** Timestamp in the video. */
  timestamp: number;
  /** Content preview. */
  content: string;
  /** Video ID. */
  videoId: string;
  /** Original similarity scores. */
  textSimilarity?: number;
  visualSimilarity?: number;
}

/** Configuration for the CLIP embedding service. */
export interface CLIPServiceConfig {
  /** Base URL of the CLIP embedding server. */
  baseUrl: string;
  /** Model name (default: ViT-B/32). */
  model?: string;
  /** Request timeout in ms. */
  timeoutMs?: number;
}

// ─── Configuration ────────────────────────────────────────────────────

const CLIP_BACKEND_URL = typeof import.meta !== 'undefined'
  ? (import.meta as any).env?.VITE_CLIP_BACKEND_URL ?? ''
  : '';

const DEFAULT_TIMEOUT_MS = 30_000;

/** Weight for text vs. visual results in merged ranking. */
const TEXT_WEIGHT = 0.4;
const VISUAL_WEIGHT = 0.6;

// ─── CLIP Embedding Client ──────────────────────────────────────────

/**
 * Sends frames to the CLIP embedding server for vectorization.
 *
 * @param frames - Base64-encoded frame images
 * @param videoId - Video identifier
 * @param timestamps - Timestamp for each frame
 * @returns Array of frame embeddings
 */
export async function embedFrames(
  frames: string[],
  videoId: string,
  timestamps: number[],
  config?: Partial<CLIPServiceConfig>,
): Promise<FrameEmbedding[]> {
  const baseUrl = config?.baseUrl || CLIP_BACKEND_URL;
  if (!baseUrl) {
    console.warn('[CLIP] No backend URL configured. Skipping frame embedding.');
    return [];
  }

  const timeoutMs = config?.timeoutMs || DEFAULT_TIMEOUT_MS;

  try {
    const response = await fetch(`${baseUrl}/embed/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: frames,
        videoId,
        timestamps,
        model: config?.model || 'ViT-B/32',
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`CLIP embedding failed: ${response.status}`);
    }

    const data = await response.json();
    return data.embeddings ?? [];
  } catch (err) {
    console.warn('[CLIP] Frame embedding failed:', err);
    return [];
  }
}

/**
 * Encodes a text query into a CLIP text embedding.
 *
 * @param query - Natural language query
 * @returns Embedding vector or null if service unavailable
 */
export async function embedText(
  query: string,
  config?: Partial<CLIPServiceConfig>,
): Promise<number[] | null> {
  const baseUrl = config?.baseUrl || CLIP_BACKEND_URL;
  if (!baseUrl) return null;

  try {
    const response = await fetch(`${baseUrl}/embed/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: query, model: config?.model || 'ViT-B/32' }),
      signal: AbortSignal.timeout(config?.timeoutMs || DEFAULT_TIMEOUT_MS),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.embedding ?? null;
  } catch {
    return null;
  }
}

/**
 * Encodes an image into a CLIP image embedding (for image→image search).
 *
 * @param imageBase64 - Base64-encoded image
 * @returns Embedding vector or null
 */
export async function embedImage(
  imageBase64: string,
  config?: Partial<CLIPServiceConfig>,
): Promise<number[] | null> {
  const baseUrl = config?.baseUrl || CLIP_BACKEND_URL;
  if (!baseUrl) return null;

  try {
    const response = await fetch(`${baseUrl}/embed/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64, model: config?.model || 'ViT-B/32' }),
      signal: AbortSignal.timeout(config?.timeoutMs || DEFAULT_TIMEOUT_MS),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.embedding ?? null;
  } catch {
    return null;
  }
}

// ─── Visual Search ───────────────────────────────────────────────────

/**
 * Performs visual search against stored frame embeddings.
 *
 * @param queryEmbedding - CLIP embedding of the query
 * @param videoId - Optional: restrict to a specific video
 * @param maxResults - Maximum results to return
 * @returns Ranked visual search results
 */
export async function visualSearch(
  queryEmbedding: number[],
  videoId?: string,
  maxResults = 10,
  config?: Partial<CLIPServiceConfig>,
): Promise<VisualSearchResult[]> {
  const baseUrl = config?.baseUrl || CLIP_BACKEND_URL;
  if (!baseUrl) return [];

  try {
    const params: Record<string, string> = {
      maxResults: String(maxResults),
    };
    if (videoId) params.videoId = videoId;

    const response = await fetch(`${baseUrl}/search/visual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embedding: queryEmbedding, ...params }),
      signal: AbortSignal.timeout(config?.timeoutMs || DEFAULT_TIMEOUT_MS),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.results ?? []).map((r: any) => ({
      ...r,
      modality: 'image' as const,
    }));
  } catch {
    return [];
  }
}

// ─── Multimodal Search (Text + Visual Fusion) ────────────────────────

/**
 * Performs multimodal search: queries both text embeddings (existing
 * vector search) and CLIP visual embeddings, then merges results.
 *
 * @param query - Natural language query
 * @param textSearchFn - Function to perform text-based vector search
 * @param videoId - Optional: restrict to a specific video
 * @param maxResults - Maximum results per modality
 * @returns Combined multimodal search results
 */
export async function multimodalSearch(
  query: string,
  textSearchFn: (q: string, vid?: string) => Promise<SearchResult[]>,
  videoId?: string,
  maxResults = 10,
  config?: Partial<CLIPServiceConfig>,
): Promise<MultimodalSearchResult> {
  const start = performance.now();

  // Run text and visual search in parallel
  const [textResults, queryEmbedding] = await Promise.all([
    textSearchFn(query, videoId),
    embedText(query, config),
  ]);

  let visualResults: VisualSearchResult[] = [];
  if (queryEmbedding) {
    visualResults = await visualSearch(queryEmbedding, videoId, maxResults, config);
  }

  // Merge results
  const merged = mergeResults(textResults, visualResults, maxResults);
  const searchTimeMs = performance.now() - start;

  return {
    textResults,
    visualResults,
    merged,
    searchTimeMs,
  };
}

/**
 * Merges text and visual results using weighted score fusion.
 *
 * When the same timestamp appears in both result sets, scores are
 * combined. Otherwise, results are scored by their modality weight.
 */
function mergeResults(
  textResults: SearchResult[],
  visualResults: VisualSearchResult[],
  maxResults: number,
): MergedResult[] {
  const byTimestamp = new Map<string, MergedResult>();

  // Add text results
  for (const r of textResults) {
    const key = `${r.chunk.videoId}:${Math.round(r.chunk.timestamp)}`;
    byTimestamp.set(key, {
      source: 'text',
      score: r.similarity * TEXT_WEIGHT,
      timestamp: r.chunk.timestamp,
      content: r.chunk.content.slice(0, 200),
      videoId: r.chunk.videoId,
      textSimilarity: r.similarity,
    });
  }

  // Add or merge visual results
  for (const r of visualResults) {
    const key = `${r.videoId}:${Math.round(r.timestamp)}`;
    const existing = byTimestamp.get(key);

    if (existing) {
      // Both modalities matched — boost score
      existing.source = 'both';
      existing.score += r.similarity * VISUAL_WEIGHT;
      existing.visualSimilarity = r.similarity;
    } else {
      byTimestamp.set(key, {
        source: 'visual',
        score: r.similarity * VISUAL_WEIGHT,
        timestamp: r.timestamp,
        content: r.description ?? `Frame at ${r.timestamp.toFixed(1)}s`,
        videoId: r.videoId,
        visualSimilarity: r.similarity,
      });
    }
  }

  // Sort by score descending and return top N
  return Array.from(byTimestamp.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

// ─── Ingestion Pipeline ──────────────────────────────────────────────

/**
 * Ingests video frames into the CLIP embedding store.
 * Call this alongside text chunk ingestion for full multimodal support.
 *
 * @param frames - Base64-encoded frames
 * @param videoId - Video identifier
 * @param duration - Video duration in seconds
 */
export async function ingestFrameEmbeddings(
  frames: string[],
  videoId: string,
  duration: number,
  config?: Partial<CLIPServiceConfig>,
): Promise<{ ingested: number; errors: number }> {
  if (frames.length === 0) return { ingested: 0, errors: 0 };

  const timestamps = frames.map((_, i) => (i / frames.length) * duration);

  const BATCH_SIZE = 20;
  let ingested = 0;
  let errors = 0;

  for (let i = 0; i < frames.length; i += BATCH_SIZE) {
    const batch = frames.slice(i, i + BATCH_SIZE);
    const batchTimestamps = timestamps.slice(i, i + BATCH_SIZE);

    try {
      const embeddings = await embedFrames(batch, videoId, batchTimestamps, config);
      ingested += embeddings.length;
    } catch {
      errors += batch.length;
    }
  }

  console.log(`[CLIP] Ingested ${ingested} frame embeddings for ${videoId} (${errors} errors)`);
  return { ingested, errors };
}

// ─── Health Check ────────────────────────────────────────────────────

/**
 * Checks if the CLIP embedding service is available.
 */
export async function checkCLIPHealth(
  config?: Partial<CLIPServiceConfig>,
): Promise<boolean> {
  const baseUrl = config?.baseUrl || CLIP_BACKEND_URL;
  if (!baseUrl) return false;

  try {
    const response = await fetch(`${baseUrl}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ─── Exports for testing ──────────────────────────────────────────────

export const _testing = {
  mergeResults,
  TEXT_WEIGHT,
  VISUAL_WEIGHT,
};