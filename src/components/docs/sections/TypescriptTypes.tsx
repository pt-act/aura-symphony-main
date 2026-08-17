import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Data</span>
      <h2>TypeScript Interfaces</h2>
      <div className="markdown-body">
        <p><FileRef path="src/types.ts" /></p>
        <CodeBlock code={`// Core content types
interface Annotation { id: number; time: number; text: string; }

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  file?: ChatMessageFile;
}

interface ChatMessageFile {
  name: string; mimeType: string; data: string; dataUrl: string;
}

// Digital Learner Profile
interface DigitalLearnerProfile {
  knowledgeGraph: {
    [concept: string]: { mastery: number; lastUpdated: string; };
  };
}

// Insight card (analysis results)
interface Insight {
  id: number;
  title: string;
  type: Mode | 'Chat' | 'Annotations' | 'DLP' | 'Quiz' | 'Create Course';
  data: InsightData;   // Discriminated union (see below)
  isList: boolean;
  isLoading: boolean;
}

// Discriminated union for insight data
type InsightData =
  | ChatMessage[] | QuizQuestion[] | DigitalLearnerProfile
  | Annotation[] | string
  | { timecodes: Array<{ time: number; text: string }> }
  | Record<string, unknown> | null;

// Quiz
interface QuizQuestion {
  question: string; options: string[];
  answer: string; explanation: string; time: string;
}

// Presentations (Creator Studio)
interface Slide {
  id: string; content: string; speakerNotes: string;
  backgroundImage: string | null; backgroundColor: string;
}

interface Presentation {
  id?: string; userId: string; name: string;
  slides: Slide[]; createdAt: FieldValue | string | null;
  lastUpdated: FieldValue | string | null;
}`} />
      </div>
    </div>
  );
}