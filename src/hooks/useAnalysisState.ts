import {useState, useRef, useEffect} from 'react';
import {
  runConductorQuery,
  runVideoQuery,
  runChat,
} from '../api/api';
import getFunctions from '../lib/functions';
import {fileToBase64, convertInsightToMarkdown} from '../lib/utils';
import {symphonyBus} from '../lib/symphonyBus';
import {validateConductorCall, buildCorrectionPrompt, logValidationFailure, ValidationFailure} from '../lib/conductor-validator';
import {logConductorQuery, startTimer} from '../lib/telemetry';
import {isComplexQuery, executeReactPlan, type ReactPlan} from '../lib/react-planner';
import type {ChatMessage, Insight} from '../types';

import {useVideoState} from './useVideoState';
import {useAnnotationsState} from './useAnnotationsState';
import {useCourseState} from './useCourseState';
import {useVectorSearch} from './useVectorSearch';
import {useLensExecution} from './useLensExecution';
import {useGraphKnowledge} from './useGraphKnowledge';
import {VIRTUOSO_REGISTRY} from '../services/virtuosos';

export function useAnalysisState(
  user: any,
  setError: (err: string | null) => void,
  setIsLoading: (loading: boolean) => void,
  onSendToCreator: (insight: Insight) => void,
) {
  const videoState = useVideoState();
  const annotationsState = useAnnotationsState();
  const courseState = useCourseState();
  const {tryVectorSearch, addAnnotations} = useVectorSearch(videoState, annotationsState);
  const graphKnowledge = useGraphKnowledge(user?.uid);

  const [insights, setInsights] = useState<Insight[]>([]);
  const [isConductorLoading, setIsConductorLoading] = useState(false);
  const [activePlan, setActivePlan] = useState<ReactPlan | null>(null);
  const nextInsightId = useRef(0);

  useEffect(() => {
    setInsights((prev) =>
      prev.map((i) => {
        if (i.type === 'Annotations') return {...i, data: annotationsState.annotations};
        if (i.type === 'DLP') return {...i, data: courseState.dlp};
        return i;
      }),
    );
  }, [annotationsState.annotations, courseState.dlp]);

  const handleVideoLoaded = (url: string) => {
    videoState.setVideoUrl(url);
    setInsights([
      {
        id: nextInsightId.current++,
        type: 'Annotations',
        title: 'Annotations',
        data: annotationsState.annotations,
        isLoading: false,
      },
      {
        id: nextInsightId.current++,
        type: 'DLP',
        title: 'Digital Learner Profile',
        data: courseState.dlp,
        isLoading: false,
      },
    ]);
  };

  const {handleSelectLens} = useLensExecution({
    insights,
    setInsights,
    nextInsightId,
    setError,
    videoState,
    courseState,
  });

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  /**
   * Validates and executes a single Conductor function call.
   * Returns true if execution succeeded, false if validation/execution failed.
   * On validation failure, builds a correction prompt for re-querying.
   *
   * Uses commission chaining for multi-step delegations: when the Conductor
   * invokes applyLens or search_video, it creates a parent→child chain
   * via symphonyBus.chainCommission, enabling observable agent-to-agent delegation.
   */
  const executeValidatedCall = async (
    call: { name: string; args: any },
    spokenTextRef: { current: string },
    parentTaskId?: string | number,
  ): Promise<boolean> => {
    const validation = validateConductorCall(call.name, call.args);

    if (!validation.success) {
      logValidationFailure(call.name, (validation as any).errors, call.args);
      return false;
    }

    const args = (validation as any).args;

    switch (call.name) {
      case 'applyLens': {
        if (!spokenTextRef.current) spokenTextRef.current = `Applying the ${args.lensName} lens.`;
        // Chain: Conductor → target Virtuoso
        if (parentTaskId) {
          const targetVirtuoso = Object.values(VIRTUOSO_REGISTRY).find(
            (v) => v.name === args.lensName || v.id === args.lensName,
          );
          if (targetVirtuoso) {
            symphonyBus.chainCommission(
              parentTaskId,
              targetVirtuoso.id as any,
              `Lens: ${args.lensName}`,
              { customPrompt: args.customPrompt },
            );
          }
        }
        await handleSelectLens(args.lensName, args.customPrompt);
        break;
      }
      case 'seekToTime':
        if (!spokenTextRef.current) spokenTextRef.current = `Seeking to ${args.timeInSeconds} seconds.`;
        videoState.jumpToTimecode(args.timeInSeconds);
        break;
      case 'setPlaybackSpeed':
        if (!spokenTextRef.current) spokenTextRef.current = `Setting playback speed to ${args.speed}.`;
        if (videoState.videoRef.current) {
          videoState.videoRef.current.playbackRate = args.speed;
          videoState.setPlaybackSpeed(args.speed);
        }
        break;
      case 'addAnnotation':
        if (!spokenTextRef.current) spokenTextRef.current = `Adding annotation.`;
        annotationsState.handleAddAnnotation(args.timeInSeconds, args.text);
        break;
      case 'setSelectionRange':
        if (!spokenTextRef.current) spokenTextRef.current = `Setting selection range.`;
        videoState.setSelectionStart(args.startTime);
        videoState.setSelectionEnd(args.endTime);
        break;
      case 'launch_valhalla':
        if (!spokenTextRef.current) spokenTextRef.current = `Launching Valhalla Gateway for ${args.tool}.`;
        symphonyBus.dispatchEvent(new CustomEvent('LAUNCH_VALHALLA', {
          detail: { tool: args.tool },
        }));
        break;
      case 'web_search': {
        if (!spokenTextRef.current) spokenTextRef.current = `Searching the web for "${args.query}".`;
        // Chain: Conductor → Scholar
        if (parentTaskId) {
          symphonyBus.chainCommission(parentTaskId, 'scholar' as any, `Web Search: ${args.query}`, { query: args.query });
        }
        await handleSelectLens('Web Search', args.query);
        break;
      }
      case 'search_video': {
        if (!spokenTextRef.current) spokenTextRef.current = `Searching video for ${args.query}.`;
        // Chain: Conductor → Visionary (video search)
        if (parentTaskId) {
          symphonyBus.chainCommission(parentTaskId, 'visionary' as any, `Video Search: ${args.query}`, { query: args.query });
        }
        await handleSearchVideo(args.query);
        break;
      }
      default:
        console.warn(`[Conductor] Unhandled function call: ${call.name}`);
        return false;
    }
    return true;
  };

  /**
   * Handles complex queries using the ReAct (Reason + Act) planner.
   * Generates a multi-step plan and executes it sequentially, adapting
   * as intermediate results arrive.
   */
  const handleReactQuery = async (query: string) => {
    setIsConductorLoading(true);
    setActivePlan(null);

    try {
      const spokenTextRef = { current: '' };

      const plan = await executeReactPlan(
        query,
        async (call, parentTaskId) => {
          return executeValidatedCall(call, spokenTextRef, parentTaskId);
        },
        (updatedPlan) => {
          setActivePlan({ ...updatedPlan, steps: [...updatedPlan.steps] });
        },
      );

      if (spokenTextRef.current) {
        speak(spokenTextRef.current);
      }

      setActivePlan(plan);
    } catch (err: any) {
      console.error(err);
      setError(`Conductor (ReAct) error: ${err.message}`);
    } finally {
      setIsConductorLoading(false);
    }
  };

  /**
   * Main Conductor query handler.
   * Routes complex queries to the ReAct planner, simple queries to
   * the single-pass dispatcher.
   */
  const handleConductorQuery = async (query: string) => {
    // Route complex queries through ReAct planner
    if (isComplexQuery(query)) {
      return handleReactQuery(query);
    }

    // ── Simple single-pass dispatch (existing behavior) ───────
    const MAX_RETRIES = 2;
    setIsConductorLoading(true);

    // Commission the Conductor as the parent task
    const conductorTaskId = symphonyBus.commission('conductor' as any, `Query: ${query.slice(0, 50)}…`);
    const timer = startTimer();

    try {
      let currentQuery = query;
      let attempt = 0;
      let response: any;

      while (attempt <= MAX_RETRIES) {
        response = await runConductorQuery(currentQuery);
        const functionCalls = response.functionCalls;
        const spokenTextRef = { current: response.text || '' };

        if (functionCalls && functionCalls.length > 0) {
          // Validate all calls before executing any
          const invalidCalls: { name: string; args: any; errors: any[] }[] = [];

          for (const call of functionCalls) {
            const validation = validateConductorCall(call.name, call.args);
            if (!validation.success) {
              const failedValidation = validation as ValidationFailure;
              invalidCalls.push({
                name: call.name,
                args: call.args,
                errors: failedValidation.errors,
              });
              logValidationFailure(call.name, failedValidation.errors, call.args);
            }
          }

          if (invalidCalls.length > 0 && attempt < MAX_RETRIES) {
            const corrections = invalidCalls
              .map((ic) => buildCorrectionPrompt(ic.name, ic.args, ic.errors))
              .join('\n\n');
            currentQuery = `${query}\n\n[Validation Error — please correct your function calls:\n${corrections}]`;
            attempt++;
            continue;
          }

          // Log the Conductor query with telemetry
          logConductorQuery(query, functionCalls.map((c: any) => c.name), attempt, timer.elapsed());

          // Execute valid calls with commission chaining
          for (const call of functionCalls) {
            await executeValidatedCall(call, spokenTextRef, conductorTaskId);
          }

          if (spokenTextRef.current) {
            speak(spokenTextRef.current);
          }
        } else {
          if (response.text) {
            speak(response.text);
          }
        }

        // Report success on the parent task
        symphonyBus.reportResult(conductorTaskId, 'conductor', true, { functionCalls: functionCalls?.length ?? 0, text: !!response.text }, timer.elapsed());
        break; // Success or final attempt — exit loop
      }
    } catch (err: any) {
      console.error(err);
      setError(`Conductor error: ${err.message}`);
      symphonyBus.reportResult(conductorTaskId, 'conductor', false, err.message, timer.elapsed());
    } finally {
      setIsConductorLoading(false);
    }
  };

  /**
   * Handles the search_video conductor function.
   * Tries vector search first (O(log n)), falls back to frame capture (O(n)).
   */
  const handleSearchVideo = async (query: string) => {
    const insightId = Date.now();
    setInsights((prev) => [
      {
        id: insightId,
        title: `Search: "${query}"`,
        data: null,
        isLoading: true,
        isList: false,
        type: 'Chat',
      },
      ...prev,
    ]);

    // ── Fast path: vector search ───────────────────────────────
    const vectorResult = await tryVectorSearch(query);
    if (vectorResult) {
      addAnnotations(vectorResult.timecodes);
      setInsights((prev) =>
        prev.map((i) =>
          i.id === insightId
            ? {
                ...i,
                data: vectorResult.timecodes,
                isLoading: false,
                isList: true,
                title: `Search: "${query}" (${vectorResult.searchTimeMs.toFixed(0)}ms, vector)`,
              }
            : i,
        ),
      );
      return;
    }

    // ── Fallback path: frame capture + Gemini Vision ───────────
    const frames = await videoState.asyncCaptureFrames(0, videoState.duration, 30);

    const prompt = `Find all occurrences of "${query}" in the video. Use the set_timecodes function to return a list of timestamps and a brief description of what is happening at that moment.`;

    const functions = getFunctions({
      set_timecodes: (fnArgs: any) => {
        fnArgs.timecodes.forEach((tc: any) => {
          let seconds = 0;
          if (typeof tc.time === 'string' && tc.time.includes(':')) {
            const parts = tc.time.split(':');
            seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
          } else {
            seconds = parseFloat(tc.time);
          }
          if (!isNaN(seconds)) {
            annotationsState.handleAddAnnotation(seconds, tc.text);
          }
        });

        setInsights((prev) =>
          prev.map((i) =>
            i.id === insightId ? {...i, data: fnArgs.timecodes, isLoading: false, isList: true} : i,
          ),
        );
      },
      set_timecodes_with_objects: () => {},
      set_timecodes_with_numeric_values: () => {},
    });

    try {
      const response = await runVideoQuery(prompt, frames, functions as any, true);
      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        for (const fnCall of functionCalls) {
          const fn = functions.find((f) => f.name === fnCall.name);
          if (fn && fn.callback) {
            fn.callback(fnCall.args);
          }
        }
      } else {
        setInsights((prev) =>
          prev.map((i) =>
            i.id === insightId ? {...i, data: response.text, isLoading: false} : i,
          ),
        );
      }
    } catch (err: any) {
      setInsights((prev) =>
        prev.map((i) =>
          i.id === insightId ? {...i, data: `Search failed: ${err.message}`, isLoading: false} : i,
        ),
      );
    }
  };

  const handleCloseInsight = (id: number) => {
    setInsights((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSendMessage = async (
    insightId: number,
    history: ChatMessage[],
    message: string,
    file?: File,
  ) => {
    const insight = insights.find((i) => i.id === insightId);
    if (!insight) return;

    const newUserMessage: ChatMessage = {role: 'user', text: message};
    let fileData;
    if (file) {
      fileData = await fileToBase64(file);
      newUserMessage.file = fileData;
    }

    const updatedHistory = [...history, newUserMessage];
    setInsights((prev) =>
      prev.map((i) =>
        i.id === insightId
          ? {...i, data: updatedHistory, isLoading: true}
          : i,
      ),
    );

    const otherInsights = insights.filter(
      (i) => i.id !== insightId && i.type !== 'Chat' && i.data && !i.isLoading,
    );

    const contextString = otherInsights
      .map(convertInsightToMarkdown)
      .filter(Boolean)
      .join('\n\n---\n\n');

    try {
      const responseText = await runChat(
        message,
        history,
        contextString,
      );
      const newModelMessage: ChatMessage = {role: 'model', text: responseText};
      setInsights((prev) =>
        prev.map((i) =>
          i.id === insightId
            ? {
                ...i,
                data: [...updatedHistory, newModelMessage],
                isLoading: false,
              }
            : i,
        ),
      );
    } catch (err) {
      console.error(err);
      setError('Failed to get chat response.');
      setInsights((prev) =>
        prev.map((i) =>
          i.id === insightId ? {...i, isLoading: false} : i,
        ),
      );
    }
  };

  return {
    ...videoState,
    ...annotationsState,
    ...courseState,
    insights,
    setInsights,
    isConductorLoading,
    activePlan,
    handleVideoLoaded,
    handleSelectLens,
    handleConductorQuery,
    handleCloseInsight,
    handleSendMessage,
    graphKnowledge,
  };
}
