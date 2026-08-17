import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return <VirtuosoDoc
    label="Agent"
    name="The Visionary"
    file="src/api/virtuosos/visionary.ts"
    model="gemini-2.5-pro"
    capabilities={['video-analysis', 'image-analysis', 'object-detection', 'pdf-analysis']}
    configNote="When a custom Virtuoso has Google Search tools configured, the Visionary merges them into its tool config with includeServerSideToolInvocations: true."
    description="The Visionary specializes in multimodal analysis of video frames, images, and PDF documents. It sends extracted frames as inline base64 data alongside text prompts to Gemini's multimodal endpoint."
    apiSignatures={`// PDF analysis (extracts text via WebWorker, then queries Gemini)
async function runPdfQuery(
  prompt: string,
  file: { mimeType: string; data: string }
): Promise<string>

// Video/image analysis with function calling
async function runVideoQuery(
  prompt: string,
  frames: string[],          // base64 JPEG frames
  functions: FunctionDeclaration[],
  useThinkingBudget?: boolean,  // Enables 32K thinking tokens
  virtuosoId?: string        // Override virtuoso identity
): Promise<GenerateContentResponse>`}
  />;
}