import {Modality} from '@google/genai';
import {getAI, getEffectiveModel} from '../client';
import {getActiveProvider} from '../../lib/provider-config';
import {Events, symphonyBus} from '../../lib/symphonyBus';
import {VIRTUOSO_REGISTRY, VirtuosoType} from '../../services/virtuosos';

async function performVideoGeneration(
  taskId: string | number,
  prompt: string,
  aspectRatio: '16:9' | '9:16',
  image?: {mimeType: string; data: string},
) {
  const generateVideosPayload: any = {
    model: getEffectiveModel(VIRTUOSO_REGISTRY[VirtuosoType.ARTISAN].model),
    prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio,
    },
  };

  if (image) {
    generateVideosPayload.image = {
      imageBytes: image.data,
      mimeType: image.mimeType,
    };
  }

  try {
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      await window.aistudio.openSelectKey();
    }
    let videoAI = getAI();

    let operation = await videoAI.models.generateVideos(generateVideosPayload);

    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      try {
        operation = await (videoAI.operations as any).getVideosOperation({
          operation: operation,
        });
      } catch (e: any) {
        if (e.message?.includes('Requested entity was not found.')) {
          if (window.aistudio) {
            await window.aistudio.openSelectKey();
          }
          // Re-create AI instance and retry
          videoAI = getAI();
          operation = await videoAI.models.generateVideos(
            generateVideosPayload,
          );
        } else {
          throw e;
        }
      }
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error('Video generation failed to return a download link.');
    }
    const activeProvider = getActiveProvider();
    const apiKey = activeProvider?.apiKey?.trim() || process.env.API_KEY || '';
    const response = await fetch(`${downloadLink}&key=${apiKey}`);
    const videoBlob = await response.blob();
    const videoUrl = URL.createObjectURL(videoBlob);

    symphonyBus.dispatch(Events.TASK_SUCCESS, {id: taskId, result: videoUrl});
  } catch (err: any) {
    symphonyBus.dispatch(Events.TASK_ERROR, {id: taskId, error: err.message});
  }
}

export function generateVideo(
  taskId: string | number,
  prompt: string,
  aspectRatio: '16:9' | '9:16',
  image?: {mimeType: string; data: string},
) {
  symphonyBus.commission(VirtuosoType.ARTISAN, 'Generating Video', taskId);
  // Don't await this. Let it run in the background.
  performVideoGeneration(taskId, prompt, aspectRatio, image);
  return taskId;
}

export async function generateImage(
  prompt: string,
  aspectRatio: '1:1' | '16:9' | '9:16',
) {
  const taskId = symphonyBus.commission(VirtuosoType.ARTISAN, 'Generate Image');
  try {
    const response = await getAI().models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio,
      },
    });
    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
    symphonyBus.dispatch(Events.TASK_SUCCESS, {id: taskId, result: imageUrl});
    return imageUrl;
  } catch (error: any) {
    symphonyBus.dispatch(Events.TASK_ERROR, {id: taskId, error: error.message});
    throw error;
  }
}

export async function editImage(
  prompt: string,
  image: {mimeType: string; data: string},
) {
  const taskId = symphonyBus.commission(VirtuosoType.ARTISAN, 'Edit Image');
  try {
    const response = await getAI().models.generateContent({
      model: getEffectiveModel('gemini-2.5-flash-image'),
      contents: {
        parts: [
          {
            inlineData: {
              data: image.data,
              mimeType: image.mimeType,
            },
          },
          {text: prompt},
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
        symphonyBus.dispatch(Events.TASK_SUCCESS, {id: taskId, result: imageUrl});
        return imageUrl;
      }
    }
    throw new Error('Image editing failed to produce an image.');
  } catch (error: any) {
    symphonyBus.dispatch(Events.TASK_ERROR, {id: taskId, error: error.message});
    throw error;
  }
}
