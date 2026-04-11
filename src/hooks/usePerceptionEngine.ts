/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as faceapi from 'face-api.js';
import React, {useEffect, useRef, useState} from 'react';

// URL where face-api.js models are hosted
const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/weights';

export const usePerceptionEngine = (
  videoRef: React.RefObject<HTMLVideoElement>,
) => {
  const [isLoading, setIsLoading] = useState(true);
  const [expression, setExpression] = useState<{
    type: string;
    probability: number;
  } | null>(null);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    const loadModels = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
      } catch (error) {
        console.error('Failed to load face-api models:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  useEffect(() => {
    if (isLoading || !videoRef.current) return;

    const video = videoRef.current;
    // Ensure video is ready before starting detection
    if (video.readyState < 3) {
      return;
    }

    const detect = async () => {
      if (!videoRef.current) return;
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections.length > 0) {
        const expressions = detections[0].expressions;
        const bestMatch = Object.entries(expressions).reduce((a, b) =>
          a[1] > b[1] ? a : b,
        );
        setExpression({type: bestMatch[0], probability: bestMatch[1] as number});
      } else {
        setExpression(null);
      }
    };

    intervalRef.current = window.setInterval(detect, 1500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLoading, videoRef, videoRef.current?.readyState]);

  return {isLoading, expression};
};