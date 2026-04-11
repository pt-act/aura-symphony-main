import React, {useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';

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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        exit={{opacity: 0}}
        onClick={onClose}>
        <motion.div
          className="modal-content"
          initial={{scale: 0.9, opacity: 0}}
          animate={{scale: 1, opacity: 1}}
          exit={{scale: 0.9, opacity: 0}}
          onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Export to NLE</h2>
            <button className="close-button" onClick={onClose}>
              <span className="icon">close</span>
            </button>
          </div>
          <div className="modal-body">
            <p>Select the format to export your annotations and timeline data.</p>
            <div className="export-options" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  name="exportFormat"
                  value="fcpxml"
                  checked={format === 'fcpxml'}
                  onChange={() => setFormat('fcpxml')}
                />
                <strong>FCPXML</strong> (Final Cut Pro, Premiere Pro, DaVinci Resolve)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  name="exportFormat"
                  value="edl"
                  checked={format === 'edl'}
                  onChange={() => setFormat('edl')}
                />
                <strong>EDL</strong> (Edit Decision List - Universal)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
          <div className="modal-footer" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-button" onClick={() => { onExport(format); onClose(); }}>
              Export
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
