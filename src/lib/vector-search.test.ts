import {describe, it, expect} from 'vitest';
import {chunkTranscript, chunkTranscriptFixed, chunkFrameDescriptions} from './vector-search';

// ─── chunkTranscript (now uses adaptive semantic chunking) ─────────

describe('chunkTranscript', () => {
  it('chunks a short transcript into a single chunk', () => {
    const transcript = [{time: 0, text: 'one two three four five six seven eight nine ten'}];
    const chunks = chunkTranscript(transcript, 'vid-1');
    expect(chunks).toHaveLength(1);
    expect(chunks[0].videoId).toBe('vid-1');
    expect(chunks[0].timestamp).toBe(0);
    expect(chunks[0].type).toBe('transcript');
  });

  it('preserves timestamps from the source transcript', () => {
    const transcript = [
      {time: 10, text: 'first segment of words for testing purposes here'},
      {time: 30, text: 'second segment at thirty seconds with more content'},
    ];
    const chunks = chunkTranscript(transcript, 'vid-4');
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks[0].timestamp).toBe(10);
  });

  it('handles empty transcript', () => {
    const chunks = chunkTranscript([], 'vid-6');
    expect(chunks).toHaveLength(0);
  });

  it('handles transcript entry with empty text', () => {
    const transcript = [{time: 0, text: ''}];
    const chunks = chunkTranscript(transcript, 'vid-7');
    expect(chunks).toHaveLength(0);
  });

  it('includes semantic metadata in chunks', () => {
    const transcript = [
      {time: 0, text: 'Machine learning algorithms process data. Neural nets learn patterns.'},
      {time: 10, text: 'Cooking pasta is simple. Boil water first. Add salt.'},
    ];
    const chunks = chunkTranscript(transcript, 'vid-meta');
    for (const chunk of chunks) {
      expect(chunk.metadata).toBeDefined();
      expect(['semantic', 'single']).toContain(chunk.metadata?.chunkMethod);
    }
  });

  it('produces chunks for multi-topic transcripts', () => {
    const transcript = [
      {time: 0, text: 'Physics involves matter and energy. Quantum mechanics is a branch of physics. Particles behave differently at quantum scales.'},
      {time: 30, text: 'Baking requires precise measurements. Flour and sugar are key ingredients. Preheat the oven to 350 degrees.'},
      {time: 60, text: 'Software engineering is about building reliable systems. Testing ensures quality. Version control tracks changes.'},
    ];
    const chunks = chunkTranscript(transcript, 'vid-multi');
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks.every(c => c.videoId === 'vid-multi')).toBe(true);
  });
});

// ─── chunkTranscriptFixed (legacy, kept for backwards compat) ──────

describe('chunkTranscriptFixed', () => {
  it('creates multiple chunks when text exceeds chunkSize', () => {
    const words = Array.from({length: 25}, (_, i) => `word${i}`).join(' ');
    const transcript = [{time: 0, text: words}];
    const chunks = chunkTranscriptFixed(transcript, 'vid-2', 10, 2);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('assigns sequential chunk IDs', () => {
    const words = Array.from({length: 50}, (_, i) => `w${i}`).join(' ');
    const transcript = [{time: 0, text: words}];
    const chunks = chunkTranscriptFixed(transcript, 'vid-3', 10, 2);
    chunks.forEach((chunk, i) => {
      expect(chunk.id).toBe(`vid-3-chunk-${i}`);
    });
  });

  it('skips trailing chunks with fewer than 10 words', () => {
    const words = Array.from({length: 13}, (_, i) => `w${i}`).join(' ');
    const transcript = [{time: 0, text: words}];
    const chunks = chunkTranscriptFixed(transcript, 'vid-5', 10, 0);
    expect(chunks).toHaveLength(1);
  });

  it('uses default chunkSize and overlap when not specified', () => {
    const words = Array.from({length: 250}, (_, i) => `w${i}`).join(' ');
    const transcript = [{time: 0, text: words}];
    const chunks = chunkTranscriptFixed(transcript, 'vid-8');
    expect(chunks.length).toBe(4);
  });

  it('sets endTime from last word in each chunk', () => {
    const transcript = [
      {time: 0, text: 'alpha beta gamma delta epsilon zeta eta theta iota kappa'},
      {time: 10, text: 'lambda mu nu xi omicron pi rho sigma tau'},
      {time: 20, text: 'upsilon phi chi psi omega'},
    ];
    const chunks = chunkTranscriptFixed(transcript, 'vid-9', 100, 0);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].endTime).toBe(20);
  });
});

// ─── chunkFrameDescriptions ────────────────────────────────────────

describe('chunkFrameDescriptions', () => {
  it('creates one chunk per frame', () => {
    const frames = [
      {time: 0, description: 'Frame 0: a cat'},
      {time: 5, description: 'Frame 5: a dog'},
      {time: 10, description: 'Frame 10: a bird'},
    ];
    const chunks = chunkFrameDescriptions(frames, 'vid-f1');
    expect(chunks).toHaveLength(3);
  });

  it('assigns correct IDs and types', () => {
    const frames = [{time: 0, description: 'test'}];
    const chunks = chunkFrameDescriptions(frames, 'vid-f2');
    expect(chunks[0].id).toBe('vid-f2-frame-0');
    expect(chunks[0].type).toBe('frame_description');
    expect(chunks[0].videoId).toBe('vid-f2');
  });

  it('sets timestamp and endTime to the frame time', () => {
    const frames = [{time: 42.5, description: 'test'}];
    const chunks = chunkFrameDescriptions(frames, 'vid-f3');
    expect(chunks[0].timestamp).toBe(42.5);
    expect(chunks[0].endTime).toBe(42.5);
  });

  it('sets content to the frame description', () => {
    const frames = [{time: 0, description: 'A wide shot of a mountain range at sunset'}];
    const chunks = chunkFrameDescriptions(frames, 'vid-f4');
    expect(chunks[0].content).toBe('A wide shot of a mountain range at sunset');
  });

  it('handles empty frames array', () => {
    const chunks = chunkFrameDescriptions([], 'vid-f5');
    expect(chunks).toHaveLength(0);
  });

  it('preserves order of frames', () => {
    const frames = [
      {time: 0, description: 'first'},
      {time: 5, description: 'second'},
      {time: 10, description: 'third'},
    ];
    const chunks = chunkFrameDescriptions(frames, 'vid-f6');
    expect(chunks[0].content).toBe('first');
    expect(chunks[1].content).toBe('second');
    expect(chunks[2].content).toBe('third');
  });
});
