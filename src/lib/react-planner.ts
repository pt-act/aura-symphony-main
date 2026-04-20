/**
 * ReAct (Reason + Act) Planner for the Conductor
 *
 * Implements a hierarchical agent planning loop where the Conductor:
 *   1. THINKS about the user's request and generates a multi-step plan
 *   2. ACTS on each step by dispatching to Virtuosos via function calls
 *   3. OBSERVES the results of each action
 *   4. REFLECTS and adapts the plan based on intermediate results
 *   5. Repeats until the plan is complete or max iterations reached
 *
 * This replaces the flat single-pass function-call pattern with a
 * deliberate planning loop that handles complex multi-step queries.
 *
 * References:
 *   [1] Yao et al. (2023) "ReAct: Synergizing Reasoning and Acting in LLMs"
 *   [2] Wei et al. (2022) "Chain-of-Thought Prompting"
 *
 * @module
 */

import { getAI, getEffectiveModel } from '../api/client';
import { conductorFunctions } from './conductor-functions';
import { VIRTUOSO_REGISTRY, VirtuosoType } from '../services/virtuosos';
import { symphonyBus } from './symphonyBus';
import { startTimer } from './telemetry';

// ─── Types ────────────────────────────────────────────────────────────

/** A single step in the ReAct plan. */
export interface PlanStep {
  /** Step number (1-indexed). */
  stepNumber: number;
  /** What the Conductor plans to do. */
  thought: string;
  /** The function call to execute (null if pure reasoning step). */
  action: { name: string; args: any } | null;
  /** The result observed from the action. */
  observation: string | null;
  /** Step status. */
  status: 'planned' | 'executing' | 'completed' | 'failed' | 'skipped';
}

/** The full ReAct execution plan. */
export interface ReactPlan {
  /** Original user query. */
  query: string;
  /** Generated plan steps. */
  steps: PlanStep[];
  /** High-level reasoning about the approach. */
  reasoning: string;
  /** Whether the plan completed successfully. */
  completed: boolean;
  /** Total execution time (ms). */
  totalTimeMs: number;
  /** Number of LLM calls made. */
  llmCalls: number;
}

/** Callback for plan progress updates. */
export type PlanProgressCallback = (plan: ReactPlan) => void;

// ─── Configuration ────────────────────────────────────────────────────

/** Maximum number of ReAct iterations to prevent infinite loops. */
const MAX_ITERATIONS = 6;

/** Maximum number of function calls per plan. */
const MAX_ACTIONS = 8;

/** Threshold: queries shorter than this skip planning (simple dispatch). */
const SIMPLE_QUERY_THRESHOLD = 30;

// ─── ReAct System Prompt ──────────────────────────────────────────────

const REACT_SYSTEM_PROMPT = `You are the Conductor of the Aura Symphony, using a ReAct (Reason + Act) approach.

For complex queries, you will plan and execute a multi-step workflow:

## Your Process:
1. THINK: Analyze the user's request and identify what steps are needed
2. PLAN: Create an ordered list of function calls to execute
3. ACT: Execute each step using the available functions
4. OBSERVE: Check the result of each action
5. ADAPT: If needed, modify the remaining plan based on observations

## Rules:
- Break complex queries into 2-5 concrete steps
- Use chain commissions when one step depends on another
- If a step fails, adapt the plan (skip, retry with different parameters, or alternative approach)
- Always explain your reasoning before acting
- After all steps complete, provide a concise summary

## Response Format:
Respond with a JSON object:
{
  "reasoning": "Your high-level analysis of what needs to be done",
  "steps": [
    {
      "thought": "Why this step is needed",
      "action": { "name": "functionName", "args": { ... } }
    }
  ]
}

If the query is simple and needs only one function call, you may respond with a single step.
If no function calls are needed (conversational query), respond with:
{
  "reasoning": "...",
  "steps": [],
  "response": "Your direct answer"
}`;

// ─── Plan Generation ──────────────────────────────────────────────────

/**
 * Generates a ReAct plan for a complex query.
 * Uses the Conductor's LLM to reason about the steps needed.
 */
