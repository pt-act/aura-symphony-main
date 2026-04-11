/**
 * Vector Search Service
 *
 * Provider-agnostic interface for semantic video search.
 * Implements the client-side integration for vector-based RAG search.
 *
 * Backend implementations: Pinecone, Milvus, or any vector DB.
 * Falls back to direct Gemini context-window search if backend unavailable.
 */

import { ai } from '../api/client';

// ─── Types ───────────────────────────────────────────────────────────

export interface VideoChunk {
  id: string;
  videoId: string;
  content: string;
  timestamp: number; // seconds
  endTime: number; // seconds
  type: 'transcript' | 'frame_description';
  metadata?: Record<string, unknown>;
}

export interface SearchResult {
  chunk: VideoChunk;
  similarity: number;
}

export interface VectorSearchResponse {
  query: string;
  results: SearchResult[];
  searchTimeMs: number;
  source: 'vector' | 'fallback';
}

// ─── Configuration ───────────────────────────────────────────────────

const VECTOR_BACKEND_URL =
  import.meta.env.VITE_VECTOR_BACKEND_URL || '';

const MIN_SIMILARITY = 0.7;
const MAX_RESULTS = 10;

// ─── Client-side chunking (for ingestion) ────────────────────────────

/**
 * Chunks a video transcript into overlapping segments for embedding.
 *
 * @param transcript - Full transcript with timestamps
 * @param videoId - Video identifier
 * @param chunkSize - Number of words per chunk (default 100)
 * @param overlap - Overlap between chunks in words (default 20)
 */
export function chunkTranscript(
  transcript: { time: number; text: string }[],
  videoId: string,
  chunkSize = 100,
  overlap = 20
): VideoChunk[] {
  const chunks: VideoChunk[] = [];
  const words: { time: number; word: string }[] = [];

  for (const entry of transcript) {
    const entryWords = entry.text.split(/\s+/);
    for (const word of entryWords) {
      words.push({ time: entry.time, word });
    }
  }

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const slice = words.slice(i, i + chunkSize);
    if (slice.length < 10) continue; // Skip tiny trailing chunks

    chunks.push({
      id: `${videoId}-chunk-${chunks.length}`,
      videoId,
      content: slice.map((w) => w.word).join(' '),
      timestamp: slice[0].time,
      endTime: slice[slice.length - 1].time,
      type: 'transcript',
    });
  }

  return chunks;
}

/**
 * Chunks frame descriptions for embedding.
 */
export function chunkFrameDescriptions(
  frames: { time: number; description: string }[],
  videoId: string
): VideoChunk[] {
  return frames.map((frame, i) => ({
    id: `${videoId}-frame-${i}`,
    videoId,
    content: frame.description,
    timestamp: frame.time,
    endTime: frame.time,
    type: 'frame_description' as const,
  }));
}

// ─── Vector search API ──────────────────────────────────────────────

/**
 * Performs semantic search against the vector backend.
 *
 * @param query - Natural language search query
 * @param videoId - Optional: restrict search to a specific video
 * @returns VectorSearchResponse with ranked results
 */
export async function vectorSearch(
  query: string,
  videoId?: string
): Promise<VectorSearchResponse> {
  const start = performance.now();

  // If no backend configured, return empty (caller should use fallback)
  if (!VECTOR_BACKEND_URL) {
    return {
      query,
      results: [],
      searchTimeMs: 0,
      source: 'fallback',
    };
  }

  try {
    const params = new URLSearchParams({
      query,
      ...(videoId && { videoId }),
      minSimilarity: String(MIN_SIMILARITY),
      maxResults: String(MAX_RESULTS),
    });

    const response = await fetch(`${VECTOR_BACKEND_URL}/search?${params}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Vector search failed: ${response.status}`);
    }

    const data = await response.json();
    const searchTimeMs = performance.now() - start;

    return {
      query,
      results: data.results || [],
      searchTimeMs,
      source: 'vector',
    };
  } catch (error) {
    console.warn('[Vector Search] Backend unavailable, using fallback:', error);
    return {
      query,
      results: [],
      searchTimeMs: performance.now() - start,
      source: 'fallback',
    };
  }
}

// ─── Ingestion API ───────────────────────────────────────────────────

/**
 * Sends chunks to the vector backend for embedding and storage.
 *
 * @param chunks - Video chunks to ingest
 */
export async function ingestChunks(chunks: VideoChunk[]): Promise<void> {
  if (!VECTOR_BACKEND_URL) {
    console.warn('[Vector Search] No backend URL configured. Skipping ingestion.');
    return;
  }

  const BATCH_SIZE = 50;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const response = await fetch(`${VECTOR_BACKEND_URL}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chunks: batch }),
    });

    if (!response.ok) {
      throw new Error(`Ingestion failed at batch ${i / BATCH_SIZE}: ${response.status}`);
    }
  }
}

// ─── Fallback: Gemini context-window search ──────────────────────────

/**
 * Fallback search using Gemini's context window (current behavior).
 * Used when vector backend is unavailable.
 *
 * @param query - Search query
 * @param transcript - Full video transcript
 * @param frameDescriptions - Frame descriptions with timestamps
 */
export async function fallbackSearch(
  query: string,
  transcript: string,
  frameDescriptions?: string
): Promise<string> {
  const context = frameDescriptions
    ? `TRANSCRIPT:\n${transcript}\n\nFRAME DESCRIPTIONS:\n${frameDescriptions}`
    : transcript;

  const prompt = `Find all occurrences of "${query}" in the following content.
Return timestamps and brief descriptions of matching moments.

${context}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
  });

  return response.text || '';
}

// ─── Health check ────────────────────────────────────────────────────

/**
 * Checks if the vector backend is available.
 */
export async function checkVectorBackendHealth(): Promise<boolean> {
  if (!VECTOR_BACKEND_URL) return false;

  try {
    const response = await fetch(`${VECTOR_BACKEND_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
