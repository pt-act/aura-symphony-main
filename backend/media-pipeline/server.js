/**
 * Aura Media Pipeline Service
 *
 * Handles heavy media processing offloaded from the browser:
 * - Frame extraction from video (via FFmpeg)
 * - Audio extraction and transcription prep
 * - Progress reporting via WebSocket
 *
 * Endpoints:
 *   POST /jobs          — Submit a video processing job
 *   GET  /jobs/:id      — Get job status
 *   GET  /health        — Service health check
 *   WebSocket :3003     — Real-time progress updates
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';
import { execFile } from 'child_process';
import { mkdir, stat, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { createServer } from 'http';

const PORT = parseInt(process.env.PORT || '3002');
const WS_PORT = parseInt(process.env.WS_PORT || '3003');
const TEMP_DIR = process.env.TEMP_DIR || '/tmp/aura-media';

// ─── Job Store ─────────────────────────────────────────────────────

const jobs = new Map();

/** @typedef {'queued'|'processing'|'completed'|'failed'} JobStatus */

/**
 * @typedef {Object} Job
 * @property {string} jobId
 * @property {string} videoId
 * @property {JobStatus} status
 * @property {number} progress
 * @property {Array} frames
 * @property {string} transcript
 * @property {string} error
 */

function createJob(videoUrl, videoId, options) {
  const jobId = randomUUID();
  const job = {
    jobId,
    videoId,
    status: 'queued',
    progress: 0,
    frames: [],
    transcript: null,
    error: null,
    videoUrl,
    options: {
      frameInterval: options.frameInterval || 1,
      extractAudio: options.extractAudio ?? true,
      transcribe: options.transcribe ?? true,
    },
    createdAt: Date.now(),
  };
  jobs.set(jobId, job);
  return job;
}

// ─── WebSocket ─────────────────────────────────────────────────────

const wsClients = new Map(); // jobId -> Set<ws>

const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `ws://localhost:${WS_PORT}`);
  const jobId = url.searchParams.get('jobId');

  if (jobId) {
    if (!wsClients.has(jobId)) wsClients.set(jobId, new Set());
    wsClients.get(jobId).add(ws);

    // Send current status immediately
    const job = jobs.get(jobId);
    if (job) {
      ws.send(JSON.stringify({ jobId, status: job.status, progress: job.progress }));
    }

    ws.on('close', () => {
      wsClients.get(jobId)?.delete(ws);
    });
  }
});

function broadcastProgress(jobId, data) {
  const clients = wsClients.get(jobId);
  if (clients) {
    const message = JSON.stringify({ jobId, ...data });
    for (const ws of clients) {
      if (ws.readyState === 1) ws.send(message);
    }
  }
}

// ─── Processing ────────────────────────────────────────────────────

async function processJob(job) {
  job.status = 'processing';
  broadcastProgress(job.jobId, { status: 'processing', progress: 0 });

  const jobDir = join(TEMP_DIR, job.jobId);
  await mkdir(jobDir, { recursive: true });

  try {
    // Step 1: Extract frames using FFmpeg
    const frameInterval = job.options.frameInterval;
    const framePattern = join(jobDir, 'frame_%04d.jpg');

    await execFFmpeg([
      '-i', job.videoUrl,
      '-vf', `fps=1/${frameInterval}`,
      '-q:v', '2',
      '-frames:v', '100', // Max 100 frames
      framePattern,
    ]);

    job.progress = 50;
    broadcastProgress(job.jobId, { status: 'processing', progress: 50 });

    // Collect extracted frames
    const { readdir, readFile } = await import('fs/promises');
    const files = await readdir(jobDir);
    const frameFiles = files.filter(f => f.startsWith('frame_') && f.endsWith('.jpg')).sort();

    job.frames = [];
    for (let i = 0; i < frameFiles.length; i++) {
      const framePath = join(jobDir, frameFiles[i]);
      const imageData = await readFile(framePath, { encoding: 'base64' });
      const timestamp = i * frameInterval;
      job.frames.push({ timestamp, imageData: `data:image/jpeg;base64,${imageData}` });

      job.progress = 50 + Math.floor((i / frameFiles.length) * 40);
      broadcastProgress(job.jobId, { status: 'processing', progress: job.progress });
    }

    // Step 2: Extract audio if requested
    if (job.options.extractAudio) {
      const audioPath = join(jobDir, 'audio.wav');
      try {
        await execFFmpeg([
          '-i', job.videoUrl,
          '-vn',
          '-acodec', 'pcm_s16le',
          '-ar', '16000',
          '-ac', '1',
          audioPath,
        ]);
        job.progress = 95;
        broadcastProgress(job.jobId, { status: 'processing', progress: 95 });
      } catch (e) {
        console.warn(`[Pipeline] Audio extraction failed for ${job.jobId}: ${e.message}`);
      }
    }

    job.status = 'completed';
    job.progress = 100;
    broadcastProgress(job.jobId, {
      status: 'completed',
      progress: 100,
      frameCount: job.frames.length,
    });

  } catch (error) {
    job.status = 'failed';
    job.error = error.message;
    broadcastProgress(job.jobId, { status: 'failed', error: error.message });
  } finally {
    // Cleanup temp files
    rm(jobDir, { recursive: true, force: true }).catch(() => {});
  }
}

function execFFmpeg(args) {
  return new Promise((resolve, reject) => {
    execFile('ffmpeg', ['-y', ...args], { timeout: 300_000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`FFmpeg error: ${stderr?.slice(0, 500) || error.message}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

// ─── Express App ───────────────────────────────────────────────────

const app = express();
app.use(express.json());

// CORS
import { corsMiddleware } from '../shared/cors.js';
app.use(corsMiddleware());

app.post('/jobs', async (req, res) => {
  const { videoUrl, videoId, frameInterval, extractAudio, transcribe } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: 'videoUrl is required' });
  }

  const job = createJob(videoUrl, videoId || `video-${Date.now()}`, {
    frameInterval,
    extractAudio,
    transcribe,
  });

  // Process asynchronously
  processJob(job);

  res.status(202).json({
    jobId: job.jobId,
    videoId: job.videoId,
    status: job.status,
  });
});

app.get('/jobs/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    jobId: job.jobId,
    videoId: job.videoId,
    status: job.status,
    progress: job.progress,
    frameCount: job.frames?.length || 0,
    error: job.error,
  });
});

app.get('/jobs/:id/frames', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    jobId: job.jobId,
    frames: job.frames || [],
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeJobs: [...jobs.values()].filter(j => j.status === 'processing').length,
    totalJobs: jobs.size,
  });
});

app.listen(PORT, () => {
  console.log(`[Media Pipeline] HTTP on :${PORT}`);
  console.log(`[Media Pipeline] WebSocket on :${WS_PORT}`);
  console.log(`[Media Pipeline] Temp dir: ${TEMP_DIR}`);
});
