/**
 * Aura Accessibility Utilities
 *
 * Shared hooks and helpers for keyboard navigation, focus management,
 * and screen reader announcements.
 */

import React, {useCallback, useRef, useEffect} from 'react';

/**
 * Hook: Makes a non-interactive element keyboard-accessible.
 * Returns props to spread onto the element.
 *
 * Usage:
 *   const a11yProps = useKeyboardActivator(() => handleClick());
 *   <div {...a11yProps} onClick={handleClick}>...</div>
 */
export function useKeyboardActivator(onActivate: () => void) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate();
      }
    },
    [onActivate],
  );

  return {
    role: 'button' as const,
    tabIndex: 0,
    onKeyDown: handleKeyDown,
  };
}

/**
 * Hook: Announces a message to screen readers via a live region.
 * The announcement is cleared after the specified timeout.
 *
 * Usage:
 *   const announce = useScreenReaderAnnouncer();
 *   announce('Analysis complete. 5 insights found.');
 */
export function useScreenReaderAnnouncer() {
  const regionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Create a single live region on mount
    let region = document.getElementById('aura-sr-announcer');
    if (!region) {
      region = document.createElement('div');
      region.id = 'aura-sr-announcer';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      region.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;';
      document.body.appendChild(region);
    }
    regionRef.current = region;
  }, []);

  return useCallback((message: string, clearAfterMs = 5000) => {
    if (regionRef.current) {
      regionRef.current.textContent = '';
      // Force reflow so screen readers re-read
      void regionRef.current.offsetHeight;
      regionRef.current.textContent = message;

      if (clearAfterMs > 0) {
        setTimeout(() => {
          if (regionRef.current) regionRef.current.textContent = '';
        }, clearAfterMs);
      }
    }
  }, []);
}

/**
 * Hook: Trap focus within a container (for modals).
 * Returns a ref to attach to the container element.
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Save current focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    const focusable = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    if (focusable.length > 0) {
      focusable[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      // Restore focus
      previousFocusRef.current?.focus();
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook: Close a modal on Escape key press.
 */
export function useEscapeKey(onClose: () => void, isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isActive]);
}

/**
 * Visually hidden text for screen readers.
 * Use inside interactive elements that only have icons.
 */
export function VisuallyHidden({children}: {children: string}) {
  return (
    <span
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        border: 0,
      }}
    >
      {children}
    </span>
  );
}
