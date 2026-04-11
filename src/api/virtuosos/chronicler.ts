import {Modality} from '@google/genai';
import {ai} from '../client';
import {Events, symphonyBus} from '../../lib/symphonyBus';
import {VIRTUOSO_REGISTRY, VirtuosoType} from '../../services/virtuosos';

export async function generateSpeech(text: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{parts: [{text}]}],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {voiceName: 'Kore'},
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? '';
}

export async function transcribeAudio(audio: {
  mimeType: string;
  data: string;
}): Promise<string> {
  const taskId = symphonyBus.commission(VirtuosoType.CHRONICLER, 'Transcribe Audio');
  try {
    const response = await ai.models.generateContent({
    model: VIRTUOSO_REGISTRY[VirtuosoType.CHRONICLER].model,
    contents: {
      parts: [
        {text: 'Transcribe the following audio:'},
        {inlineData: {mimeType: audio.mimeType, data: audio.data}},
      ],
    },
    config: {
      systemInstruction: VIRTUOSO_REGISTRY[VirtuosoType.CHRONICLER].systemInstruction,
    },
    });
    symphonyBus.dispatch(Events.TASK_SUCCESS, {id: taskId, result: response.text});
    return response.text;
  } catch (error: any) {
    symphonyBus.dispatch(Events.TASK_ERROR, {id: taskId, error: error.message});
    throw error;
  }
}
