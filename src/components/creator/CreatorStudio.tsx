/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
import {AnimatePresence, motion, Reorder} from 'framer-motion';
import type firebase from 'firebase/compat/app';
import React, {useState} from 'react';
import {FolderOpen, FileText, FileText as FileMd, Plus, Trash2, MonitorPlay, Check, X} from 'lucide-react';
import {savePresentation, updatePresentation} from '../../api/firestoreService';
import {useToast} from '../../hooks/useToast';
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
  const {success, error} = useToast();
  const [isNaming, setIsNaming] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const handleSave = async () => {
    if (!presentation) return;

    let presentationToSave = {...presentation};

    // If untitled and unsaved, show inline naming instead of prompt()
    if (presentation.name === 'Untitled Presentation' && !presentation.id) {
      setNameInput(presentation.name);
      setIsNaming(true);
      return;
    }

    await doSave(presentationToSave);
  };

  const doSave = async (presentationToSave: Presentation) => {
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
      success('Presentation saved successfully');
    } catch (err) {
      console.error('Failed to save presentation:', err);
      error('Failed to save presentation');
    }
  };

  const handleNameConfirm = async () => {
    if (!presentation || !nameInput.trim()) return;
    const named = {...presentation, name: nameInput.trim()};
    setIsNaming(false);
    await doSave(named);
  };

  const handleNameCancel = () => {
    setIsNaming(false);
    setNameInput('');
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
    if (!presentation || presentation.slides.length <= 1) return;
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
    try {
      handleExportPresentationPdf(presentation);
      success('PDF exported successfully');
    } catch (e) {
      error('Failed to export PDF');
    }
  };

  const handleExportMarkdown = () => {
    if (!presentation) return;
    try {
      handleExportPresentationMarkdown(presentation);
      success('Markdown exported successfully');
    } catch (e) {
      error('Failed to export Markdown');
    }
  };

  const activeSlide = presentation?.slides[activeSlideIndex];

  return (
    <div className="creator-studio-container">
      <header className="creator-header">
        <h2>{presentation ? presentation.name : 'Creator Studio'}</h2>
        <div className="creator-actions">
          <button onClick={onNewPresentation}>New</button>
          <button onClick={onOpenLibrary}>
            <FolderOpen size={16} /> My Library
          </button>
          <button onClick={handleSave} disabled={!presentation}>
            Save
          </button>
          <button onClick={handleExportPdf} disabled={!presentation}>
            <FileText size={16} /> Export PDF
          </button>
          <button onClick={handleExportMarkdown} disabled={!presentation}>
            <FileMd size={16} /> Export MD
          </button>
        </div>
      </header>

      {/* Inline naming bar — replaces prompt() */}
      <AnimatePresence>
        {isNaming && (
          <motion.div
            className="naming-bar"
            initial={{height: 0, opacity: 0}}
            animate={{height: 'auto', opacity: 1}}
            exit={{height: 0, opacity: 0}}>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter presentation name..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameConfirm();
                if (e.key === 'Escape') handleNameCancel();
              }}
            />
            <button className="naming-confirm-btn" onClick={handleNameConfirm}>
              <Check size={16} /> Save
            </button>
            <button className="naming-cancel-btn" onClick={handleNameCancel}>
              <X size={16} /> Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
                <Plus size={20} /> Add Slide
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
                <Trash2 size={18} />
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
            <MonitorPlay size={64} />
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