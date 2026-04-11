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
import React, {useEffect, useState} from 'react';
import BiofeedbackMonitor from './BiofeedbackMonitor';
import ConsentModal from './ConsentModal';
import QuizModule from './learning-modules/QuizModule';
import TextModule from './learning-modules/TextModule';
import VideoModule from './learning-modules/VideoModule';
import type {QuizQuestion} from '../../types';
import {timeToSecs} from '../../lib/utils';
import {useBiofeedback} from '../../hooks/useBiofeedback';

interface CourseViewProps {
  course: {
    title: string;
    summary: {time: string; text: string}[];
    keyMoments: {time: string; text: string}[];
    quiz: QuizQuestion[];
  };
  videoUrl: string;
  onBack: () => void;
  jumpToTimecode: (time: number) => void;
  onQuizComplete: (concept: string, score: number, total: number) => void;
}

export default function CourseView({
  course,
  videoUrl,
  onBack,
  jumpToTimecode,
  onQuizComplete,
}: CourseViewProps) {
  const [highlightedTime, setHighlightedTime] = useState<string | null>(null);
  const [layout, setLayout] = useState<'default' | 'remedial'>('default');
  const [adaptationNotice, setAdaptationNotice] = useState<string | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);

  // State lifted from QuizModule for adaptation
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(string | null)[]>(
    Array(course.quiz.length).fill(null),
  );

  const [guidedQuestionIndex, setGuidedQuestionIndex] = useState<number | null>(
    null,
  );

  const {
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
  } = useBiofeedback(isManualMode);

  useEffect(() => {
    if (adaptationNotice) {
      const timer = setTimeout(() => {
        setAdaptationNotice(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [adaptationNotice]);

  // Effect to trigger adaptation
  useEffect(() => {
    if (!isManualMode && frustrationDuration >= 5) {
      // 5 seconds of frustration
      if (guidedQuestionIndex !== currentQuestionIndex) {
        setGuidedQuestionIndex(currentQuestionIndex);
        setAdaptationNotice("It looks like you're stuck. Let me help you out!");
      }
      // Reset timer to prevent re-triggering for the same question
      if (frustrationTimer.current) clearInterval(frustrationTimer.current);
      frustrationTimer.current = null;
      setFrustrationDuration(0);
    }
  }, [
    frustrationDuration,
    currentQuestionIndex,
    guidedQuestionIndex,
    isManualMode,
    setFrustrationDuration,
    frustrationTimer,
  ]);

  // Reset guided mode when question changes
  useEffect(() => {
    setGuidedQuestionIndex(null);
  }, [currentQuestionIndex]);

  const handleHighlightRequest = (time: string) => {
    const timeInSecs = timeToSecs(time);
    jumpToTimecode(timeInSecs);
    setHighlightedTime(time);
    setTimeout(() => {
      setHighlightedTime(null);
    }, 5000);
  };

  const handleQuizCompletion = (
    concept: string,
    score: number,
    total: number,
  ) => {
    onQuizComplete(concept, score, total);
    if (isManualMode) return;

    if (score / total < 0.5 && layout !== 'remedial') {
      setLayout('remedial');
      setAdaptationNotice(
        "Layout adapted for focused review. Let's go over the key points again.",
      );
    } else if (score / total >= 0.5 && layout === 'remedial') {
      setLayout('default');
      setAdaptationNotice(
        "Great work! You've mastered this section. Restoring default view.",
      );
    }
  };

  return (
    <div className="course-view">
      <ConsentModal
        isOpen={cameraPermission === 'prompt'}
        onAllow={handleAllowCamera}
        onDeny={handleDenyCamera}
      />
      {cameraStream && (
        <BiofeedbackMonitor
          stream={cameraStream}
          videoRef={biofeedbackVideoRef}
          isLoading={isPerceptionLoading}
          expression={expression?.type}
        />
      )}
      <header>
        <h1>{course.title}</h1>
        <div className="header-controls">
          <div className="manual-mode-toggle">
            <label htmlFor="manual-mode">Manual Mode</label>
            <input
              id="manual-mode"
              type="checkbox"
              checked={isManualMode}
              onChange={(e) => setIsManualMode(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </div>
          <button onClick={onBack}>Back to Editor</button>
        </div>
      </header>

      <AnimatePresence>
        {adaptationNotice && (
          <motion.div
            className="adaptation-notice"
            initial={{opacity: 0, y: -50}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -50, transition: {duration: 0.2}}}>
            <span className="icon">auto_awesome</span>
            {adaptationNotice}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="course-content">
        {layout === 'default' ? (
          <>
            <motion.div layout className="course-main">
              <motion.div layout="position">
                <VideoModule videoUrl={videoUrl} />
              </motion.div>
              <motion.div layout="position">
                <QuizModule
                  title="Knowledge Check"
                  data={course.quiz}
                  onQuizComplete={(title, score, total) =>
                    handleQuizCompletion(course.title, score, total)
                  }
                  onHighlightRequest={handleHighlightRequest}
                  // Controlled component props
                  currentQuestionIndex={currentQuestionIndex}
                  setCurrentQuestionIndex={setCurrentQuestionIndex}
                  selectedAnswers={selectedAnswers}
                  setSelectedAnswers={setSelectedAnswers}
                  guidedQuestionIndex={
                    isManualMode ? null : guidedQuestionIndex
                  }
                />
              </motion.div>
            </motion.div>
            <motion.div layout className="course-sidebar">
              <motion.div layout="position">
                <TextModule
                  title="Summary"
                  data={course.summary}
                  jumpToTimecode={jumpToTimecode}
                  isSummary
                  highlightedTime={highlightedTime}
                />
              </motion.div>
              <motion.div layout="position">
                <TextModule
                  title="Key Moments"
                  data={course.keyMoments}
                  jumpToTimecode={jumpToTimecode}
                  highlightedTime={highlightedTime}
                />
              </motion.div>
            </motion.div>
          </>
        ) : (
          // Remedial Layout
          <motion.div layout className="course-main remedial-layout">
            <motion.div layout="position">
              <TextModule
                title="Summary"
                data={course.summary}
                jumpToTimecode={jumpToTimecode}
                isSummary
                highlightedTime={highlightedTime}
              />
            </motion.div>
            <motion.div layout="position">
              <TextModule
                title="Key Moments"
                data={course.keyMoments}
                jumpToTimecode={jumpToTimecode}
                highlightedTime={highlightedTime}
              />
            </motion.div>
            <motion.div layout="position">
              <VideoModule videoUrl={videoUrl} />
            </motion.div>
            <motion.div layout="position">
              <QuizModule
                title="Knowledge Check"
                data={course.quiz}
                onQuizComplete={(title, score, total) =>
                  handleQuizCompletion(course.title, score, total)
                }
                onHighlightRequest={handleHighlightRequest}
                // Controlled component props
                currentQuestionIndex={currentQuestionIndex}
                setCurrentQuestionIndex={setCurrentQuestionIndex}
                selectedAnswers={selectedAnswers}
                setSelectedAnswers={setSelectedAnswers}
                guidedQuestionIndex={isManualMode ? null : guidedQuestionIndex}
              />
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}