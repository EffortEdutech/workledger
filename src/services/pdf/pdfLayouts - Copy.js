/**
 * WorkLedger - PDF Layout Renderers
 * 
 * Layout-specific rendering functions for different section types.
 * Each function renders a section according to its layout type.
 * 
 * @module services/pdf/pdfLayouts
 * @created February 5, 2026 - Session 17
 */

import {
  formatFieldValue,
  getFieldLabel,
  calculateTextHeight,
  wrapText,
  drawBox,
  checkPageBreak,
  drawHorizontalLine,
  embedImage,
  embedSignature
} from './pdfHelpers';

/**
 * Render section in two-column layout
 * 
 * @param {Object} pdf - jsPDF instance
 * @param {Object} section - Section definition
 * @param {Object} data - Work entry data
 * @param {number} yPos - Current Y position
 * @returns {number} New Y position
 */
export function renderTwoColumn(pdf, section, data, yPos) {
  const marginLeft = 20;
  const pageWidth = pdf.internal.pageSize.width;
  const columnGap = 10;
  const columnWidth = (pageWidth - marginLeft * 2 - columnGap) / 2;
  
  // Section title
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text(section.section_name, marginLeft, yPos);
  yPos += 6;
  
  // Separator line
  drawHorizontalLine(pdf, yPos, marginLeft);
  yPos += 5;
  
  // Split fields into two columns
  const leftFields = [];
  const rightFields = [];
  
  section.fields.forEach((field, index) => {
    if (index % 2 === 0) {
      leftFields.push(field);
    } else {
      rightFields.push(field);
    }
  });
  
  const maxRows = Math.max(leftFields.length, rightFields.length);
  
  for (let i = 0; i < maxRows; i++) {
    yPos = checkPageBreak(pdf, yPos, 12);
    
    // Left column
    if (leftFields[i]) {
      renderField(pdf, section, leftFields[i], data, marginLeft, yPos, columnWidth);
    }
    
    // Right column
    if (rightFields[i]) {
      const rightX = marginLeft + columnWidth + columnGap;
      renderField(pdf, section, rightFields[i], data, rightX, yPos, columnWidth);
    }
    
    yPos += 10;
  }
  
  return yPos + 3;
}

/**
 * Helper: Render a single field
 */
function renderField(pdf, section, field, data, x, y, width) {
  const fieldPath = `${section.section_id}.${field.field_id}`;
  const value = data[fieldPath];
  const formattedValue = formatFieldValue(field, value);
  
  // Label
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(80, 80, 80);
  pdf.text(getFieldLabel(field), x, y);
  
  // Value
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  const lines = wrapText(pdf, formattedValue, width - 2);
  lines.forEach((line, index) => {
    pdf.text(line, x, y + 4 + (index * 4));
  });
}

/**
 * Render section in single-column layout
 * 
 * @param {Object} pdf - jsPDF instance
 * @param {Object} section - Section definition
 * @param {Object} data - Work entry data
 * @param {number} yPos - Current Y position
 * @returns {number} New Y position
 */
export function renderSingleColumn(pdf, section, data, yPos) {
  const marginLeft = 20;
  const marginRight = 20;
  const pageWidth = pdf.internal.pageSize.width;
  const contentWidth = pageWidth - marginLeft - marginRight;
  
  // Section title
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text(section.section_name, marginLeft, yPos);
  yPos += 6;
  
  // Separator line
  drawHorizontalLine(pdf, yPos, marginLeft, marginRight);
  yPos += 5;
  
  // Render each field
  section.fields.forEach(field => {
    const fieldPath = `${section.section_id}.${field.field_id}`;
    const value = data[fieldPath];
    const formattedValue = formatFieldValue(field, value);
    
    // Calculate height needed
    const textHeight = calculateTextHeight(pdf, formattedValue, contentWidth);
    yPos = checkPageBreak(pdf, yPos, textHeight + 8);
    
    // Label
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(80, 80, 80);
    pdf.text(getFieldLabel(field), marginLeft, yPos);
    yPos += 4;
    
    // Value
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const lines = wrapText(pdf, formattedValue, contentWidth);
    lines.forEach(line => {
      pdf.text(line, marginLeft, yPos);
      yPos += 4;
    });
    
    yPos += 3; // Gap between fields
  });
  
  return yPos + 3;
}

/**
 * Render section as checklist
 * 
 * @param {Object} pdf - jsPDF instance
 * @param {Object} section - Section definition
 * @param {Object} data - Work entry data
 * @param {Object} layout - Layout configuration
 * @param {number} yPos - Current Y position
 * @returns {number} New Y position
 */
