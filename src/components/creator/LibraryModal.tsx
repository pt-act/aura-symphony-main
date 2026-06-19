/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
import React, {useEffect, useState} from 'react';
import {ExternalLink, Trash2, AlertTriangle} from 'lucide-react';
import Modal from '../shared/Modal';
import {SkeletonListItem} from '../shared/Skeleton';
import {useToast} from '../../hooks/useToast';
import {deletePresentation, getPresentationsForUser} from '../../api/firestoreService';
import type {Presentation} from '../../types';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (presentation: Presentation) => void;
  userId: string;
}

export default function LibraryModal({
  isOpen,
  onClose,
  onLoad,
  userId,
}: LibraryModalProps) {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const {success, error} = useToast();

  useEffect(() => {
    if (isOpen && userId) {
      setIsLoading(true);
      getPresentationsForUser(userId)
        .then(setPresentations)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, userId]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deletePresentation(deleteTarget);
      setPresentations(presentations.filter((p) => p.id !== deleteTarget));
      success('Presentation deleted');
    } catch (e) {
      error('Failed to delete presentation');
    }
    setDeleteTarget(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="My Library">
      <div className="modal-body">
        {isLoading ? (
          <ul className="library-list">
            <SkeletonListItem count={4} />
          </ul>
        ) : presentations.length === 0 ? (
          <p>You haven't saved any presentations yet.</p>
        ) : (
          <ul className="library-list">
            {presentations.map((p) => (
              <li key={p.id}>
                {deleteTarget === p.id ? (
                  <div className="library-delete-confirm">
                    <AlertTriangle size={16} />
                    <span>Delete "{p.name}"?</span>
                    <button className="confirm-delete-btn" onClick={handleDeleteConfirm}>
                      Delete
                    </button>
                    <button className="cancel-delete-btn" onClick={() => setDeleteTarget(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <span
                      className="library-item-name"
                      onClick={() => onLoad(p)}>
                      {p.name}
                    </span>
                    <div className="library-item-actions">
                      <button onClick={() => onLoad(p)} title="Load" aria-label={`Load presentation ${p.name}`}>
                        <ExternalLink size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p.id!)}
                        title="Delete"
                        aria-label={`Delete presentation ${p.name}`}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}