/**
 * useCriticGate Hook
 *
 * Provides a reusable quality gate for Virtuoso output.
 * Any component producing output can call `criticGate()` to run
 * the Critic evaluation before delivering results to the user.
 *
 * Usage:
 *   const { criticGate, lastEvaluation } = useCriticGate();
 *   const result = await criticGate(userPrompt, virtuosoOutput, 'Analyst');
 */

import { useState, useCallback } from 'react';
import { evaluateOutput, buildCriticCorrectionPrompt, CriticEvaluation } from '../api/virtuosos/critic';

export interface CriticGateResult<T> {
  output: T;
  evaluation: CriticEvaluation;
  wasRevised: boolean;
}

export function useCriticGate() {
  const [lastEvaluation, setLastEvaluation] = useState<CriticEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  /**
   * Runs the Critic gate on a Virtuoso's output.
   * If evaluation fails, builds a correction prompt for retry.
   * Returns the output with evaluation metadata.
   *
   * @param originalPrompt - The user's original request
   * @param output - The Virtuoso's output (string)
   * @param virtuosoType - Which Virtuoso produced the output
   * @param retryFn - Optional: function to call for retry if Critic rejects
   * @returns CriticGateResult with output, evaluation, and whether it was revised
   */
  const criticGate = useCallback(async (
    originalPrompt: string,
    output: string,
    virtuosoType: string,
    retryFn?: (correctionPrompt: string) => Promise<string>
  ): Promise<CriticGateResult<string>> => {
    setIsEvaluating(true);
    const MAX_RETRIES = 2;
    let currentOutput = output;
    let wasRevised = false;

    try {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const evaluation = await evaluateOutput(originalPrompt, currentOutput, virtuosoType);
        setLastEvaluation(evaluation);

        if (evaluation.passed || !retryFn || attempt >= MAX_RETRIES) {
          return { output: currentOutput, evaluation, wasRevised };
        }

        // Build correction and retry
        const correctionPrompt = buildCriticCorrectionPrompt(
          originalPrompt,
          evaluation,
          virtuosoType
        );
        currentOutput = await retryFn(correctionPrompt);
        wasRevised = true;
      }

      // Fallback (should not reach here)
      return {
        output: currentOutput,
        evaluation: lastEvaluation!,
        wasRevised,
      };
    } finally {
      setIsEvaluating(false);
    }
  }, []);

  return { criticGate, lastEvaluation, isEvaluating };
}
