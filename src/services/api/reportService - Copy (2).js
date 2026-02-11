/**
 * WorkLedger - Report Service (CONSOLIDATED)
 * 
 * Handles report generation and management.
 * Fetches data from Supabase, delegates PDF generation to pdfService.
 * 
 * Flow:
 *   ReportGenerator.jsx → reportService.generateReport(entryIds, options)
 *     → Fetch entries + templates + contracts + attachments from Supabase
 *     → pdfService.generatePDF(reportData, options)
 *     → Return { success, blob, filename }
 * 
 * @module services/api/reportService
 * @created February 5, 2026 - Session 18
 * @updated February 6, 2026 - Fixed async PDF generation + proper data fetching
 */

import { supabase } from '../supabase/client';
import { pdfService } from '../pdf/pdfService';

class ReportService {
  /**
   * Generate report with PDF
   * 
   * @param {Array<string>} entryIds - Work entry IDs to include
   * @param {Object} options - Report options
   * @returns {Promise<Object>} { success, blob, filename, data }
   */
  async generateReport(entryIds, options = {}) {
    try {
      console.log('📊 Generating report for', entryIds.length, 'entries');

      // Fetch work entries with related data (template + contract + project + org)
      const { data, error } = await supabase
        .from('work_entries')
        .select(`
          *,
          contract:contracts(
            *,
            project:projects(
              *,
              organization:organizations(*)
            )
          ),
          template:templates(*)
        `)
        .in('id', entryIds)
        .order('entry_date', { ascending: true });

      if (error) {
        console.error('❌ Failed to fetch work entries for report:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          error: 'No work entries found for the selected IDs'
        };
      }

      console.log('✅ Fetched', data.length, 'entries for report');

      // Fetch user profiles for display names
      const userIds = [...new Set(data.map(e => e.created_by).filter(Boolean))];
      const userProfiles = await this.getUserProfiles(userIds);

      // Fetch attachments for all entries
      const attachments = await this.getAllAttachments(entryIds);

      // Map attachments and user profiles to entries
      const entriesWithExtras = data.map(entry => ({
        ...entry,
        attachments: attachments.filter(a => a.work_entry_id === entry.id),
        created_by_profile: userProfiles[entry.created_by] || null
      }));

      // Prepare report data structure
      const reportData = {
        entries: entriesWithExtras,
        metadata: {
          totalEntries: data.length,
          dateRange: {
            from: data[0]?.entry_date,
            to: data[data.length - 1]?.entry_date
          },
          contract: data[0]?.contract,
          generatedAt: new Date().toISOString(),
          generatedBy: (await supabase.auth.getUser()).data.user?.id,
          ...options
        }
      };

      // Generate PDF (AWAIT - pdfService.generatePDF is async!)
      console.log('📄 Generating PDF...');
      const pdfResult = await pdfService.generatePDF(reportData, options);

      return {
        success: true,
        blob: pdfResult.blob,
        filename: pdfResult.filename,
        pdf: pdfResult.pdf,
        data: reportData
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
   * Get user profiles for multiple user IDs
   */
  async getUserProfiles(userIds) {
    try {
      if (!userIds || userIds.length === 0) return {};

      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, phone_number, avatar_url')
        .in('id', userIds);

      if (error) {
        console.error('❌ Failed to fetch user profiles:', error);
        return {};
      }

      // Convert array to map for easy lookup
      const profileMap = {};
      (data || []).forEach(profile => {
        profileMap[profile.id] = profile;
      });

      return profileMap;
    } catch (error) {
      console.error('❌ Error fetching user profiles:', error);
      return {};
    }
  }

  /**
   * Get ALL attachments for multiple entry IDs in one query
   */
  async getAllAttachments(entryIds) {
    try {
      if (!entryIds || entryIds.length === 0) return [];

      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .in('work_entry_id', entryIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Failed to fetch attachments:', error);
        return [];
      }

      console.log('📎 Fetched', data?.length || 0, 'attachments');
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching attachments:', error);
      return [];
    }
  }

  /**
   * Get work entries for a contract (for report selection UI)
   */
  async getWorkEntriesForReport(contractId, filters = {}) {
    try {
      console.log('📋 Fetching work entries for contract:', contractId);

      let query = supabase
        .from('work_entries')
        .select('id, entry_date, shift, status, created_at, created_by')
        .eq('contract_id', contractId)
        .is('deleted_at', null);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.dateFrom) {
        query = query.gte('entry_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('entry_date', filters.dateTo);
      }
      if (!filters.includeAll) {
        query = query.in('status', ['submitted', 'approved']);
      }

      query = query.order('entry_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      console.log('✅ Found', data?.length || 0, 'work entries');

      // Add user display names
      const userIds = [...new Set(data.map(e => e.created_by).filter(Boolean))];
      const userProfiles = await this.getUserProfiles(userIds);

      const entriesWithProfiles = (data || []).map(entry => ({
        ...entry,
        created_by_name: userProfiles[entry.created_by]?.full_name || 'Unknown'
      }));

      return { success: true, data: entriesWithProfiles };
    } catch (error) {
      console.error('❌ Error fetching work entries:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Download PDF file (delegates to pdfService)
   */
  downloadPDF(blob, filename) {
    pdfService.downloadPDF(blob, filename);
  }

  /**
   * Open PDF in new tab (delegates to pdfService)
   */
  openPDFInNewTab(blob) {
    pdfService.openInNewTab(blob);
  }

  /**
   * Generate monthly report for a contract
   */
  async generateMonthlyReport(contractId, year, month) {
    try {
      const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const dateTo = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

      const entriesResult = await this.getWorkEntriesForReport(contractId, {
        dateFrom,
        dateTo,
        includeAll: false
      });

      if (!entriesResult.success) throw new Error(entriesResult.error);

      const entryIds = entriesResult.data.map(e => e.id);

      if (entryIds.length === 0) {
        return { success: false, error: 'No entries found for this month' };
      }

      return await this.generateReport(entryIds, {
        reportType: 'monthly',
        month,
        year
      });
    } catch (error) {
      console.error('❌ Failed to generate monthly report:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const reportService = new ReportService();

// Export class for testing
export default ReportService;
