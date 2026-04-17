/**
 * NLE (Non-Linear Editor) Export Utilities
 *
 * Exports annotations to professional video editing formats:
 * FCPXML (Final Cut Pro), EDL, and CSV.
 */

import type { Annotation } from '../types';

/** Converts seconds to HH:MM:SS timecode (no frames). */
function toTimecode(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Converts seconds to HH:MM:SS:FF timecode at 30fps. */
function toTimecode30fps(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const f = Math.floor((seconds % 1) * 30);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
}

/** Escapes XML special characters. */
function xmlEscape(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildFcpxml(videoUrl: string, duration: number, annotations: Annotation[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
  <resources>
    <format id="r1" name="FFVideoFormat1080p30" frameDuration="100/3000s" width="1920" height="1080" colorSpace="1-1-1 (Rec. 709)"/>
    <asset id="r2" name="Video" src="file://${videoUrl || 'video.mp4'}" start="0s" duration="${duration}s" hasVideo="1" hasAudio="1" format="r1"/>
  </resources>
  <library>
    <event name="Aura Symphony Export">
      <project name="Aura Project">
        <sequence format="r1" duration="${duration}s" tcStart="0s" tcFormat="NDF">
          <spine>
            <asset-clip name="Video" ref="r2" offset="0s" duration="${duration}s" start="0s">
              ${annotations.map(ann => `
              <marker start="${ann.time}s" duration="100/3000s" value="${xmlEscape(ann.text)}" note="Aura Annotation"/>
              `).join('')}
            </asset-clip>
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`;
}

function buildEdl(annotations: Annotation[]): string {
  let content = `TITLE: Aura Symphony Export\nFCM: NON-DROP FRAME\n\n`;
  annotations.forEach((ann, index) => {
    const eventNum = String(index + 1).padStart(3, '0');
    const tc = toTimecode30fps(ann.time);
    content += `${eventNum}  AX       V     C        ${tc} ${tc} ${tc} ${tc}\n`;
    content += `* FROM CLIP NAME: Video\n`;
    content += `* LOC: ${tc} ${ann.text.replace(/\n/g, ' ')}\n\n`;
  });
  return content;
}

function buildCsv(annotations: Annotation[]): string {
  let content = `Time (Seconds),Timecode,Annotation\n`;
  annotations.forEach(ann => {
    const escapedText = `"${ann.text.replace(/"/g, '""')}"`;
    content += `${ann.time.toFixed(2)},${toTimecode(ann.time)},${escapedText}\n`;
  });
  return content;
}

function downloadBlob(content: string, mimeType: string, filename: string): void {
  const blob = new Blob([content], {type: mimeType});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports annotations to an NLE-compatible format and triggers a browser download.
 */
export function handleExportNLE(
  format: 'fcpxml' | 'edl' | 'csv',
  videoUrl: string,
  duration: number,
  annotations: Annotation[],
): void {
  if (format === 'fcpxml') {
    downloadBlob(buildFcpxml(videoUrl, duration, annotations), 'application/xml', 'aura_export.fcpxml');
  } else if (format === 'edl') {
    downloadBlob(buildEdl(annotations), 'text/plain', 'aura_export.edl');
  } else if (format === 'csv') {
    downloadBlob(buildCsv(annotations), 'text/csv', 'aura_export.csv');
  }
}
