/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
import {AnimatePresence} from 'framer-motion';
import React from 'react';
import {FlaskConical, PlusCircle} from 'lucide-react';
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
      <div className="lens-laboratory-header">
        <div className="lens-laboratory-title">
          <FlaskConical size={20} />
          <h2>Lens Laboratory</h2>
        </div>
        {onOpenCustomBuilder && (
          <button
            className="icon-button"
            onClick={onOpenCustomBuilder}
            title="Create Custom Virtuoso"
          >
            <PlusCircle size={20} />
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
