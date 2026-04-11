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
import React, {useEffect, useState} from 'react';
import {deletePresentation, getPresentationsForUser} from '../../api/firestoreService';
import type {Presentation} from '../../types';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (presentation: Presentation) => void;
  userId: string;
}

export default function LibraryModal({
  isOpen,
  onClose,
  onLoad,
  userId,
}: LibraryModalProps) {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      setIsLoading(true);
      getPresentationsForUser(userId)
        .then(setPresentations)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, userId]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this presentation?')) {
      await deletePresentation(id);
      setPresentations(presentations.filter((p) => p.id !== id));
    }
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
              <h2>My Library</h2>
              <button onClick={onClose}>&times;</button>
            </header>
            <div className="modal-body">
              {isLoading ? (
                <p>Loading...</p>
              ) : presentations.length === 0 ? (
                <p>You haven't saved any presentations yet.</p>
              ) : (
                <ul className="library-list">
                  {presentations.map((p) => (
                    <li key={p.id}>
                      <span
                        className="library-item-name"
                        onClick={() => onLoad(p)}>
                        {p.name}
                      </span>
                      <div className="library-item-actions">
                        <button onClick={() => onLoad(p)} title="Load">
                          <span className="icon">open_in_new</span>
                        </button>
                        <button
                          onClick={() => handleDelete(p.id!)}
                          title="Delete">
                          <span className="icon">delete</span>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}