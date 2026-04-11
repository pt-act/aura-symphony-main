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

import {AnimatePresence} from 'framer-motion';
import React from 'react';
import InsightCard from './InsightCard';
import type {ChatMessage, Insight} from '../../types';

interface LensLaboratoryProps {
  insights: Insight[];
  user: any | null;
  currentTime: number;
  duration: number;
  onClose: (id: number) => void;
  onSendMessage: (
    insightId: number,
    history: ChatMessage[],
    message: string,
    file?: File,
  ) => void;
  jumpToTimecode: (time: number) => void;
  onDeleteAnnotation: (id: number) => void;
  onSendToCreator: (insight: Insight) => void;
  onOpenCustomBuilder?: () => void;
}

export default function LensLaboratory({
  insights,
  user,
  currentTime,
  duration,
  onClose,
  onSendMessage,
  jumpToTimecode,
  onDeleteAnnotation,
  onSendToCreator,
  onOpenCustomBuilder,
}: LensLaboratoryProps) {
  return (
    <aside className="lens-laboratory">
      <div className="lens-laboratory-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="icon">science</span>
          <h2>Lens Laboratory</h2>
        </div>
        {onOpenCustomBuilder && (
          <button 
            className="icon-button" 
            onClick={onOpenCustomBuilder}
            title="Create Custom Virtuoso"
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <span className="icon">add_circle</span>
          </button>
        )}
      </div>
      <div className="lens-laboratory-list">
        <AnimatePresence initial={false}>
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              user={user}
              currentTime={currentTime}
              duration={duration}
              onClose={onClose}
              onSendMessage={onSendMessage}
              jumpToTimecode={jumpToTimecode}
              onDeleteAnnotation={onDeleteAnnotation}
              onQuizComplete={() => {}}
              onSendToCreator={onSendToCreator}
            />
          ))}
        </AnimatePresence>
      </div>
    </aside>
  );
}
