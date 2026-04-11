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

import c from 'classnames';
import React, {useEffect} from 'react';

interface BiofeedbackMonitorProps {
  stream: MediaStream;
  videoRef: React.RefObject<HTMLVideoElement>;
  isLoading: boolean;
  expression?: string;
}

export default function BiofeedbackMonitor({
  stream,
  videoRef,
  isLoading,
  expression = 'neutral',
}: BiofeedbackMonitorProps) {
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoRef]);

  return (
    <div
      className={c('biofeedback-monitor', expression)}
      title={`Aura is active. Status: ${isLoading ? 'Initializing...' : expression}`}>
      {isLoading && (
        <div className="loader-overlay">
          <div className="spinner"></div>
        </div>
      )}
      <video ref={videoRef} autoPlay playsInline muted />
    </div>
  );
}