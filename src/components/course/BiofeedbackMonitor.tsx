/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
import c from 'classnames';
import React, {useEffect} from 'react';

interface BiofeedbackMonitorProps {
  stream: MediaStream;
  videoRef: React.RefObject<HTMLVideoElement>;
  isLoading: boolean;
  expression?: string;
}

export default function BiofeedbackMonitor({
  stream,
  videoRef,
  isLoading,
  expression = 'neutral',
}: BiofeedbackMonitorProps) {
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoRef]);

  return (
    <div
      className={c('biofeedback-monitor', expression)}
      title={`Aura is active. Status: ${isLoading ? 'Initializing...' : expression}`}>
      {isLoading && (
        <div className="loader-overlay">
          <div className="spinner"></div>
        </div>
      )}
      <video ref={videoRef} autoPlay playsInline muted />
    </div>
  );
}