import {useCallback, type Dispatch, type SetStateAction, type MutableRefObject} from 'react';
import {
  runPdfQuery,
  runVideoQuery,
  generateVideo,
  runChat,
  generateCourseModules,
  generateImage,
  editImage,
  runSearchGroundedQuery,
  transcribeAudio,
} from '../api/api';
import getFunctions from '../lib/functions';
import modes from '../lib/modes';
import {fileToBase64} from '../lib/utils';
import {VIRTUOSO_REGISTRY} from '../services/virtuosos';
import {useCriticGate} from './useCriticGate';
import type {ChatMessage, Insight} from '../types';

interface VideoStateSlice {
  selectionStart: number | null;
  selectionEnd: number | null;
  duration: number;
  asyncCaptureFrames: (start: number, end: number, maxFrames?: number) => Promise<string[]>;
}

interface CourseStateSlice {
  setActiveCourse: (course: any) => void;
}

interface Deps {
  insights: Insight[];
  setInsights: Dispatch<SetStateAction<Insight[]>>;
  nextInsightId: MutableRefObject<number>;
  setError: (err: string | null) => void;
  videoState: VideoStateSlice;
  courseState: CourseStateSlice;
}

/**
 * Encapsulates lens/mode execution logic (the handleSelectLens function).
 * Extracted from useAnalysisState to reduce hook complexity.
 */
export function useLensExecution(deps: Deps) {
  const {insights, setInsights, nextInsightId, setError, videoState, courseState} = deps;
  const {criticGate} = useCriticGate();

  const handleSelectLens = useCallback(
    async (modeName: string, customPrompt?: string, file?: File) => {
      const mode = modes[modeName as keyof typeof modes];
      const customVirtuoso = Object.values(VIRTUOSO_REGISTRY).find(
        (v) => v.name === modeName || v.id === modeName,
      );
      const isCustomVirtuoso = !!customVirtuoso;

      if (!mode && modeName !== 'Custom' && modeName !== 'PDF Analysis' && !isCustomVirtuoso) return;

      const id = nextInsightId.current++;
      const title =
        modeName === 'Custom'
          ? customPrompt || 'Custom Analysis'
          : modeName === 'PDF Analysis'
            ? `PDF: ${file?.name}`
            : customVirtuoso
              ? customVirtuoso.name
              : modeName || 'Analysis';

      const newInsight: Insight = {
        id,
        type: modeName as any,
        title,
        data: null,
        isLoading: true,
        isList: mode?.isList || false,
      };

      setInsights((prev) => [newInsight, ...prev]);

      try {
        if (modeName === 'PDF Analysis' && file) {
          const fileData = await fileToBase64(file);
          await runPdfQuery(customPrompt || 'Summarize this document', {
            mimeType: fileData.mimeType,
            data: fileData.data,
          });
        } else if (modeName === 'Chat') {
          const initialHistory: ChatMessage[] = [];
          let fileData;
          if (file) {
            fileData = await fileToBase64(file);
            initialHistory.push({
              role: 'user',
              text: customPrompt || 'Analyze this file.',
              file: fileData,
            });
          } else {
            initialHistory.push({
              role: 'user',
              text: customPrompt || 'Hello',
            });
          }
          setInsights((prev) =>
            prev.map((i) =>
              i.id === id ? {...i, data: initialHistory, isLoading: true} : i,
            ),
          );

          const otherInsights = insights.filter(
            (i) => i.id !== id && i.type !== 'Chat' && i.data && !i.isLoading,
          );
          const contextString = otherInsights
            .map((i) => {
              if (typeof i.data === 'string') return `**${i.title}**\n${i.data}`;
              return '';
            })
            .filter(Boolean)
            .join('\n\n---\n\n');

          const responseText = await runChat(customPrompt || 'Hello', [], contextString);
          const newModelMessage: ChatMessage = {role: 'model', text: responseText};
          setInsights((prev) =>
            prev.map((i) =>
              i.id === id
                ? {
                    ...i,
                    data: [...initialHistory, newModelMessage],
                    isLoading: false,
                  }
                : i,
            ),
          );
        } else if (modeName === 'Generate Video') {
          let image;
          if (file) {
            const fileData = await fileToBase64(file);
            image = {mimeType: fileData.mimeType, data: fileData.data};
          }
          generateVideo(id, customPrompt || 'A beautiful scene', '16:9', image);
        } else if (modeName === 'Generate Image') {
          await generateImage(customPrompt || 'A beautiful scene', '16:9');
        } else if (modeName === 'Edit Image' && file) {
          const fileData = await fileToBase64(file);
          await editImage(customPrompt || 'Enhance this image', {
            mimeType: fileData.mimeType,
            data: fileData.data,
          });
        } else if (modeName === 'Web Search') {
          await runSearchGroundedQuery(customPrompt || 'Latest news');
        } else if (modeName === 'Transcribe Audio' && file) {
          const fileData = await fileToBase64(file);
          await transcribeAudio({mimeType: fileData.mimeType, data: fileData.data});
        } else if (modeName === 'Curate Course') {
          const start = videoState.selectionStart ?? 0;
          const end = videoState.selectionEnd ?? videoState.duration;
          const frames = await videoState.asyncCaptureFrames(start, end);
          const courseData = await generateCourseModules(frames);
          courseState.setActiveCourse({title: 'Curated Course', ...courseData});
          setInsights((prev) => prev.filter((i) => i.id !== id));
        } else {
          const start = videoState.selectionStart ?? 0;
          const end = videoState.selectionEnd ?? videoState.duration;
          const frames = await videoState.asyncCaptureFrames(start, end);

          const prompt =
            customPrompt ||
            (typeof mode?.prompt === 'function' ? mode.prompt(customPrompt || '') : mode?.prompt) ||
            '';
          const functions = getFunctions({
            set_timecodes: (args: any) => {
              setInsights((prev) =>
                prev.map((i) =>
                  i.id === id ? {...i, data: args.timecodes, isLoading: false} : i,
                ),
              );
            },
            set_timecodes_with_objects: (args: any) => {
              setInsights((prev) =>
                prev.map((i) =>
                  i.id === id ? {...i, data: args.timecodes, isLoading: false} : i,
                ),
              );
            },
            set_timecodes_with_numeric_values: (args: any) => {
              setInsights((prev) =>
                prev.map((i) =>
                  i.id === id ? {...i, data: args.timecodes, isLoading: false} : i,
                ),
              );
            },
          });
          const response = await runVideoQuery(
            prompt,
            frames,
            functions as any,
            modeName === 'Deep Analysis',
            customVirtuoso?.id || modeName,
          );

          const functionCalls = response.functionCalls;
          if (functionCalls && functionCalls.length > 0) {
            for (const call of functionCalls) {
              const fn = functions.find((f) => f.name === call.name);
              if (fn && fn.callback) {
                fn.callback(call.args);
              }
            }
          } else if (response.text) {
            // Gate text output through Critic before display
            const gated = await criticGate(prompt, response.text, customVirtuoso?.id || modeName);
            setInsights((prev) =>
              prev.map((i) =>
                i.id === id
                  ? {
                      ...i,
                      data: gated.output,
                      isLoading: false,
                      ...(gated.wasRevised ? {title: `${title} (revised)`} : {}),
                    }
                  : i,
              ),
            );
          }
        }
      } catch (err: any) {
        console.error(err);
        setError(`Failed to process lens: ${err.message}`);
        setInsights((prev) => prev.filter((i) => i.id !== id));
      }
    },
    [insights, setInsights, nextInsightId, setError, videoState, courseState],
  );

  return {handleSelectLens};
}