export function renderChecklist(pdf, section, data, layout, yPos) {
  const marginLeft = 20;
  
  // Section title
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text(section.section_name, marginLeft, yPos);
  yPos += 6;
  
  // Separator line
  drawHorizontalLine(pdf, yPos, marginLeft);
  yPos += 5;
  
  // Render checklist items
  section.fields.forEach(field => {
    const fieldPath = `${section.section_id}.${field.field_id}`;
    const value = data[fieldPath];
    const isChecked = value === true || value === 'true' || value === '✓';
    
    // Skip if show_checked_only and not checked
    if (layout?.show_checked_only && !isChecked) {
      return;
    }
    
    yPos = checkPageBreak(pdf, yPos, 6);
    
    // Checkbox
    const boxSize = 4;
    const boxY = yPos - 3;
    
    pdf.setLineWidth(0.3);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(marginLeft, boxY, boxSize, boxSize);
    
    // Checkmark if checked
    if (isChecked) {
      pdf.setLineWidth(0.5);
      pdf.line(marginLeft + 0.8, boxY + 2, marginLeft + 1.5, boxY + 3.2);
      pdf.line(marginLeft + 1.5, boxY + 3.2, marginLeft + 3.2, boxY + 0.8);
    }
    
    // Label
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(getFieldLabel(field), marginLeft + boxSize + 3, yPos);
    
    yPos += 6;
  });
  
  return yPos + 3;
}

/**
 * Render section as table
 * 
 * @param {Object} pdf - jsPDF instance
 * @param {Object} section - Section definition
 * @param {Object} data - Work entry data
 * @param {Object} layout - Layout configuration
 * @param {number} yPos - Current Y position
 * @returns {number} New Y position
 */
export function renderTable(pdf, section, data, layout, yPos) {
  const marginLeft = 20;
  const marginRight = 20;
  const pageWidth = pdf.internal.pageSize.width;
  const tableWidth = pageWidth - marginLeft - marginRight;
  
  // Section title
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text(section.section_name, marginLeft, yPos);
  yPos += 6;
  
  yPos = checkPageBreak(pdf, yPos, 15);
  
  // Calculate column widths
  const columnCount = section.fields.length;
  const columnWidth = tableWidth / columnCount;
  
  // Table header
  pdf.setFillColor(240, 240, 240);
  pdf.rect(marginLeft, yPos, tableWidth, 7, 'F');
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  
  section.fields.forEach((field, index) => {
    const x = marginLeft + (index * columnWidth) + 2;
    pdf.text(getFieldLabel(field), x, yPos + 5);
  });
  
  yPos += 7;
  
  // Table row
  pdf.setFont('helvetica', 'normal');
  pdf.setDrawColor(200, 200, 200);
  
  section.fields.forEach((field, index) => {
    const fieldPath = `${section.section_id}.${field.field_id}`;
    const value = data[fieldPath];
    const formattedValue = formatFieldValue(field, value);
    
    const x = marginLeft + (index * columnWidth) + 2;
    pdf.text(formattedValue, x, yPos + 5);
    
    // Cell border
    pdf.rect(marginLeft + (index * columnWidth), yPos, columnWidth, 7);
  });
  
  yPos += 10;
  
  return yPos;
}

/**
 * Render section as metrics cards
 * 
 * @param {Object} pdf - jsPDF instance
 * @param {Object} section - Section definition
 * @param {Object} data - Work entry data
 * @param {Object} layout - Layout configuration
 * @param {number} yPos - Current Y position
 * @returns {number} New Y position
 */
export function renderMetricsCards(pdf, section, data, layout, yPos) {
  const marginLeft = 20;
  const marginRight = 20;
  const pageWidth = pdf.internal.pageSize.width;
  const contentWidth = pageWidth - marginLeft - marginRight;
  
  // Section title
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text(section.section_name, marginLeft, yPos);
  yPos += 6;
  
  // Card dimensions
  const columns = layout?.columns || 3;
  const gap = 5;
  const cardWidth = (contentWidth - (gap * (columns - 1))) / columns;
  const cardHeight = 22;
  
  yPos = checkPageBreak(pdf, yPos, cardHeight + 5);
  
  let xPos = marginLeft;
  let cardsInRow = 0;
  
  section.fields.forEach(field => {
    const fieldPath = `${section.section_id}.${field.field_id}`;
    const value = data[fieldPath];
    
    // Card background
    drawBox(pdf, xPos, yPos, cardWidth, cardHeight, {
      fillColor: [59, 130, 246],
      strokeColor: [59, 130, 246],
      lineWidth: 0
    });
    
    // Value (large, centered)
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(
      String(value || '0'),
      xPos + cardWidth / 2,
      yPos + 10,
      { align: 'center' }
    );
    
    // Label (small, centered)
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    const lines = wrapText(pdf, getFieldLabel(field), cardWidth - 4);
    lines.forEach((line, index) => {
      pdf.text(
        line,
        xPos + cardWidth / 2,
        yPos + 16 + (index * 3),
        { align: 'center' }
      );
    });
    
    // Move to next position
    cardsInRow++;
    if (cardsInRow >= columns) {
      cardsInRow = 0;
      xPos = marginLeft;
      yPos += cardHeight + gap;
    } else {
      xPos += cardWidth + gap;
    }
  });
  
  // Move down if last row incomplete
  if (cardsInRow > 0) {
    yPos += cardHeight + gap;
  }
  
  // Reset text color
  pdf.setTextColor(0, 0, 0);
  
  return yPos + 3;
}

