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
import {AnimatePresence, motion} from 'framer-motion';
// Fix for framer-motion props not being recognized by TypeScript
import React from 'react';
import {useState} from 'react';
import modes from '../../lib/modes';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({isOpen, onClose}: HelpModalProps) {
  const [activeTab, setActiveTab] = useState('quickstart');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          onClick={onClose}>
          <motion.div
            className="modal-content"
            initial={{y: 50, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            exit={{y: 50, opacity: 0}}
            onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>Welcome to Media Canvas</h2>
              <button onClick={onClose}>&times;</button>
            </header>
            <div className="modal-body">
              <div className="modal-tabs">
                <button
                  className={c({active: activeTab === 'quickstart'})}
                  onClick={() => setActiveTab('quickstart')}>
                  Quick Start
                </button>
                <button
                  className={c({active: activeTab === 'lensguide'})}
                  onClick={() => setActiveTab('lensguide')}>
                  Lens Guide
                </button>
              </div>
              <div className="modal-tab-content">
                {activeTab === 'quickstart' && (
                  <div>
                    <h3>How to Get Started in 3 Steps:</h3>
                    <ol className="quick-start-list">
                      <li>
                        <strong>Ingest Media:</strong> Paste a link to a video
                        (e.g., direct .mp4 or YouTube) or drag and drop a video
                        file onto the main screen.
                      </li>
                      <li>
                        <strong>Analyze with Lenses:</strong> For standard
                        videos, use the Lens Palette at the bottom to generate
                        insights. Click an icon to get summaries, key moments,
                        and more.
                      </li>
                      <li>
                        <strong>Chat and Create:</strong> For YouTube videos,
                        provide a transcript to start a chat. Discuss the content,
                        add a PDF for more context, and generate step-by-step
                        guides.
                      </li>
                    </ol>
                  </div>
                )}
                {activeTab === 'lensguide' && (
                  <ul className="lens-guide-list">
                    {Object.entries(modes).map(([name, config]) => (
                      <li key={name}>
                        <div className="lens-icon-bg">
                          <config.icon />
                        </div>
                        <div className="lens-info">
                          <strong>{name}</strong>
                          <p>{config.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}