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

import {AnimatePresence, motion} from 'framer-motion';
import React, {useEffect, useRef, useState} from 'react';
import type {Mode} from '../../types';
import {fileToBase64} from '../../lib/utils';

interface LensPromptModalProps {
  isOpen: boolean;
  mode: Mode | null;
  onClose: () => void;
  onSubmit: (
    prompt: string,
    options: {
      aspectRatio?: '1:1' | '16:9' | '9:16';
      file?: {mimeType: string; data: string};
    },
  ) => void;
}

export default function LensPromptModal({
  isOpen,
  mode,
  onClose,
  onSubmit,
}: LensPromptModalProps) {
  const [promptValue, setPromptValue] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>(
    '16:9',
  );
  const [file, setFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Reset state when modal opens for a new mode
    if (isOpen) {
      setPromptValue('');
      setAspectRatio('16:9');
      setFile(null);
      setIsRecording(false);
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
    }
  }, [isOpen, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let fileData;
    if (file) {
      fileData = await fileToBase64(file);
    }
    onSubmit(promptValue, {aspectRatio, file: fileData});
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleStartRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({audio: true});
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };
    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {type: 'audio/webm'});
      const fileData = await fileToBase64(
        new File([audioBlob], 'recording.webm', {type: 'audio/webm'}),
      );
      onSubmit('Transcribe this audio', {file: fileData});
      stream.getTracks().forEach((track) => track.stop()); // Stop microphone
    };
    audioChunksRef.current = [];
    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const renderContent = () => {
    if (!mode) return null;

    const needsText = ![
      'A/V captions',
      'Paragraph',
      'Key moments',
      'In-strukt',
      'Table',
      'Haiku',
      'Create Course',
      'Transcribe Audio',
      'Live Conversation',
    ].includes(mode);
    const needsAspectRatio = ['Generate Video', 'Generate Image'].includes(
      mode,
    );
    const needsFileUpload = ['Edit Image', 'PDF Analysis'].includes(mode);
    const needsOptionalFileUpload = ['Generate Video'].includes(mode);
    const needsAudioRecord = ['Transcribe Audio'].includes(mode);

    if (needsAudioRecord) {
      return (
        <div className="audio-recorder">
          <h3>{mode}</h3>
          <p>Click to record audio from your microphone.</p>
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`record-button ${isRecording ? 'recording' : ''}`}>
            <span className="icon">
              {isRecording ? 'stop_circle' : 'mic'}
            </span>
            {isRecording ? 'Stop & Transcribe' : 'Start Recording'}
          </button>
        </div>
      );
    }

    return (
      <form
        className="lens-prompt-form"
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}>
        <h3>{mode}</h3>
        {(needsFileUpload || needsOptionalFileUpload) && (
          <div className="file-input-container">
            <label htmlFor="lens-file-upload">
              {needsOptionalFileUpload
                ? 'Optional Starting Image'
                : `Upload ${mode === 'PDF Analysis' ? 'PDF' : 'Image'}`}
            </label>
            <input
              id="lens-file-upload"
              type="file"
              accept={mode === 'PDF Analysis' ? '.pdf' : 'image/*'}
              onChange={handleFileChange}
            />
            {file && <span className="file-name">{file.name}</span>}
          </div>
        )}
        {needsText && (
          <input
            type="text"
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            placeholder={`Enter prompt for ${mode}...`}
            autoFocus
          />
        )}
        {needsAspectRatio && (
          <div className="aspect-ratio-selector">
            <span>Aspect Ratio:</span>
            <label>
              <input
                type="radio"
                name="aspect-ratio"
                value="16:9"
                checked={aspectRatio === '16:9'}
                onChange={() => setAspectRatio('16:9')}
              />
              16:9
            </label>
            <label>
              <input
                type="radio"
                name="aspect-ratio"
                value="9:16"
                checked={aspectRatio === '9:16'}
                onChange={() => setAspectRatio('9:16')}
              />
              9:16
            </label>
            {mode === 'Generate Image' && (
              <label>
                <input
                  type="radio"
                  name="aspect-ratio"
                  value="1:1"
                  checked={aspectRatio === '1:1'}
                  onChange={() => setAspectRatio('1:1')}
                />
                1:1
              </label>
            )}
          </div>
        )}
        <button
          type="submit"
          disabled={
            (needsText && !promptValue.trim()) ||
            (needsFileUpload && !file) ||
            isRecording
          }>
          Generate
        </button>
      </form>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="lens-prompt-overlay"
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          onClick={onClose}>
          <motion.div
            initial={{y: 50, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            exit={{y: 50, opacity: 0}}>
            {renderContent()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}