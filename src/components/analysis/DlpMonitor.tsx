/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
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