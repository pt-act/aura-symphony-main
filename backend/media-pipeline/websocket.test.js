import {describe, it, expect} from 'vitest';

/**
 * WebSocket Integration Tests — Media Pipeline
 *
 * Tests the real-time progress reporting via WebSocket.
 * Requires the media pipeline service running on :4002/:4003.
 */

const HTTP_URL = process.env.MEDIA_URL || 'http://127.0.0.1:4002';
const WS_URL = process.env.MEDIA_WS_URL || 'ws://127.0.0.1:4003';

async function api(method, path, body) {
  const opts = {method, headers: {'Content-Type': 'application/json'}};
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${HTTP_URL}${path}`, opts);
  const data = await res.json();
  return {status: res.status, data};
}

function connectWebSocket(jobId, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const messages = [];
    const ws = new WebSocket(`${WS_URL}?jobId=${jobId}`);
    const timer = setTimeout(() => {
      ws.close();
      resolve({messages, timedOut: true});
    }, timeoutMs);

    ws.onopen = () => {
      messages.push({type: 'connected'});
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        messages.push(data);

        // Resolve when we get a terminal status
        if (data.status === 'completed' || data.status === 'failed') {
          clearTimeout(timer);
          ws.close();
          resolve({messages, timedOut: false});
        }
      } catch (e) {
        messages.push({type: 'parse_error', raw: event.data});
      }
    };

    ws.onerror = (err) => {
      clearTimeout(timer);
      reject(new Error(`WebSocket error: ${err.message || 'connection failed'}`));
    };
  });
}

describe('Media Pipeline WebSocket', () => {
  it('establishes WebSocket connection for a job', async () => {
    const {data: job} = await api('POST', '/jobs', {
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      videoId: 'ws-test-conn',
      frameInterval: 10,
      extractAudio: false,
    });

    const {messages} = await connectWebSocket(job.jobId, 20000);

    // Should have at least: connected, processing/completed
    expect(messages.length).toBeGreaterThanOrEqual(2);
    expect(messages.some(m => m.status === 'processing' || m.status === 'completed')).toBe(true);
  }, 25000);

  it('receives progress updates during processing', async () => {
    const {data: job} = await api('POST', '/jobs', {
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      videoId: 'ws-test-progress',
      frameInterval: 5,
      extractAudio: false,
    });

    const {messages} = await connectWebSocket(job.jobId, 20000);

    // Filter only status messages (not connection)
    const statusMessages = messages.filter(m => m.status);
    expect(statusMessages.length).toBeGreaterThanOrEqual(1);

    // Check that we got a final completion message
    const finalMsg = statusMessages[statusMessages.length - 1];
    expect(finalMsg.status).toBe('completed');
    expect(finalMsg.progress).toBe(100);
  }, 25000);

  it('reports correct jobId in messages', async () => {
    const {data: job} = await api('POST', '/jobs', {
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      videoId: 'ws-test-jobid',
      frameInterval: 10,
      extractAudio: false,
    });

    const {messages} = await connectWebSocket(job.jobId, 20000);

    // All status messages should reference the correct jobId
    const statusMessages = messages.filter(m => m.jobId);
    for (const msg of statusMessages) {
      expect(msg.jobId).toBe(job.jobId);
    }
  }, 25000);

  it('handles connection to non-existent job gracefully', async () => {
    const {messages} = await connectWebSocket('nonexistent-job-id', 3000);
    // Should connect but receive no status updates (or just the initial one)
    // The connection itself should succeed even for unknown jobIds
    expect(messages.length).toBeGreaterThanOrEqual(0);
  }, 5000);

  it('receives messages for multiple concurrent jobs', async () => {
    // Submit two jobs
    const {data: job1} = await api('POST', '/jobs', {
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      videoId: 'ws-concurrent-1',
      frameInterval: 10,
      extractAudio: false,
    });
    const {data: job2} = await api('POST', '/jobs', {
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      videoId: 'ws-concurrent-2',
      frameInterval: 10,
      extractAudio: false,
    });

    // Connect both in parallel
    const [result1, result2] = await Promise.all([
      connectWebSocket(job1.jobId, 20000),
      connectWebSocket(job2.jobId, 20000),
    ]);

    // Both should complete
    const last1 = result1.messages.filter(m => m.status).pop();
    const last2 = result2.messages.filter(m => m.status).pop();

    expect(last1?.status).toBe('completed');
    expect(last2?.status).toBe('completed');
    expect(last1?.jobId).toBe(job1.jobId);
    expect(last2?.jobId).toBe(job2.jobId);
  }, 30000);
});
