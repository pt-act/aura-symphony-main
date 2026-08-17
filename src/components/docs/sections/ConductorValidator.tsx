import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return (
    <div className="docs-article">
      <span className="article-label">Conductor</span>
      <h2>Validation Middleware</h2>
      <div className="markdown-body">
        <p>The validation middleware sits between the LLM response and function execution, catching malformed calls before they reach state.</p>
        <p><FileRef path="src/lib/conductor-validator.ts" /></p>

        <CodeBlock title="Validation Flow" code={`LLM Response → validateConductorCall(name, args) → {
  success: true  → execute function
  success: false → buildCorrectionPrompt() → re-prompt LLM
  unknown func   → "Conductor hallucinated a tool that does not exist"
}`} />

        <h3>API</h3>
        <CodeBlock code={`function validateConductorCall(
  functionName: string,
  args: unknown
): ValidationResult

type ValidationResult =
  | { success: true; functionName: string; args: T }
  | { success: false; functionName: string; errors: ZodIssue[]; errorMessage: string }

function buildCorrectionPrompt(
  functionName: string,
  originalArgs: unknown,
  errors: ZodIssue[]
): string  // Prompt for LLM self-correction`} />
      </div>
    </div>
  );
}