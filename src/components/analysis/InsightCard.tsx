/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
import {AnimatePresence, motion} from 'framer-motion';
import React, {useState} from 'react';
import {Brain, ChevronsDown, ChevronsUp, X} from 'lucide-react';
import CardFooter from './CardFooter';
import {SkeletonCard} from '../shared/Skeleton';
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
      ? () => <Brain size={18} />
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
            {isExpanded ? <ChevronsDown size={18} /> : <ChevronsUp size={18} />}
          </button>
          <button
            onClick={() => onClose(insight.id)}
            title="Close"
            className="close-btn">
            <X size={18} />
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
                <SkeletonCard />
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