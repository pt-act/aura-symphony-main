/**
 * Accessible Modal Component
 *
 * Wraps content in a proper dialog with:
 * - role="dialog" + aria-modal="true"
 * - aria-labelledby linking to the title
 * - Focus trap (Tab cycles within modal)
 * - Escape key to close
 * - Click overlay to close
 * - Screen reader announcement on open
 *
 * Usage:
 *   <Modal isOpen={show} onClose={hide} title="Settings">
 *     <SettingsContent />
 *   </Modal>
 */

import React, {useEffect, useRef, useCallback} from 'react';
import {AnimatePresence, motion} from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  /** Additional CSS class for the content panel */
  contentClassName?: string;
  /** If true, clicking the overlay does NOT close the modal */
  preventOverlayClose?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  contentClassName = 'modal-content',
  preventOverlayClose = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = `modal-title-${title.replace(/\s+/g, '-').toLowerCase()}`;

  // ─── Focus trap ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    // Save previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    const dialog = dialogRef.current;

    // Focus first focusable element
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length > 0) {
      // Small delay to let framer-motion animate in
      requestAnimationFrame(() => focusable[0].focus());
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);

    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the element that opened the modal
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  // ─── Escape key ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // ─── Body scroll lock ────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  const handleOverlayClick = useCallback(() => {
    if (!preventOverlayClose) onClose();
  }, [onClose, preventOverlayClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`modal-overlay ${className || ''}`}
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          onClick={handleOverlayClick}
        >
          <motion.div
            ref={dialogRef}
            className={contentClassName}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{y: 50, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            exit={{y: 50, opacity: 0}}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-header">
              <h2 id={titleId}>{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close dialog"
              >
                &times;
              </button>
            </header>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
