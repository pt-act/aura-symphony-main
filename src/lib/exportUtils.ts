/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Canvg} from 'canvg';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {ChatMessage, Insight} from '../types';

export const getFilename = (insight: Insight, extension: string) => {
  return `${insight.title
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()}_export.${extension}`;
};

export const triggerDownload = (blob: Blob, filename: string) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const handleExportJson = (insight: Insight) => {
  if (!insight.data) return;
  const jsonString = JSON.stringify(insight.data, null, 2);
  const blob = new Blob([jsonString], {
    type: 'application/json;charset=utf-8;',
  });
  triggerDownload(blob, getFilename(insight, 'json'));
};

export const handleExportXml = (insight: Insight) => {
  if (!insight.data) return;

  const toXml = (obj: any, indent = ''): string => {
    let xml = '';
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        const tag = isNaN(parseInt(key)) ? key : 'item'; // Use 'item' for array indices
        xml += `${indent}<${tag}>`;
        if (typeof value === 'object' && value !== null) {
          xml += `\n${toXml(value, indent + '  ')}${indent}`;
        } else {
          const content = String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
          xml += content;
        }
        xml += `</${tag}>\n`;
      }
    }
    return xml;
  };

  const rootTag =
    insight.title.split(' ')[0].toLowerCase().replace(/[^a-zA-Z0-9]/g, '') ||
    'data';
  const xmlString = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootTag}>\n${toXml(
    insight.data,
    '  ',
  )}</${rootTag}>`;

  const blob = new Blob([xmlString], {
    type: 'application/xml;charset=utf-8;',
  });
  triggerDownload(blob, getFilename(insight, 'xml'));
};

export const handleExportPng = async (insight: Insight) => {
  const cardElement = document.getElementById(`insight-card-${insight.id}`);
  if (!cardElement) return;

  try {
    const canvas = await html2canvas(cardElement, {
      backgroundColor: '#1e1e1e', // From CSS var --surface-color
      useCORS: true,
    });
    const image = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.setAttribute('download', getFilename(insight, 'png'));
    link.setAttribute('href', image);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting PNG:', error);
  }
};

export const handleExportTable = (insight: Insight) => {
  if (insight.type !== 'Table' || !insight.data) return;
  const tableData = insight.data as unknown as Record<string, unknown>[];
  const headers = Object.keys(tableData[0]);
  const csvContent = [
    headers.join(','),
    ...tableData.map((row: any) =>
      headers.map((header) => JSON.stringify(row[header])).join(','),
    ),
  ].join('\n');

  const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
  triggerDownload(blob, getFilename(insight, 'csv'));
};

export const handleExportChat = (insight: Insight) => {
  if (insight.type !== 'Chat' || !insight.data) return;
  const chatContent = (insight.data as ChatMessage[])
    .map((msg: ChatMessage) => `${msg.role.toUpperCase()}: ${msg.text}`)
    .join('\n\n');

  const blob = new Blob([chatContent], {type: 'text/plain;charset=utf-8;'});
  triggerDownload(blob, getFilename(insight, 'txt'));
};

export const handleExportText = (insight: Insight) => {
  if (!insight.data) return;

  let content = `${insight.title}\n\n`;

  if (insight.type === 'PDF Analysis' || typeof insight.data === 'string') {
    content += insight.data as string;
  } else if (insight.isList) {
    content += (insight.data as unknown as {time: string; text: string}[])
      .map(
        (item) =>
          `- [${item.time}] ${item.text}`,
      )
      .join('\n');
  } else {
    // For Paragraph, Haiku etc.
    content += (insight.data as unknown as {time: string; text: string}[])
      .map((item) => item.text)
      .join(insight.type === 'Haiku' ? '\n' : ' ');
  }

  const blob = new Blob([content], {type: 'text/plain;charset=utf-8;'});
  triggerDownload(blob, getFilename(insight, 'txt'));
};

export const handleExportMarkdown = (insight: Insight) => {
  if (!insight.data) return;

  let mdContent = `# ${insight.title}\n\n`;

  switch (insight.type) {
    case 'Table': {
      const mdTableData = insight.data as unknown as Record<string, unknown>[];
      const headers = Object.keys(mdTableData[0]);
      mdContent += `| ${headers
        .map((h) => h.charAt(0).toUpperCase() + h.slice(1))
        .join(' | ')} |\n`;
      mdContent += `| ${headers.map(() => '---').join(' | ')} |\n`;
      mdContent += mdTableData
        .map((row: any) => {
          const rowData = headers.map((header) => {
            const cellData = row[header];
            return Array.isArray(cellData) ? cellData.join(', ') : cellData;
          });
          return `| ${rowData.join(' | ')} |`;
        })
        .join('\n');
      break;
    }
    case 'Chat':
      mdContent += (insight.data as ChatMessage[])
        .map(
          (msg: ChatMessage) =>
            `**${msg.role.toUpperCase()}:**\n\n${msg.text}`,
        )
        .join('\n\n---\n\n');
      break;
    case 'Mermaid':
      mdContent += '```mermaid\n' + (insight.data as string) + '\n```';
      break;
    case 'PDF Analysis':
      mdContent += insight.data as string;
      break;
    default:
      if (insight.isList) {
        mdContent += (insight.data as unknown as {time: string; text: string}[])
          .map(
            (item) =>
              `- **${item.time}** ${item.text}`,
          )
          .join('\n');
      } else {
        // For Paragraph, Haiku etc.
        mdContent +=
          '> ' +
          (insight.data as unknown as {time: string; text: string}[])
            .map((item) => item.text)
            .join(insight.type === 'Haiku' ? '\n>\n> ' : ' ');
      }
      break;
  }

  const blob = new Blob([mdContent], {
    type: 'text/markdown;charset=utf-8;',
  });
  triggerDownload(blob, getFilename(insight, 'md'));
};

