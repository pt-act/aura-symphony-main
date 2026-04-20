/**
 * CRDT Collaboration Tests
 *
 * Validates Yjs-based collaboration: session lifecycle, shared data
 * operations, merge convergence, and undo/redo.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  CollaborationSession,
  getCollaborationSession,
  destroyCollaborationSession,
  destroyAllSessions,
  listActiveSessions,
  pickColor,
  PEER_COLORS,
} from '../lib/crdt-collaboration';

afterEach(() => {
  destroyAllSessions();
});

// ─── Session Lifecycle ─────────────────────────────────────────────────

describe('CollaborationSession lifecycle', () => {
  it('creates a session with a room ID', () => {
    const session = new CollaborationSession('test-room');
    expect(session.roomId).toBe('test-room');
    expect(session.destroyed).toBe(false);
    session.destroy();
  });

  it('destroys a session', () => {
    const session = new CollaborationSession('test-room');
    session.destroy();
    expect(session.destroyed).toBe(true);
  });

  it('initializes all shared types', () => {
    const session = new CollaborationSession('test-room');
    expect(session.annotations).toBeDefined();
    expect(session.insights).toBeDefined();
    expect(session.dlp).toBeDefined();
    expect(session.chat).toBeDefined();
    expect(session.cursors).toBeDefined();
    expect(session.metadata).toBeDefined();
    session.destroy();
  });
});

// ─── Annotation Operations ─────────────────────────────────────────────

describe('Annotation operations', () => {
  it('adds an annotation', () => {
    const session = new CollaborationSession('test');
    session.addAnnotation(10.5, 'Test annotation', 'user-1');
    const annotations = session.getAnnotations();
    expect(annotations).toHaveLength(1);
    expect(annotations[0].time).toBe(10.5);
    expect(annotations[0].text).toBe('Test annotation');
    expect(annotations[0].userId).toBe('user-1');
    session.destroy();
  });

  it('removes an annotation by ID', () => {
    const session = new CollaborationSession('test');
    session.addAnnotation(5, 'First');
    session.addAnnotation(10, 'Second');
    const annotations = session.getAnnotations();
    const firstId = annotations[0].id;

    session.removeAnnotation(firstId);
    expect(session.getAnnotations()).toHaveLength(1);
    expect(session.getAnnotations()[0].text).toBe('Second');
    session.destroy();
  });
});

// ─── DLP Operations ─────────────────────────────────────────────────────

describe('DLP operations', () => {
  it('sets and gets concept mastery', () => {
    const session = new CollaborationSession('test');
    session.setConceptMastery('algebra', { pMastery: 0.8 });
    const mastery = session.getConceptMastery('algebra');
    expect(mastery.pMastery).toBe(0.8);
    session.destroy();
  });

  it('gets all masteries', () => {
    const session = new CollaborationSession('test');
    session.setConceptMastery('algebra', { pMastery: 0.8 });
    session.setConceptMastery('geometry', { pMastery: 0.5 });
    const all = session.getAllMasteries();
    expect(Object.keys(all)).toHaveLength(2);
    session.destroy();
  });
});

// ─── Chat Operations ────────────────────────────────────────────────────

describe('Chat operations', () => {
  it('adds and retrieves chat messages', () => {
    const session = new CollaborationSession('test');
    session.addChatMessage({ role: 'user', text: 'Hello', userId: 'u1' });
    session.addChatMessage({ role: 'model', text: 'Hi there!' });
    const history = session.getChatHistory();
    expect(history).toHaveLength(2);
    expect(history[0].text).toBe('Hello');
    session.destroy();
  });
});

// ─── CRDT Merge Convergence ─────────────────────────────────────────────

describe('CRDT merge convergence', () => {
  it('merges two independent sessions to the same state', () => {
    const session1 = new CollaborationSession('room-a');
    const session2 = new CollaborationSession('room-b');

    session1.addAnnotation(5, 'From session 1');
    session2.addAnnotation(10, 'From session 2');

    // Merge session2 into session1
    session1.mergeFrom(session2);

    const annotations = session1.getAnnotations();
    expect(annotations).toHaveLength(2);

    session1.destroy();
    session2.destroy();
  });

  it('handles concurrent edits without conflict', () => {
    const session1 = new CollaborationSession('room-c');
    const session2 = new CollaborationSession('room-d');

    // Both add annotations at the same time
    session1.addAnnotation(5, 'Note A');
    session2.addAnnotation(5, 'Note B');

    session1.mergeFrom(session2);
    const merged = session1.getAnnotations();
    expect(merged).toHaveLength(2);

    session1.destroy();
    session2.destroy();
  });
});

// ─── State Export/Import ────────────────────────────────────────────────

describe('State export/import', () => {
  it('exports and imports state', () => {
    const session1 = new CollaborationSession('export-test');
    session1.addAnnotation(1, 'Test');
    session1.setConceptMastery('math', { pMastery: 0.9 });

    const exported = session1.exportState();
    expect(exported).toBeInstanceOf(Uint8Array);
    expect(exported.length).toBeGreaterThan(0);

    const session2 = new CollaborationSession('import-test');
    session2.importState(exported);

    expect(session2.getAnnotations()).toHaveLength(1);
    expect(session2.getConceptMastery('math').pMastery).toBe(0.9);

    session1.destroy();
    session2.destroy();
  });
});

// ─── Metadata ───────────────────────────────────────────────────────────

describe('Metadata', () => {
  it('sets and gets metadata', () => {
    const session = new CollaborationSession('meta-test');
    session.setMetadata({ title: 'My Session', createdBy: 'user-1' });

    const meta = session.getMetadata();
    expect(meta.title).toBe('My Session');
    expect(meta.createdBy).toBe('user-1');
    session.destroy();
  });
});

// ─── Session Manager ────────────────────────────────────────────────────

describe('Session Manager', () => {
  it('creates and retrieves sessions', () => {
    const session = getCollaborationSession('managed-1', false);
    expect(session.roomId).toBe('managed-1');
    expect(listActiveSessions()).toContain('managed-1');
  });

  it('returns the same session for the same room', () => {
    const s1 = getCollaborationSession('same-room', false);
    const s2 = getCollaborationSession('same-room', false);
    expect(s1).toBe(s2);
  });

  it('destroys a specific session', () => {
    getCollaborationSession('to-destroy', false);
    destroyCollaborationSession('to-destroy');
    expect(listActiveSessions()).not.toContain('to-destroy');
  });

  it('destroys all sessions', () => {
    getCollaborationSession('a', false);
    getCollaborationSession('b', false);
    destroyAllSessions();
    expect(listActiveSessions()).toHaveLength(0);
  });
});

// ─── Peer Colors ────────────────────────────────────────────────────────

describe('pickColor', () => {
  it('returns a color from the palette', () => {
    const color = pickColor('user-1');
    expect(PEER_COLORS).toContain(color);
  });

  it('returns consistent color for the same user', () => {
    expect(pickColor('user-1')).toBe(pickColor('user-1'));
  });

  it('returns different colors for different users', () => {
    const colors = new Set(['alice', 'bob', 'charlie', 'david'].map(pickColor));
    expect(colors.size).toBeGreaterThan(1);
  });
});

// ─── Change Events ──────────────────────────────────────────────────────

describe('Change events', () => {
  it('emits change events on annotation add', () => {
    const session = new CollaborationSession('event-test');
    const events: any[] = [];
    session.onChange((e) => events.push(e));

    session.addAnnotation(5, 'Test');
    expect(events.length).toBeGreaterThan(0);
    expect(events.some((e) => e.type === 'annotation')).toBe(true);
    session.destroy();
  });

  it('unsubscribes from change events', () => {
    const session = new CollaborationSession('unsub-test');
    const events: any[] = [];
    const unsub = session.onChange((e) => events.push(e));

    unsub();
    session.addAnnotation(5, 'After unsub');
    expect(events).toHaveLength(0);
    session.destroy();
  });
});