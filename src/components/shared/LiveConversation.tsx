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

import {LiveServerMessage, Modality, Blob} from '@google/genai';
import {getAI} from '../../api/client';
import c from 'classnames';
import {AnimatePresence, motion} from 'framer-motion';
// Fix for framer-motion props not being recognized by TypeScript
import React from 'react';
import {useEffect, useRef, useState} from 'react';
import {decode, decodeAudioData, encode} from '../../lib/utils';

// AI client is now resolved dynamically per the active provider settings

interface LiveConversationProps {
  isOpen: boolean;
  onClose: () => void;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export default function LiveConversation({
  isOpen,
  onClose,
}: LiveConversationProps) {
  const [status, setStatus] = useState('idle');
  const [transcripts, setTranscripts] = useState<
    {speaker: 'user' | 'model'; text: string}[]
  >([]);
  const [partialInput, setPartialInput] = useState('');
  const [partialOutput, setPartialOutput] = useState('');

  const currentInputRef = useRef('');
  const currentOutputRef = useRef('');
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());

  const startConversation = async () => {
    setStatus('connecting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      audioStreamRef.current = stream;

      inputAudioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)({sampleRate: 16000});
      outputAudioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)({sampleRate: 24000});
      nextStartTimeRef.current = 0;

      const dynamicAI = getAI();
      sessionPromiseRef.current = dynamicAI.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('listening');
            if (
              !inputAudioContextRef.current ||
              !audioStreamRef.current ||
              scriptProcessorRef.current
            )
              return;

            sourceNodeRef.current =
              inputAudioContextRef.current.createMediaStreamSource(
                audioStreamRef.current,
              );
            scriptProcessorRef.current =
              inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current.onaudioprocess = (
              audioProcessingEvent,
            ) => {
              const inputData =
                audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({audio: pcmBlob});
              });
            };
            sourceNodeRef.current.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(
              inputAudioContextRef.current.destination,
            );
          },
          onmessage: async (message: LiveServerMessage) => {
            const serverContent = message.serverContent as any;
            if (serverContent?.outputTranscription) {
              const text = serverContent.outputTranscription.text;
              currentOutputRef.current += text;
              setPartialOutput(currentOutputRef.current);
            }
            if (serverContent?.inputTranscription) {
              const text = serverContent.inputTranscription.text;
              currentInputRef.current += text;
              setPartialInput(currentInputRef.current);
            }
            if (serverContent?.turnComplete) {
              const fullInput = currentInputRef.current;
              const fullOutput = currentOutputRef.current;
              setTranscripts((prev) => [
                ...prev,
                {speaker: 'user', text: fullInput},
                {speaker: 'model', text: fullOutput},
              ]);
              currentInputRef.current = '';
              currentOutputRef.current = '';
              setPartialInput('');
              setPartialOutput('');
            }

            const base64Audio =
              message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
            if (base64Audio && outputAudioContextRef.current) {
              const outputAudioContext = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(
                nextStartTimeRef.current,
                outputAudioContext.currentTime,
              );
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                outputAudioContext,
                24000,
                1,
              );
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContext.destination);
              source.addEventListener('ended', () => {
                audioSourcesRef.current.delete(source);
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              for (const source of audioSourcesRef.current.values()) {
                source.stop();
              }
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Live session error:', e);
            setStatus('error');
          },
          onclose: (e: CloseEvent) => {
            setStatus('idle');
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: {
            voiceConfig: {prebuiltVoiceConfig: {voiceName: 'Zephyr'}},
          },
        } as any,
      });
    } catch (err) {
      console.error('Failed to start conversation:', err);
      setStatus('error');
    }
  };

  const stopConversation = () => {
    sessionPromiseRef.current?.then((session) => session.close());
    sessionPromiseRef.current = null;

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();

    setTranscripts([]);
    setPartialInput('');
    setPartialOutput('');
    currentInputRef.current = '';
    currentOutputRef.current = '';
    setStatus('idle');
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      startConversation();
    } else {
      if (status !== 'idle') {
        stopConversation();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const getStatusIndicator = () => {
    switch (status) {
      case 'connecting':
        return <div className="status-indicator connecting"></div>;
      case 'listening':
        return <div className="status-indicator listening"></div>;
      case 'error':
        return <div className="status-indicator error"></div>;
      default:
        return <div className="status-indicator idle"></div>;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}>
          <motion.div
            className="modal-content live-conversation-modal"
            initial={{y: 50, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            exit={{y: 50, opacity: 0}}>
            <header className="modal-header">
              <h2>Live Conversation</h2>
              <button onClick={stopConversation}>&times;</button>
            </header>
            <div className="modal-body">
              <div className="live-transcript-container">
                {transcripts.map((t, i) => (
                  <div key={i} className={c('transcript-entry', t.speaker)}>
                    <strong>{t.speaker === 'user' ? 'You:' : 'Aura:'}</strong>
                    <p>{t.text}</p>
                  </div>
                ))}
                {partialInput && (
                  <div className="transcript-entry user partial">
                    <strong>You:</strong>
                    <p>{partialInput}</p>
                  </div>
                )}
                {partialOutput && (
                  <div className="transcript-entry model partial">
                    <strong>Aura:</strong>
                    <p>{partialOutput}</p>
                  </div>
                )}
              </div>
              <div className="live-footer">
                {getStatusIndicator()}
                <p className="status-text">{status}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}