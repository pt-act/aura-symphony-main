import {useEffect, useCallback} from 'react';
import {
  vectorSearch,
  checkVectorBackendHealth,
  ingestChunks,
  chunkFrameDescriptions,
  type VectorSearchResponse,
  type VideoChunk,
} from '../lib/vector-search';

interface VideoStateRef {
  videoUrl: string | null;
  duration: number;
  asyncCaptureFrames: (start: number, end: number, maxFrames?: number) => Promise<string[]>;
}

interface AnnotationsRef {
  handleAddAnnotation: (time: number, text: string) => void;
}

export interface VectorSearchResult {
  timecodes: Array<{time: number; text: string}>;
  searchTimeMs: number;
}

/**
 * Encapsulates vector search and ingestion logic.
 * Separated from useAnalysisState to reduce hook complexity.
 */
export function useVectorSearch(
  videoState: VideoStateRef,
  annotationsState: AnnotationsRef,
) {
  /**
   * Ingests video frames into the vector backend for semantic search.
   * Non-blocking — silently skips if backend unavailable.
   */
  const ingestVideoForSearch = useCallback(async () => {
    try {
      const hasBackend = await checkVectorBackendHealth();
      if (!hasBackend) return;

      const frameCount = Math.min(Math.floor(videoState.duration / 5), 200);
      const frames = await videoState.asyncCaptureFrames(0, videoState.duration, frameCount);

      const frameDescriptions = frames.map((frameData, i) => {
        const time = (i / frames.length) * videoState.duration;
        return {time, description: `Frame at ${time.toFixed(1)}s: ${frameData.slice(0, 200)}`};
      });

      const videoId = videoState.videoUrl || `video-${Date.now()}`;
      const chunks = chunkFrameDescriptions(frameDescriptions, videoId);

      if (chunks.length > 0) {
        await ingestChunks(chunks);
        console.log(`[Vector Search] Ingested ${chunks.length} chunks for ${videoId}`);
      }
    } catch (err) {
      console.warn('[Vector Search] Ingestion failed, fallback will be used:', err);
    }
  }, [videoState.videoUrl, videoState.duration, videoState.asyncCaptureFrames]);

  /**
   * Tries vector search. Returns results if backend available, null otherwise.
   * Callers should fall back to alternative search when null is returned.
   */
  const tryVectorSearch = useCallback(
    async (query: string): Promise<VectorSearchResult | null> => {
      try {
        const result = await vectorSearch(query, videoState.videoUrl || undefined);
        if (result.source === 'vector' && result.results.length > 0) {
          const timecodes = result.results.map((r) => ({
            time: r.chunk.timestamp,
            text: `[${(r.similarity * 100).toFixed(0)}%] ${r.chunk.content.slice(0, 120)}`,
          }));
          return {timecodes, searchTimeMs: result.searchTimeMs};
        }
      } catch (err) {
        console.warn('[Vector Search] Falling back to frame analysis:', err);
      }
      return null;
    },
    [videoState.videoUrl],
  );

  /**
   * Adds vector search results as annotations.
   */
  const addAnnotations = useCallback(
    (timecodes: Array<{time: number; text: string}>) => {
      timecodes.forEach((tc) => annotationsState.handleAddAnnotation(tc.time, tc.text));
    },
    [annotationsState.handleAddAnnotation],
  );

  // Auto-ingest when video loads (non-blocking)
  useEffect(() => {
    if (videoState.videoUrl && videoState.duration > 0) {
      ingestVideoForSearch();
    }
  }, [videoState.videoUrl, videoState.duration]);

  return {
    tryVectorSearch,
    addAnnotations,
    ingestVideoForSearch,
  };
}
