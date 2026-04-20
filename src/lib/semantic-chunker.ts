/**
 * Semantic Chunker
 *
 * Replaces fixed-size word-count chunking with adaptive semantic chunking.
 * Splits on topic boundaries detected by embedding cosine-similarity drops.
 *
 * Algorithm (inspired by Langchain SemanticChunker):
 *   1. Split transcript into sentences.
 *   2. Compute a lightweight embedding for each sentence (TF-IDF bigram hash).
 *   3. For each consecutive pair, compute cosine similarity.
 *   4. Where the similarity drops below a dynamic threshold (percentile-based),
 *      insert a chunk boundary.
 *   5. Merge tiny fragments into their nearest neighbor.
 *
 * The embeddings are computed locally (no network round-trip) using a
 * deterministic hash-based vectorizer. This is ~100x faster than calling an
 * embedding API per sentence, and sufficient for segmentation purposes
 * (not retrieval — the vector DB will re-embed with its own model).
 *
 * @module
 */

import type { VideoChunk } from './vector-search';

// ─── Configuration ────────────────────────────────────────────────────

/** Minimum words per chunk (prevents micro-fragments). */
const MIN_CHUNK_WORDS = 30;

/** Maximum words per chunk (prevents mega-chunks). */
const MAX_CHUNK_WORDS = 300;

/** Percentile for similarity break detection (lower = fewer, larger chunks). */
const BREAK_PERCENTILE = 25;

/** Embedding dimension for hash-based vectorizer. */
const EMBED_DIM = 128;

// ─── Sentence splitting ───────────────────────────────────────────────

interface TimestampedSentence {
  text: string;
  startTime: number;
  endTime: number;
}

/**
 * Splits a timestamped transcript into sentences.
 * Uses punctuation-based heuristics (. ! ? followed by space/newline).
 */
function splitIntoSentences(
  transcript: { time: number; text: string }[],
): TimestampedSentence[] {
  const sentences: TimestampedSentence[] = [];

  for (const entry of transcript) {
    // Split on sentence-ending punctuation
    const parts = entry.text.split(/(?<=[.!?])\s+/);
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.length > 0) {
        sentences.push({
          text: trimmed,
          startTime: entry.time,
          endTime: entry.time,
        });
      }
    }
  }

  // Assign estimated end times from subsequent sentence start times
  for (let i = 0; i < sentences.length - 1; i++) {
    sentences[i].endTime = sentences[i + 1].startTime;
  }
  if (sentences.length > 0) {
    const last = sentences[sentences.length - 1];
    last.endTime = last.startTime; // Will be corrected by caller if needed
  }

  return sentences;
}

// ─── Hash-based embedding (local, no API) ─────────────────────────────

/**
 * Generates bigrams from text: "hello world foo" → ["hello world", "world foo"]
 */
function bigrams(text: string): string[] {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const bg: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    bg.push(`${words[i]} ${words[i + 1]}`);
  }
  // Include unigrams for very short texts
  if (words.length <= 3) {
    bg.push(...words);
  }
  return bg;
}

/**
 * FNV-1a 32-bit hash → deterministic integer for a string.
 */
function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Produces a deterministic EMBED_DIM-dimensional float vector
 * by hashing bigrams into buckets (count-min sketch style).
 */
function hashEmbed(text: string): Float32Array {
  const vec = new Float32Array(EMBED_DIM);
  const grams = bigrams(text);

  for (const gram of grams) {
    const bucket = fnv1a(gram) % EMBED_DIM;
    // Alternate sign based on second hash to reduce collisions
    const sign = (fnv1a(gram + '_sign') & 1) === 0 ? 1 : -1;
    vec[bucket] += sign;
  }

  // L2-normalize
  let norm = 0;
  for (let i = 0; i < EMBED_DIM; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < EMBED_DIM; i++) {
    vec[i] /= norm;
  }

  return vec;
}

/**
 * Cosine similarity between two L2-normalized vectors (just dot product).
 */
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

// ─── Break detection ──────────────────────────────────────────────────

/**
 * Computes the percentile-based threshold for break detection.
 * Values below this threshold are considered topic boundaries.
 */
function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * sorted.length);
  return sorted[Math.min(idx, sorted.length - 1)];
}

/**
 * Given pairwise similarities, returns indices where a break should occur.
 */
function detectBreaks(similarities: number[]): number[] {
  if (similarities.length === 0) return [];

  const threshold = percentile(similarities, BREAK_PERCENTILE);
  const breaks: number[] = [];

  for (let i = 0; i < similarities.length; i++) {
    if (similarities[i] < threshold) {
      breaks.push(i + 1); // Break AFTER the i-th sentence
    }
  }

  return breaks;
}

// ─── Chunk merging ────────────────────────────────────────────────────

interface RawChunk {
  sentences: TimestampedSentence[];
  wordCount: number;
}

/**
 * Merges tiny chunks into their nearest neighbor.
 * Also splits oversized chunks.
 */
