/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
import React from 'react';

interface VideoModuleProps {
  videoUrl: string;
}

export default function VideoModule({videoUrl}: VideoModuleProps) {
  return (
    <div className="learning-module video-module">
      <video src={videoUrl} controls playsInline></video>
    </div>
  );
}