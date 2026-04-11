import jsPDF from 'jspdf';
import type {Presentation} from '../types';

export const handleExportPresentationPdf = (presentation: Presentation) => {
  const doc = new jsPDF();
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  presentation.slides.forEach((slide, index) => {
    if (index > 0) {
      doc.addPage();
    }

    doc.setFontSize(12);
    doc.setTextColor(40);

    const contentLines = doc.splitTextToSize(
      slide.content || '[Empty Slide]',
      usableWidth,
    );
    let yPos = margin;
    doc.text(contentLines, margin, yPos);
    yPos += contentLines.length * 5;

    if (yPos > usableHeight - 30) {
      doc.addPage();
      yPos = margin;
    }

    if (slide.speakerNotes) {
      yPos += 10;
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('Speaker Notes:', margin, yPos);
      yPos += 6;

      const notesLines = doc.splitTextToSize(
        slide.speakerNotes,
        usableWidth,
      );
      doc.text(notesLines, margin, yPos);
    }
  });

  doc.save(`${presentation.name.replace(/ /g, '_')}.pdf`);
};

export const handleExportPresentationMarkdown = (presentation: Presentation) => {
  let mdContent = `# ${presentation.name}\n\n`;

  presentation.slides.forEach((slide, index) => {
    mdContent += slide.content || '[Empty Slide]';

    if (slide.speakerNotes) {
      mdContent += `\n\n> ### Speaker Notes\n> ${slide.speakerNotes.replace(
        /\n/g,
        '\n> ',
      )}`;
    }

    if (index < presentation.slides.length - 1) {
      mdContent += '\n\n---\n\n';
    }
  });

  const blob = new Blob([mdContent], {type: 'text/markdown;charset=utf-8;'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${presentation.name.replace(/ /g, '_')}.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
