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

import React from 'react';
import type {DigitalLearnerProfile} from '../../types';

interface DlpMonitorProps {
  dlp: DigitalLearnerProfile;
}

export default function DlpMonitor({dlp}: DlpMonitorProps) {
  const {knowledgeGraph} = dlp;
  const concepts = Object.entries(knowledgeGraph);

  if (concepts.length === 0) {
    return (
      <div className="dlp-monitor">
        <p>No learning data recorded yet. Complete a quiz to get started!</p>
      </div>
    );
  }

  return (
    <div className="dlp-monitor">
      <h4>Knowledge Graph</h4>
      <ul className="knowledge-graph-list">
        {concepts.map(([concept, data]) => (
          <li key={concept}>
            <span className="concept-name">{concept}</span>
            <div className="mastery-bar-container">
              <div
                className="mastery-bar"
                style={{width: `${data.mastery * 100}%`}}></div>
            </div>
            <span className="mastery-percent">
              {Math.round(data.mastery * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}