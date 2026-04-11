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

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ChevronLeft, ChevronRight, Music} from 'lucide-react';
import {motion, AnimatePresence} from 'motion/react';
import type {Annotation} from '../../types';

interface TimelineProps {
  duration: number;
  currentTime: number;
  selectionStart: number | null;
  selectionEnd: number | null;
  annotations: Annotation[];
  onSelectionChange: (start: number | null, end: number | null) => void;
  onJumpToTime: (time: number) => void;
  onAddAnnotation: (time: number, text: string) => void;
}

export default function Timeline({
  duration,
  currentTime,
  selectionStart,
  selectionEnd,
  annotations,
  onSelectionChange,
  onJumpToTime,
  onAddAnnotation,
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState<{
    time: number;
    y: number;
  } | null>(null);
  const [annotationText, setAnnotationText] = useState('');
  const annotationInputRef = useRef<HTMLInputElement>(null);

  const calculateTimeFromEvent = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      if (!timelineRef.current || duration === 0) return 0;
      const rect = timelineRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const percentage = Math.max(0, Math.min(1, y / rect.height));
      return percentage * duration;
    },
    [duration],
  );

  useEffect(() => {
    if (newAnnotation && annotationInputRef.current) {
      annotationInputRef.current.focus();
    }
  }, [newAnnotation]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isSelecting) {
        const time = calculateTimeFromEvent(e);
        onSelectionChange(selectionStart, time);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isSelecting) {
        setIsSelecting(false);
        const time = calculateTimeFromEvent(e);
        if (selectionStart === null) return;
        const finalStart = Math.min(selectionStart, time);
        const finalEnd = Math.max(selectionStart, time);
        if (finalEnd - finalStart < 0.2) {
          onJumpToTime(finalStart);
          onSelectionChange(null, null);
        } else {
          onSelectionChange(finalStart, finalEnd);
        }
      }
    };

    if (isSelecting) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isSelecting,
    calculateTimeFromEvent,
    onSelectionChange,
    onJumpToTime,
    selectionStart,
  ]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    setIsSelecting(true);
    const time = calculateTimeFromEvent(e.nativeEvent);
    onSelectionChange(time, time);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const time = calculateTimeFromEvent(e);
    setNewAnnotation({time, y: e.clientY - rect.top});
  };

  const handleAnnotationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (annotationText.trim() && newAnnotation) {
      onAddAnnotation(newAnnotation.time, annotationText);
    }
    setNewAnnotation(null);
    setAnnotationText('');
  };

  const progressPercent = (currentTime / duration) * 100 || 0;
  const selectionStartNormal =
    selectionStart !== null && selectionEnd !== null
      ? Math.min(selectionStart, selectionEnd)
      : 0;
  const selectionEndNormal =
    selectionStart !== null && selectionEnd !== null
      ? Math.max(selectionStart, selectionEnd)
      : 0;
  const selectionTopPercent =
    selectionStart !== null ? (selectionStartNormal / duration) * 100 : 0;
  const selectionHeightPercent =
    selectionStart !== null && selectionEnd !== null
      ? ((selectionEndNormal - selectionStartNormal) / duration) * 100
      : 0;

  return (
    <motion.div 
      className={`master-score ${isCollapsed ? 'collapsed' : ''}`}
      animate={{ width: isCollapsed ? 40 : 80 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="master-score-header">
        <button 
          className="collapse-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        {!isCollapsed && (
          <div className="master-score-title">
            <Music size={12} />
            <span>Score</span>
          </div>
        )}
      </div>

      <div
        ref={timelineRef}
        className="timeline-container vertical"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}>
        <div className="timeline-track">
          <div
            className="timeline-progress"
            style={{height: `${progressPercent}%`}}></div>
          {selectionStart !== null && (
            <div
              className="timeline-selection"
              style={{
                top: `${selectionTopPercent}%`,
                height: `${selectionHeightPercent}%`,
              }}></div>
          )}
          {annotations.map((ann) => (
            <div
              key={ann.id}
              className="annotation-marker"
              style={{top: `${(ann.time / duration) * 100}%`}}
              onClick={(e) => {
                e.stopPropagation();
                onJumpToTime(ann.time);
              }}>
              <span className="annotation-tooltip">{ann.text}</span>
            </div>
          ))}
        </div>
        <div
          className="timeline-playhead"
          style={{top: `${progressPercent}%`}}></div>
        
        <AnimatePresence>
          {newAnnotation && (
            <motion.form
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="annotation-input-container vertical"
              style={{top: `${newAnnotation.y}px`}}
              onSubmit={handleAnnotationSubmit}>
              <input
                ref={annotationInputRef}
                type="text"
                value={annotationText}
                placeholder="Add note..."
                onChange={(e) => setAnnotationText(e.target.value)}
                onBlur={handleAnnotationSubmit}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
