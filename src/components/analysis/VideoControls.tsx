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
import React from 'react';
import { Download } from 'lucide-react';

interface VideoControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onFrameStep: (direction: 'forward' | 'backward') => void;
  currentSpeed: number;
  onSpeedChange: (speed: number) => void;
  onExportNLE?: () => void;
}

const speeds = [0.5, 1, 1.5, 2];

export default function VideoControls({
  isPlaying,
  onPlayPause,
  onFrameStep,
  currentSpeed,
  onSpeedChange,
  onExportNLE,
}: VideoControlsProps) {
  return (
    <div className="video-controls">
      <button
        onClick={() => onFrameStep('backward')}
        title="Frame backward"
        aria-label="Frame backward">
        <span className="icon">skip_previous</span>
      </button>
      <button
        onClick={onPlayPause}
        title={isPlaying ? 'Pause' : 'Play'}
        aria-label={isPlaying ? 'Pause' : 'Play'}>
        <span className="icon">{isPlaying ? 'pause' : 'play_arrow'}</span>
      </button>
      <button
        onClick={() => onFrameStep('forward')}
        title="Frame forward"
        aria-label="Frame forward">
        <span className="icon">skip_next</span>
      </button>
      <div className="speed-controls">
        {speeds.map((speed) => (
          <button
            key={speed}
            className={c({active: currentSpeed === speed})}
            onClick={() => onSpeedChange(speed)}
            aria-label={`Set playback speed to ${speed}x`}>
            {speed}x
          </button>
        ))}
      </div>
      {onExportNLE && (
        <button 
          className="export-nle-btn" 
          onClick={onExportNLE}
          title="Export to NLE (FCPXML)"
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Download size={16} />
          <span>Export NLE</span>
        </button>
      )}
    </div>
  );
}