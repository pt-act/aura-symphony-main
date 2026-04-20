/**
 * Lens Handler Strategy Interface
 *
 * Each lens type implements this contract. The dispatcher
 * is a ~20-line lookup that delegates to the matched handler.
 */
import type {Dispatch, SetStateAction, MutableRefObject} from 'react';
import type {Insight} from '../../types';

export interface VideoStateSlice {
  selectionStart: number | null;
  selectionEnd: number | null;
  duration: number;
  asyncCaptureFrames: (start: number, end: number, maxFrames?: number) => Promise<string[]>;
}

export interface CourseStateSlice {
  setActiveCourse: (course: any) => void;
}

export interface LensContext {
  insights: Insight[];
  setInsights: Dispatch<SetStateAction<Insight[]>>;
  nextInsightId: MutableRefObject<number>;
  setError: (err: string | null) => void;
  videoState: VideoStateSlice;
  courseState: CourseStateSlice;
  /** Critic quality gate function */
  criticGate: (prompt: string, output: string, type: string, retryFn?: (p: string) => Promise<string>) => Promise<{output: string; evaluation: any; wasRevised: boolean}>;
}

export interface LensRequest {
  modeName: string;
  customPrompt?: string;
  file?: File;
  insightId: number;
  title: string;
}

export interface LensHandler {
  /** Unique name(s) this handler responds to */
  readonly names: string[];
  /** Whether this handler requires a file upload */
  readonly requiresFile?: boolean;
  /** Execute the lens */
  execute(request: LensRequest, context: LensContext): Promise<void>;
}