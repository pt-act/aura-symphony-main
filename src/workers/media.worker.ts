import * as pdfjsLib from 'pdfjs-dist';

// Set up pdfjs worker if needed, though in a worker it might just work
// pdfjsLib.GlobalWorkerOptions.workerSrc = ...

self.onmessage = async (e: MessageEvent) => {
  const { type, payload, id } = e.data;

  if (type === 'PROCESS_FRAMES') {
    const { bitmaps, quality = 0.5 } = payload;
    
    try {
      const base64Frames: string[] = [];
      
      for (const bitmap of bitmaps) {
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2d context');
        
        ctx.drawImage(bitmap, 0, 0);
        
        const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
        const buffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        
        let binary = '';
        // Process in chunks to avoid call stack size exceeded
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
          binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
        }
        
        const base64 = btoa(binary);
        base64Frames.push(`data:image/jpeg;base64,${base64}`);
        
        // Close bitmap to free memory
        bitmap.close();
      }
      
      self.postMessage({ type: 'PROCESS_FRAMES_RESULT', payload: base64Frames, id });
    } catch (error: any) {
      self.postMessage({ type: 'PROCESS_FRAMES_ERROR', payload: error.message, id });
    }
  } else if (type === 'FILE_TO_BASE64') {
    try {
      const file: File = payload.file;
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
        binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
      }
      
      const base64 = btoa(binary);
      const dataUrl = `data:${file.type};base64,${base64}`;
      
      self.postMessage({
        type: 'FILE_TO_BASE64_RESULT',
        payload: {
          name: file.name,
          mimeType: file.type,
          data: base64,
          dataUrl
        },
        id
      });
    } catch (error: any) {
      self.postMessage({ type: 'FILE_TO_BASE64_ERROR', payload: error.message, id });
    }
  } else if (type === 'EXTRACT_PDF_TEXT') {
    try {
      const { base64Data } = payload;
      const pdfData = atob(base64Data);
      const pdfBytes = new Uint8Array(pdfData.length);
      for (let i = 0; i < pdfData.length; i++) {
        pdfBytes[i] = pdfData.charCodeAt(i);
      }

      const doc = await pdfjsLib.getDocument({data: pdfBytes}).promise;
      const numPages = doc.numPages;
      let fullText = '';

      for (let i = 1; i <= numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => ('str' in item ? (item as any).str : ''))
          .join(' ');
        fullText += pageText + '\n\n';
      }

      self.postMessage({ type: 'EXTRACT_PDF_TEXT_RESULT', payload: fullText, id });
    } catch (error: any) {
      self.postMessage({ type: 'EXTRACT_PDF_TEXT_ERROR', payload: error.message, id });
    }
  }
};
