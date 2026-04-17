import {GenerateContentResponse} from '@google/genai';
import {getAI, getEffectiveModel} from '../client';
import {conductorFunctions} from '../../lib/conductor-functions';
import {VIRTUOSO_REGISTRY, VirtuosoType} from '../../services/virtuosos';
import type {ChatMessage} from '../../types';

export async function runConductorQuery(
  query: string,
): Promise<GenerateContentResponse> {
  const modelName = getEffectiveModel(VIRTUOSO_REGISTRY[VirtuosoType.CONDUCTOR].model);

  const availableVirtuosos = Object.values(VIRTUOSO_REGISTRY)
    .filter(v => v.id !== VirtuosoType.CONDUCTOR)
    .map(v => `- ${v.name}: ${v.description} (Capabilities: ${v.capabilities.join(', ')})`)
    .join('\n');

  const dynamicSystemInstruction = `${VIRTUOSO_REGISTRY[VirtuosoType.CONDUCTOR].systemInstruction}
  
Available Virtuosos (Lenses) you can apply using the applyLens function:
${availableVirtuosos}`;

  const response = await getAI().models.generateContent({
    model: modelName,
    contents: {
      parts: [{text: query}],
    },
    config: {
      systemInstruction: dynamicSystemInstruction,
      tools: [{functionDeclarations: conductorFunctions}],
    },
  });

  return response;
}

export async function runChat(
  message: string,
  history: ChatMessage[],
  context?: string,
): Promise<string> {
  const modelName = getEffectiveModel(VIRTUOSO_REGISTRY[VirtuosoType.CONDUCTOR].model);

  const formattedHistory = history.map((msg) => {
    const parts = [];
    if (msg.text) parts.push({text: msg.text});
    if (msg.file) {
      parts.push({
        inlineData: {
          mimeType: msg.file.mimeType,
          data: msg.file.data,
        },
      });
    }
    return {role: msg.role, parts};
  });

  const chat = getAI().chats.create({
    model: modelName, 
    history: formattedHistory,
    config: {
      systemInstruction: VIRTUOSO_REGISTRY[VirtuosoType.CONDUCTOR].systemInstruction,
    }
  });

  let finalMessage = message;
  if (context && context.trim().length > 0) {
    finalMessage = `Context:\n${context}\n\nUser Message: ${message}`;
  }

  const response = await chat.sendMessage({message: finalMessage});
  return response.text;
}
