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
// Fix for framer-motion props not being recognized by TypeScript
import React from 'react';
import {useState} from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  shareUrl,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              <h2>Share Session</h2>
              <button onClick={onClose}>&times;</button>
            </header>
            <div className="modal-body share-modal-body">
              <p>Anyone with this link can view this session.</p>
              <div className="share-link-container">
                <input type="text" value={shareUrl} readOnly />
                <button onClick={handleCopy}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}