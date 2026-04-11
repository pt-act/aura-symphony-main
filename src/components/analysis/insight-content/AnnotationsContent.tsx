/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
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