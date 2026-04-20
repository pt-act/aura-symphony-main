import {generateVideo, generateImage, editImage, transcribeAudio} from '../../api/api';
import {fileToBase64} from '../utils';
import type {LensHandler, LensRequest, LensContext} from './types';

export const generateVideoHandler: LensHandler = {
  names: ['Generate Video'],

  async execute(request: LensRequest, context: LensContext) {
    let image;
    if (request.file) {
      const fileData = await fileToBase64(request.file);
      image = {mimeType: fileData.mimeType, data: fileData.data};
    }
    generateVideo(request.insightId, request.customPrompt || 'A beautiful scene', '16:9', image);
  },
};

export const generateImageHandler: LensHandler = {
  names: ['Generate Image'],

  async execute(request: LensRequest) {
    await generateImage(request.customPrompt || 'A beautiful scene', '16:9');
  },
};

export const editImageHandler: LensHandler = {
  names: ['Edit Image'],
  requiresFile: true,

  async execute(request: LensRequest) {
    if (!request.file) return;
    const fileData = await fileToBase64(request.file);
    await editImage(request.customPrompt || 'Enhance this image', {
      mimeType: fileData.mimeType,
      data: fileData.data,
    });
  },
};

export const transcribeAudioHandler: LensHandler = {
  names: ['Transcribe Audio'],
  requiresFile: true,

  async execute(request: LensRequest) {
    if (!request.file) return;
    const fileData = await fileToBase64(request.file);
    await transcribeAudio({mimeType: fileData.mimeType, data: fileData.data});
  },
};