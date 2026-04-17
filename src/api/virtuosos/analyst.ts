import {Type} from '@google/genai';
import {getAI, getEffectiveModel} from '../client';
import {Events, symphonyBus} from '../../lib/symphonyBus';
import {VIRTUOSO_REGISTRY, VirtuosoType} from '../../services/virtuosos';

export async function generateCourseModules(frames: string[]) {
  const taskId = symphonyBus.commission(VirtuosoType.ANALYST, 'Curating Modules');
  try {
    const modelName = getEffectiveModel(VIRTUOSO_REGISTRY[VirtuosoType.ANALYST].model);
    const prompt = `Analyze this video and generate a concise learning course from it. Provide a brief summary, identify 3-5 key moments, and create a 3-question multiple-choice quiz to test understanding. Ensure the key moments have accurate timecodes. For each quiz question, also provide a relevant timecode from the video where the answer can be found.`;
    const imageParts = frames.map((frame) => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: frame,
      },
    }));

    const response = await getAI().models.generateContent({
      model: modelName,
      contents: {
        parts: [{text: prompt}, ...imageParts],
      },
      config: {
        systemInstruction: VIRTUOSO_REGISTRY[VirtuosoType.ANALYST].systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.ARRAY,
              description:
                'A 2-3 sentence summary of the video, with each sentence as an object containing the text and a relevant timecode.',
              items: {
                type: Type.OBJECT,
                properties: {
                  time: {type: Type.STRING},
                  text: {type: Type.STRING},
                },
              },
            },
            keyMoments: {
              type: Type.ARRAY,
              description:
                'A list of 3-5 key moments from the video, each with a timecode and a descriptive text.',
              items: {
                type: Type.OBJECT,
                properties: {
                  time: {type: Type.STRING},
                  text: {type: Type.STRING},
                },
              },
            },
            quiz: {
              type: Type.ARRAY,
              description:
                'A list of 3 multiple-choice questions based on the video content.',
              items: {
                type: Type.OBJECT,
                properties: {
                  question: {type: Type.STRING},
                  options: {type: Type.ARRAY, items: {type: Type.STRING}},
                  answer: {
                    type: Type.STRING,
                    description: 'The correct option from the options list.',
                  },
                  explanation: {
                    type: Type.STRING,
                    description: 'A brief explanation for the correct answer.',
                  },
                  time: {
                    type: Type.STRING,
                    description:
                      'The relevant timecode in "HH:MM:SS" format from the video where the answer can be found.',
                  },
                },
              },
            },
          },
        },
      },
    });

    const result = JSON.parse(response.text);
    symphonyBus.dispatch(Events.TASK_SUCCESS, {id: taskId, result});
    return result;
  } catch (error: any) {
    symphonyBus.dispatch(Events.TASK_ERROR, {id: taskId, error: error.message});
    throw error;
  }
}