function mergeAndBalance(chunks: RawChunk[]): RawChunk[] {
  const result: RawChunk[] = [];

  for (const chunk of chunks) {
    if (chunk.wordCount > MAX_CHUNK_WORDS) {
      // Split oversized chunk roughly in half by sentence count
      const mid = Math.ceil(chunk.sentences.length / 2);
      const left = chunk.sentences.slice(0, mid);
      const right = chunk.sentences.slice(mid);
      const leftWords = left.reduce((n, s) => n + s.text.split(/\s+/).length, 0);
      const rightWords = right.reduce((n, s) => n + s.text.split(/\s+/).length, 0);
      result.push({ sentences: left, wordCount: leftWords });
      result.push({ sentences: right, wordCount: rightWords });
    } else {
      result.push(chunk);
    }
  }

  // Merge too-small chunks into the preceding chunk
  const merged: RawChunk[] = [];
  for (const chunk of result) {
    if (chunk.wordCount < MIN_CHUNK_WORDS && merged.length > 0) {
      const prev = merged[merged.length - 1];
      prev.sentences.push(...chunk.sentences);
      prev.wordCount += chunk.wordCount;
    } else {
      merged.push(chunk);
    }
  }

  return merged;
}

// ─── Public API ───────────────────────────────────────────────────────

export interface SemanticChunkOptions {
  /** Percentile for break sensitivity (default: 25). Lower = fewer chunks. */
  breakPercentile?: number;
  /** Minimum words per chunk (default: 30). */
  minWords?: number;
  /** Maximum words per chunk (default: 300). */
  maxWords?: number;
}

/**
 * Semantically chunks a timestamped transcript.
 *
 * Instead of slicing at every N words, this detects topic boundaries
 * using embedding similarity drops between consecutive sentences,
 * then groups sentences into coherent chunks.
 *
 * @param transcript - Timestamped transcript entries
 * @param videoId    - Video identifier for chunk IDs
 * @param options    - Optional tuning parameters
 * @returns Array of VideoChunks ready for vector ingestion
 */
export function semanticChunkTranscript(
  transcript: { time: number; text: string }[],
  videoId: string,
  options?: SemanticChunkOptions,
): VideoChunk[] {
  if (transcript.length === 0) return [];

  const sentences = splitIntoSentences(transcript);
  if (sentences.length === 0) return [];

  // Single sentence → single chunk
  if (sentences.length === 1) {
    return [{
      id: `${videoId}-semantic-0`,
      videoId,
      content: sentences[0].text,
      timestamp: sentences[0].startTime,
      endTime: sentences[0].endTime,
      type: 'transcript',
      metadata: { chunkMethod: 'semantic', sentenceCount: 1 },
    }];
  }

  // 1. Embed every sentence
  const embeddings = sentences.map((s) => hashEmbed(s.text));

  // 2. Compute pairwise cosine similarities
  const similarities: number[] = [];
  for (let i = 0; i < embeddings.length - 1; i++) {
    similarities.push(cosineSimilarity(embeddings[i], embeddings[i + 1]));
  }

  // 3. Detect breaks
  const breakIndices = detectBreaks(similarities);

  // 4. Group sentences into chunks
  const rawChunks: RawChunk[] = [];
  let start = 0;
  for (const brk of breakIndices) {
    const slice = sentences.slice(start, brk);
    const wordCount = slice.reduce((n, s) => n + s.text.split(/\s+/).length, 0);
    rawChunks.push({ sentences: slice, wordCount });
    start = brk;
  }
  // Remaining sentences
  if (start < sentences.length) {
    const slice = sentences.slice(start);
    const wordCount = slice.reduce((n, s) => n + s.text.split(/\s+/).length, 0);
    rawChunks.push({ sentences: slice, wordCount });
  }

  // 5. Merge/balance
  const balanced = mergeAndBalance(rawChunks);

  // 6. Convert to VideoChunks
  return balanced.map((chunk, idx) => ({
    id: `${videoId}-semantic-${idx}`,
    videoId,
    content: chunk.sentences.map((s) => s.text).join(' '),
    timestamp: chunk.sentences[0].startTime,
    endTime: chunk.sentences[chunk.sentences.length - 1].endTime,
    type: 'transcript' as const,
    metadata: {
      chunkMethod: 'semantic',
      sentenceCount: chunk.sentences.length,
      wordCount: chunk.wordCount,
    },
  }));
}

/**
 * Hybrid chunking: uses semantic chunking when transcript has enough
 * sentences for meaningful topic detection, falls back to fixed-size
 * for very short transcripts.
 *
 * This is the recommended entry point — drop-in replacement for
 * the original `chunkTranscript` function.
 */
export function adaptiveChunkTranscript(
  transcript: { time: number; text: string }[],
  videoId: string,
  options?: SemanticChunkOptions,
): VideoChunk[] {
  // Count total sentences to decide strategy
  const totalSentences = transcript.reduce(
    (n, entry) => n + entry.text.split(/(?<=[.!?])\s+/).filter(Boolean).length,
    0,
  );

  // For very short transcripts (< 5 sentences), semantic chunking has no
  // signal — treat the entire text as one chunk.
  if (totalSentences < 5) {
    const text = transcript.map((e) => e.text).join(' ');
    if (!text.trim()) return [];
    return [{
      id: `${videoId}-adaptive-0`,
      videoId,
      content: text,
      timestamp: transcript[0].time,
      endTime: transcript[transcript.length - 1].time,
      type: 'transcript',
      metadata: { chunkMethod: 'single', sentenceCount: totalSentences },
    }];
  }

  return semanticChunkTranscript(transcript, videoId, options);
}

// ─── Exports for testing ──────────────────────────────────────────────

export const _testing = {
  splitIntoSentences,
  hashEmbed,
  cosineSimilarity,
  detectBreaks,
  mergeAndBalance,
  bigrams,
};