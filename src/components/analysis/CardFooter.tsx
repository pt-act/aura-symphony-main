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
import type {Insight} from '../../types';
import {
  handleExportJson,
  handleExportXml,
  handleExportPng,
  handleExportTable,
  handleExportChat,
  handleExportText,
  handleExportMarkdown,
  handleExportPdf,
} from '../../lib/exportUtils';

interface CardFooterProps {
  insight: Insight;
  user: any | null;
  onSendToCreator: (insight: Insight) => void;
}

const sendableTypes = [
  'Paragraph',
  'Haiku',
  'A/V captions',
  'Key moments',
  'In-strukt',
  'Custom',
  'Deep Analysis',
  'Table',
  'Mermaid',
];

export default function CardFooter({
  insight,
  user,
  onSendToCreator,
}: CardFooterProps) {
  if (insight.isLoading || !insight.data) return null;

  const buttons: React.ReactNode[] = [];

  if (user && sendableTypes.includes(insight.type as string)) {
    buttons.push(
      <button key="send-to-creator" onClick={() => onSendToCreator(insight)}>
        <span className="icon">add_to_queue</span> Send to Creator
      </button>,
    );
  }

  const pdfButton = (
    <button key="pdf" onClick={() => handleExportPdf(insight)}>
      <span className="icon">picture_as_pdf</span> Export PDF
    </button>
  );
  const jsonButton = (
    <button key="json" onClick={() => handleExportJson(insight)}>
      <span className="icon">data_object</span> Export JSON
    </button>
  );
  const xmlButton = (
    <button key="xml" onClick={() => handleExportXml(insight)}>
      <span className="icon">code</span> Export XML
    </button>
  );
  const pngButton = (
    <button key="png" onClick={() => handleExportPng(insight)}>
      <span className="icon">image</span> Export PNG
    </button>
  );

  switch (insight.type) {
    case 'Table':
      buttons.push(
        <button key="csv" onClick={() => handleExportTable(insight)}>
          <span className="icon">download</span> Export CSV
        </button>,
        <button key="md" onClick={() => handleExportMarkdown(insight)}>
          <span className="icon">description</span> Export MD
        </button>,
        pdfButton,
        jsonButton,
        xmlButton,
        pngButton,
      );
      break;
    case 'Chat':
      buttons.push(
        <button key="txt" onClick={() => handleExportChat(insight)}>
          <span className="icon">download</span> Export TXT
        </button>,
        <button key="md" onClick={() => handleExportMarkdown(insight)}>
          <span className="icon">description</span> Export MD
        </button>,
        pdfButton,
        jsonButton,
        xmlButton,
        pngButton,
      );
      break;
    case 'Mermaid':
    case 'Chart':
      buttons.push(
        <button key="md" onClick={() => handleExportMarkdown(insight)}>
          <span className="icon">description</span> Export MD
        </button>,
        pdfButton,
        jsonButton,
        xmlButton,
        pngButton,
      );
      break;
    case 'Generate Video':
      // Only supports visual/data export of the container
      buttons.push(jsonButton, pngButton);
      break;
    default: // Handles 'A/V captions', 'Paragraph', 'Key moments', 'In-strukt', 'Haiku', 'Custom', 'PDF Analysis'
      if (
        insight.isList ||
        ['Paragraph', 'Haiku', 'PDF Analysis'].includes(insight.type)
      ) {
        buttons.push(
          <button key="txt" onClick={() => handleExportText(insight)}>
            <span className="icon">download</span> Export TXT
          </button>,
          <button key="md" onClick={() => handleExportMarkdown(insight)}>
            <span className="icon">description</span> Export MD
          </button>,
          pdfButton,
          jsonButton,
          xmlButton,
          pngButton,
        );
      }
      break;
  }

  if (buttons.length > 0) {
    return <div className="card-footer">{buttons}</div>;
  }

  return null;
}