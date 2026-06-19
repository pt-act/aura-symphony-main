/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
import {useEffect, useRef} from 'react';

export interface ShortcutHandler {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  handler: () => void;
  /** If true, the shortcut fires even when an input/textarea is focused. */
  allowInInput?: boolean;
  /** If true, the shortcut fires even when a modal is open. */
  allowInModal?: boolean;
}

/**
 * Registers global keyboard shortcuts.
 *
 * Shortcuts are automatically disabled when:
 * - The user is typing in an input, textarea, or contenteditable element
 *   (unless `allowInInput` is true)
 * - A modal is open (unless `allowInModal` is true)
 *
 * Pass `isModalOpen` as true when any modal is active to suppress shortcuts.
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutHandler[],
  isModalOpen: boolean = false,
) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      const isModalActive = isModalOpen || document.querySelector('[role="dialog"]') !== null;

      for (const shortcut of shortcutsRef.current) {
        // Check key match (case-insensitive for letters)
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        // Check modifier keys
        const ctrlMatch = !!shortcut.ctrlKey === (e.ctrlKey || e.metaKey);
        const metaMatch = !!shortcut.metaKey === (e.metaKey || e.ctrlKey);
        const shiftMatch = !!shortcut.shiftKey === e.shiftKey;

        if (!keyMatch || !ctrlMatch || !metaMatch || !shiftMatch) continue;

        // Guard: typing in input
        if (isTyping && !shortcut.allowInInput) continue;

        // Guard: modal open
        if (isModalActive && !shortcut.allowInModal) continue;

        // Don't preventDefault for plain letter keys in inputs
        e.preventDefault();
        shortcut.handler();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);
}