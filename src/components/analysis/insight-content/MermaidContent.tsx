/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
/* tslint:disable */
import mermaid from 'mermaid';
import React, {useEffect} from 'react';

interface MermaidContentProps {
  data: string;
  insightId: number;
}

export default function MermaidContent({data, insightId}: MermaidContentProps) {
  useEffect(() => {
    const renderMermaid = async () => {
      try {
        const {svg} = await mermaid.render(`mermaid-svg-${insightId}`, data);
        const preview = document.getElementById(`mermaid-preview-${insightId}`);
        if (preview) {
          preview.innerHTML = svg;
        }
      } catch (e) {
        console.error(e);
      }
    };
    renderMermaid();
  }, [data, insightId]);

  return (
    <div
      id={`mermaid-preview-${insightId}`}
      className="mermaid-preview"></div>
  );
}