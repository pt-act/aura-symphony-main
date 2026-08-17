import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return <VirtuosoDoc
    label="Agent"
    name="The Conductor"
    file="src/api/virtuosos/conductor.ts"
    model="gemini-2.5-pro"
    capabilities={['intent-parsing', 'delegation', 'orchestration']}
    configNote="The Conductor dynamically injects all other Virtuosos' descriptions into its system prompt so it knows what agents are available for delegation."
    description="The Conductor is the central intelligence of the system. It parses natural language user queries, selects the appropriate Virtuoso(s), and executes tasks via Gemini Function Calling. It supports 17 function declarations (see Conductor Reference)."
    apiSignatures={`// Intent parsing with function calling
async function runConductorQuery(query: string): Promise<GenerateContentResponse>

// Multi-turn conversational chat
async function runChat(
  message: string,
  history: ChatMessage[],
  context?: string
): Promise<string>`}
  />;
}