export const handleExportPdf = async (insight: Insight) => {
  if (!insight.data) return;
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(insight.title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);

  const startY = 30;

  switch (insight.type) {
    case 'Table': {
      const pdfTableData = insight.data as unknown as Record<string, unknown>[];
      const headers = Object.keys(pdfTableData[0]);
      const body = pdfTableData.map((row: any) =>
        headers.map((header) => {
          const cellData = row[header];
          return Array.isArray(cellData) ? cellData.join(', ') : cellData;
        }),
      );
      autoTable(doc, {
        head: [headers.map((h) => h.charAt(0).toUpperCase() + h.slice(1))],
        body,
        startY,
      });
      break;
    }
    case 'Chat': {
      let y = startY;
      doc.setFontSize(10);
      for (const msg of insight.data as ChatMessage[]) {
        const text = `${msg.role.toUpperCase()}: ${msg.text}`;
        const splitText = doc.splitTextToSize(text, 180);
        const textHeight = splitText.length * 5; // estimate height
        if (y + textHeight > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(splitText, 14, y);
        y += textHeight + 5;
      }
      break;
    }
    case 'Mermaid':
    case 'Chart': {
      const containerId =
        insight.type === 'Mermaid'
          ? `mermaid-preview-${insight.id}`
          : `insight-card-${insight.id}`;
      const container = document.getElementById(containerId);
      const svgElement = container?.querySelector('svg');

      if (svgElement && container) {
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const v = await Canvg.from(ctx, svgString, {
            ignoreDimensions: true,
            scaleWidth: canvas.width,
            scaleHeight: canvas.height,
          });
          await v.render();
          const imgData = canvas.toDataURL('image/png');
          const imgProps = doc.getImageProperties(imgData);
          const pdfWidth = doc.internal.pageSize.getWidth() - 28;
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          doc.addImage(imgData, 'PNG', 14, startY, pdfWidth, pdfHeight);
        }
      }
      break;
    }
    default: {
      let content = '';
      if (
        insight.type === 'PDF Analysis' ||
        typeof insight.data === 'string'
      ) {
        content = insight.data as string;
      } else if (insight.isList) {
        content = (insight.data as unknown as {time: string; text: string}[])
          .map(
            (item) =>
              `- [${item.time}] ${item.text}`,
          )
          .join('\n');
      } else {
        // For Paragraph, Haiku etc.
        content = (insight.data as unknown as {time: string; text: string}[])
          .map((item) => item.text)
          .join(insight.type === 'Haiku' ? '\n' : ' ');
      }
      const splitContent = doc.splitTextToSize(content, 180);
      doc.text(splitContent, 14, startY);
      break;
    }
  }

  doc.save(getFilename(insight, 'pdf'));
};
