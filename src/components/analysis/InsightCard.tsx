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
import React, {useState} from 'react';
import CardFooter from './CardFooter';
import InsightContentRenderer from './InsightContentRenderer';
import modes from '../../lib/modes';
import type {ChatMessage, Insight, Mode} from '../../types';

interface InsightCardProps {
  key?: React.Key;
  insight: Insight;
  user: any | null;
  currentTime: number;
  duration: number;
  onClose: (id: number) => void;
  onDeleteAnnotation: (id: number) => void;
  onSendMessage: (
    insightId: number,
    history: ChatMessage[],
    message: string,
    file?: File,
  ) => void;
  jumpToTimecode: (time: number) => void;
  onQuizComplete: (score: number, total: number) => void;
  onSendToCreator: (insight: Insight) => void;
}

export default function InsightCard({
  insight,
  user,
  currentTime,
  duration,
  onClose,
  onDeleteAnnotation,
  onSendMessage,
  jumpToTimecode,
  onQuizComplete,
  onSendToCreator,
}: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const IconComponent =
    insight.type === 'DLP'
      ? () => <span className="icon">neurology</span>
      : modes[insight.type as Mode]?.icon;

  return (
    <motion.div
      className="insight-card"
      id={`insight-card-${insight.id}`}
      layout
      initial={{opacity: 0, y: 50, scale: 0.3}}
      animate={{opacity: 1, y: 0, scale: 1}}
      exit={{opacity: 0, scale: 0.5, transition: {duration: 0.2}}}>
      <motion.div className="card-header" layout="position">
        <div className="card-title">
          {IconComponent && <IconComponent />}
          <h3>{insight.title}</h3>
        </div>
        <div className="card-controls">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}>
            <span className="icon">
              {isExpanded ? 'unfold_less' : 'unfold_more'}
            </span>
          </button>
          <button
            onClick={() => onClose(insight.id)}
            title="Close"
            className="close-btn">
            <span className="icon">close</span>
          </button>
        </div>
      </motion.div>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: {opacity: 1, height: 'auto'},
              collapsed: {opacity: 0, height: 0},
            }}
            transition={{duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98]}}>
            <div className="card-body">
              {insight.isLoading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <span>Generating...</span>
                </div>
              ) : (
                <InsightContentRenderer
                  insight={insight}
                  currentTime={currentTime}
                  duration={duration}
                  jumpToTimecode={jumpToTimecode}
                  onSendMessage={onSendMessage}
                  onDeleteAnnotation={onDeleteAnnotation}
                  onQuizComplete={onQuizComplete}
                />
              )}
            </div>
            <CardFooter
              insight={insight}
              user={user}
              onSendToCreator={onSendToCreator}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}