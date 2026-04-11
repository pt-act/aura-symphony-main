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

import {AnimatePresence, motion} from 'framer-motion';
import React from 'react';

interface ConsentModalProps {
  isOpen: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

export default function ConsentModal({
  isOpen,
  onAllow,
  onDeny,
}: ConsentModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}>
          <motion.div
            className="modal-content"
            initial={{y: 50, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            exit={{y: 50, opacity: 0}}
            onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>Enable Empathetic Learning?</h2>
            </header>
            <div className="modal-body consent-modal-body">
              <h3>Allow camera access to unlock adaptive features.</h3>
              <p>
                By enabling your camera, Aura can subtly adapt the learning
                experience to your pace and focus.
              </p>
              <div className="privacy-guarantee">
                <span className="icon">shield</span>
                <div>
                  <strong>Your privacy is our priority.</strong>
                  <p>
                    Your camera feed is processed entirely on your device. It is
                    never recorded, stored, or sent to any servers.
                  </p>
                </div>
              </div>
              <div className="consent-actions">
                <button className="primary-action" onClick={onAllow}>
                  Enable Camera
                </button>
                <button className="secondary-action" onClick={onDeny}>
                  Continue Without
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}