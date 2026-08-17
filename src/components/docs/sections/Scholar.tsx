import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return <VirtuosoDoc
    label="Agent"
    name="The Scholar"
    file="src/api/virtuosos/scholar.ts"
    model="gemini-2.5-flash"
    capabilities={['web-search', 'fact-checking', 'grounding']}
    configNote='Uses the Google Search grounding tool: config.tools = [{ googleSearch: {} }]. The response includes groundingMetadata with source URLs.'
    description="The Scholar grounds analysis in real-world facts using Google Search. It returns both the generated text and an array of grounding chunks with source URLs for citation."
    apiSignatures={`async function runSearchGroundedQuery(
  prompt: string
): Promise<{
  text: string;
  sources: GroundingChunk[];  // { web: { uri, title } }
}>`}
  />;
}