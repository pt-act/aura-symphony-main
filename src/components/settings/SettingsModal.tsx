import {AnimatePresence, motion} from 'framer-motion';
import React from 'react';
import ProviderSettingsCard from './ProviderSettingsCard';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({isOpen, onClose}: SettingsModalProps) {
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
            className="modal-content settings-modal-content"
            initial={{y: 50, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            exit={{y: 50, opacity: 0}}
            onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>Settings</h2>
              <button onClick={onClose}>&times;</button>
            </header>
            <div className="modal-body settings-modal-body">
              <ProviderSettingsCard />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
