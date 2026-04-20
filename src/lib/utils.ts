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

import type {Insight} from '../types';
import MediaWorker from '../workers/media.worker?worker';

let sharedMediaWorker: Worker | null = null;

export const getSharedMediaWorker = () => {
  if (!sharedMediaWorker) {
    sharedMediaWorker = new MediaWorker();
  }
  return sharedMediaWorker;
};

export const timeToSecs = (timecode: string) => {
  const split = timecode.split(':').map(parseFloat);

  return split.length === 2
    ? split[0] * 60 + split[1]
    : split[0] * 3600 + split[1] * 60 + split[2];
};

export const fileToBase64 = (
  file: File,
): Promise<{name: string; mimeType: string; data: string; dataUrl: string}> => {
  return new Promise((resolve, reject) => {
    const worker = getSharedMediaWorker();
    const taskId = Date.now().toString() + Math.random().toString();
    
    const handleMessage = (e: MessageEvent) => {
      if (e.data.id === taskId) {
        if (e.data.type === 'FILE_TO_BASE64_RESULT') {
          worker.removeEventListener('message', handleMessage);
          resolve(e.data.payload);
        } else if (e.data.type === 'FILE_TO_BASE64_ERROR') {
          worker.removeEventListener('message', handleMessage);
          reject(new Error(e.data.payload));
        }
      }
    };

    worker.addEventListener('message', handleMessage);
    worker.postMessage({ type: 'FILE_TO_BASE64', payload: { file }, id: taskId });
  });
};

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function convertInsightToMarkdown(insight: Insight): string | null {
  if (!insight.data) return null;

  const data = insight.data;
  let mdContent = `# ${insight.title}\n\n`;

  switch (insight.type) {
    case 'Paragraph':
    case 'Haiku':
      if (Array.isArray(data)) {
        mdContent += (data as unknown as Record<string, unknown>[])
          .map((item) => String(item.text ?? ''))
          .join(insight.type === 'Haiku' ? '\n' : ' ');
      }
      break;

    case 'A/V captions':
    case 'Key moments':
    case 'In-strukt':
    case 'Custom':
    case 'Deep Analysis':
      if (Array.isArray(data) && data.length > 0 && ((data[0] as unknown) as Record<string, unknown>)?.time) {
        mdContent += (data as unknown as Record<string, unknown>[])
          .map(
            (item) =>
              `- **[${item.time}]** ${item.text}`,
          )
          .join('\n');
      } else {
        return null;
      }
      break;

    case 'Table':
      if (Array.isArray(data) && data.length === 0) return null;
      if (Array.isArray(data)) {
        const rows = data as unknown as Record<string, unknown>[];
        const headers = Object.keys(rows[0]);
        mdContent += `| ${headers.join(' | ')} |\n`;
        mdContent += `| ${headers.map(() => '---').join(' | ')} |\n`;
        mdContent += rows
          .map(
            (row) =>
              `| ${headers
                .map((h) => (Array.isArray(row[h]) ? (row[h] as string[]).join(', ') : row[h]))
                .join(' | ')} |`,
          )
          .join('\n');
      }
      break;

    case 'Mermaid':
      mdContent += '```mermaid\n' + String(data) + '\n```';
      break;

    case 'PDF Analysis':
      if (typeof data === 'string') {
        mdContent += data;
      } else {
        return null;
      }
      break;

    case 'Web Search':
      if (typeof data === 'object' && data !== null && 'text' in data) {
        const searchData = data as {text: string; sources?: Array<{web: {title: string; uri: string}}>};
        mdContent += searchData.text;
        if (searchData.sources && searchData.sources.length > 0) {
          mdContent += '\n\n**Sources:**\n';
          mdContent += searchData.sources
            .map((s) => `* [${s.web.title}](${s.web.uri})`)
            .join('\n');
        }
      } else {
        return null;
      }
      break;

    case 'Transcribe Audio':
      if (typeof data === 'string') {
        mdContent += `**Transcription:**\n\n> ${data}`;
      } else {
        return null;
      }
      break;

    default:
      return null;
  }
  return mdContent;
}