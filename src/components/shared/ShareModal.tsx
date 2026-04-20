import React, {useState} from 'react';
import Modal from '../shared/Modal';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
}

export default function ShareModal({isOpen, onClose, shareUrl}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Session">
      <div className="modal-body share-modal-body">
        <p>Anyone with this link can view this session.</p>
        <div className="share-link-container">
          <input type="text" value={shareUrl} readOnly aria-label="Share URL" />
          <button onClick={handleCopy} aria-label={copied ? 'Link copied' : 'Copy link to clipboard'}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
