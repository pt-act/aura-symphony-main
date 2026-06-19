/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
import React, {createContext, useContext, useState, useCallback, useEffect, useRef} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {CheckCircle2, AlertCircle, Info, X} from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  dismiss: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const AUTO_DISMISS_MS = 4000;

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} />,
  error: <AlertCircle size={18} />,
  info: <Info size={18} />,
};

function ToastItem({toast, onDismiss}: {toast: Toast; onDismiss: (id: string) => void; [key: string]: unknown}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Auto-dismiss success/info after 4s; errors persist
    if (toast.type !== 'error') {
      timerRef.current = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast, onDismiss]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Enter') {
      onDismiss(toast.id);
    }
  };

  return (
    <motion.div
      className={`toast toast-${toast.type}`}
      role="alert"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      initial={{opacity: 0, x: 60, scale: 0.9}}
      animate={{opacity: 1, x: 0, scale: 1}}
      exit={{opacity: 0, x: 60, scale: 0.9}}
      transition={{type: 'spring', stiffness: 300, damping: 30}}>
      <span className="toast-icon">{icons[toast.type]}</span>
      <span className="toast-message">{toast.message}</span>
      <button
        className="toast-close"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification">
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function ToastProvider({children}: {children: React.ReactNode}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    setToasts(prev => [...prev, {id, message, type}]);
  }, []);

  const success = useCallback((msg: string) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg: string) => addToast(msg, 'error'), [addToast]);
  const info = useCallback((msg: string) => addToast(msg, 'info'), [addToast]);

  return (
    <ToastContext.Provider value={{success, error, info, dismiss}}>
      {children}
      {/* ARIA live region for screen readers */}
      <div
        className="toast-live-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
      <div className="toast-container">
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}