export async function generatePlan(
  query: string,
  context?: string,
): Promise<{ reasoning: string; steps: Array<{ thought: string; action: { name: string; args: any } | null }>; response?: string }> {
  const model = getEffectiveModel(VIRTUOSO_REGISTRY[VirtuosoType.CONDUCTOR].model);

  const availableVirtuosos = Object.values(VIRTUOSO_REGISTRY)
    .filter((v) => v.id !== VirtuosoType.CONDUCTOR)
    .map((v) => `- ${v.name}: ${v.description}`)
    .join('\n');

  const systemPrompt = `${REACT_SYSTEM_PROMPT}\n\nAvailable Virtuosos:\n${availableVirtuosos}`;

  let prompt = query;
  if (context) {
    prompt = `Previous observations:\n${context}\n\nOriginal query: ${query}`;
  }

  const response = await getAI().models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: systemPrompt,
      tools: [{ functionDeclarations: conductorFunctions }],
      responseMimeType: 'application/json',
    },
  });

  const text = response.text ?? '{}';

  try {
    // Strip code fences if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    // Fallback: treat as a direct response
    return {
      reasoning: 'Direct response to query',
      steps: [],
      response: text,
    };
  }
}

/**
 * Re-plans remaining steps based on intermediate observations.
 * Called when the Conductor needs to adapt the plan.
 */
export async function replan(
  originalQuery: string,
  completedSteps: PlanStep[],
  remainingSteps: PlanStep[],
): Promise<Array<{ thought: string; action: { name: string; args: any } | null }>> {
  const model = getEffectiveModel(VIRTUOSO_REGISTRY[VirtuosoType.CONDUCTOR].model);

  const completedSummary = completedSteps
    .map((s) => `Step ${s.stepNumber}: ${s.thought}\n  Result: ${s.observation ?? 'N/A'}\n  Status: ${s.status}`)
    .join('\n');

  const remainingSummary = remainingSteps
    .map((s) => `Step ${s.stepNumber}: ${s.thought}`)
    .join('\n');

  const prompt = `You are replanning a multi-step workflow.

Original query: ${originalQuery}

Completed steps:
${completedSummary}

Remaining planned steps:
${remainingSummary}

Based on the observations from completed steps, should the remaining plan be adjusted?
Respond with JSON: { "steps": [ { "thought": "...", "action": { "name": "...", "args": {...} } } ] }
If no changes needed, return the remaining steps unchanged.
If steps should be skipped, remove them. If new steps are needed, add them.`;

  const response = await getAI().models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: REACT_SYSTEM_PROMPT,
      responseMimeType: 'application/json',
    },
  });

  try {
    const cleaned = (response.text ?? '{}').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return parsed.steps ?? remainingSteps.map((s) => ({ thought: s.thought, action: s.action }));
  } catch {
    // Keep original plan
    return remainingSteps.map((s) => ({ thought: s.thought, action: s.action }));
  }
}

// ─── Query Complexity Detection ──────────────────────────────────────

/**
 * Heuristically determines if a query is "complex" enough to warrant
 * multi-step ReAct planning vs. simple single-pass dispatch.
 *
 * Complex queries typically:
 *   - Contain conjunctions ("and", "then", "also")
 *   - Ask for multiple things ("summarize and search for...")
 *   - Mention comparison or synthesis
 *   - Are longer than SIMPLE_QUERY_THRESHOLD chars
 */
export function isComplexQuery(query: string): boolean {
  if (query.length <= SIMPLE_QUERY_THRESHOLD) return false;

  const complexIndicators = [
    /\band\b.*\bthen\b/i,
    /\bfirst\b.*\bthen\b/i,
    /\bcompare\b/i,
    /\banalyze\b.*\band\b.*\bsearch\b/i,
    /\bsummarize\b.*\band\b/i,
    /\bmultiple\b/i,
    /\bstep.by.step\b/i,
    /\bcombine\b/i,
    /\bcross.reference\b/i,
    /\bafter\b.*\b(do|perform|run)\b/i,
  ];

  return complexIndicators.some((pattern) => pattern.test(query));
}

// ─── ReAct Execution Engine ──────────────────────────────────────────

/**
 * Executes a ReAct planning loop for the Conductor.
 *
 * This is the main entry point for complex queries. For simple queries,
 * the existing single-pass `handleConductorQuery` is still used.
 *
 * @param query - The user's query
 * @param executeAction - Callback to execute a function call (provided by useAnalysisState)
 * @param onProgress - Optional callback for real-time plan updates
 * @returns The completed ReactPlan
 */
