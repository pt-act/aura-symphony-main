/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
/* tslint:disable */
import React from 'react';

interface VideoContentProps {
  url: string;
}

export default function VideoContent({url}: VideoContentProps) {
  return (
    <div className="generated-video-container">
      <video src={url} controls autoPlay></video>
      <a href={url} download="generated-video.mp4" className="button">
        Download MP4
      </a>
    </div>
  );
}