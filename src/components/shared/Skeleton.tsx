/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
  /** key is accepted by React but not part of the component's own props */
  [key: string]: unknown;
}

/** Single skeleton block with shimmer animation. */
export function Skeleton({width = '100%', height = '1rem', borderRadius = 'var(--radius-sm)', className = ''}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{width, height, borderRadius}}
    />
  );
}

/** Multi-line text skeleton — renders N lines with the last line shorter. */
export function SkeletonText({lines = 3, lineHeight = '0.875rem', gap = '0.5rem'}: {lines?: number; lineHeight?: string; gap?: string}) {
  return (
    <div className="skeleton-text" style={{display: 'flex', flexDirection: 'column', gap}}>
      {Array.from({length: lines}).map((_, i) => (
        <Skeleton
          key={i}
          height={lineHeight}
          width={i === lines - 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  );
}

/** Card-shaped skeleton — header bar + body lines. Matches InsightCard layout. */
export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card-header">
        <Skeleton width="20px" height="20px" borderRadius="var(--radius-sm)" />
        <Skeleton width="120px" height="0.875rem" />
      </div>
      <div className="skeleton-card-body">
        <SkeletonText lines={4} />
      </div>
    </div>
  );
}

/** Typing indicator skeleton — 3 pulsing dots for chat loading. */
export function SkeletonTyping() {
  return (
    <div className="skeleton-typing">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  );
}

/** List item skeleton — for library/modal loading states. */
export function SkeletonListItem({count = 4}: {count?: number}) {
  return (
    <>
      {Array.from({length: count}).map((_, i) => (
        <div key={i} className="skeleton-list-item">
          <Skeleton width="60%" height="0.875rem" />
          <Skeleton width="24px" height="24px" borderRadius="var(--radius-sm)" />
        </div>
      ))}
    </>
  );
}