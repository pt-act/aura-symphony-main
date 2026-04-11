import {useCallback, useRef, useEffect} from 'react';
import {
  submitMediaJob,
  checkMediaBackendHealth,
  disconnectMediaPipeline,
  type MediaProcessingJob,
  type ProgressCallback,
} from '../lib/media-pipeline';

/**
 * Encapsulates cloud media pipeline integration.
 * Tries cloud-based frame extraction first, falls back to local WebWorker.
 */
export function useMediaPipeline(localCaptureFrames: (start: number, end: number, maxFrames?: number) => Promise<string[]>) {
  const backendAvailable = useRef<boolean | null>(null);
  const activeJobRef = useRef<MediaProcessingJob | null>(null);

  // Check backend health once on mount
  useEffect(() => {
    checkMediaBackendHealth().then((ok) => {
      backendAvailable.current = ok;
      if (ok) console.log('[Media Pipeline] Backend available');
    });
    return () => disconnectMediaPipeline();
  }, []);

  /**
   * Captures frames via cloud pipeline if available, otherwise local WebWorker.
   * Returns base64 JPEG strings (same format as local capture).
   */
  const captureFrames = useCallback(
    async (
      videoUrl: string,
      start: number,
      end: number,
      maxFrames: number = 30,
      onProgress?: ProgressCallback,
    ): Promise<string[]> => {
      // If backend not available or not checked yet, use local
      if (!backendAvailable.current) {
        return localCaptureFrames(start, end, maxFrames);
      }

      try {
        const frameInterval = Math.max(1, (end - start) / maxFrames);
        const job = await submitMediaJob(
          videoUrl,
          `capture-${Date.now()}`,
          {frameInterval, extractAudio: false, transcribe: false},
          (update) => {
            activeJobRef.current = update;
            onProgress?.(update);
          },
        );

        activeJobRef.current = job;

        // Wait for completion (poll if no WebSocket)
        let result = job;
        while (result.status === 'queued' || result.status === 'processing') {
          await new Promise((r) => setTimeout(r, 2000));
          const {getJobStatus} = await import('../lib/media-pipeline');
          result = await getJobStatus(result.jobId);
          activeJobRef.current = result;
        }

        if (result.status === 'completed' && result.frames) {
          return result.frames.map((f) => f.imageData);
        }

        // Cloud failed — fall back to local
        console.warn('[Media Pipeline] Cloud processing failed, using local fallback');
        return localCaptureFrames(start, end, maxFrames);
      } catch (err) {
        console.warn('[Media Pipeline] Error, using local fallback:', err);
        backendAvailable.current = false;
        return localCaptureFrames(start, end, maxFrames);
      }
    },
    [localCaptureFrames],
  );

  /**
   * Returns current processing job status (for UI progress display).
   */
  const getActiveJob = useCallback(() => activeJobRef.current, []);

  return {captureFrames, getActiveJob};
}
