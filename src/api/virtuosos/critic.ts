/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Type } from '@google/genai';
import { getAI, getEffectiveModel } from '../client';
import { Events, symphonyBus } from '../../lib/symphonyBus';
import { VIRTUOSO_REGISTRY, VirtuosoType } from '../../services/virtuosos';

/**
 * Critic evaluation result.
 */
export interface CriticEvaluation {
  passed: boolean;
  score: number; // 0-100
  relevance: number; // 0-10
  factualConsistency: number; // 0-10
  quality: number; // 0-10
  feedback: string;
  specificIssues: string[];
  timestamp: string;
}

/**
 * Evaluates a Virtuoso's output against the user's original request.
 *
 * @param originalPrompt - The user's original request
 * @param virtuosoOutput - The output produced by the originating Virtuoso
 * @param virtuosoType - Which Virtuoso produced the output
 * @returns CriticEvaluation with pass/fail and detailed feedback
 */
export async function evaluateOutput(
  originalPrompt: string,
  virtuosoOutput: string,
  virtuosoType: string
): Promise<CriticEvaluation> {
  const taskId = symphonyBus.commission(VirtuosoType.CRITIC, 'Quality Evaluation');

  try {
    const modelName = getEffectiveModel(VIRTUOSO_REGISTRY[VirtuosoType.CRITIC].model);

    const evaluationPrompt = `You are evaluating the output of an AI system called "${virtuosoType}".

ORIGINAL USER REQUEST:
"${originalPrompt}"

VIRTUOSO OUTPUT TO EVALUATE:
"${virtuosoOutput}"

Evaluate this output on three dimensions:
1. Relevance (0-10): Does it directly address what the user asked for?
2. Factual Consistency (0-10): Are claims accurate and supported?
3. Quality (0-10): Is it well-structured, useful, and complete?

A score of 7+ on all dimensions is a PASS. Below 7 on any dimension is a FAIL.
If FAIL, provide specific, actionable feedback for improvement.`;

    const response = await getAI().models.generateContent({
      model: modelName,
      contents: evaluationPrompt,
      config: {
        systemInstruction: VIRTUOSO_REGISTRY[VirtuosoType.CRITIC].systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            relevance: {
              type: Type.NUMBER,
              description: 'Relevance score 0-10',
            },
            factualConsistency: {
              type: Type.NUMBER,
              description: 'Factual consistency score 0-10',
            },
            quality: {
              type: Type.NUMBER,
              description: 'Quality score 0-10',
            },
            feedback: {
              type: Type.STRING,
              description: 'Overall evaluation summary',
            },
            specificIssues: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of specific issues found (empty if passing)',
            },
          },
        },
      },
    });

    const parsed = JSON.parse(response.text);

    const score = Math.round(
      ((parsed.relevance + parsed.factualConsistency + parsed.quality) / 30) * 100
    );
    const passed =
      parsed.relevance >= 7 &&
      parsed.factualConsistency >= 7 &&
      parsed.quality >= 7;

    const evaluation: CriticEvaluation = {
      passed,
      score,
      relevance: parsed.relevance,
      factualConsistency: parsed.factualConsistency,
      quality: parsed.quality,
      feedback: parsed.feedback,
      specificIssues: parsed.specificIssues || [],
      timestamp: new Date().toISOString(),
    };

    symphonyBus.dispatch(Events.TASK_SUCCESS, { id: taskId, result: evaluation });
    return evaluation;
  } catch (error: any) {
    symphonyBus.dispatch(Events.TASK_ERROR, { id: taskId, error: error.message });
    // On Critic failure, default to pass (don't block the user)
    return {
      passed: true,
      score: 50,
      relevance: 5,
      factualConsistency: 5,
      quality: 5,
      feedback: 'Critic evaluation failed. Defaulting to pass.',
      specificIssues: [`Evaluation error: ${error.message}`],
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Builds a correction prompt for the originating Virtuoso based on Critic feedback.
 * Used for the adversarial feedback loop.
 *
 * @param originalPrompt - The user's original request
 * @param evaluation - The Critic's evaluation result
 * @param virtuosoType - Which Virtuoso needs to retry
 * @returns A prompt to send back to the originating Virtuoso
 */
export function buildCriticCorrectionPrompt(
  originalPrompt: string,
  evaluation: CriticEvaluation,
  virtuosoType: string
): string {
  const issues = evaluation.specificIssues.length > 0
    ? `\nSpecific issues:\n${evaluation.specificIssues.map((i) => `- ${i}`).join('\n')}`
    : '';

  return `Your previous output was evaluated by the Critic and did not meet quality standards.

Original request: "${originalPrompt}"

Critic feedback: ${evaluation.feedback}
Scores — Relevance: ${evaluation.relevance}/10, Factual: ${evaluation.factualConsistency}/10, Quality: ${evaluation.quality}/10${issues}

Please revise your output to address these issues. Focus especially on the lowest-scoring dimension.`;
}
