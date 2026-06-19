import React, {useState} from 'react';
import c from 'classnames';
import Modal from '../shared/Modal';
import modes from '../../lib/modes';

const KEYBOARD_SHORTCUTS = [
  {keys: 'Space', action: 'Play / Pause video'},
  {keys: 'J', action: 'Seek backward 10 seconds'},
  {keys: 'K', action: 'Toggle play / pause'},
  {keys: 'L', action: 'Seek forward 10 seconds'},
  {keys: '← →', action: 'Frame step backward / forward'},
  {keys: '/', action: 'Focus the Conductor input'},
  {keys: 'Cmd/Ctrl + K', action: 'Open Command Palette'},
  {keys: 'Cmd/Ctrl + P', action: 'Open Valhalla Gateway'},
  {keys: 'Esc', action: 'Close modal / palette'},
];

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
          <button
            role="tab"
            aria-selected={activeTab === 'shortcuts'}
            aria-controls="panel-shortcuts"
            id="tab-shortcuts"
            className={c({active: activeTab === 'shortcuts'})}
            onClick={() => setActiveTab('shortcuts')}>
            Keyboard Shortcuts
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
          {activeTab === 'shortcuts' && (
            <table className="shortcuts-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {KEYBOARD_SHORTCUTS.map(s => (
                  <tr key={s.keys}>
                    <td><kbd className="shortcut-key">{s.keys}</kbd></td>
                    <td>{s.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Modal>
  );
}
