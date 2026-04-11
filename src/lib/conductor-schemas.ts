/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

/**
 * Zod schemas for all Conductor function calls.
 * These provide runtime validation of LLM-generated function arguments
 * before execution, preventing hallucinated parameters from reaching state.
 */

// ─── No-argument functions ───────────────────────────────────────────

export const GenerateSummarySchema = z.object({}).strict();

export const ListKeyMomentsSchema = z.object({}).strict();

export const GenerateInstructionsSchema = z.object({}).strict();

export const CreateHaikuSchema = z.object({}).strict();

// ─── Content creation functions ──────────────────────────────────────

export const CreateMermaidDiagramSchema = z
  .object({
    topic: z.string().min(1, 'topic is required'),
  })
  .strict();

export const CreateChartSchema = z
  .object({
    metric: z.string().min(1, 'metric is required'),
  })
  .strict();

export const GenerateImageSchema = z
  .object({
    prompt: z.string().min(1, 'prompt is required'),
    aspect_ratio: z.enum(['1:1', '16:9', '9:16']).optional(),
  })
  .strict();

export const EditImageSchema = z
  .object({
    prompt: z.string().min(1, 'prompt is required'),
  })
  .strict();

export const GenerateVideoSchema = z
  .object({
    prompt: z.string().min(1, 'prompt is required'),
    aspect_ratio: z.enum(['16:9', '9:16']).optional(),
  })
  .strict();

// ─── Search functions ────────────────────────────────────────────────

export const WebSearchSchema = z
  .object({
    query: z.string().min(1, 'query is required'),
  })
  .strict();

export const SearchVideoSchema = z
  .object({
    query: z.string().min(1, 'query is required'),
  })
  .strict();

export const CustomVideoAnalysisSchema = z
  .object({
    instructions: z.string().min(1, 'instructions are required'),
  })
  .strict();

// ─── External tool functions ─────────────────────────────────────────

export const LaunchValhallaSchema = z
  .object({
    tool: z.string().min(1, 'tool name is required'),
  })
  .strict();

// ─── Lens / analysis functions ───────────────────────────────────────

export const ApplyLensSchema = z
  .object({
    lensName: z.string().min(1, 'lensName is required'),
    customPrompt: z.string().optional(),
  })
  .strict();

// ─── Playback control functions ──────────────────────────────────────

export const SeekToTimeSchema = z
  .object({
    timeInSeconds: z
      .number()
      .min(0, 'timeInSeconds must be >= 0'),
  })
  .strict();

export const SetPlaybackSpeedSchema = z
  .object({
    speed: z
      .number()
      .positive('speed must be positive'),
  })
  .strict();

// ─── Annotation functions ────────────────────────────────────────────

export const AddAnnotationSchema = z
  .object({
    timeInSeconds: z
      .number()
      .min(0, 'timeInSeconds must be >= 0'),
    text: z.string().min(1, 'text is required'),
  })
  .strict();

export const SetSelectionRangeSchema = z
  .object({
    startTime: z
      .number()
      .min(0, 'startTime must be >= 0'),
    endTime: z
      .number()
      .min(0, 'endTime must be >= 0'),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'endTime must be greater than startTime',
    path: ['endTime'],
  });

// ─── Schema registry ─────────────────────────────────────────────────
// Maps function name → Zod schema for the validation middleware.

export const conductorSchemas: Record<string, z.ZodSchema> = {
  generate_summary: GenerateSummarySchema,
  list_key_moments: ListKeyMomentsSchema,
  generate_instructions: GenerateInstructionsSchema,
  create_haiku: CreateHaikuSchema,
  create_mermaid_diagram: CreateMermaidDiagramSchema,
  create_chart: CreateChartSchema,
  generate_image: GenerateImageSchema,
  edit_image: EditImageSchema,
  generate_video: GenerateVideoSchema,
  web_search: WebSearchSchema,
  search_video: SearchVideoSchema,
  custom_video_analysis: CustomVideoAnalysisSchema,
  launch_valhalla: LaunchValhallaSchema,
  applyLens: ApplyLensSchema,
  seekToTime: SeekToTimeSchema,
  setPlaybackSpeed: SetPlaybackSpeedSchema,
  addAnnotation: AddAnnotationSchema,
  setSelectionRange: SetSelectionRangeSchema,
};

export type ConductorFunctionName = keyof typeof conductorSchemas;
