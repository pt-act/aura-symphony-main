import {FunctionDeclaration, GenerateContentResponse} from '@google/genai';
import {getAI, getEffectiveModel} from '../client';
import {Events, symphonyBus} from '../../lib/symphonyBus';
import {VIRTUOSO_REGISTRY, VirtuosoType} from '../../services/virtuosos';
import {getSharedMediaWorker} from '../../lib/utils';

async function extractTextFromPdf(base64Data: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = getSharedMediaWorker();
    const taskId = Date.now().toString() + Math.random().toString();
    
    const handleMessage = (e: MessageEvent) => {
      if (e.data.id === taskId) {
        if (e.data.type === 'EXTRACT_PDF_TEXT_RESULT') {
          worker.removeEventListener('message', handleMessage);
          resolve(e.data.payload);
        } else if (e.data.type === 'EXTRACT_PDF_TEXT_ERROR') {
          worker.removeEventListener('message', handleMessage);
          reject(new Error(e.data.payload));
        }
      }
    };

    worker.addEventListener('message', handleMessage);
    worker.postMessage({ type: 'EXTRACT_PDF_TEXT', payload: { base64Data }, id: taskId });
  });
}

export async function runPdfQuery(
  prompt: string,
  file: {mimeType: string; data: string},
): Promise<string> {
  const taskId = symphonyBus.commission(VirtuosoType.VISIONARY, 'PDF Analysis');
  try {
    const pdfText = await extractTextFromPdf(file.data);

    const registryModel = VIRTUOSO_REGISTRY[VirtuosoType.VISIONARY].model;
    const modelName = getEffectiveModel(registryModel);
    const fullPrompt = `Based on the following document, answer the user's question. Document Content:\n\n---\n\n${pdfText}\n\n---\n\nUser Question: ${prompt}`;

    const response = await getAI().models.generateContent({
      model: modelName,
      contents: fullPrompt,
      config: {
        systemInstruction: VIRTUOSO_REGISTRY[VirtuosoType.VISIONARY].systemInstruction,
      },
    });
    symphonyBus.dispatch(Events.TASK_SUCCESS, {id: taskId, result: response.text});
    return response.text;
  } catch (error: any) {
    symphonyBus.dispatch(Events.TASK_ERROR, {id: taskId, error: error.message});
    throw error;
  }
}

export async function runVideoQuery(
  prompt: string,
  frames: string[],
  functions: FunctionDeclaration[],
  useThinkingBudget = false,
  virtuosoId: string = VirtuosoType.VISIONARY
): Promise<GenerateContentResponse> {
  const taskId = symphonyBus.commission(virtuosoId as VirtuosoType, 'Deep Analysis');
  try {
    const virtuoso = VIRTUOSO_REGISTRY[virtuosoId as VirtuosoType] || VIRTUOSO_REGISTRY[VirtuosoType.VISIONARY];
    const modelName = getEffectiveModel(virtuoso.model);

    const imageParts = frames.map((frame) => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: frame,
      },
    }));

    const config: any = {
      systemInstruction: virtuoso.systemInstruction,
      tools: [{functionDeclarations: functions}]
    };
    
    if (virtuoso.config?.tools) {
      config.tools = [...config.tools, ...virtuoso.config.tools];
      config.toolConfig = { includeServerSideToolInvocations: true };
    }

    if (useThinkingBudget) {
      config.thinkingConfig = {thinkingBudget: 32768};
    }

    const response = await getAI().models.generateContent({
      model: modelName,
      contents: {
        parts: [{text: `Instructions: ${prompt}\n\n`}, ...imageParts],
      },
      config: config,
    });
    symphonyBus.dispatch(Events.TASK_SUCCESS, {id: taskId, result: response});
    return response;
  } catch (error: any) {
    symphonyBus.dispatch(Events.TASK_ERROR, {id: taskId, error: error.message});
    throw error;
  }
}
