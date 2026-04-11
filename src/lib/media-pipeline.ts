/**
 * Media Pipeline Service
 *
 * Client-side interface for cloud-based media processing.
 * Offloads frame extraction, audio transcription, and heavy I/O
 * from the browser's WebWorker to a backend service.
 *
 * Architecture:
 *   Client → signed URL → Backend (FFmpeg on Cloud Run)
 *   Backend → WebSocket → Client (progress updates)
 *   Backend → Firestore → Client (final results)
 *
 * Falls back to local WebWorker if backend unavailable.
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface MediaProcessingJob {
  jobId: string;
  videoId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  frames?: ExtractedFrame[];
  transcript?: string;
  error?: string;
}

export interface ExtractedFrame {
  timestamp: number; // seconds
  imageData: string; // base64 JPEG
}

export type ProgressCallback = (job: MediaProcessingJob) => void;

// ─── Configuration ───────────────────────────────────────────────────

const MEDIA_BACKEND_URL =
  import.meta.env.VITE_MEDIA_BACKEND_URL || '';

// ─── WebSocket connection ────────────────────────────────────────────

let wsConnection: WebSocket | null = null;
const progressListeners = new Map<string, ProgressCallback>();

function connectWebSocket(jobId: string, onProgress: ProgressCallback): WebSocket {
  if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
    progressListeners.set(jobId, onProgress);
    return wsConnection;
  }

  const wsUrl = MEDIA_BACKEND_URL.replace(/^http/, 'ws') + '/ws';
  const ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const listener = progressListeners.get(data.jobId);
      if (listener) {
        listener(data);
        if (data.status === 'completed' || data.status === 'failed') {
          progressListeners.delete(data.jobId);
        }
      }
    } catch (err) {
      console.error('[Media Pipeline] WS parse error:', err);
    }
  };

  ws.onclose = () => {
    wsConnection = null;
    // Attempt reconnect if there are active listeners
    if (progressListeners.size > 0) {
      setTimeout(() => {
        const firstJob = progressListeners.keys().next().value;
        if (firstJob) {
          const cb = progressListeners.get(firstJob)!;
          connectWebSocket(firstJob, cb);
        }
      }, 2000);
    }
  };

  wsConnection = ws;
  progressListeners.set(jobId, onProgress);
  return ws;
}

// ─── Job submission ──────────────────────────────────────────────────

/**
 * Submits a video for cloud processing.
 *
 * @param videoUrl - Signed URL or public URL of the video
 * @param videoId - Video identifier
 * @param options - Processing options
 * @param onProgress - Callback for progress updates
 * @returns Promise resolving to the completed job
 */
export async function submitMediaJob(
  videoUrl: string,
  videoId: string,
  options: {
    frameInterval?: number; // seconds between frame extractions
    extractAudio?: boolean;
    transcribe?: boolean;
  } = {},
  onProgress?: ProgressCallback
): Promise<MediaProcessingJob> {
  if (!MEDIA_BACKEND_URL) {
    throw new Error('Media backend not configured');
  }

  // Submit job
  const response = await fetch(`${MEDIA_BACKEND_URL}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      videoUrl,
      videoId,
      frameInterval: options.frameInterval || 1,
      extractAudio: options.extractAudio ?? true,
      transcribe: options.transcribe ?? true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Media job submission failed: ${response.status}`);
  }

  const job: MediaProcessingJob = await response.json();

  // Connect WebSocket for progress
  if (onProgress) {
    connectWebSocket(job.jobId, onProgress);
  }

  return job;
}

/**
 * Polls a job status (alternative to WebSocket).
 */
export async function getJobStatus(jobId: string): Promise<MediaProcessingJob> {
  const response = await fetch(`${MEDIA_BACKEND_URL}/jobs/${jobId}`);
  if (!response.ok) {
    throw new Error(`Failed to get job status: ${response.status}`);
  }
  return response.json();
}

// ─── Health check ────────────────────────────────────────────────────

export async function checkMediaBackendHealth(): Promise<boolean> {
  if (!MEDIA_BACKEND_URL) return false;

  try {
    const response = await fetch(`${MEDIA_BACKEND_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ─── Cleanup ─────────────────────────────────────────────────────────

export function disconnectMediaPipeline(): void {
  if (wsConnection) {
    wsConnection.close();
    wsConnection = null;
  }
  progressListeners.clear();
}
