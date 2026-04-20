import {runVideoQuery} from '../../api/api';
import getFunctions from '../functions';
import modes from '../modes';
import {VIRTUOSO_REGISTRY} from '../../services/virtuosos';
import type {LensHandler, LensRequest, LensContext} from './types';

/**
 * Default handler for all video-frame-based analysis lenses.
 * Captures frames, runs Gemini Vision with function calling,
 * and gates text output through the Critic.
 */
export const videoAnalysisHandler: LensHandler = {
  // This handler is the fallback — it handles any mode not claimed by a specific handler
  names: ['__default__'],

  async execute(request: LensRequest, context: LensContext) {
    const {modeName, customPrompt, insightId, title} = request;
    const {videoState, setInsights, criticGate} = context;

    const mode = modes[modeName as keyof typeof modes];
    const customVirtuoso = Object.values(VIRTUOSO_REGISTRY).find(
      (v) => v.name === modeName || v.id === modeName,
    );

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
            i.id === insightId ? {...i, data: args.timecodes, isLoading: false} : i,
          ),
        );
      },
      set_timecodes_with_objects: (args: any) => {
        setInsights((prev) =>
          prev.map((i) =>
            i.id === insightId ? {...i, data: args.timecodes, isLoading: false} : i,
          ),
        );
      },
      set_timecodes_with_numeric_values: (args: any) => {
        setInsights((prev) =>
          prev.map((i) =>
            i.id === insightId ? {...i, data: args.timecodes, isLoading: false} : i,
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
      const gated = await criticGate(prompt, response.text, customVirtuoso?.id || modeName);
      setInsights((prev) =>
        prev.map((i) =>
          i.id === insightId
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
  },
};