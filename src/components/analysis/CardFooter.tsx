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
import {
  Plus, FileText, Braces, Code, Image as ImageIcon,
  Download, FileText as FileMd,
} from 'lucide-react';
import type {Insight} from '../../types';
import {useToast} from '../../hooks/useToast';
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
  const {success, error} = useToast();
  if (insight.isLoading || !insight.data) return null;

  const wrapExport = (fn: (insight: Insight) => void, label: string) => {
    return () => {
      try {
        fn(insight);
        success(`${label} exported successfully`);
      } catch (e) {
        error(`Failed to export ${label}`);
      }
    };
  };

  const buttons: React.ReactNode[] = [];

  if (user && sendableTypes.includes(insight.type as string)) {
    buttons.push(
      <button key="send-to-creator" onClick={() => onSendToCreator(insight)}>
        <Plus size={14} /> Send to Creator
      </button>,
    );
  }

  const pdfButton = (
    <button key="pdf" onClick={wrapExport(handleExportPdf, 'PDF')}>
      <FileText size={14} /> Export PDF
    </button>
  );
  const jsonButton = (
    <button key="json" onClick={wrapExport(handleExportJson, 'JSON')}>
      <Braces size={14} /> Export JSON
    </button>
  );
  const xmlButton = (
    <button key="xml" onClick={wrapExport(handleExportXml, 'XML')}>
      <Code size={14} /> Export XML
    </button>
  );
  const pngButton = (
    <button key="png" onClick={wrapExport(handleExportPng, 'PNG')}>
      <ImageIcon size={14} /> Export PNG
    </button>
  );

  switch (insight.type) {
    case 'Table':
      buttons.push(
        <button key="csv" onClick={wrapExport(handleExportTable, 'CSV')}>
          <Download size={14} /> Export CSV
        </button>,
        <button key="md" onClick={wrapExport(handleExportMarkdown, 'Markdown')}>
          <FileMd size={14} /> Export MD
        </button>,
        pdfButton,
        jsonButton,
        xmlButton,
        pngButton,
      );
      break;
    case 'Chat':
      buttons.push(
        <button key="txt" onClick={wrapExport(handleExportChat, 'TXT')}>
          <Download size={14} /> Export TXT
        </button>,
        <button key="md" onClick={wrapExport(handleExportMarkdown, 'Markdown')}>
          <FileMd size={14} /> Export MD
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
        <button key="md" onClick={wrapExport(handleExportMarkdown, 'Markdown')}>
          <FileMd size={14} /> Export MD
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
          <button key="txt" onClick={wrapExport(handleExportText, 'TXT')}>
            <Download size={14} /> Export TXT
          </button>,
          <button key="md" onClick={wrapExport(handleExportMarkdown, 'Markdown')}>
            <FileMd size={14} /> Export MD
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