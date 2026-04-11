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

import {AnimatePresence, motion, Reorder} from 'framer-motion';
import type firebase from 'firebase/compat/app';
import React from 'react';
import {savePresentation, updatePresentation} from '../../api/firestoreService';
import type {Presentation, Slide} from '../../types';
import {
  handleExportPresentationPdf,
  handleExportPresentationMarkdown,
} from '../../lib/presentationExportUtils';

interface CreatorStudioProps {
  user: firebase.User;
  presentation: Presentation | null;
  setPresentation: (presentation: Presentation | null) => void;
  activeSlideIndex: number;
  setActiveSlideIndex: (index: number) => void;
  onNewPresentation: () => void;
  onOpenLibrary: () => void;
}

export default function CreatorStudio({
  user,
  presentation,
  setPresentation,
  activeSlideIndex,
  setActiveSlideIndex,
  onNewPresentation,
  onOpenLibrary,
}: CreatorStudioProps) {
  const handleSave = async () => {
    if (!presentation) return;

    let presentationToSave = {...presentation};
    if (presentation.name === 'Untitled Presentation' && !presentation.id) {
      const newName = prompt(
        'Enter a name for your presentation:',
        presentation.name,
      );
      if (!newName) return; // User cancelled
      presentationToSave.name = newName;
    }

    try {
      if (presentationToSave.id) {
        await updatePresentation(presentationToSave.id, {
          name: presentationToSave.name,
          slides: presentationToSave.slides,
        });
      } else {
        const newId = await savePresentation(user.uid, {
          name: presentationToSave.name,
          slides: presentationToSave.slides,
        });
        presentationToSave.id = newId;
      }
      setPresentation(presentationToSave);
      // You can add a toast notification for success here
    } catch (error) {
      console.error('Failed to save presentation:', error);
      // You can add a toast notification for error here
    }
  };

  const handleAddSlide = () => {
    if (!presentation) return;
    const newSlide: Slide = {
      id: Date.now().toString(),
      content: '',
      speakerNotes: '',
      backgroundImage: null,
      backgroundColor: '#ffffff',
    };
    const newSlides = [...presentation.slides, newSlide];
    setPresentation({...presentation, slides: newSlides});
    setActiveSlideIndex(newSlides.length - 1);
  };

  const handleDeleteSlide = () => {
    if (!presentation || presentation.slides.length <= 1) {
      // Or show a toast message
      return;
    }
    const newSlides = presentation.slides.filter(
      (_, index) => index !== activeSlideIndex,
    );
    setPresentation({...presentation, slides: newSlides});
    if (activeSlideIndex >= newSlides.length) {
      setActiveSlideIndex(newSlides.length - 1);
    }
  };

  const handleSlideContentChange = (
    field: 'content' | 'speakerNotes',
    value: string,
  ) => {
    if (!presentation) return;
    const newSlides = [...presentation.slides];
    newSlides[activeSlideIndex] = {
      ...newSlides[activeSlideIndex],
      [field]: value,
    };
    setPresentation({...presentation, slides: newSlides});
  };

  const handleReorder = (newOrder: Slide[]) => {
    if (!presentation) return;
    setPresentation({...presentation, slides: newOrder});
  };

  const handleExportPdf = () => {
    if (!presentation) return;
    handleExportPresentationPdf(presentation);
  };

  const handleExportMarkdown = () => {
    if (!presentation) return;
    handleExportPresentationMarkdown(presentation);
  };

  const activeSlide = presentation?.slides[activeSlideIndex];

  return (
    <div className="creator-studio-container">
      <header className="creator-header">
        <h2>{presentation ? presentation.name : 'Creator Studio'}</h2>
        <div className="creator-actions">
          <button onClick={onNewPresentation}>New</button>
          <button onClick={onOpenLibrary}>
            <span className="icon">folder_open</span> My Library
          </button>
          <button onClick={handleSave} disabled={!presentation}>
            Save
          </button>
          <button onClick={handleExportPdf} disabled={!presentation}>
            <span className="icon">picture_as_pdf</span> Export PDF
          </button>
          <button onClick={handleExportMarkdown} disabled={!presentation}>
            <span className="icon">description</span> Export MD
          </button>
        </div>
      </header>
      <main className="creator-main-content">
        {presentation ? (
          <>
            <div className="slide-sidebar">
              <Reorder.Group
                axis="y"
                values={presentation.slides}
                onReorder={handleReorder}
                className="slide-list">
                <AnimatePresence>
                  {presentation.slides.map((slide, index) => (
                    <Reorder.Item
                      key={slide.id}
                      value={slide}
                      initial={{opacity: 0}}
                      animate={{opacity: 1}}
                      exit={{opacity: 0}}>
                      <div
                        className={`slide-thumbnail ${
                          index === activeSlideIndex ? 'active' : ''
                        }`}
                        onClick={() => setActiveSlideIndex(index)}>
                        <span className="slide-number">{index + 1}</span>
                        <div className="thumbnail-preview">
                          {slide.content.split('\n')[0] || '[ Empty Slide ]'}
                        </div>
                      </div>
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
              </Reorder.Group>
              <button className="add-slide-btn" onClick={handleAddSlide}>
                <span className="icon">add</span> Add Slide
              </button>
            </div>
            <div className="slide-editor-area">
              <textarea
                className="slide-editor"
                value={activeSlide?.content || ''}
                onChange={(e) =>
                  handleSlideContentChange('content', e.target.value)
                }
                placeholder="Start typing your slide content here..."
              />
              <button
                className="delete-slide-btn"
                onClick={handleDeleteSlide}
                disabled={presentation.slides.length <= 1}>
                <span className="icon">delete</span>
              </button>
            </div>
            <div className="speaker-notes-area">
              <h3>Speaker Notes</h3>
              <textarea
                className="speaker-notes-editor"
                value={activeSlide?.speakerNotes || ''}
                onChange={(e) =>
                  handleSlideContentChange('speakerNotes', e.target.value)
                }
                placeholder="Add speaker notes for this slide..."
              />
            </div>
          </>
        ) : (
          <div className="empty-studio-placeholder">
            <span className="icon">slideshow</span>
            <h2>Welcome to the Creator Studio</h2>
            <p>Create a new presentation or open an existing one to begin.</p>
            <button onClick={onNewPresentation}>
              Create New Presentation
            </button>
          </div>
        )}
      </main>
    </div>
  );
}