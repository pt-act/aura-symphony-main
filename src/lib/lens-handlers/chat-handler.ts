import {runChat} from '../../api/api';
import {fileToBase64} from '../utils';
import type {ChatMessage} from '../../types';
import type {LensHandler, LensRequest, LensContext} from './types';

export const chatHandler: LensHandler = {
  names: ['Chat'],

  async execute(request: LensRequest, context: LensContext) {
    const {insightId, customPrompt} = request;
    const {setInsights, insights} = context;

    const initialHistory: ChatMessage[] = [];
    if (request.file) {
      const fileData = await fileToBase64(request.file);
      initialHistory.push({
        role: 'user',
        text: customPrompt || 'Analyze this file.',
        file: fileData,
      });
    } else {
      initialHistory.push({role: 'user', text: customPrompt || 'Hello'});
    }

    setInsights((prev) =>
      prev.map((i) =>
        i.id === insightId ? {...i, data: initialHistory, isLoading: true} : i,
      ),
    );

    const otherInsights = insights.filter(
      (i) => i.id !== insightId && i.type !== 'Chat' && i.data && !i.isLoading,
    );
    const contextString = otherInsights
      .map((i) => (typeof i.data === 'string' ? `**${i.title}**\n${i.data}` : ''))
      .filter(Boolean)
      .join('\n\n---\n\n');

    const responseText = await runChat(customPrompt || 'Hello', [], contextString);
    const newModelMessage: ChatMessage = {role: 'model', text: responseText};
    setInsights((prev) =>
      prev.map((i) =>
        i.id === insightId
          ? {...i, data: [...initialHistory, newModelMessage], isLoading: false}
          : i,
      ),
    );
  },
};