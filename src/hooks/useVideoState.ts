import {useState, useRef, useCallback, useEffect} from 'react';
import MediaWorker from '../workers/media.worker?worker';
import {useMediaPipeline} from './useMediaPipeline';

const FRAME_CAPTURE_INTERVAL_MS = 1000;
const MAX_FRAMES = 60;

let mediaWorkerInstance: Worker | null = null;

export function useVideoState() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!mediaWorkerInstance) {
      mediaWorkerInstance = new MediaWorker();
    }
  }, []);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleFrameStep = useCallback((forward: boolean) => {
    if (videoRef.current) {
      const frameTime = 1 / 30;
      videoRef.current.currentTime += forward ? frameTime : -frameTime;
    }
  }, []);

  const handleSpeedChange = useCallback(() => {
    if (videoRef.current) {
      const newSpeed = playbackSpeed >= 2 ? 0.5 : playbackSpeed + 0.5;
      videoRef.current.playbackRate = newSpeed;
      setPlaybackSpeed(newSpeed);
    }
  }, [playbackSpeed]);

  const jumpToTimecode = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const asyncCaptureFrames = useCallback(
    async (start: number, end: number, maxFrames: number = 30): Promise<string[]> => {
      if (!videoRef.current || !mediaWorkerInstance) return [];
      const video = videoRef.current;

      const duration = end - start;
      const interval = Math.max(1, duration / maxFrames);
      const originalTime = video.currentTime;
      const wasPlaying = !video.paused;

      if (wasPlaying) video.pause();

      const bitmaps: ImageBitmap[] = [];

      for (let t = start; t <= end; t += interval) {
        await new Promise<void>((resolve) => {
          const onSeeked = () => {
            video.removeEventListener('seeked', onSeeked);
            resolve();
          };
          video.addEventListener('seeked', onSeeked);
          video.currentTime = t;
        });
        
        const bitmap = await createImageBitmap(video);
        bitmaps.push(bitmap);
      }

      video.currentTime = originalTime;
      if (wasPlaying) video.play();

      return new Promise((resolve, reject) => {
        const taskId = Date.now().toString();
        
        const handleMessage = (e: MessageEvent) => {
          if (e.data.id === taskId) {
            if (e.data.type === 'PROCESS_FRAMES_RESULT') {
              mediaWorkerInstance?.removeEventListener('message', handleMessage);
              resolve(e.data.payload);
            } else if (e.data.type === 'PROCESS_FRAMES_ERROR') {
              mediaWorkerInstance?.removeEventListener('message', handleMessage);
              reject(new Error(e.data.payload));
            }
          }
        };

        mediaWorkerInstance?.addEventListener('message', handleMessage);
        mediaWorkerInstance?.postMessage(
          { type: 'PROCESS_FRAMES', payload: { bitmaps, quality: 0.5 }, id: taskId },
          bitmaps
        );
      });
    },
    []
  );

  // Cloud-first frame capture (uses media pipeline if available, falls back to local)
  const {captureFrames: captureFramesCloud} = useMediaPipeline(asyncCaptureFrames);

  return {
    videoUrl,
    setVideoUrl,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    selectionStart,
    setSelectionStart,
    selectionEnd,
    setSelectionEnd,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    videoRef,
    canvasRef,
    handlePlayPause,
    handleFrameStep,
    handleSpeedChange,
    jumpToTimecode,
    asyncCaptureFrames,
    captureFramesCloud,
  };
}
