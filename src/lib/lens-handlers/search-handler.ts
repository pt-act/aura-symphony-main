import {runSearchGroundedQuery} from '../../api/api';
import type {LensHandler, LensRequest} from './types';

export const webSearchHandler: LensHandler = {
  names: ['Web Search'],

  async execute(request: LensRequest) {
    await runSearchGroundedQuery(request.customPrompt || 'Latest news');
  },
};