export async function executeReactPlan(
  query: string,
  executeAction: (call: { name: string; args: any }, parentTaskId?: string | number) => Promise<boolean>,
  onProgress?: PlanProgressCallback,
): Promise<ReactPlan> {
  const timer = startTimer();
  const parentTaskId = symphonyBus.commission(
    VirtuosoType.CONDUCTOR as any,
    `ReAct Plan: ${query.slice(0, 40)}…`,
  );

  const plan: ReactPlan = {
    query,
    steps: [],
    reasoning: '',
    completed: false,
    totalTimeMs: 0,
    llmCalls: 0,
  };

  try {
    // Step 1: Generate initial plan
    const generated = await generatePlan(query);
    plan.reasoning = generated.reasoning;
    plan.llmCalls++;

    // If it's a direct response (no actions needed)
    if (generated.response && (!generated.steps || generated.steps.length === 0)) {
      plan.completed = true;
      plan.totalTimeMs = timer.elapsed();
      onProgress?.(plan);
      return plan;
    }

    // Convert to PlanSteps
    plan.steps = (generated.steps ?? []).slice(0, MAX_ACTIONS).map((s, idx) => ({
      stepNumber: idx + 1,
      thought: s.thought,
      action: s.action,
      observation: null,
      status: 'planned' as const,
    }));

    onProgress?.(plan);

    // Step 2: Execute plan steps
    let actionsExecuted = 0;
    let iteration = 0;

    while (iteration < MAX_ITERATIONS && plan.steps.some((s) => s.status === 'planned')) {
      const nextStep = plan.steps.find((s) => s.status === 'planned');
      if (!nextStep) break;

      nextStep.status = 'executing';
      onProgress?.(plan);

      if (nextStep.action) {
        try {
          const spokenTextRef = { current: '' };
          const success = await executeAction(nextStep.action, parentTaskId);

          if (success) {
            nextStep.status = 'completed';
            nextStep.observation = `Action "${nextStep.action.name}" completed successfully.`;
            actionsExecuted++;
          } else {
            nextStep.status = 'failed';
            nextStep.observation = `Action "${nextStep.action.name}" failed (validation or execution error).`;
          }
        } catch (err: any) {
          nextStep.status = 'failed';
          nextStep.observation = `Error: ${err.message}`;
        }
      } else {
        // Pure reasoning step (no action)
        nextStep.status = 'completed';
        nextStep.observation = 'Reasoning step completed.';
      }

      onProgress?.(plan);

      // Step 3: After each step, check if we need to replan
      const completedSteps = plan.steps.filter((s) => s.status === 'completed' || s.status === 'failed');
      const remainingSteps = plan.steps.filter((s) => s.status === 'planned');

      // Only replan if a step failed and there are remaining steps
      if (nextStep.status === 'failed' && remainingSteps.length > 0) {
        const adaptedSteps = await replan(query, completedSteps, remainingSteps);
        plan.llmCalls++;

        // Replace remaining planned steps with adapted ones
        const newSteps = adaptedSteps.slice(0, MAX_ACTIONS - actionsExecuted).map((s, idx) => ({
          stepNumber: completedSteps.length + idx + 1,
          thought: s.thought,
          action: s.action,
          observation: null,
          status: 'planned' as const,
        }));

        plan.steps = [
          ...plan.steps.filter((s) => s.status !== 'planned'),
          ...newSteps,
        ];

        onProgress?.(plan);
      }

      iteration++;

      if (actionsExecuted >= MAX_ACTIONS) break;
    }

    // Mark any remaining planned steps as skipped
    for (const step of plan.steps) {
      if (step.status === 'planned') {
        step.status = 'skipped';
      }
    }

    plan.completed = plan.steps.every((s) => s.status === 'completed' || s.status === 'skipped');
    plan.totalTimeMs = timer.elapsed();

    symphonyBus.reportResult(
      parentTaskId,
      'conductor',
      plan.completed,
      {
        steps: plan.steps.length,
        completed: plan.steps.filter((s) => s.status === 'completed').length,
        failed: plan.steps.filter((s) => s.status === 'failed').length,
      },
      plan.totalTimeMs,
    );

    onProgress?.(plan);
    return plan;
  } catch (err: any) {
    plan.totalTimeMs = timer.elapsed();
    symphonyBus.reportResult(parentTaskId, 'conductor', false, err.message, plan.totalTimeMs);
    throw err;
  }
}

// ─── Exports for testing ──────────────────────────────────────────────

export const _testing = {
  MAX_ITERATIONS,
  MAX_ACTIONS,
  SIMPLE_QUERY_THRESHOLD,
  REACT_SYSTEM_PROMPT,
};