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
import React from 'react';
import {timeToSecs} from '../../../lib/utils';

interface TextModuleProps {
  title: string;
  data: {time: string; text: string}[];
  jumpToTimecode: (time: number) => void;
  isSummary?: boolean;
  highlightedTime?: string | null;
}

export default function TextModule({
  title,
  data,
  jumpToTimecode,
  isSummary = false,
  highlightedTime,
}: TextModuleProps) {
  return (
    <div className="learning-module text-module">
      <h3>{title}</h3>
      {isSummary ? (
        <p>
          {data.map((item, i) => (
            <span
              key={i}
              className={c('clickable-sentence', {
                highlighted: item.time === highlightedTime,
              })}
              onClick={() => jumpToTimecode(timeToSecs(item.time))}>
              {item.text}{' '}
            </span>
          ))}
        </p>
      ) : (
        <ul>
          {data.map((item, i) => (
            <li
              key={i}
              className={c('clickable-item', {
                highlighted: item.time === highlightedTime,
              })}
              onClick={() => jumpToTimecode(timeToSecs(item.time))}>
              <time>{item.time}</time>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}