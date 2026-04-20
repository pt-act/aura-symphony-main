import {describe, it, expect} from 'vitest';

const BASE_URL = process.env.GRAPH_URL || 'http://127.0.0.1:4004';

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

const TEST_USER = 'vitest-user';

describe('Graph Knowledge Service', () => {
  // ─── Health ─────────────────────────────────────────────────────

  describe('GET /health', () => {
    it('returns ok status', async () => {
      const {status, data} = await api('GET', '/health');
      expect(status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.backend).toBeDefined();
      expect(typeof data.concepts).toBe('number');
      expect(typeof data.relationships).toBe('number');
    });
  });

  // ─── Relationships ──────────────────────────────────────────────

  describe('POST /relationships', () => {
    it('returns 400 without required fields', async () => {
      const {status} = await api('POST', '/relationships', {});
      expect(status).toBe(400);
    });

    it('creates a relationship between concepts', async () => {
      const {status} = await api('POST', '/relationships', {
        source: 'Python',
        target: 'Machine Learning',
        type: 'PREREQUISITE_OF',
        strength: 0.8,
        userId: TEST_USER,
      });
      expect(status).toBe(201);
    });

    it('is idempotent (upsert on duplicate)', async () => {
      const rel = {
        source: 'Linear Algebra',
        target: 'Machine Learning',
        type: 'PREREQUISITE_OF',
        strength: 0.9,
        userId: TEST_USER,
      };
      await api('POST', '/relationships', rel);
      const {status} = await api('POST', '/relationships', rel);
      expect(status).toBe(201);
    });
  });

  // ─── DLP Import ─────────────────────────────────────────────────

  describe('POST /import/dlp', () => {
    it('returns 400 without concepts or userId', async () => {
      const {status} = await api('POST', '/import/dlp', {});
      expect(status).toBe(400);
    });

    it('imports multiple concepts', async () => {
      const {status, data} = await api('POST', '/import/dlp', {
        concepts: [
          {name: 'Python', mastery: 0.9, lastStudied: '2026-04-15'},
          {name: 'Linear Algebra', mastery: 0.7, lastStudied: '2026-04-10'},
          {name: 'Statistics', mastery: 0.5, lastStudied: '2026-04-01'},
          {name: 'Machine Learning', mastery: 0.3, lastStudied: '2026-04-18'},
          {name: 'Deep Learning', mastery: 0.0, lastStudied: null},
        ],
        userId: TEST_USER,
      });
      expect(status).toBe(200);
      expect(data.imported).toBe(5);
      expect(data.errors).toBe(0);
    });
  });

  // ─── Related Concepts ───────────────────────────────────────────

  describe('GET /concepts/:name/related', () => {
    it('returns related concepts via graph traversal', async () => {
      // Ensure prerequisite relationships exist
      await api('POST', '/relationships', {
        source: 'Python', target: 'Machine Learning',
        type: 'PREREQUISITE_OF', strength: 0.8, userId: TEST_USER,
      });
      await api('POST', '/relationships', {
        source: 'Linear Algebra', target: 'Machine Learning',
        type: 'PREREQUISITE_OF', strength: 0.9, userId: TEST_USER,
      });
      await api('POST', '/relationships', {
        source: 'Machine Learning', target: 'Deep Learning',
        type: 'PREREQUISITE_OF', strength: 0.95, userId: TEST_USER,
      });

      const {status, data} = await api(
        'GET',
        `/concepts/Machine Learning/related?depth=2&userId=${TEST_USER}`,
      );
      expect(status).toBe(200);
      expect(Array.isArray(data.nodes)).toBe(true);
      expect(data.nodes.length).toBeGreaterThan(0);

      const nodeNames = data.nodes.map(n => n.name);
      expect(nodeNames).toContain('Python');
      expect(nodeNames).toContain('Linear Algebra');
      expect(nodeNames).toContain('Deep Learning');

      expect(typeof data.queryTimeMs).toBe('number');
    });

    it('respects depth parameter', async () => {
      const {data: d1} = await api('GET', `/concepts/Machine Learning/related?depth=1&userId=${TEST_USER}`);
      const {data: d2} = await api('GET', `/concepts/Machine Learning/related?depth=3&userId=${TEST_USER}`);
      // Deeper traversal should find same or more nodes
      expect(d2.nodes.length).toBeGreaterThanOrEqual(d1.nodes.length);
    });
  });

  // ─── Learning Path ──────────────────────────────────────────────

  describe('GET /learning-path', () => {
    it('returns 400 without target', async () => {
      const {status} = await api('GET', `/learning-path?userId=${TEST_USER}`);
      expect(status).toBe(400);
    });

    it('finds prerequisite gaps for a target concept', async () => {
      // Add prerequisite chain: Probability → Statistics → ML → Deep Learning
      await api('POST', '/relationships', {
        source: 'Probability', target: 'Statistics',
        type: 'PREREQUISITE_OF', strength: 0.9, userId: TEST_USER,
      });
      await api('POST', '/relationships', {
        source: 'Statistics', target: 'Machine Learning',
        type: 'PREREQUISITE_OF', strength: 0.8, userId: TEST_USER,
      });

      const {status, data} = await api(
        'GET',
        `/learning-path?target=Deep Learning&userId=${TEST_USER}`,
      );
      expect(status).toBe(200);
      expect(Array.isArray(data.gaps)).toBe(true);

      const gapNames = data.gaps.map(g => g.name);
      // Machine Learning mastery is 0.3 (< 0.8), should be a gap
      expect(gapNames).toContain('Machine Learning');
    });
  });

  // ─── User Concepts ──────────────────────────────────────────────

  describe('GET /users/:userId/concepts', () => {
    it('returns all concepts for a user', async () => {
      const {status, data} = await api('GET', `/users/${TEST_USER}/concepts`);
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(5);

      const python = data.find(c => c.name === 'Python');
      expect(python).toBeDefined();
      expect(python.mastery).toBe(0.9);
    });

    it('returns empty array for unknown user', async () => {
      const {status, data} = await api('GET', '/users/nonexistent-user/concepts');
      expect(status).toBe(200);
      expect(data).toEqual([]);
    });

    it('returns concepts sorted by mastery descending', async () => {
      const {data} = await api('GET', `/users/${TEST_USER}/concepts`);
      for (let i = 1; i < data.length; i++) {
        expect(data[i - 1].mastery).toBeGreaterThanOrEqual(data[i].mastery);
      }
    });
  });

  // ─── Stats ──────────────────────────────────────────────────────

  describe('GET /stats', () => {
    it('returns concept and relationship counts', async () => {
      const {status, data} = await api('GET', '/stats');
      expect(status).toBe(200);
      expect(typeof data.concepts).toBe('number');
      expect(typeof data.relationships).toBe('number');
      expect(data.concepts).toBeGreaterThan(0);
      expect(data.relationships).toBeGreaterThan(0);
    });
  });
});
