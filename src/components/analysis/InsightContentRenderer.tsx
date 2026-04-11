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
import React, {useMemo, useState} from 'react';
import {generateSpeech} from '../../api/api';
import type {ChatMessage, Insight} from '../../types';
import {decode, decodeAudioData, timeToSecs} from '../../lib/utils';
import AnnotationsContent from './insight-content/AnnotationsContent';
import ChatContent from './insight-content/ChatContent';
import ListContent from './insight-content/ListContent';
import MermaidContent from './insight-content/MermaidContent';
import TableContent from './insight-content/TableContent';
import VideoContent from './insight-content/VideoContent';
import QuizModule from '../course/learning-modules/QuizModule';
import Chart from './Chart';
import DlpMonitor from './DlpMonitor';

function TextContent({
  data,
  isParagraph,
  jumpToTimecode,
  currentTime,
  duration,
}: {
  data: {time: string; text: string}[];
  isParagraph: boolean;
  jumpToTimecode: (time: number) => void;
  currentTime: number;
  duration: number;
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const text = data.map((item) => item.text).join(isParagraph ? ' ' : '\n');

  const dataWithSecs = useMemo(
    () => data.map((d) => ({...d, secs: timeToSecs(d.time)})),
    [data],
  );

  const handleSpeak = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const audioContent = await generateSpeech(text);
      if (audioContent) {
        const outputAudioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)({sampleRate: 24000});
        const outputNode = outputAudioContext.createGain();
        const audioBuffer = await decodeAudioData(
          decode(audioContent),
          outputAudioContext,
          24000,
          1,
        );
        const source = outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputNode);
        outputNode.connect(outputAudioContext.destination);
        source.start();
        source.onended = () => setIsSpeaking(false);
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('TTS failed', error);
      setIsSpeaking(false);
    }
  };

  const content = isParagraph ? (
    <p>
      {dataWithSecs.map((item, i) => {
        const nextItem = dataWithSecs[i + 1];
        const isActive =
          currentTime >= item.secs &&
          (nextItem ? currentTime < nextItem.secs : currentTime <= duration);
        return (
          <span
            key={i}
            className={c('outputItem-span', {active: isActive})}
            onClick={() => jumpToTimecode(item.secs)}>
            {item.text}{' '}
          </span>
        );
      })}
    </p>
  ) : (
    <ListContent
      data={data}
      currentTime={currentTime}
      duration={duration}
      jumpToTimecode={jumpToTimecode}
    />
  );

  return (
    <div className="text-content-container">
      <button
        onClick={handleSpeak}
        disabled={isSpeaking}
        className="tts-button"
        title="Read aloud">
        <span className="icon">{isSpeaking ? 'volume_up' : 'volume_down'}</span>
      </button>
      {content}
    </div>
  );
}

// A wrapper for the uncontrolled QuizModule used in the main insights view
function StandaloneQuiz({insight, onQuizComplete, jumpToTimecode}: {
  insight: Insight;
  onQuizComplete: (score: number, total: number) => void;
  jumpToTimecode: (time: number) => void;
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(string | null)[]>(
    Array(insight.data.length).fill(null),
  );

  return (
    <QuizModule
      title={insight.title.toString()}
      data={insight.data}
      onQuizComplete={(_concept, score, total) => onQuizComplete(score, total)}
      onHighlightRequest={(time: string) => {
        jumpToTimecode(timeToSecs(time));
      }}
      currentQuestionIndex={currentQuestionIndex}
      setCurrentQuestionIndex={setCurrentQuestionIndex}
      selectedAnswers={selectedAnswers}
      setSelectedAnswers={setSelectedAnswers}
    />
  );
}

function SearchContent({data}: {data: any}) {
  return (
    <div className="search-content">
      <p>{data.text}</p>
      {data.sources && data.sources.length > 0 && (
        <div className="search-sources">
          <h4>Sources:</h4>
          <ul>
            {data.sources.map((source: any, index: number) => (
              <li key={index}>
                <a
                  href={source.web.uri}
                  target="_blank"
                  rel="noopener noreferrer">
                  {source.web.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface InsightContentRendererProps {
  insight: Insight;
  currentTime: number;
  duration: number;
  jumpToTimecode: (time: number) => void;
  onSendMessage: (
    insightId: number,
    history: ChatMessage[],
    message: string,
    file?: File,
  ) => void;
  onDeleteAnnotation: (id: number) => void;
  onQuizComplete: (score: number, total: number) => void;
}

export default function InsightContentRenderer({
  insight,
  currentTime,
  duration,
  jumpToTimecode,
  onSendMessage,
  onDeleteAnnotation,
  onQuizComplete,
}: InsightContentRendererProps) {
  if (!insight.data) return null;

  switch (insight.type) {
    case 'A/V captions':
    case 'Key moments':
    case 'In-strukt':
    case 'Custom':
      return (
        <TextContent
          data={insight.data}
          isParagraph={false}
          jumpToTimecode={jumpToTimecode}
          currentTime={currentTime}
          duration={duration}
        />
      );
    case 'Paragraph':
    case 'Haiku':
      return (
        <TextContent
          data={insight.data}
          isParagraph={true}
          jumpToTimecode={jumpToTimecode}
          currentTime={currentTime}
          duration={duration}
        />
      );
    case 'Table':
      return <TableContent data={insight.data} jumpToTimecode={jumpToTimecode} />;
    case 'Chart':
      return (
        <Chart
          data={insight.data}
          yLabel={insight.title}
          jumpToTimecode={jumpToTimecode}
        />
      );
    case 'Mermaid':
      return <MermaidContent data={insight.data} insightId={insight.id} />;
    case 'Generate Video':
      return <VideoContent url={insight.data} />;
    case 'Generate Image':
    case 'Edit Image':
      return <img src={insight.data} className="generated-image" alt={insight.title} />;
    case 'Web Search':
      return <SearchContent data={insight.data} />;
    case 'Transcribe Audio':
      return <p className="transcription-text">{insight.data}</p>;
    case 'PDF Analysis':
      return <div className="markdown-content">{insight.data}</div>;
    case 'Chat':
      return <ChatContent insight={insight} onSendMessage={onSendMessage} />;
    case 'Annotations':
      return (
        <AnnotationsContent
          data={insight.data}
          jumpToTimecode={jumpToTimecode}
          onDelete={onDeleteAnnotation}
        />
      );
    case 'Quiz': // For standalone quizzes in the main view
      return (
        <StandaloneQuiz
          insight={insight}
          onQuizComplete={onQuizComplete}
          jumpToTimecode={jumpToTimecode}
        />
      );
    case 'DLP':
      return <DlpMonitor dlp={insight.data} />;
    case 'Create Course': // This type is handled specially in App.tsx, but provide a fallback.
    case 'Deep Analysis':
      // Deep Analysis re-uses the same function call types as other video lenses
      if (Array.isArray(insight.data)) {
        return (
          <ListContent
            data={insight.data}
            jumpToTimecode={jumpToTimecode}
            currentTime={currentTime}
            duration={duration}
          />
        );
      }
      return <p>{insight.data}</p>;
    default:
      return <div className="placeholder-text">Content type not supported.</div>;
  }
}