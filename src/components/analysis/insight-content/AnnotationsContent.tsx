/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
/* tslint:disable */
import React from 'react';
import type {Annotation} from '../../../types';

interface AnnotationsContentProps {
  data: Annotation[];
  jumpToTimecode: (time: number) => void;
  onDelete: (id: number) => void;
}

const formatTime = (t: number) =>
  `${Math.floor(t / 60)}:${Math.floor(t % 60)
    .toString()
    .padStart(2, '0')}`;

export default function AnnotationsContent({
  data,
  jumpToTimecode,
  onDelete,
}: AnnotationsContentProps) {
  return (
    <ul className="annotations-list">
      {data.map((annotation) => (
        <li key={annotation.id}>
          <div
            className="annotation-text-container"
            onClick={() => jumpToTimecode(annotation.time)}>
            <time>{formatTime(annotation.time)}</time>
            <p className="text">{annotation.text}</p>
          </div>
          <button
            className="delete-annotation-btn"
            title="Delete annotation"
            onClick={() => onDelete(annotation.id)}>
            &times;
          </button>
        </li>
      ))}
    </ul>
  );
}