import {generateCourseModules} from '../../api/api';
import type {LensHandler, LensRequest, LensContext} from './types';

export const courseHandler: LensHandler = {
  names: ['Curate Course'],

  async execute(request: LensRequest, context: LensContext) {
    const {videoState, courseState, setInsights} = context;
    const start = videoState.selectionStart ?? 0;
    const end = videoState.selectionEnd ?? videoState.duration;
    const frames = await videoState.asyncCaptureFrames(start, end);
    const courseData = await generateCourseModules(frames);
    courseState.setActiveCourse({title: 'Curated Course', ...courseData});
    setInsights((prev) => prev.filter((i) => i.id !== request.insightId));
  },
};