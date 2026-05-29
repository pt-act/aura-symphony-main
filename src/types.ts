/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
import type modes from './lib/modes';
import type {FieldValue} from 'firebase/firestore';

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

/** Discriminated union for Insight data types. */
export type InsightData =
  | ChatMessage[]
  | QuizQuestion[]
  | DigitalLearnerProfile
  | Annotation[]
  | string
  | {timecodes: Array<{time: number; text: string}>}
  | Record<string, unknown>
  | null;

export interface Insight {
  id: number;
  title: string;
  type: Mode | 'Chat' | 'Annotations' | 'DLP' | 'Quiz' | 'Create Course';
  data: InsightData;
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
  createdAt: FieldValue | string | null;
  lastUpdated: FieldValue | string | null;
}