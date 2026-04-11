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

import type modes from './lib/modes';

export type Mode = keyof typeof modes;

export interface Annotation {
  id: number;
  time: number;
  text: string;
}

export interface ChatMessageFile {
  name: string;
  mimeType: string;
  data: string;
  dataUrl: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  file?: ChatMessageFile;
}

export interface DigitalLearnerProfile {
  knowledgeGraph: {
    [concept: string]: {
      mastery: number;
      lastUpdated: string;
    };
  };
}

export interface Insight {
  id: number;
  title: string;
  type: Mode | 'Chat' | 'Annotations' | 'DLP' | 'Quiz' | 'Create Course';
  data: any;
  isList: boolean;
  isLoading: boolean;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  time: string;
}

export interface Slide {
  id: string;
  content: string;
  speakerNotes: string;
  backgroundImage: string | null;
  backgroundColor: string;
}

export interface Presentation {
  id?: string;
  userId: string;
  name: string;
  slides: Slide[];
  createdAt: any; // Or a more specific Firestore timestamp type
  lastUpdated: any; // Or a more specific Firestore timestamp type
}