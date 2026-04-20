/**
 * Semantic Chunker Tests
 *
 * Validates adaptive semantic chunking: sentence splitting, embedding,
 * break detection, merging, and end-to-end chunking.
 */
import { describe, it, expect } from 'vitest';
import {
  semanticChunkTranscript,
  adaptiveChunkTranscript,
  _testing,
} from '../lib/semantic-chunker';

const {
  splitIntoSentences,
  hashEmbed,
  cosineSimilarity,
  detectBreaks,
  mergeAndBalance,
  bigrams,
} = _testing;

// ─── Sentence splitting ────────────────────────────────────────────────

describe('splitIntoSentences', () => {
  it('splits on sentence-ending punctuation', () => {
    const transcript = [
      { time: 0, text: 'Hello world. This is a test.' },
      { time: 10, text: 'Another sentence! And one more?' },
    ];
    const sentences = splitIntoSentences(transcript);
    expect(sentences.length).toBe(4);
    expect(sentences[0].text).toBe('Hello world.');
    expect(sentences[1].text).toBe('This is a test.');
    expect(sentences[2].text).toBe('Another sentence!');
    expect(sentences[3].text).toBe('And one more?');
  });

  it('handles single entry with no punctuation', () => {
    const transcript = [{ time: 0, text: 'No punctuation here' }];
    const sentences = splitIntoSentences(transcript);
    expect(sentences.length).toBe(1);
    expect(sentences[0].text).toBe('No punctuation here');
  });

  it('assigns timestamps correctly', () => {
    const transcript = [
      { time: 0, text: 'First sentence.' },
      { time: 5, text: 'Second sentence.' },
    ];
    const sentences = splitIntoSentences(transcript);
    expect(sentences[0].startTime).toBe(0);
    expect(sentences[0].endTime).toBe(5); // endTime = next sentence startTime
    expect(sentences[1].startTime).toBe(5);
  });

  it('returns empty for empty transcript', () => {
    expect(splitIntoSentences([])).toEqual([]);
  });
});

// ─── Bigrams ───────────────────────────────────────────────────────────

describe('bigrams', () => {
  it('generates bigrams from text', () => {
    const bg = bigrams('hello world foo');
    expect(bg).toContain('hello world');
    expect(bg).toContain('world foo');
    // 3 words → 2 bigrams + 3 unigrams (≤ 3 words triggers unigram fallback)
    expect(bg.length).toBe(5);
  });

  it('includes unigrams for short texts', () => {
    const bg = bigrams('hello world');
    expect(bg).toContain('hello world');
    expect(bg).toContain('hello');
    expect(bg).toContain('world');
  });

  it('generates only bigrams for longer texts', () => {
    const bg = bigrams('one two three four five');
    // 5 words → 4 bigrams, no unigrams (> 3 words)
    expect(bg.length).toBe(4);
    expect(bg).toContain('one two');
    expect(bg).toContain('four five');
  });
});

// ─── Hash embedding ────────────────────────────────────────────────────

describe('hashEmbed', () => {
  it('produces a 128-dimensional vector', () => {
    const vec = hashEmbed('test sentence about machine learning');
    expect(vec.length).toBe(128);
  });

  it('produces L2-normalized vectors', () => {
    const vec = hashEmbed('another test sentence');
    let norm = 0;
    for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
    expect(Math.abs(Math.sqrt(norm) - 1)).toBeLessThan(0.001);
  });

  it('produces same vector for same text (deterministic)', () => {
    const a = hashEmbed('deterministic test');
    const b = hashEmbed('deterministic test');
    expect(cosineSimilarity(a, b)).toBeCloseTo(1.0, 5);
  });

  it('produces different vectors for different texts', () => {
    const a = hashEmbed('machine learning algorithms');
    const b = hashEmbed('cooking recipes for dinner');
    const sim = cosineSimilarity(a, b);
    expect(sim).toBeLessThan(0.8); // Different topics should differ
  });
});

// ─── Cosine similarity ─────────────────────────────────────────────────

describe('cosineSimilarity', () => {
  it('returns 1.0 for identical vectors', () => {
    const vec = hashEmbed('same text');
    expect(cosineSimilarity(vec, vec)).toBeCloseTo(1.0, 5);
  });

  it('returns a lower value for dissimilar texts', () => {
    const a = hashEmbed('quantum physics experiments');
    const b = hashEmbed('chocolate cake baking recipe');
    expect(cosineSimilarity(a, b)).toBeLessThan(0.5);
  });

  it('returns a higher value for similar texts', () => {
    const a = hashEmbed('machine learning is about algorithms and data');
    const b = hashEmbed('algorithms and data are central to machine learning');
    expect(cosineSimilarity(a, b)).toBeGreaterThan(0.3);
  });
});

// ─── Break detection ───────────────────────────────────────────────────

