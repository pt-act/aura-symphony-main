/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
/* tslint:disable */
import {useState} from 'react';
import LensPromptModal from './LensPromptModal';
import modes from '../../lib/modes';
import type {Mode} from '../../types';

interface LensPaletteProps {
  onSelect: (
    mode: Mode,
    customPrompt?: string,
    options?: {
      aspectRatio?: '1:1' | '16:9' | '9:16';
      file?: {mimeType: string; data: string};
    },
  ) => void;
  hasVideo: boolean;
}

export default function LensPalette({onSelect, hasVideo}: LensPaletteProps) {
  const [activePrompt, setActivePrompt] = useState<Mode | null>(null);

  const handleSelect = (mode: Mode) => {
    // Lenses that don't need a modal
    if (!modes[mode].prompt) {
      onSelect(mode);
    } else {
      setActivePrompt(mode);
    }
  };

  const handlePromptSubmit = (
    promptValue: string,
    options: {
      aspectRatio?: '1:1' | '16:9' | '9:16';
      file?: {mimeType: string; data: string};
    },
  ) => {
    if (activePrompt) {
      onSelect(activePrompt, promptValue, options);
      setActivePrompt(null);
    }
  };

  return (
    <div className="lens-palette-container">
      <LensPromptModal
        isOpen={!!activePrompt}
        mode={activePrompt}
        onClose={() => setActivePrompt(null)}
        onSubmit={handlePromptSubmit}
      />
      <div className="lens-palette">
        {Object.entries(modes).map(([mode, config]) => {
          const requiresVideo = ![
            'Generate Video',
            'Generate Image',
            'Edit Image',
            'Web Search',
            'Transcribe Audio',
            'Live Conversation',
            'PDF Analysis',
          ].includes(mode);
          const isDisabled = requiresVideo && !hasVideo;
          return (
            <button
              key={mode}
              className="lens-button"
              title={mode}
              onClick={() => handleSelect(mode as Mode)}
              disabled={isDisabled}>
              <config.icon />
            </button>
          );
        })}
      </div>
    </div>
  );
}