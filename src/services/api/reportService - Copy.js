/**
 * WorkLedger - Report Service
 * 
 * API layer for report generation and management.
 * Orchestrates work entry fetching and PDF generation.
 * 
 * @module services/api/reportService
 * @created February 5, 2026 - Session 18
 */

import { supabase } from '../supabase/client';
import { pdfService } from '../pdf/pdfGenerator';

/**
 * Report Service Class
 */
class ReportService {
  /**
   * Generate PDF report for single or multiple work entries
   * 
   * @param {Array<string>} workEntryIds - Array of work entry IDs
   * @param {Object} options - Report options
   * @returns {Promise<Object>} Result with PDF blob
   */
  async generateReport(workEntryIds, options = {}) {
    try {
      console.log('📊 Generating report for', workEntryIds.length, 'entries');
      
      const {
        includeLogo = true,
        includePhotos = true,
        includeSignatures = true,
        orientation = 'portrait',
        pageSize = 'A4'
      } = options;
      
      // Fetch work entries with full details
      const { data: workEntries, error: entriesError } = await supabase
        .from('work_entries')
        .select(`
          *,
          contract:contracts (
            *,
            organization:organizations (*)
          ),
          template:templates (*),
          created_by_user:auth.users (*)
        `)
        .in('id', workEntryIds)
        .order('entry_date', { ascending: true });
      
      if (entriesError) throw entriesError;
      
      if (!workEntries || workEntries.length === 0) {
        return {
          success: false,
          error: 'No work entries found'
        };
      }
      
      // Fetch attachments if needed
      let attachments = [];
      if (includePhotos || includeSignatures) {
        const types = [];
        if (includePhotos) types.push('photo');
        if (includeSignatures) types.push('signature');
        
        const { data: attachmentsData, error: attachmentsError } = await supabase
          .from('attachments')
          .select('*')
          .in('work_entry_id', workEntryIds)
          .in('attachment_type', types)
          .is('deleted_at', null);
        
        if (attachmentsError) throw attachmentsError;
        
        attachments = attachmentsData || [];
      }
      
      // Generate PDF for each entry
      // (For now, single entry. Multi-entry can be enhanced later)
      const workEntry = workEntries[0];
      const entryAttachments = attachments.filter(
        a => a.work_entry_id === workEntry.id
      );
      
      // Override template layout options if provided
      const template = { ...workEntry.template };
      if (template.pdf_layout) {
        template.pdf_layout.orientation = orientation;
        template.pdf_layout.page_size = pageSize;
        if (template.pdf_layout.header) {
          template.pdf_layout.header.show_logo = includeLogo;
        }
      }
      
      // Generate PDF
      const pdfBlob = await pdfService.generateReport(
        workEntry,
        template,
        workEntry.contract,
        entryAttachments
      );
      
      // Create filename
      const filename = this.generateFilename(workEntry);
      
      console.log('✅ Report generated successfully');
      
      return {
        success: true,
        blob: pdfBlob,
        filename: filename
      };
      
    } catch (error) {
      console.error('❌ Failed to generate report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Generate monthly report (aggregated)
   * 
   * @param {string} contractId - Contract ID
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {Promise<Object>} Result with PDF blob
   */
  async generateMonthlyReport(contractId, year, month) {
    try {
      console.log('📊 Generating monthly report:', { contractId, year, month });
      
      // Calculate date range
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of month
      
      // Fetch work entries for the month
      const { data: workEntries, error } = await supabase
        .from('work_entries')
        .select(`
          *,
          contract:contracts (*),
          template:templates (*)
        `)
        .eq('contract_id', contractId)
        .gte('entry_date', startDate.toISOString().split('T')[0])
        .lte('entry_date', endDate.toISOString().split('T')[0])
        .eq('status', 'approved')
        .order('entry_date');
      
      if (error) throw error;
      
      if (!workEntries || workEntries.length === 0) {
        return {
          success: false,
          error: 'No approved entries found for this month'
        };
      }
      
      // TODO: Implement monthly aggregation logic
      // For now, return list of entry IDs
      
      console.log('✅ Monthly report generated');
      
      return {
        success: true,
        entryCount: workEntries.length,
        entries: workEntries
      };
      
    } catch (error) {
      console.error('❌ Failed to generate monthly report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get report history for contract
   * 
   * @param {string} contractId - Contract ID
   * @returns {Promise<Object>} Result with reports list
   */
  async getReportHistory(contractId) {
    // TODO: Implement report history storage
    // For now, return empty array
    
    return {
      success: true,
      data: []
    };
  }
  
  /**
   * Download PDF blob
   * 
   * @param {Blob} blob - PDF blob
   * @param {string} filename - Filename
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
    
    console.log('✅ PDF downloaded:', filename);
  }
  
  /**
   * Generate filename for report
   * 
   * @param {Object} workEntry - Work entry
   * @returns {string} Filename
   */
  generateFilename(workEntry) {
    const date = new Date(workEntry.entry_date)
      .toISOString()
      .split('T')[0]
      .replace(/-/g, '');
    
    const contractNo = workEntry.contract?.contract_no
      ?.replace(/[^a-zA-Z0-9]/g, '_') || 'REPORT';
    
    return `${contractNo}_${date}_${workEntry.id.substring(0, 8)}.pdf`;
  }
}

// Export singleton instance
export const reportService = new ReportService();