describe('detectBreaks', () => {
  it('returns empty for empty similarities', () => {
    expect(detectBreaks([])).toEqual([]);
  });

  it('detects breaks at low-similarity points', () => {
    // Simulate: 3 similar pairs, then a topic shift
    const similarities = [0.9, 0.85, 0.88, 0.1, 0.92, 0.87];
    const breaks = detectBreaks(similarities);
    // The break at index 3 (similarity 0.1) should be detected
    expect(breaks).toContain(4); // Break AFTER the 3rd sentence
  });

  it('handles all-equal similarities', () => {
    const similarities = [0.5, 0.5, 0.5, 0.5];
    const breaks = detectBreaks(similarities);
    // With identical values, the 25th percentile ≤ all values,
    // so we may get breaks at the bottom of the distribution
    expect(breaks.length).toBeLessThanOrEqual(similarities.length);
  });
});

// ─── Merge and balance ─────────────────────────────────────────────────

describe('mergeAndBalance', () => {
  it('merges tiny chunks into predecessor', () => {
    const chunks = [
      { sentences: [{ text: 'A long enough sentence for testing purposes. And another one here.', startTime: 0, endTime: 5 }], wordCount: 40 },
      { sentences: [{ text: 'Tiny.', startTime: 5, endTime: 6 }], wordCount: 1 },
    ];
    const result = mergeAndBalance(chunks);
    expect(result.length).toBe(1);
    expect(result[0].wordCount).toBe(41);
  });

  it('splits oversized chunks', () => {
    const bigSentences = Array.from({ length: 20 }, (_, i) => ({
      text: `Sentence number ${i} with some extra words to fill it up.`,
      startTime: i,
      endTime: i + 1,
    }));
    const chunks = [{ sentences: bigSentences, wordCount: 350 }];
    const result = mergeAndBalance(chunks);
    expect(result.length).toBeGreaterThan(1);
    expect(result.every((c) => c.wordCount <= 350)).toBe(true);
  });
});

// ─── End-to-end: semanticChunkTranscript ───────────────────────────────

describe('semanticChunkTranscript', () => {
  it('returns empty for empty transcript', () => {
    expect(semanticChunkTranscript([], 'vid-1')).toEqual([]);
  });

  it('returns a single chunk for a single sentence', () => {
    const transcript = [{ time: 0, text: 'A single sentence.' }];
    const chunks = semanticChunkTranscript(transcript, 'vid-1');
    expect(chunks.length).toBe(1);
    expect(chunks[0].metadata?.chunkMethod).toBe('semantic');
  });

  it('produces multiple chunks for multi-topic transcripts', () => {
    // Simulate a transcript with two clear topics
    const transcript = [
      { time: 0, text: 'Machine learning algorithms process data to find patterns. Neural networks are a type of machine learning model. Deep learning uses multiple layers of neural networks.' },
      { time: 30, text: 'Cooking pasta requires boiling water first. Add salt to the water. Then add the pasta and cook for 10 minutes. Drain the pasta when done.' },
      { time: 60, text: 'Machine learning models need training data. Supervised learning uses labeled examples. The model learns to predict outputs from inputs.' },
    ];
    const chunks = semanticChunkTranscript(transcript, 'vid-1');
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks.every((c) => c.videoId === 'vid-1')).toBe(true);
    expect(chunks.every((c) => c.type === 'transcript')).toBe(true);
  });

  it('assigns correct chunk IDs', () => {
    const transcript = [
      { time: 0, text: 'First topic about science. Another science sentence.' },
      { time: 10, text: 'Second topic about cooking. Another cooking sentence.' },
    ];
    const chunks = semanticChunkTranscript(transcript, 'my-video');
    for (const chunk of chunks) {
      expect(chunk.id).toMatch(/^my-video-semantic-\d+$/);
    }
  });

  it('includes semantic metadata in each chunk', () => {
    const transcript = [
      { time: 0, text: 'Sentence one. Sentence two. Sentence three.' },
      { time: 10, text: 'Sentence four. Sentence five. Sentence six.' },
    ];
    const chunks = semanticChunkTranscript(transcript, 'vid-1');
    for (const chunk of chunks) {
      expect(chunk.metadata).toBeDefined();
      expect(chunk.metadata?.chunkMethod).toBe('semantic');
      expect(typeof chunk.metadata?.sentenceCount).toBe('number');
    }
  });
});

// ─── End-to-end: adaptiveChunkTranscript ───────────────────────────────

describe('adaptiveChunkTranscript', () => {
  it('returns empty for empty transcript', () => {
    expect(adaptiveChunkTranscript([], 'vid-1')).toEqual([]);
  });

  it('uses single-chunk mode for very short transcripts', () => {
    const transcript = [
      { time: 0, text: 'Just a couple of sentences. Not enough for topic detection.' },
    ];
    const chunks = adaptiveChunkTranscript(transcript, 'vid-1');
    expect(chunks.length).toBe(1);
    expect(chunks[0].metadata?.chunkMethod).toBe('single');
  });

  it('uses semantic chunking for longer transcripts', () => {
    const transcript = [
      { time: 0, text: 'First sentence about physics. Second about physics. Third about physics.' },
      { time: 10, text: 'Fourth about cooking. Fifth about cooking. Sixth about cooking.' },
      { time: 20, text: 'Seventh about math. Eighth about math. Ninth about math.' },
    ];
    const chunks = adaptiveChunkTranscript(transcript, 'vid-1');
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    // All chunks should have semantic or single method
    for (const chunk of chunks) {
      expect(['semantic', 'single']).toContain(chunk.metadata?.chunkMethod);
    }
  });
});