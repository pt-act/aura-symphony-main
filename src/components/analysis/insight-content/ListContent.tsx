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

import c from 'classnames';
import React, {useMemo} from 'react';
import {timeToSecs} from '../../../lib/utils';

interface ListContentProps {
  data: {time: string; text: string}[];
  currentTime: number;
  duration: number;
  jumpToTimecode: (time: number) => void;
}

export default function ListContent({
  data,
  currentTime,
  duration,
  jumpToTimecode,
}: ListContentProps) {
  const dataWithSecs = useMemo(
    () => data.map((d) => ({...d, secs: timeToSecs(d.time)})),
    [data],
  );

  return (
    <ul className="transcript-list">
      {dataWithSecs.map((item, i) => {
        const nextItem = dataWithSecs[i + 1];
        const isActive =
          currentTime >= item.secs &&
          (nextItem ? currentTime < nextItem.secs : currentTime <= duration);

        return (
          <li
            key={i}
            className={c('outputItem', {active: isActive})}
            onClick={() => jumpToTimecode(item.secs)}>
            <time>{item.time}</time>
            <p className="text">{item.text}</p>
          </li>
        );
      })}
    </ul>
  );
}