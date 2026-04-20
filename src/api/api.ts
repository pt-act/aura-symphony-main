/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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