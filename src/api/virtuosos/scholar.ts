import {getAI, getEffectiveModel} from '../client';
import {Events, symphonyBus} from '../../lib/symphonyBus';
import {VIRTUOSO_REGISTRY, VirtuosoType} from '../../services/virtuosos';

export async function runSearchGroundedQuery(prompt: string) {
  const taskId = symphonyBus.commission(VirtuosoType.SCHOLAR, 'Web Search');
  try {
    const response = await getAI().models.generateContent({
      model: getEffectiveModel(VIRTUOSO_REGISTRY[VirtuosoType.SCHOLAR].model),
      contents: prompt,
      config: {
        systemInstruction: VIRTUOSO_REGISTRY[VirtuosoType.SCHOLAR].systemInstruction,
        tools: [{googleSearch: {}}],
      },
    });
    const result = {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [],
    };
    symphonyBus.dispatch(Events.TASK_SUCCESS, {id: taskId, result});
    return result;
  } catch (error: any) {
    symphonyBus.dispatch(Events.TASK_ERROR, {id: taskId, error: error.message});
    throw error;
  }
}
