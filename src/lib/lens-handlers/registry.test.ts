/**
 * Lens Handler Registry Tests
 *
 * Verifies the Strategy pattern: correct handler resolution,
 * fallback behavior, and runtime registration.
 */

import {describe, it, expect} from 'vitest';
import {resolveHandler, listHandlerNames, registerHandler} from './registry';
import {videoAnalysisHandler} from './video-analysis-handler';
import type {LensHandler} from './types';

describe('Lens Handler Registry', () => {
  describe('resolveHandler', () => {
    it('resolves PDF Analysis to pdfHandler', () => {
      const handler = resolveHandler('PDF Analysis');
      expect(handler.names).toContain('PDF Analysis');
    });

    it('resolves Chat to chatHandler', () => {
      const handler = resolveHandler('Chat');
      expect(handler.names).toContain('Chat');
    });

    it('resolves Generate Video to generateVideoHandler', () => {
      const handler = resolveHandler('Generate Video');
      expect(handler.names).toContain('Generate Video');
    });

    it('resolves Generate Image to generateImageHandler', () => {
      const handler = resolveHandler('Generate Image');
      expect(handler.names).toContain('Generate Image');
    });

    it('resolves Edit Image to editImageHandler', () => {
      const handler = resolveHandler('Edit Image');
      expect(handler.names).toContain('Edit Image');
    });

    it('resolves Web Search to webSearchHandler', () => {
      const handler = resolveHandler('Web Search');
      expect(handler.names).toContain('Web Search');
    });

    it('resolves Transcribe Audio to transcribeAudioHandler', () => {
      const handler = resolveHandler('Transcribe Audio');
      expect(handler.names).toContain('Transcribe Audio');
    });

    it('resolves Curate Course to courseHandler', () => {
      const handler = resolveHandler('Curate Course');
      expect(handler.names).toContain('Curate Course');
    });

    it('falls back to videoAnalysisHandler for unknown modes', () => {
      const handler = resolveHandler('Deep Analysis');
      expect(handler).toBe(videoAnalysisHandler);
    });

    it('falls back to videoAnalysisHandler for custom virtuosos', () => {
      const handler = resolveHandler('custom_cinematographer');
      expect(handler).toBe(videoAnalysisHandler);
    });
  });

  describe('listHandlerNames', () => {
    it('returns all registered handler names', () => {
      const names = listHandlerNames();
      expect(names).toContain('PDF Analysis');
      expect(names).toContain('Chat');
      expect(names).toContain('Generate Video');
      expect(names).toContain('Web Search');
      expect(names).toContain('Curate Course');
      expect(names.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('registerHandler', () => {
    it('registers a new handler at runtime', () => {
      const customHandler: LensHandler = {
        names: ['Test Custom Handler'],
        async execute() {},
      };

      registerHandler(customHandler);

      const resolved = resolveHandler('Test Custom Handler');
      expect(resolved).toBe(customHandler);
    });
  });
});