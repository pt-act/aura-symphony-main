/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
export {runConductorQuery, runChat} from './virtuosos/conductor';
export {runPdfQuery, runVideoQuery} from './virtuosos/visionary';
export {generateVideo, generateImage, editImage} from './virtuosos/artisan';
export {runSearchGroundedQuery} from './virtuosos/scholar';
export {generateCourseModules} from './virtuosos/analyst';
export {generateSpeech, transcribeAudio} from './virtuosos/chronicler';

// ─── Streaming APIs ──────────────────────────────────────────────────
export {
  streamPdfQuery,
  streamSearchQuery,
  streamChat,
  streamVideoAnalysis,
  streamCourseGeneration,
  streamTranscription,
  createStreamController,
  type StreamChunkCallback,
  type StreamOptions,
} from './streaming';