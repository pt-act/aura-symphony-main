import {useCallback, type Dispatch, type SetStateAction, type MutableRefObject} from 'react';
import modes from '../lib/modes';
import {VIRTUOSO_REGISTRY} from '../services/virtuosos';
import {useCriticGate} from './useCriticGate';
import {resolveHandler} from '../lib/lens-handlers/registry';
import type {Insight} from '../types';
import type {VideoStateSlice, CourseStateSlice, LensContext, LensRequest} from '../lib/lens-handlers/types';

interface Deps {
  insights: Insight[];
  setInsights: Dispatch<SetStateAction<Insight[]>>;
  nextInsightId: MutableRefObject<number>;
  setError: (err: string | null) => void;
  videoState: VideoStateSlice;
  courseState: CourseStateSlice;
}

/**
 * Encapsulates lens/mode execution logic using the Strategy pattern.
 *
 * Each lens type is a standalone handler in lib/lens-handlers/.
 * This hook provides a thin dispatcher that resolves the handler and invokes it.
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

      if (!mode && modeName !== 'Custom' && modeName !== 'PDF Analysis' && !customVirtuoso) return;

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

      const context: LensContext = {insights, setInsights, nextInsightId, setError, videoState, courseState, criticGate};
      const request: LensRequest = {modeName, customPrompt, file, insightId: id, title};

      try {
        const handler = resolveHandler(modeName);
        await handler.execute(request, context);
      } catch (err: any) {
        console.error(err);
        setError(`Failed to process lens: ${err.message}`);
        setInsights((prev) => prev.filter((i) => i.id !== id));
      }
    },
    [insights, setInsights, nextInsightId, setError, videoState, courseState, criticGate],
  );

  return {handleSelectLens};
}
