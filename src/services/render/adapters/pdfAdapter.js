/**
 * WorkLedger - PDF Adapter
 * 
 * Converts Render Tree (IR) to PDF using jsPDF.
 * Delegates to existing pdfLayouts.js renderers for actual rendering.
 * 
 * @module services/render/adapters/pdfAdapter
 * @created February 12, 2026 - Session 2
 */

import jsPDF from 'jspdf';
import {
  renderTwoColumn,
  renderSingleColumn,
  renderChecklist,
  renderTable,
  renderMetricsCards,
  renderSignatureBox,
  renderPhotoGrid
} from '../../pdf/pdfLayouts';
import {
  formatDate,
  formatDateTime,
  checkPageBreak,
  addPageNumbers,
  drawHorizontalLine
} from '../../pdf/pdfHelpers';

class PDFAdapter {
  /**
   * Convert Render Tree to PDF
   * 
   * @param {Object} renderTree - Intermediate Representation
   * @param {Array} attachments - Photos and signatures (for embedding)
   * @param {jsPDF} existingPdf - Optional existing PDF instance (for multi-entry)
   * @returns {jsPDF} PDF document
   */
  async render(renderTree, attachments = [], existingPdf = null) {
    console.log('📄 PDFAdapter: Rendering PDF from Render Tree...');
    
    // Create or use existing PDF
    const pdf = existingPdf || new jsPDF({
      orientation: renderTree.page.orientation || 'portrait',
      unit: 'mm',
      format: renderTree.page.size || 'A4'
    });
    
    let yPos = 20;
    
    // Render header (metadata)
    yPos = this.renderPDFHeader(pdf, renderTree.metadata, yPos);
    
    // Render each block
    for (const block of renderTree.blocks) {
      yPos = await this.renderBlock(pdf, block, yPos, attachments);
      
      // Check page break
      yPos = checkPageBreak(pdf, yPos, 40);
    }
    
    console.log('✅ PDF rendered');
    return pdf;
  }
  
  /**
   * Render PDF header (contract info, report title)
   */
  renderPDFHeader(pdf, metadata, yPos) {
    const marginLeft = 20;
    const pageWidth = pdf.internal.pageSize.width;
    
    // Logo text
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(59, 130, 246);
    pdf.text('WORKLEDGER', marginLeft, yPos);
    
    // Generated date (right)
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      `Generated: ${formatDateTime(metadata.generatedAt)}`,
      pageWidth - 20,
      yPos,
      { align: 'right' }
    );
    yPos += 8;
    
    // Report title
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('WORK REPORT', marginLeft, yPos);
    yPos += 7;
    
