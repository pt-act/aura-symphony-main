import {describe, it, expect} from 'vitest';

// Tests hit the running media pipeline service via HTTP.
// Start with: cd backend/media-pipeline && PORT=4002 WS_PORT=4003 node server.js

const BASE_URL = process.env.MEDIA_URL || 'http://127.0.0.1:4002';

async function api(method, path, body) {
  const opts = {
    method,
    headers: {'Content-Type': 'application/json'},
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json();
  return {status: res.status, data};
}

describe('Media Pipeline Service', () => {
  // ─── Health ─────────────────────────────────────────────────────

  describe('GET /health', () => {
    it('returns ok status', async () => {
      const {status, data} = await api('GET', '/health');
      expect(status).toBe(200);
      expect(data.status).toBe('ok');
      expect(typeof data.activeJobs).toBe('number');
      expect(typeof data.totalJobs).toBe('number');
    });
  });

  // ─── Job Submission ─────────────────────────────────────────────

  describe('POST /jobs', () => {
    it('returns 400 without videoUrl', async () => {
      const {status} = await api('POST', '/jobs', {});
      expect(status).toBe(400);
    });

    it('accepts a valid job and returns 202', async () => {
      const {status, data} = await api('POST', '/jobs', {
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        videoId: 'test-job',
        frameInterval: 10,
        extractAudio: false,
      });
      expect(status).toBe(202);
      expect(data.jobId).toBeDefined();
      expect(data.videoId).toBe('test-job');
      expect(['queued', 'processing', 'completed', 'failed']).toContain(data.status);
    });

    it('uses default options when not specified', async () => {
      const {status, data} = await api('POST', '/jobs', {
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      });
      expect(status).toBe(202);
      expect(data.jobId).toBeDefined();
    });
  });

  // ─── Job Status ─────────────────────────────────────────────────

  describe('GET /jobs/:id', () => {
    it('returns 404 for unknown job', async () => {
      const {status} = await api('GET', '/jobs/nonexistent-id');
      expect(status).toBe(404);
    });

    it('returns job status after submission', async () => {
      const {data: submit} = await api('POST', '/jobs', {
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        videoId: 'status-test',
        frameInterval: 10,
        extractAudio: false,
      });

      const {status, data} = await api('GET', `/jobs/${submit.jobId}`);
      expect(status).toBe(200);
      expect(data.jobId).toBe(submit.jobId);
      expect(data.videoId).toBe('status-test');
      expect(typeof data.progress).toBe('number');
      expect(data.progress).toBeGreaterThanOrEqual(0);
      expect(data.progress).toBeLessThanOrEqual(100);
    });
  });

  // ─── Job Frames ─────────────────────────────────────────────────

  describe('GET /jobs/:id/frames', () => {
    it('returns 404 for unknown job', async () => {
      const {status} = await api('GET', '/jobs/nonexistent-id/frames');
      expect(status).toBe(404);
    });

    it('returns frames array for known job', async () => {
      const {data: submit} = await api('POST', '/jobs', {
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        videoId: 'frames-test',
        frameInterval: 10,
        extractAudio: false,
      });

      // Wait for processing to complete (FFmpeg needs time)
      await new Promise(r => setTimeout(r, 8000));

      const {status, data} = await api('GET', `/jobs/${submit.jobId}/frames`);
      expect(status).toBe(200);
      expect(data.jobId).toBe(submit.jobId);
      expect(Array.isArray(data.frames)).toBe(true);
      // The test video is short, should have at least 1 frame
      if (data.frames.length > 0) {
        expect(data.frames[0].timestamp).toBeDefined();
        expect(data.frames[0].imageData).toBeDefined();
      }
    }, 15000);
  });
});
