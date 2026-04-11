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
import {AnimatePresence, motion} from 'framer-motion';
import React, {useEffect, useRef, useState} from 'react';
import type {QuizQuestion} from '../../../types';

interface QuizModuleProps {
  title: string;
  data: QuizQuestion[];
  onQuizComplete: (concept: string, score: number, total: number) => void;
  onHighlightRequest: (time: string) => void;
  // Optional props for controlled component behavior
  currentQuestionIndex?: number;
  setCurrentQuestionIndex?: (index: number) => void;
  selectedAnswers?: (string | null)[];
  setSelectedAnswers?: (answers: (string | null)[]) => void;
  guidedQuestionIndex?: number | null;
}

const INACTIVITY_TIMEOUT = 10000; // 10 seconds

export default function QuizModule({
  title,
  data,
  onQuizComplete,
  onHighlightRequest,
  ...props
}: QuizModuleProps) {
  // --- State Management ---
  // The component can be controlled or uncontrolled.
  const isControlled = props.currentQuestionIndex !== undefined;

  // Internal state for uncontrolled mode
  const [internalQuestionIndex, setInternalQuestionIndex] = useState(0);
  const [internalSelectedAnswers, setInternalSelectedAnswers] = useState<
    (string | null)[]
  >(Array(data.length).fill(null));

  // Determine which state and setters to use
  const currentQuestionIndex = isControlled
    ? props.currentQuestionIndex!
    : internalQuestionIndex;
  const setCurrentQuestionIndex = isControlled
    ? props.setCurrentQuestionIndex!
    : setInternalQuestionIndex;
  const selectedAnswers = isControlled
    ? props.selectedAnswers!
    : internalSelectedAnswers;
  const setSelectedAnswers = isControlled
    ? props.setSelectedAnswers!
    : setInternalSelectedAnswers;

  const [showResults, setShowResults] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [disabledOptions, setDisabledOptions] = useState<string[]>([]);
  const inactivityTimer = useRef<number | null>(null);

  const handleAnswerSelect = (option: string) => {
    if (showResults || disabledOptions.includes(option)) return;

    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = option;
    setSelectedAnswers(newAnswers);

    const currentQuestion = data[currentQuestionIndex];
    // Guided Mode Logic
    if (
      currentQuestionIndex === props.guidedQuestionIndex &&
      option !== currentQuestion.answer
    ) {
      const otherIncorrectOption = currentQuestion.options.find(
        (opt) =>
          opt !== option && // Not the one they just picked
          opt !== currentQuestion.answer && // Not the correct answer
          !disabledOptions.includes(opt), // Not already disabled
      );
      if (otherIncorrectOption) {
        setDisabledOptions((prev) => [...prev, otherIncorrectOption]);
      }
    }
  };

  const handleSubmit = () => {
    const score = selectedAnswers.filter(
      (ans, i) => ans === data[i].answer,
    ).length;
    setShowResults(true);
    if (onQuizComplete) {
      onQuizComplete(title, score, data.length);
    }
    const firstIncorrectIndex = selectedAnswers.findIndex(
      (ans, i) => ans !== data[i].answer,
    );
    if (firstIncorrectIndex !== -1) {
      const incorrectQuestion = data[firstIncorrectIndex];
      if (incorrectQuestion.time) {
        onHighlightRequest(incorrectQuestion.time);
      }
    }
  };

  const handleRetake = () => {
    setSelectedAnswers(Array(data.length).fill(null));
    setCurrentQuestionIndex(0);
    setShowResults(false);
  };

  const handleShowHint = () => {
    const currentQuestion = data[currentQuestionIndex];
    if (currentQuestion.time) {
      onHighlightRequest(currentQuestion.time);
    }
    setShowHint(false);
  };

  // Reset disabled options when question changes
  useEffect(() => {
    setDisabledOptions([]);
  }, [currentQuestionIndex]);

  // Inactivity timer effect
  useEffect(() => {
    const resetTimer = () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      inactivityTimer.current = window.setTimeout(() => {
        setShowHint(true);
      }, INACTIVITY_TIMEOUT);
    };

    if (showResults) {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      setShowHint(false);
      return;
    }

    const events = ['mousemove', 'keydown', 'click'];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [currentQuestionIndex, showResults]);

  useEffect(() => {
    setShowHint(false);
  }, [currentQuestionIndex]);

  const score = selectedAnswers.filter(
    (ans, i) => ans === data[i].answer,
  ).length;

  if (showResults) {
    return (
      <div className="learning-module quiz-module">
        <h3>{title} - Results</h3>
        <div className="quiz-results">
          <p className="score">
            You scored {score} out of {data.length}
          </p>
          <ul className="results-list">
            {data.map((q, i) => (
              <li
                key={i}
                className={c({
                  correct: selectedAnswers[i] === q.answer,
                  incorrect: selectedAnswers[i] !== q.answer,
                })}
                onClick={() => {
                  if (selectedAnswers[i] !== q.answer && q.time) {
                    onHighlightRequest(q.time);
                  }
                }}
                role={selectedAnswers[i] !== q.answer ? 'button' : undefined}
                tabIndex={selectedAnswers[i] !== q.answer ? 0 : -1}>
                <strong>
                  Q{i + 1}: {q.question}
                </strong>
                <p>
                  <em>Your answer: {selectedAnswers[i] || 'Not answered'}</em>
                </p>
                {selectedAnswers[i] !== q.answer && (
                  <>
                    <p>
                      <strong>Correct answer: {q.answer}</strong>
                    </p>
                    <p className="explanation">{q.explanation}</p>
                  </>
                )}
              </li>
            ))}
          </ul>
          <button onClick={handleRetake}>Retake Quiz</button>
        </div>
      </div>
    );
  }

  const currentQuestion = data[currentQuestionIndex];
  const selectedAnswer = selectedAnswers[currentQuestionIndex];

  return (
    <div className="learning-module quiz-module">
      <h3>
        {title} (Question {currentQuestionIndex + 1} of {data.length})
      </h3>
      <div className="quiz-question-container">
        <p className="quiz-question">{currentQuestion.question}</p>
        <ul className="quiz-options">
          {currentQuestion.options.map((option) => (
            <li
              key={option}
              className={c({
                selected: selectedAnswer === option,
                disabled: disabledOptions.includes(option),
              })}
              onClick={() => handleAnswerSelect(option)}>
              {option}
            </li>
          ))}
        </ul>
        <AnimatePresence>
          {showHint && (
            <motion.div
              className="quiz-hint-container"
              initial={{opacity: 0, y: 10}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: 10}}>
              <button className="quiz-hint-btn" onClick={handleShowHint}>
                <span className="icon">lightbulb</span> Show Hint
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="quiz-navigation">
        <button
          onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
          disabled={currentQuestionIndex === 0}>
          Previous
        </button>
        {currentQuestionIndex < data.length - 1 ? (
          <button
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}>
            Next
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={selectedAnswers.includes(null)}>
            Submit
          </button>
        )}
      </div>
    </div>
  );
}