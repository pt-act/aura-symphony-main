/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Modality } from "@google/genai";
import type {FieldValue} from 'firebase/firestore';

export enum VirtuosoType {
  CONDUCTOR = "conductor",
  VISIONARY = "visionary", // Video/Image Analysis
  SCHOLAR = "scholar",     // Research/Search/Grounding
  ARTISAN = "artisan",     // Media Generation (Veo/Imagen)
  ANALYST = "analyst",     // Logic/Data/Reasoning
  CHRONICLER = "chronicler", // Documentation/Export/Summary
  CRITIC = "critic"        // Quality evaluation and feedback
}

/** Gemini config options used by Virtuosos. */
export interface VirtuosoConfig {
  tools?: Array<{googleSearch?: Record<string, unknown>}>;
  thinkingConfig?: {includeThinkingProcess?: boolean};
  [key: string]: unknown;
}

export interface VirtuosoProfile {
  id: VirtuosoType | string;
  name: string;
  title: string;
  model: string;
  description: string;
  systemInstruction: string;
  capabilities: string[];
  color: string;
  icon: string;
  config?: VirtuosoConfig;
  userId?: string;
  createdAt?: string | FieldValue;
}

export const VIRTUOSO_REGISTRY: Record<string, VirtuosoProfile> = {
  [VirtuosoType.CONDUCTOR]: {
    id: VirtuosoType.CONDUCTOR,
    name: "The Conductor",
    title: "Orchestra Lead",
    model: "gemini-2.5-pro",
    description: "Interprets user intent and delegates tasks to specialized Virtuosos.",
    systemInstruction: `You are the Conductor of the Aura Symphony.
    Your role is to interpret the user's natural language commands and delegate them to the appropriate specialized Virtuosos.
    Do not perform complex analysis yourself; instead, commission the specialists.
    Always maintain a professional, orchestral tone.`,
    capabilities: ["intent-parsing", "delegation", "orchestration"],
    color: "#8AB4F8",
    icon: "Music",
  },
  [VirtuosoType.VISIONARY]: {
    id: VirtuosoType.VISIONARY,
    name: "The Visionary",
    title: "Visual Analyst",
    model: "gemini-2.5-pro",
    description: "Specializes in deep multi-modal analysis of video and image content.",
    systemInstruction: `You are The Visionary. Your domain is the visual realm.
    When commissioned, perform exhaustive analysis of video frames or images.
    Focus on composition, color theory, motion, and hidden details.
    Your output should be structured as "Insights" for the Lens Laboratory.`,
    capabilities: ["video-analysis", "image-analysis", "object-detection"],
    color: "#F27D26",
    icon: "Eye",
  },
  [VirtuosoType.SCHOLAR]: {
    id: VirtuosoType.SCHOLAR,
    name: "The Scholar",
    title: "Research Specialist",
    model: "gemini-2.5-flash",
    description: "Utilizes Google Search and web grounding to provide real-world context.",
    systemInstruction: `You are The Scholar. Your domain is knowledge and grounding.
    Use Google Search to verify facts, find recent events, and provide external context to the media being analyzed.
    Always cite your sources with URLs.`,
    capabilities: ["web-search", "fact-checking", "grounding"],
    color: "#34A853",
    icon: "BookOpen",
    config: {
      tools: [{ googleSearch: {} }]
    }
  },
  [VirtuosoType.ARTISAN]: {
    id: VirtuosoType.ARTISAN,
    name: "The Artisan",
    title: "Media Creator",
    model: "veo-3.1-fast-generate-preview",
    description: "Crafts new media assets using generative video and image models.",
    systemInstruction: `You are The Artisan. Your domain is creation.
    When commissioned, use generative models to create or edit video and image content based on the Conductor's prompts.
    Focus on aesthetic quality and adherence to the creative vision.`,
    capabilities: ["video-generation", "image-generation", "media-editing"],
    color: "#A142F4",
    icon: "Palette",
  },
  [VirtuosoType.ANALYST]: {
    id: VirtuosoType.ANALYST,
    name: "The Analyst",
    title: "Logic Specialist",
    model: "gemini-2.5-pro",
    description: "Performs complex reasoning, data extraction, and logical synthesis.",
    systemInstruction: `You are The Analyst. Your domain is logic and structure.
    Perform deep reasoning on text data, extract structured information, and solve complex problems.
    Use high-level thinking to synthesize multiple insights into a cohesive whole.`,
    capabilities: ["reasoning", "data-extraction", "synthesis"],
    color: "#4285F4",
    icon: "Cpu",
    config: {
      thinkingConfig: { includeThinkingProcess: true }
    }
  },
  [VirtuosoType.CHRONICLER]: {
    id: VirtuosoType.CHRONICLER,
    name: "The Chronicler",
    title: "Documentation Lead",
    model: "gemini-2.5-flash",
    description: "Summarizes sessions and prepares data for export in various formats.",
    systemInstruction: `You are The Chronicler. Your domain is memory and documentation.
    Summarize the analysis session, organize insights into structured reports, and prepare data for export (Markdown, PDF, etc.).`,
    capabilities: ["summarization", "report-generation", "export-formatting"],
    color: "#FBBC04",
    icon: "FileText",
  },
  [VirtuosoType.CRITIC]: {
    id: VirtuosoType.CRITIC,
    name: "The Critic",
    title: "Quality Evaluator",
    model: "gemini-2.5-pro",
    description: "Evaluates output quality against user intent. Catches hallucinations and ensures relevance.",
    systemInstruction: `You are The Critic. Your domain is quality assurance.
    You evaluate the output of other Virtuosos against the user's original request.
    Assess: (1) Relevance — does the output address what was asked?, (2) Factual consistency — are claims supported?, (3) Quality — is the output useful and well-formed?
    Be rigorous but fair. Provide specific, actionable feedback when rejecting.`,
    capabilities: ["quality-evaluation", "hallucination-detection", "relevance-check"],
    color: "#EA4335",
    icon: "Shield",
    config: {
      thinkingConfig: { includeThinkingProcess: true }
    }
  }
};
