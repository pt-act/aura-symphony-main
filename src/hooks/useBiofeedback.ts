import {useEffect, useRef, useState} from 'react';
import {usePerceptionEngine} from './usePerceptionEngine';

export function useBiofeedback(isManualMode: boolean) {
  const [cameraPermission, setCameraPermission] = useState<
    'prompt' | 'granted' | 'denied'
  >(() => (localStorage.getItem('cameraPermission') as any) || 'prompt');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const biofeedbackVideoRef = useRef<HTMLVideoElement>(null);
  const {expression, isLoading: isPerceptionLoading} =
    usePerceptionEngine(biofeedbackVideoRef);
  const [frustrationDuration, setFrustrationDuration] = useState(0);
  const frustrationTimer = useRef<number | null>(null);

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video: true});
      setCameraStream(stream);
      setCameraPermission('granted');
      localStorage.setItem('cameraPermission', 'granted');
    } catch (err) {
      console.error('Camera access denied:', err);
      setCameraPermission('denied');
      localStorage.setItem('cameraPermission', 'denied');
    }
  };

  useEffect(() => {
    if (cameraPermission === 'granted' && !cameraStream) {
      requestCamera();
    }

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraPermission, cameraStream]);

  // Effect to track frustration
  useEffect(() => {
    if (
      !isManualMode &&
      expression?.type === 'angry' &&
      expression.probability > 0.5
    ) {
      if (!frustrationTimer.current) {
        frustrationTimer.current = window.setInterval(() => {
          setFrustrationDuration((prev) => prev + 1);
        }, 1000);
      }
    } else {
      // Reset if not angry or if expression is lost
      if (frustrationTimer.current) {
        clearInterval(frustrationTimer.current);
        frustrationTimer.current = null;
      }
      setFrustrationDuration(0);
    }

    return () => {
      if (frustrationTimer.current) clearInterval(frustrationTimer.current);
    };
  }, [expression, isManualMode]);

  const handleAllowCamera = () => {
    requestCamera();
  };

  const handleDenyCamera = () => {
    setCameraPermission('denied');
    localStorage.setItem('cameraPermission', 'denied');
  };

  return {
    cameraPermission,
    cameraStream,
    biofeedbackVideoRef,
    expression,
    isPerceptionLoading,
    frustrationDuration,
    setFrustrationDuration,
    frustrationTimer,
    handleAllowCamera,
    handleDenyCamera,
  };
}
