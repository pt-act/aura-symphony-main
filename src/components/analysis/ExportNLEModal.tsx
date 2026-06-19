/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
import React, {useState} from 'react';
import Modal from '../shared/Modal';

interface ExportNLEModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'fcpxml' | 'edl' | 'csv') => void;
}

export default function ExportNLEModal({
  isOpen,
  onClose,
  onExport,
}: ExportNLEModalProps) {
  const [format, setFormat] = useState<'fcpxml' | 'edl' | 'csv'>('fcpxml');

  const handleExport = () => {
    onExport(format);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export to NLE">
      <div className="modal-body">
        <p>Select the format to export your annotations and timeline data.</p>
        <div className="export-options">
          <label className="export-option-label">
            <input
              type="radio"
              name="exportFormat"
              value="fcpxml"
              checked={format === 'fcpxml'}
              onChange={() => setFormat('fcpxml')}
            />
            <strong>FCPXML</strong> (Final Cut Pro, Premiere Pro, DaVinci Resolve)
          </label>
          <label className="export-option-label">
            <input
              type="radio"
              name="exportFormat"
              value="edl"
              checked={format === 'edl'}
              onChange={() => setFormat('edl')}
            />
            <strong>EDL</strong> (Edit Decision List - Universal)
          </label>
          <label className="export-option-label">
            <input
              type="radio"
              name="exportFormat"
              value="csv"
              checked={format === 'csv'}
              onChange={() => setFormat('csv')}
            />
            <strong>CSV</strong> (Spreadsheet / Custom Parsing)
          </label>
        </div>
      </div>
      <div className="modal-footer">
        <button className="secondary-button" onClick={onClose}>
          Cancel
        </button>
        <button className="primary-button" onClick={handleExport}>
          Export
        </button>
      </div>
    </Modal>
  );
}