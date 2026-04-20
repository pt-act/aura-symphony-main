import {runPdfQuery} from '../../api/api';
import {fileToBase64} from '../utils';
import type {LensHandler, LensRequest, LensContext} from './types';

export const pdfHandler: LensHandler = {
  names: ['PDF Analysis'],
  requiresFile: true,

  async execute(request: LensRequest, context: LensContext) {
    if (!request.file) return;
    const fileData = await fileToBase64(request.file);
    await runPdfQuery(request.customPrompt || 'Summarize this document', {
      mimeType: fileData.mimeType,
      data: fileData.data,
    });
  },
};