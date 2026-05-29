/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
import React, {useCallback, useState} from 'react';

interface IngestionScreenProps {
  onVideoLoaded: (url: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export default function IngestionScreen({
  onVideoLoaded,
  setIsLoading,
  setError,
}: IngestionScreenProps) {
  const [url, setUrl] = useState('');

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onVideoLoaded(url.trim());
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file && file.type.startsWith('video/')) {
        const fileUrl = URL.createObjectURL(file);
        onVideoLoaded(fileUrl);
      } else {
        setError('Please drop a valid video file.');
      }
    },
    [onVideoLoaded, setError],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const fileUrl = URL.createObjectURL(file);
      onVideoLoaded(fileUrl);
    } else {
      setError('Please select a valid video file.');
    }
  };

  // A simple implementation for drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    onDrop(files);
  };

  return (
    <div
      className="ingestion-screen"
      onDragOver={handleDragOver}
      onDrop={handleDrop}>
      <div className="ingestion-content">
        <h1>Media Canvas</h1>
        <p>Analyze, interact with, and generate video content using AI.</p>
        <div className="ingestion-methods">
          <form onSubmit={handleUrlSubmit} className="url-form">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste video URL (e.g., .mp4)"
            />
            <button type="submit">Load</button>
          </form>
          <div className="or-divider">OR</div>
          <div className="file-drop-area">
            <input
              type="file"
              id="file-upload"
              accept="video/*"
              onChange={handleFileChange}
              style={{display: 'none'}}
            />
            <label htmlFor="file-upload" className="file-upload-label">
              Drag &amp; drop a video file here, or click to select
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}