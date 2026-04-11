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

import React, {useState, useEffect, useRef} from 'react';
import c from 'classnames';

interface ConductorInputProps {
  onQuerySubmit: (query: string) => void;
  isLoading: boolean;
}

export default function ConductorInput({
  onQuerySubmit,
  isLoading,
}: ConductorInputProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isWakeWordMode, setIsWakeWordMode] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = isWakeWordMode;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          if (isWakeWordMode) {
            const lowerTranscript = finalTranscript.toLowerCase();
            const wakeWordIndex = lowerTranscript.indexOf('hey conductor');
            if (wakeWordIndex !== -1) {
              const command = finalTranscript.substring(wakeWordIndex + 'hey conductor'.length).trim();
              if (command) {
                setQuery(command);
                onQuerySubmit(command);
                setQuery('');
              }
            }
          } else {
            setQuery(finalTranscript);
            onQuerySubmit(finalTranscript);
            setQuery('');
            setIsListening(false);
          }
        } else {
          setQuery(interimTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (!isWakeWordMode) {
          setIsListening(false);
        }
      };

      recognitionRef.current.onend = () => {
        if (isWakeWordMode && isListening) {
          // Restart if in wake word mode
          try {
            recognitionRef.current?.start();
          } catch (e) {
            console.error('Failed to restart recognition', e);
          }
        } else {
          setIsListening(false);
        }
      };
    }
  }, [onQuerySubmit, isWakeWordMode, isListening]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setIsWakeWordMode(false);
    } else {
      setQuery('');
      setIsWakeWordMode(false);
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const toggleWakeWordMode = () => {
    if (isWakeWordMode) {
      setIsWakeWordMode(false);
      setIsListening(false);
      recognitionRef.current?.stop();
    } else {
      setIsWakeWordMode(true);
      setIsListening(true);
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onQuerySubmit(query);
      setQuery('');
    }
  };

  return (
    <div className={c('conductor-container', {focused: isFocused})}>
      <form className="conductor-form" onSubmit={handleSubmit}>
        <div className="conductor-input-wrapper">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isWakeWordMode ? "Say 'Hey Conductor'..." : isListening ? "Listening..." : "Tell Aura what to do..."}
            disabled={isLoading}
          />
          {isLoading && (
            <div className="conductor-spinner">
              <div className="spinner"></div>
            </div>
          )}
        </div>
        <button
          type="button"
          className={c('conductor-button', {active: isWakeWordMode})}
          title="Wake Word Mode ('Hey Conductor')"
          onClick={toggleWakeWordMode}
          disabled={isLoading || !recognitionRef.current}>
          <span className="icon" style={{ color: isWakeWordMode ? '#ea4335' : 'inherit' }}>
            {isWakeWordMode ? 'record_voice_over' : 'voice_over_off'}
          </span>
        </button>
        <button
          type="button"
          className={c('conductor-button', {active: isListening && !isWakeWordMode})}
          title="Use microphone"
          onClick={toggleListening}
          disabled={isLoading || !recognitionRef.current || isWakeWordMode}>
          <span className="icon" style={{ color: (isListening && !isWakeWordMode) ? '#ea4335' : 'inherit' }}>
            {(isListening && !isWakeWordMode) ? 'mic' : 'mic_none'}
          </span>
        </button>
        <button
          type="submit"
          className="conductor-button"
          title="Submit"
          disabled={isLoading || !query.trim()}>
          <span className="icon">send</span>
        </button>
      </form>
    </div>
  );
}