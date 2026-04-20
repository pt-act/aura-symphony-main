import React, {useState} from 'react';
import c from 'classnames';
import Modal from '../shared/Modal';
import modes from '../../lib/modes';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({isOpen, onClose}: HelpModalProps) {
  const [activeTab, setActiveTab] = useState('quickstart');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Welcome to Media Canvas">
      <div className="modal-body">
        <div className="modal-tabs" role="tablist" aria-label="Help sections">
          <button
            role="tab"
            aria-selected={activeTab === 'quickstart'}
            aria-controls="panel-quickstart"
            id="tab-quickstart"
            className={c({active: activeTab === 'quickstart'})}
            onClick={() => setActiveTab('quickstart')}>
            Quick Start
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'lensguide'}
            aria-controls="panel-lensguide"
            id="tab-lensguide"
            className={c({active: activeTab === 'lensguide'})}
            onClick={() => setActiveTab('lensguide')}>
            Lens Guide
          </button>
        </div>
        <div
          className="modal-tab-content"
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {activeTab === 'quickstart' && (
            <div>
              <h3>How to Get Started in 3 Steps:</h3>
              <ol className="quick-start-list">
                <li>
                  <strong>Ingest Media:</strong> Paste a link to a video
                  (e.g., direct .mp4 or YouTube) or drag and drop a video
                  file onto the main screen.
                </li>
                <li>
                  <strong>Analyze with Lenses:</strong> For standard
                  videos, use the Lens Palette at the bottom to generate
                  insights. Click an icon to get summaries, key moments,
                  and more.
                </li>
                <li>
                  <strong>Chat and Create:</strong> For YouTube videos,
                  provide a transcript to start a chat. Discuss the content,
                  add a PDF for more context, and generate step-by-step
                  guides.
                </li>
              </ol>
            </div>
          )}
          {activeTab === 'lensguide' && (
            <ul className="lens-guide-list">
              {Object.entries(modes).map(([name, config]) => (
                <li key={name}>
                  <div className="lens-icon-bg">
                    <config.icon />
                  </div>
                  <div className="lens-info">
                    <strong>{name}</strong>
                    <p>{config.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
