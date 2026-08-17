import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return <VirtuosoDoc
    label="Agent"
    name="The Analyst"
    file="src/api/virtuosos/analyst.ts"
    model="gemini-2.5-pro"
    capabilities={['reasoning', 'data-extraction', 'synthesis', 'course-generation']}
    configNote="Uses Gemini's thinkingConfig with includeThinkingProcess: true for transparent chain-of-thought reasoning. Course generation uses responseMimeType: 'application/json' with a detailed responseSchema for structured output."
    description="The Analyst performs structured reasoning, data extraction, and generates adaptive courses from video content. It produces JSON-structured output with summaries, key moments, and quizzes, all linked to video timecodes."
    apiSignatures={`// Generate structured course from video frames
async function generateCourseModules(
  frames: string[]  // base64 JPEG frames
): Promise<{
  summary: Array<{ time: string; text: string }>;
  keyMoments: Array<{ time: string; text: string }>;
  quiz: Array<{
    question: string;
    options: string[];
    answer: string;
    explanation: string;
    time: string;  // "HH:MM:SS"
  }>;
}>`}
  />;
}