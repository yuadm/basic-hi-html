import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { format } from 'date-fns';

interface CompanyInfo {
  name?: string;
  logo?: string;
}

interface QuestionnaireResponse {
  id: string;
  question_text: string;
  question_type: 'yes_no' | 'text' | 'multiple_choice' | 'number';
  response_value: string;
  options?: string[];
}

interface QuestionnaireData {
  questionnaire_name: string;
  employee_name: string;
  completion_date: string;
  responses: QuestionnaireResponse[];
}

export async function generateQuestionnairePDF(
  data: QuestionnaireData,
  company?: CompanyInfo
): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Embed fonts
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Colors
  const primaryColor = rgb(0.2, 0.4, 0.7);
  const textColor = rgb(0.1, 0.1, 0.1);
  const lightGray = rgb(0.9, 0.9, 0.9);

  let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  let yPosition = 800;
  const margin = 50;
  const pageWidth = page.getWidth() - 2 * margin;

  // Helper functions
  const drawText = (text: string, x: number, y: number, font = regularFont, size = 12, color = textColor) => {
    page.drawText(text, { x, y, size, font, color });
  };

  const drawBoldText = (text: string, x: number, y: number, size = 12, color = textColor) => {
    drawText(text, x, y, boldFont, size, color);
  };

  const wrapText = (text: string, maxWidth: number, fontSize = 12) => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = regularFont.widthOfTextAtSize(testLine, fontSize);
      
      if (textWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word);
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  const checkNewPage = (requiredSpace: number) => {
    if (yPosition - requiredSpace < 100) {
      page = pdfDoc.addPage([595.28, 841.89]);
      yPosition = 800;
      return true;
    }
    return false;
  };

  // Draw header
  if (company?.logo) {
    try {
      // Note: In a real implementation, you'd fetch and embed the logo
      // For now, we'll just add space for it
      yPosition -= 60;
    } catch (error) {
      console.warn('Could not embed logo:', error);
    }
  }

  // Company name
  if (company?.name) {
    drawBoldText(company.name, margin, yPosition, 16, primaryColor);
    yPosition -= 30;
  }

  // Title
  drawBoldText(data.questionnaire_name, margin, yPosition, 18, primaryColor);
  yPosition -= 40;

  // Employee and date info
  drawBoldText('Employee:', margin, yPosition, 12);
  drawText(data.employee_name, margin + 80, yPosition);
  yPosition -= 20;

  drawBoldText('Completed:', margin, yPosition, 12);
  drawText(format(new Date(data.completion_date), 'dd/MM/yyyy'), margin + 80, yPosition);
  yPosition -= 40;

  // Draw line separator
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: page.getWidth() - margin, y: yPosition },
    thickness: 1,
    color: lightGray,
  });
  yPosition -= 30;

  // Process responses
  for (let i = 0; i < data.responses.length; i++) {
    const response = data.responses[i];
    
    checkNewPage(80);

    // Question number and text
    const questionNumber = `${i + 1}.`;
    drawBoldText(questionNumber, margin, yPosition, 11);
    
    const questionLines = wrapText(response.question_text, pageWidth - 30, 11);
    for (let lineIndex = 0; lineIndex < questionLines.length; lineIndex++) {
      drawBoldText(questionLines[lineIndex], margin + 20, yPosition - (lineIndex * 15), 11);
    }
    yPosition -= (questionLines.length * 15) + 10;

    // Response
    let responseText = '';
    if (response.question_type === 'yes_no') {
      responseText = response.response_value === 'yes' ? '✓ Yes' : '✗ No';
    } else if (response.question_type === 'multiple_choice') {
      responseText = response.response_value;
    } else {
      responseText = response.response_value || 'No response provided';
    }

    // Handle long responses
    if (responseText.length > 100 || response.question_type === 'text') {
      const responseLines = wrapText(responseText, pageWidth - 40, 10);
      for (let lineIndex = 0; lineIndex < responseLines.length; lineIndex++) {
        checkNewPage(15);
        drawText(responseLines[lineIndex], margin + 30, yPosition - (lineIndex * 12), regularFont, 10);
      }
      yPosition -= (responseLines.length * 12) + 20;
    } else {
      checkNewPage(15);
      drawText(responseText, margin + 30, yPosition, regularFont, 10);
      yPosition -= 25;
    }
  }

  // Add footer with timestamp
  const pageCount = pdfDoc.getPageCount();
  for (let i = 0; i < pageCount; i++) {
    const currentPage = pdfDoc.getPage(i);
    const footerText = `Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')} - Page ${i + 1} of ${pageCount}`;
    const footerWidth = regularFont.widthOfTextAtSize(footerText, 8);
    currentPage.drawText(footerText, {
      x: (currentPage.getWidth() - footerWidth) / 2,
      y: 30,
      size: 8,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5)
    });
  }

  // Save and download
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  const fileName = `${data.questionnaire_name.replace(/\s+/g, '_')}_${data.employee_name.replace(/\s+/g, '_')}_${format(new Date(data.completion_date), 'yyyy-MM-dd')}.pdf`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}