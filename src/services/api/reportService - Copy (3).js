/**
 * WorkLedger - Report Service (Refactored)
 * 
 * Orchestrates report generation using Render Engine architecture.
 * Supports both new layout-driven and legacy template-driven generation.
 * 
 * Flow:
 * 1. Fetch work entries with relations
 * 2. Fetch report layout (if layoutId provided)
 * 3. Generate Render Trees using RenderEngineCore
 * 4. Route to HTMLAdapter or PDFAdapter
 * 5. Return result
 * 
 * @module services/api/reportService
 * @updated February 12, 2026 - Session 2 - Render Engine integration
 */

import { supabase } from '../supabase/client';
import { renderEngineCore } from '../render/renderEngineCore';
import { htmlAdapter } from '../render/adapters/htmlAdapter';
import { pdfAdapter } from '../render/adapters/pdfAdapter';
import { layoutRegistryService } from '../layoutRegistryService';

// Legacy PDF service (fallback for backward compatibility)
// import { pdfService as legacyPDFService } from '../pdf/pdfService';

class ReportService {
  /**
   * Generate report with layout selection
   * 
   * @param {Array<string>} entryIds - Work entry IDs
   * @param {Object} options - Generation options
   * @param {string} options.layoutId - Optional layout ID (new architecture)
   * @param {string} options.outputFormat - 'pdf' | 'html' | 'preview'
   * @param {string} options.orientation - 'portrait' | 'landscape'
   * @param {string} options.pageSize - 'a4' | 'letter'
   * @param {Object} options.entrySelections - Per-entry field selections
   * @returns {Promise<Object>} { success, blob?, html?, filename?, format }
   */
  async generateReport(entryIds, options = {}) {
    try {
      console.log('📄 ReportService: Starting report generation...');
      console.log('  Entries:', entryIds.length);
      console.log('  Layout ID:', options.layoutId);
      console.log('  Output:', options.outputFormat || 'pdf');
      
      // Validate inputs
      if (!entryIds || entryIds.length === 0) {
        throw new Error('No work entries provided');
      }
      
      // Fetch work entries with all relations
      const entries = await this.fetchWorkEntries(entryIds);
      
      if (!entries || entries.length === 0) {
        throw new Error('No work entries found');
      }
      
      // Determine which generation path to use
      if (options.layoutId) {
        // NEW: Layout-driven generation using Render Engine
        return await this.generateWithRenderEngine(entries, options);
      } else {
        // LEGACY: Template-driven generation (backward compatibility)
        console.log('⚠️  Using legacy generation (no layoutId provided)');
        return await this.generateLegacy(entries, options);
      }
      
    } catch (error) {
      console.error('❌ Report generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * NEW: Generate report using Render Engine architecture
   */
  async generateWithRenderEngine(entries, options) {
    try {
      console.log('🚀 Using Render Engine architecture');
      
      // 1. Fetch report layout
      const layout = await layoutRegistryService.getLayout(options.layoutId);
      
      console.log('  Layout:', layout.layout_name);
      
      // 2. Generate Render Trees for each entry
      const renderTrees = [];
      
      for (const entry of entries) {
        const renderTree = renderEngineCore.generateRenderTree(
          layout.layout_schema,
          entry,
          layout.binding_rules
        );
        
        renderTrees.push(renderTree);
      }
      
      console.log(`✅ Generated ${renderTrees.length} Render Trees`);
      
      // 3. Select output format
      if (options.outputFormat === 'html' || options.outputFormat === 'preview') {
        // HTML for preview
        return await this.generateHTML(renderTrees, entries, layout);
      } else {
        // PDF for final output (default)
        return await this.generatePDF(renderTrees, entries, layout, options);
      }
      
    } catch (error) {
      console.error('❌ Render Engine generation failed:', error);
      throw error;
    }
  }
  
  /**
   * Generate HTML for preview
   */
  async generateHTML(renderTrees, entries, layout) {
    console.log('🌐 Generating HTML...');
    
    const htmlParts = renderTrees.map((tree, index) => {
      const html = htmlAdapter.render(tree);
      
      // Add page break between entries (except last)
      if (index < renderTrees.length - 1) {
        return html + '<div style="page-break-after: always; height: 40px;"></div>';
      }
      
      return html;
    });
    
    const fullHTML = htmlParts.join('\n');
    
    console.log('✅ HTML generated');
    
    return {
      success: true,
      html: fullHTML,
      format: 'html',
      layoutName: layout.layout_name,
      entryCount: entries.length
    };
  }
  
  /**
   * Generate PDF
   */
  async generatePDF(renderTrees, entries, layout, options) {
    console.log('📄 Generating PDF...');
    
    // Create first page
    let pdf = await pdfAdapter.render(
      renderTrees[0],
      entries[0].attachments || []
    );
    
    // Add subsequent entries as new pages
    for (let i = 1; i < renderTrees.length; i++) {
      pdf.addPage();
      pdf = await pdfAdapter.render(
        renderTrees[i],
        entries[i].attachments || [],
        pdf
      );
    }
    
    // Add page numbers
    this.addPageNumbers(pdf);
    
    // Generate blob
    const blob = pdf.output('blob');
    const filename = this.generateFilename(entries[0].template, entries, layout);
    
    console.log('✅ PDF generated:', filename);
    
    return {
      success: true,
      blob,
      filename,
      pdf,
      format: 'pdf',
      layoutName: layout.layout_name,
      entryCount: entries.length
    };
  }
  
  /**
   * LEGACY: Generate using old pdfService (fallback)
   */
  async generateLegacy(entries, options) {
    console.log('⚠️  Using legacy PDF generation');
    
    // For now, throw error to force use of layoutId
    // In production, this would call the old pdfService
    throw new Error('Legacy generation not available. Please select a report layout.');
    
    // Uncomment when ready to support legacy:
    /*
    const legacyOptions = {
      orientation: options.orientation || 'portrait',
      pageSize: options.pageSize || 'a4',
      output: options.outputFormat || 'download',
      entrySelections: options.entrySelections
    };
    
    return await legacyPDFService.generatePDF(
      {
        entries,
        metadata: this.extractMetadata(entries)
      },
      legacyOptions
    );
    */
  }
  
  /**
   * Fetch work entries with all relations
   */
  async fetchWorkEntries(entryIds) {
    console.log('📥 Fetching work entries...');
    
    const { data, error } = await supabase
      .from('work_entries')
      .select(`
        *,
        contract:contracts!work_entries_contract_id_fkey(
          id,
          contract_number,
          contract_name,
          client_name,
          site_location,
          contract_category,
          contract_type
        ),
        template:templates!work_entries_template_id_fkey(
          id,
          template_id,
          template_name,
          contract_category,
          fields_schema
        ),
        attachments!work_entries_attachments_work_entry_id_fkey(
          id,
          file_name,
          file_type,
          storage_url,
          storage_path,
          caption,
          field_id,
          metadata,
          uploaded_at
        )
      `)
      .in('id', entryIds)
      .order('entry_date', { ascending: true });
    
    if (error) throw error;
    
    // Get creator profiles separately (Supabase auth.users limitation)
    const userIds = [...new Set(data.map(e => e.created_by))];
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .in('id', userIds);
    
    // Map profiles to entries
    const profileMap = {};
    (profiles || []).forEach(p => {
      profileMap[p.id] = p;
    });
    
    const entries = data.map(entry => ({
      ...entry,
      created_by_profile: profileMap[entry.created_by] || {
        id: entry.created_by,
        full_name: 'Unknown'
      }
    }));
    
    console.log(`✅ Fetched ${entries.length} entries with relations`);
    return entries;
  }
  
  /**
   * Extract metadata for headers/footers (legacy support)
   */
  extractMetadata(entries) {
    const firstEntry = entries[0];
    
    return {
      generatedAt: new Date().toISOString(),
      totalEntries: entries.length,
      dateRange: {
        from: entries[0].entry_date,
        to: entries[entries.length - 1].entry_date
      },
      contract: firstEntry.contract
    };
  }
  
  /**
   * Generate filename
   */
  generateFilename(template, entries, layout = null) {
    const contractCategory = template?.contract_category || 'REPORT';
    const layoutName = layout?.layout_name.replace(/\s+/g, '_') || 'standard';
    const dateStr = new Date().toISOString().split('T')[0];
    const entryCount = entries.length;
    
    return `WorkLedger_${contractCategory}_${layoutName}_${entryCount}entries_${dateStr}.pdf`;
  }
  
  /**
   * Add page numbers to PDF
   */
  addPageNumbers(pdf) {
    const pageCount = pdf.internal.getNumberOfPages();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
  }
  
  /**
   * Download PDF blob
   */
  downloadPDF(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('💾 PDF downloaded:', filename);
  }
  
  /**
   * Open PDF in new tab
   */
  openPDFInNewTab(blob) {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    console.log('🔗 PDF opened in new tab');
  }
  
  /**
   * Preview PDF in iframe (alternative to HTML preview)
   */
  previewPDFInIframe(blob, iframeElement) {
    const url = URL.createObjectURL(blob);
    iframeElement.src = url;
    
    console.log('👁️ PDF preview loaded in iframe');
  }
}

// Export singleton instance
export const reportService = new ReportService();
