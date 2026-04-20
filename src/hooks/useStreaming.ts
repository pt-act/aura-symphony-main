/**
 * useStreaming Hook
 *
 * Provides React state management for streaming Virtuoso responses.
 * Wraps the streaming API to automatically update Insight data as
 * chunks arrive, giving users real-time feedback.
 *
 * Usage:
 *   const { streamToInsight, isStreaming, abortStream } = useStreaming(setInsights);
 *   await streamToInsight(insightId, () => streamSearchQuery(prompt, streamOpts));
 */

import { useState, useCallback, useRef, type Dispatch, type SetStateAction } from 'react';
import {
  createStreamController,
  type StreamOptions,
  type StreamChunkCallback,
} from '../api/streaming';
import type { Insight } from '../types';

export interface UseStreamingResult {
  /** Whether a stream is currently active. */
  isStreaming: boolean;
  /** Abort the current stream. */
  abortStream: () => void;
  /**
   * Creates StreamOptions wired to update an Insight in real-time.
   * Pass to any streaming API function.
   */
  createInsightStreamOptions: (
    insightId: number,
    opts?: { onComplete?: (text: string) => void },
  ) => StreamOptions;
  /**
   * Creates StreamOptions for chat-style streaming where data is
   * appended to a ChatMessage array.
   */
  createChatStreamOptions: (
    insightId: number,
    existingHistory: any[],
  ) => StreamOptions;
}

export function useStreaming(
  setInsights: Dispatch<SetStateAction<Insight[]>>,
): UseStreamingResult {
  const [isStreaming, setIsStreaming] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const abortStream = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setIsStreaming(false);
  }, []);

  /**
   * Creates StreamOptions that pipe chunks directly into an Insight's data field.
   */
  const createInsightStreamOptions = useCallback(
    (insightId: number, opts?: { onComplete?: (text: string) => void }): StreamOptions => {
      const { controller, signal } = createStreamController();
      controllerRef.current = controller;
      setIsStreaming(true);

      return {
        signal,
        onChunk: (_chunk: string, accumulated: string) => {
          setInsights((prev) =>
            prev.map((i) =>
              i.id === insightId
                ? { ...i, data: accumulated, isLoading: true }
                : i,
            ),
          );
        },
        onComplete: (fullText: string) => {
          setInsights((prev) =>
            prev.map((i) =>
              i.id === insightId
                ? { ...i, data: fullText, isLoading: false }
                : i,
            ),
          );
          setIsStreaming(false);
          controllerRef.current = null;
          opts?.onComplete?.(fullText);
        },
        onError: (error: Error) => {
          setInsights((prev) =>
            prev.map((i) =>
              i.id === insightId
                ? { ...i, data: `Streaming error: ${error.message}`, isLoading: false }
                : i,
            ),
          );
          setIsStreaming(false);
          controllerRef.current = null;
        },
      };
    },
    [setInsights],
  );

  /**
   * Creates StreamOptions for chat messages, where the streaming text
   * is appended as a new model message to the history array.
   */
  const createChatStreamOptions = useCallback(
    (insightId: number, existingHistory: any[]): StreamOptions => {
      const { controller, signal } = createStreamController();
      controllerRef.current = controller;
      setIsStreaming(true);

      return {
        signal,
        onChunk: (_chunk: string, accumulated: string) => {
          const streamingMessage = { role: 'model' as const, text: accumulated };
          setInsights((prev) =>
            prev.map((i) =>
              i.id === insightId
                ? { ...i, data: [...existingHistory, streamingMessage], isLoading: true }
                : i,
            ),
          );
        },
        onComplete: (fullText: string) => {
          const finalMessage = { role: 'model' as const, text: fullText };
          setInsights((prev) =>
            prev.map((i) =>
              i.id === insightId
                ? { ...i, data: [...existingHistory, finalMessage], isLoading: false }
                : i,
            ),
          );
          setIsStreaming(false);
          controllerRef.current = null;
        },
        onError: (error: Error) => {
          const errorMessage = { role: 'model' as const, text: `Error: ${error.message}` };
          setInsights((prev) =>
            prev.map((i) =>
              i.id === insightId
                ? { ...i, data: [...existingHistory, errorMessage], isLoading: false }
                : i,
            ),
          );
          setIsStreaming(false);
          controllerRef.current = null;
        },
      };
    },
    [setInsights],
  );

  return {
    isStreaming,
    abortStream,
    createInsightStreamOptions,
    createChatStreamOptions,
  };
}