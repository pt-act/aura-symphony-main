/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';
import { conductorSchemas, ConductorFunctionName } from './conductor-schemas';

/**
 * Result of validating a Conductor function call.
 */
export interface ValidationSuccess<T = unknown> {
  success: true;
  functionName: string;
  args: T;
}

export interface ValidationFailure {
  success: false;
  functionName: string;
  errors: z.ZodIssue[];
  errorMessage: string;
}

export type ValidationResult<T = unknown> =
  | ValidationSuccess<T>
  | ValidationFailure;

/**
 * Validates a Conductor function call against its Zod schema.
 *
 * @param functionName - The name of the function the Conductor wants to call
 * @param args - The raw arguments from the LLM response
 * @returns ValidationSuccess with parsed args, or ValidationFailure with error details
 */
export function validateConductorCall(
  functionName: string,
  args: unknown
): ValidationResult {
  // Check if the function exists in our registry
  const schema = conductorSchemas[functionName as ConductorFunctionName];

  if (!schema) {
    return {
      success: false,
      functionName,
      errors: [],
      errorMessage: `Unknown function: "${functionName}". The Conductor hallucinated a tool that does not exist.`,
    };
  }

  // Validate arguments against the schema
  const result = schema.safeParse(args ?? {});

  if (result.success) {
    return {
      success: true,
      functionName,
      args: result.data,
    };
  }

  // Build human-readable error message for re-prompting
  const errorDetails = result.error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? ` at "${issue.path.join('.')}"` : '';
      return `- ${issue.message}${path}`;
    })
    .join('\n');

  return {
    success: false,
    functionName,
    errors: result.error.issues,
    errorMessage: `Validation failed for "${functionName}":\n${errorDetails}`,
  };
}

/**
 * Builds a correction prompt to send back to the LLM when validation fails.
 * This enables graceful re-prompting without exposing errors to the user.
 *
 * @param functionName - The function that failed validation
 * @param originalArgs - The original (invalid) arguments
 * @param errors - The Zod validation errors
 * @returns A string to inject into the conversation for the LLM to self-correct
 */
export function buildCorrectionPrompt(
  functionName: string,
  originalArgs: unknown,
  errors: z.ZodIssue[]
): string {
  const errorList = errors
    .map((e) => `  - ${e.message} (field: ${e.path.join('.') || 'root'})`)
    .join('\n');

  return [
    `Your previous function call to "${functionName}" had invalid arguments.`,
    `Original arguments: ${JSON.stringify(originalArgs)}`,
    `Validation errors:`,
    errorList,
    `Please correct the arguments and call the function again.`,
  ].join('\n');
}

/**
 * Telemetry hook for tracking validation failures.
 * Logs to console in development; replace with proper telemetry in production.
 */
export function logValidationFailure(
  functionName: string,
  errors: z.ZodIssue[],
  originalArgs: unknown
): void {
  console.warn('[Conductor Validation] Failed:', {
    function: functionName,
    errors: errors.map((e) => ({
      message: e.message,
      path: e.path,
      code: e.code,
    })),
    originalArgs,
    timestamp: new Date().toISOString(),
  });
}
