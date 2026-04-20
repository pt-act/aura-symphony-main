import React from 'react';
import Modal from '../shared/Modal';
import ProviderSettingsCard from './ProviderSettingsCard';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({isOpen, onClose}: SettingsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" contentClassName="modal-content settings-modal-content">
      <div className="modal-body settings-modal-body">
        <ProviderSettingsCard />
      </div>
    </Modal>
  );
}
