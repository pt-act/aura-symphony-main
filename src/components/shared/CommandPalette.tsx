/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
import React, {useState, useEffect, useRef, useMemo} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {
  Search, Wand2, Sun, Moon, Download, Settings,
  HelpCircle, Palette, FolderOpen, CornerDownLeft,
} from 'lucide-react';

export interface CommandAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  hint?: string;
  handler: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  actions: CommandAction[];
}

/** Simple fuzzy match — checks if all query chars appear in order in the label. */
function fuzzyMatch(query: string, label: string): boolean {
  const q = query.toLowerCase();
  const l = label.toLowerCase();
  let qi = 0;
  for (let li = 0; li < l.length && qi < q.length; li++) {
    if (l[li] === q[qi]) qi++;
  }
  return qi === q.length;
}

export default function CommandPalette({isOpen, onClose, actions}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!query.trim()) return actions;
    return actions.filter(a => fuzzyMatch(query, a.label));
  }, [query, actions]);

  // Reset active index when filtered list changes
  useEffect(() => {
    setActiveIndex(0);
  }, [filtered]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const action = filtered[activeIndex];
      if (action) {
        action.handler();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.children[activeIndex] as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({block: 'nearest'});
    }
  }, [activeIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="command-palette-overlay"
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          onClick={onClose}>
          <motion.div
            className="command-palette"
            initial={{scale: 0.95, opacity: 0, y: -10}}
            animate={{scale: 1, opacity: 1, y: 0}}
            exit={{scale: 0.95, opacity: 0, y: -10}}
            transition={{type: 'spring', stiffness: 300, damping: 30}}
            onClick={e => e.stopPropagation()}>
            <div className="command-palette-input-wrapper">
              <Search size={18} className="command-palette-search-icon" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search actions..."
                className="command-palette-input"
              />
              <kbd className="command-palette-esc-hint">ESC</kbd>
            </div>

            <div className="command-palette-list" ref={listRef}>
              {filtered.length === 0 ? (
                <div className="command-palette-empty">No actions found</div>
              ) : (
                filtered.map((action, index) => (
                  <button
                    key={action.id}
                    className={`command-palette-item ${index === activeIndex ? 'active' : ''}`}
                    onClick={() => {
                      action.handler();
                      onClose();
                    }}
                    onMouseEnter={() => setActiveIndex(index)}>
                    <span className="command-palette-item-icon">{action.icon}</span>
                    <span className="command-palette-item-label">{action.label}</span>
                    {index === activeIndex && (
                      <CornerDownLeft size={14} className="command-palette-item-hint" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}