    // Contract info
    if (metadata.contract?.number) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Contract: ${metadata.contract.number}`, marginLeft, yPos);
      yPos += 5;
    }
    
    if (metadata.contract?.name) {
      pdf.setFontSize(9);
      pdf.text(`Client: ${metadata.contract.name}`, marginLeft, yPos);
      yPos += 5;
    }
    
    // Entry info
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    const entryInfo = [];
    if (metadata.entryDate) entryInfo.push(`Date: ${formatDate(metadata.entryDate)}`);
    if (metadata.shift) entryInfo.push(`Shift: ${metadata.shift}`);
    if (entryInfo.length > 0) {
      pdf.text(entryInfo.join(' | '), marginLeft, yPos);
      yPos += 5;
    }
    
    // Horizontal line
    pdf.setTextColor(0, 0, 0);
    drawHorizontalLine(pdf, yPos, marginLeft);
    yPos += 5;
    
    return yPos;
  }
  
  /**
   * Render a block based on type
   */
  async renderBlock(pdf, block, yPos, attachments) {
    console.log(`  📦 Rendering block: ${block.type}`);
    
    // Map Render Tree block to existing pdfLayouts renderer
    switch (block.type) {
      case 'header':
        return this.renderHeaderBlock(pdf, block, yPos);
        
      case 'detail_entry':
        return this.renderDetailBlock(pdf, block, yPos);
        
      case 'text_section':
        return this.renderTextBlock(pdf, block, yPos);
        
      case 'checklist':
        return await this.renderChecklistBlock(pdf, block, yPos);
        
      case 'photo_grid':
        return await this.renderPhotoBlock(pdf, block, yPos, attachments);
        
      case 'signature_box':
        return await this.renderSignatureBlock(pdf, block, yPos, attachments);
        
      default:
        console.warn(`  ⚠️  Unknown block type: ${block.type}`);
        return yPos;
    }
  }
  
  /**
   * Render header block (section title)
   */
  renderHeaderBlock(pdf, block, yPos) {
    const marginLeft = 20;
    
    // Check page break
    yPos = checkPageBreak(pdf, yPos, 20);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    
    if (block.content.title || block.options.content?.title) {
      const title = block.content.title || block.options.content?.title;
      pdf.text(title, marginLeft, yPos);
      yPos += 7;
    }
    
    if (block.content.subtitle || block.options.content?.subtitle) {
      const subtitle = block.content.subtitle || block.options.content?.subtitle;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(subtitle, marginLeft, yPos);
      yPos += 6;
    }
    
    pdf.setTextColor(0, 0, 0);
    yPos += 3;
    return yPos;
  }
  
  /**
   * Render detail entry block using existing two_column renderer
   */
  renderDetailBlock(pdf, block, yPos) {
    // Convert block.content to section format expected by pdfLayouts
    const section = {
      section_id: block.blockId,
      section_name: this.formatLabel(block.blockId),
      fields: Object.entries(block.content)
        .filter(([key, value]) => value !== null && value !== undefined)
        .map(([key, value]) => ({
          field_id: key,
          field_name: this.formatLabel(key),
          field_type: this.guessFieldType(value)
        }))
    };
    
    const data = {};
    Object.entries(block.content).forEach(([key, value]) => {
      data[`${block.blockId}.${key}`] = value;
    });
    
    // Check page break
    yPos = checkPageBreak(pdf, yPos, 50);
    
    // Delegate to existing renderer
    if (block.layout === 'two_column' || block.layout === 'grid' || block.options.columns === 2) {
      return renderTwoColumn(pdf, section, data, yPos);
    } else {
      return renderSingleColumn(pdf, section, data, yPos);
    }
  }
  
  /**
   * Render text section
   */
  renderTextBlock(pdf, block, yPos) {
    const marginLeft = 20;
    const maxWidth = 170;
    
    const text = block.content.text || block.content.observations || '';
    
    if (!text) return yPos;
    
    // Check page break
    yPos = checkPageBreak(pdf, yPos, 30);
    
    // Section title
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    const title = block.options.title || 'Observations';
    pdf.text(title, marginLeft, yPos);
    yPos += 6;
    
    // Text content
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(text, maxWidth);
    
    // Check if all lines fit on page
    const requiredHeight = lines.length * 5;
    yPos = checkPageBreak(pdf, yPos, requiredHeight);
    
    pdf.text(lines, marginLeft, yPos);
    yPos += (lines.length * 5) + 5;
    
    return yPos;
  }
  
  /**
   * Render checklist using existing renderer
   */
  async renderChecklistBlock(pdf, block, yPos) {
    const items = block.content.items || [];
    
    if (items.length === 0) return yPos;
    
    // Check page break
    yPos = checkPageBreak(pdf, yPos, 40);
    
    // Create section for pdfLayouts
    const section = {
      section_id: block.blockId,
      section_name: block.options.title || 'Checklist',
      fields: [
        { field_id: 'items', field_name: 'Checklist Items', field_type: 'checklist' }
      ]
    };
    
    const data = {
      [`${block.blockId}.items`]: items
    };
    
    const sectionLayout = {
      layout: 'checklist',
      show_status: block.options.showStatus !== false
    };
    
    return renderChecklist(pdf, section, data, sectionLayout, yPos);
  }
  
  /**
   * Render photo grid using existing renderer
   */
  async renderPhotoBlock(pdf, block, yPos, attachments) {
    const photos = block.content.photos || block.content || [];
    
    if (photos.length === 0) return yPos;
    
    // Check page break
    yPos = checkPageBreak(pdf, yPos, 60);
    
    const photoLayout = {
      columns: block.options.columns || 2,
      title: block.options.title || 'Photo Documentation',
      show_timestamps: block.options.showTimestamps !== false,
      show_captions: block.options.showCaptions !== false
    };
    
    return await renderPhotoGrid(pdf, photos, photoLayout, yPos);
  }
  
  /**
   * Render signature box using existing renderer
   */
  async renderSignatureBlock(pdf, block, yPos, attachments) {
    const signatures = block.content.signatures || block.content || [];
    
    if (signatures.length === 0) {
      console.log('⚠️ No signatures in block');
      return yPos;
    }
    
    console.log(`✍️ Rendering ${signatures.length} signatures`);
    
    // Check page break
    yPos = checkPageBreak(pdf, yPos, 50);
    
    // Create section for pdfLayouts
    const section = {
      section_id: block.blockId,
      section_name: block.options.title || 'Signatures',
      fields: signatures.map((sig, idx) => ({
        field_id: sig.role || `signature_${idx}`,
        field_name: sig.name || `Signature ${idx + 1}`,
        field_type: 'signature'
      }))
    };
    
    const data = {};
    
    // Map signatures to expected format
    signatures.forEach((sig, index) => {
      const fieldId = sig.role || `signature_${index}`;
      data[`${block.blockId}.${fieldId}`] = sig;
    });
    
    // FIXED: Pass ALL signatures array instead of just first one!
    return await renderSignatureBox(pdf, section, data, yPos, signatures);
  }
  
  /**
   * Format label from snake_case
   */
  formatLabel(key) {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  /**
   * Guess field type from value
   */
  guessFieldType(value) {
    if (typeof value === 'boolean') return 'checkbox';
    if (typeof value === 'number') return 'number';
    if (value instanceof Date) return 'date';
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) return 'date';
    return 'text';
  }
}

// Export singleton instance
export const pdfAdapter = new PDFAdapter();
