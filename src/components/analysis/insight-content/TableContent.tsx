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
import {timeToSecs} from '../../../lib/utils';

interface TableContentProps {
  data: {time: string; text: string; objects: string[]}[];
  jumpToTimecode: (time: number) => void;
}

export default function TableContent({data, jumpToTimecode}: TableContentProps) {
  return (
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Description</th>
          <th>Objects</th>
        </tr>
      </thead>
      <tbody>
        {data.map(({time, text, objects}: any, i: number) => (
          <tr
            key={i}
            role="button"
            onClick={() => jumpToTimecode(timeToSecs(time))}>
            <td>
              <time>{time}</time>
            </td>
            <td>{text}</td>
            <td>{objects.join(', ')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}