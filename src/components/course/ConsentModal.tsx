/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
import React from 'react';
import {Shield} from 'lucide-react';
import Modal from '../shared/Modal';

interface ConsentModalProps {
  isOpen: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

export default function ConsentModal({
  isOpen,
  onAllow,
  onDeny,
}: ConsentModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onDeny} title="Enable Empathetic Learning?">
      <div className="modal-body consent-modal-body">
        <h3>Allow camera access to unlock adaptive features.</h3>
        <p>
          By enabling your camera, Aura can subtly adapt the learning
          experience to your pace and focus.
        </p>
        <div className="privacy-guarantee">
          <span className="privacy-icon"><Shield size={20} /></span>
          <div>
            <strong>Your privacy is our priority.</strong>
            <p>
              Your camera feed is processed entirely on your device. It is
              never recorded, stored, or sent to any servers.
            </p>
          </div>
        </div>
        <div className="consent-actions">
          <button className="primary-action" onClick={onAllow}>
            Enable Camera
          </button>
          <button className="secondary-action" onClick={onDeny}>
            Continue Without
          </button>
        </div>
      </div>
    </Modal>
  );
}