/**
 * Render signature box
 * 
 * @param {Object} pdf - jsPDF instance
 * @param {Object} section - Section definition
 * @param {Object} data - Work entry data
 * @param {number} yPos - Current Y position
 * @param {Object|null} signatureAttachment - Signature attachment
 * @returns {Promise<number>} New Y position
 */
export async function renderSignatureBox(pdf, section, data, yPos, signatureAttachment = null) {
  const marginLeft = 20;
  
  // Section title
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text(section.section_name, marginLeft, yPos);
  yPos += 6;
  
  // Separator line
  drawHorizontalLine(pdf, yPos, marginLeft);
  yPos += 5;
  
  yPos = checkPageBreak(pdf, yPos, 40);
  
  const sigWidth = 60;
  const sigHeight = 30;
  
  // Signature box
  pdf.setDrawColor(180, 180, 180);
  pdf.setLineWidth(0.5);
  pdf.rect(marginLeft, yPos, sigWidth, sigHeight);
  
  // Embed signature if available
  if (signatureAttachment?.storage_url) {
    await embedSignature(
      pdf,
      signatureAttachment.storage_url,
      marginLeft,
      yPos,
      sigWidth,
      sigHeight
    );
  } else {
    // Placeholder
    pdf.setFontSize(8);
    pdf.setTextColor(180, 180, 180);
    pdf.text(
      'Signature',
      marginLeft + sigWidth / 2,
      yPos + sigHeight / 2,
      { align: 'center' }
    );
    pdf.setTextColor(0, 0, 0);
  }
  
  yPos += sigHeight + 5;
  
  // Name, date fields
  section.fields.forEach(field => {
    if (field.field_type === 'signature') return;
    
    const fieldPath = `${section.section_id}.${field.field_id}`;
    const value = data[fieldPath];
    const formattedValue = formatFieldValue(field, value);
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(80, 80, 80);
    pdf.text(getFieldLabel(field) + ':', marginLeft, yPos);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(formattedValue, marginLeft + 25, yPos);
    
    yPos += 5;
  });
  
  return yPos + 5;
}

/**
 * Render photo grid
 * 
 * @param {Object} pdf - jsPDF instance
 * @param {Array} photos - Array of photo attachments
 * @param {Object} layout - Layout configuration
 * @param {number} yPos - Current Y position
 * @returns {Promise<number>} New Y position
 */
export async function renderPhotoGrid(pdf, photos, layout, yPos) {
  if (!photos || photos.length === 0) return yPos;
  
  const marginLeft = 20;
  const marginRight = 20;
  const pageWidth = pdf.internal.pageSize.width;
  const contentWidth = pageWidth - marginLeft - marginRight;
  
  // Section title
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Photos', marginLeft, yPos);
  yPos += 6;
  
  // Photo dimensions
  const columns = layout?.columns || 2;
  const gap = 5;
  const photoWidth = (contentWidth - (gap * (columns - 1))) / columns;
  const photoHeight = photoWidth * 0.75; // 4:3 ratio
  
  let xPos = marginLeft;
  let photosInRow = 0;
  
  for (const photo of photos) {
    yPos = checkPageBreak(pdf, yPos, photoHeight + 10);
    
    // Embed photo
    await embedImage(
      pdf,
      photo.storage_url,
      xPos,
      yPos,
      photoWidth,
      photoHeight
    );
    
    // Caption
    if (photo.file_name) {
      pdf.setFontSize(7);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        photo.file_name,
        xPos + photoWidth / 2,
        yPos + photoHeight + 4,
        { align: 'center' }
      );
      pdf.setTextColor(0, 0, 0);
    }
    
    // Move to next position
    photosInRow++;
    if (photosInRow >= columns) {
      photosInRow = 0;
      xPos = marginLeft;
      yPos += photoHeight + 8;
    } else {
      xPos += photoWidth + gap;
    }
  }
  
  // Move down if last row incomplete
  if (photosInRow > 0) {
    yPos += photoHeight + 8;
  }
  
  return yPos + 5;
}
