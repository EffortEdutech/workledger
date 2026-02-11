/**
 * WorkLedger - Report Service (UPDATED)
 * 
 * Handles report generation, history management, and PDF operations.
 * Fetches data from Supabase, delegates PDF generation to pdfService.
 * 
 * NEW in Session 19:
 *   - saveReportHistory() — persist report metadata to generated_reports table
 *   - getReportHistory() — fetch report list for a contract
 *   - archiveReport() / deleteReport() — manage report lifecycle
 *   - generateWeeklyReport() — auto-select entries for a week
 *   - getReportStats() — dashboard stats for a contract
 *   - regenerateReport() — regenerate PDF from saved parameters
 * 
 * @module services/api/reportService
 * @created February 5, 2026 - Session 18
 * @updated February 6, 2026 - Session 19: Report history + monthly/weekly
 */

import { supabase } from '../supabase/client';
import { pdfService } from '../pdf/pdfService';

class ReportService {

  // ============================================
  // REPORT GENERATION
  // ============================================

  /**
   * Generate report with PDF
   */
  async generateReport(entryIds, options = {}) {
    try {
      console.log('📊 Generating report for', entryIds.length, 'entries');

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
        return { success: false, error: 'No work entries found for the selected IDs' };
      }

      console.log('✅ Fetched', data.length, 'entries for report');

      const userIds = [...new Set(data.map(e => e.created_by).filter(Boolean))];
      const userProfiles = await this.getUserProfiles(userIds);
      const attachments = await this.getAllAttachments(entryIds);

      const entriesWithExtras = data.map(entry => ({
        ...entry,
        attachments: attachments.filter(a => a.work_entry_id === entry.id),
        created_by_profile: userProfiles[entry.created_by] || null
      }));

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
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate monthly report — auto-selects all entries for the given month
   */
  async generateMonthlyReport(contractId, year, month, extraOptions = {}) {
    try {
      console.log(`📅 Generating monthly report: ${year}-${String(month).padStart(2, '0')}`);

      const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const dateTo = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

      const entriesResult = await this.getWorkEntriesForReport(contractId, {
        dateFrom,
        dateTo,
        includeAll: true
      });

      if (!entriesResult.success) throw new Error(entriesResult.error);

      const entries = entriesResult.data;
      const entryIds = entries.map(e => e.id);

      if (entryIds.length === 0) {
        return { success: false, error: 'No entries found for this month' };
      }

      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const reportTitle = `${monthNames[month - 1]} ${year} Monthly Report`;

      const options = {
        reportType: 'monthly',
        reportTitle,
        month,
        year,
        periodStart: dateFrom,
        periodEnd: dateTo,
        ...extraOptions
      };

      const result = await this.generateReport(entryIds, options);
      if (!result.success) return result;

      // Save to history
      const reportRecord = await this.saveReportHistory({
        contractId,
        reportType: 'monthly',
        reportTitle,
        entryIds,
        options,
        periodStart: dateFrom,
        periodEnd: dateTo
      });

      return { ...result, reportRecord };

    } catch (error) {
      console.error('❌ Failed to generate monthly report:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate weekly report — auto-selects all entries for the given week
   */
  async generateWeeklyReport(contractId, weekStart, weekEnd, extraOptions = {}) {
    try {
      console.log(`📅 Generating weekly report: ${weekStart} to ${weekEnd}`);

      const entriesResult = await this.getWorkEntriesForReport(contractId, {
        dateFrom: weekStart,
        dateTo: weekEnd,
        includeAll: true
      });

      if (!entriesResult.success) throw new Error(entriesResult.error);

      const entries = entriesResult.data;
      const entryIds = entries.map(e => e.id);

      if (entryIds.length === 0) {
        return { success: false, error: 'No entries found for this week' };
      }

      const startDate = new Date(weekStart);
      const endDate = new Date(weekEnd);
      const fmt = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      const reportTitle = `Weekly Report: ${fmt(startDate)} – ${fmt(endDate)} ${endDate.getFullYear()}`;

      const options = {
        reportType: 'weekly',
        reportTitle,
        periodStart: weekStart,
        periodEnd: weekEnd,
        ...extraOptions
      };

      const result = await this.generateReport(entryIds, options);
      if (!result.success) return result;

      const reportRecord = await this.saveReportHistory({
        contractId,
        reportType: 'weekly',
        reportTitle,
        entryIds,
        options,
        periodStart: weekStart,
        periodEnd: weekEnd
      });

      return { ...result, reportRecord };

    } catch (error) {
      console.error('❌ Failed to generate weekly report:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Regenerate PDF from a saved report history record
   */
  async regenerateReport(reportRecord) {
    try {
      console.log('🔄 Regenerating report:', reportRecord.report_title);

      const entryIds = reportRecord.entry_ids || [];
      const options = reportRecord.options || {};

      if (entryIds.length === 0) {
        return { success: false, error: 'No entry IDs stored for this report' };
      }

      return await this.generateReport(entryIds, options);
    } catch (error) {
      console.error('❌ Failed to regenerate report:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // REPORT HISTORY (generated_reports table)
  // ============================================

  /**
   * Save report generation metadata to history
   */
  async saveReportHistory({ contractId, reportType, reportTitle, entryIds, options = {}, periodStart = null, periodEnd = null }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const record = {
        contract_id: contractId,
        report_type: reportType,
        report_title: reportTitle,
        entry_ids: entryIds,
        options,
        period_start: periodStart,
        period_end: periodEnd,
        entry_count: entryIds.length,
        status: 'active',
        generated_by: user?.id,
        generated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('generated_reports')
        .insert(record)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to save report history:', error);
        return null;
      }

      console.log('✅ Report saved to history:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Error saving report history:', error);
      return null;
    }
  }

  /**
   * Get report history for a contract
   */
  async getReportHistory(contractId, filters = {}) {
    try {
      console.log('📋 Fetching report history for contract:', contractId);

      let query = supabase
        .from('generated_reports')
        .select('*')
        .eq('contract_id', contractId)
        .is('deleted_at', null);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.reportType) {
        query = query.eq('report_type', filters.reportType);
      }

      query = query.order('generated_at', { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Failed to fetch report history:', error);
        throw error;
      }

      const userIds = [...new Set((data || []).map(r => r.generated_by).filter(Boolean))];
      const userProfiles = await this.getUserProfiles(userIds);

      const reportsWithProfiles = (data || []).map(report => ({
        ...report,
        generated_by_name: userProfiles[report.generated_by]?.full_name || 'Unknown'
      }));

      console.log('✅ Found', reportsWithProfiles.length, 'reports');
      return { success: true, data: reportsWithProfiles };
    } catch (error) {
      console.error('❌ Error fetching report history:', error);
      return { success: false, data: [], error: error.message };
    }
  }

  /**
   * Archive a report
   */
  async archiveReport(reportId) {
    try {
      const { data, error } = await supabase
        .from('generated_reports')
        .update({ status: 'archived', archived_at: new Date().toISOString() })
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;
      console.log('🗄️ Report archived:', reportId);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Failed to archive report:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Restore an archived report
   */
  async restoreReport(reportId) {
    try {
      const { data, error } = await supabase
        .from('generated_reports')
        .update({ status: 'active', archived_at: null })
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;
      console.log('♻️ Report restored:', reportId);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Failed to restore report:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Soft-delete a report
   */
  async deleteReport(reportId) {
    try {
      const { error } = await supabase
        .from('generated_reports')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', reportId);

      if (error) throw error;
      console.log('🗑️ Report deleted:', reportId);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete report:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get report statistics for a contract
   */
  async getReportStats(contractId) {
    try {
      const { data, error } = await supabase
        .from('generated_reports')
        .select('id, report_type, entry_count, generated_at')
        .eq('contract_id', contractId)
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('generated_at', { ascending: false });

      if (error) throw error;

      const reports = data || [];
      const totalEntries = reports.reduce((sum, r) => sum + (r.entry_count || 0), 0);

      return {
        totalReports: reports.length,
        totalEntries,
        lastGenerated: reports[0]?.generated_at || null,
        byType: {
          custom: reports.filter(r => r.report_type === 'custom').length,
          monthly: reports.filter(r => r.report_type === 'monthly').length,
          weekly: reports.filter(r => r.report_type === 'weekly').length
        }
      };
    } catch (error) {
      console.error('❌ Failed to fetch report stats:', error);
      return { totalReports: 0, totalEntries: 0, lastGenerated: null, byType: {} };
    }
  }

  // ============================================
  // DATA HELPERS
  // ============================================

  async getUserProfiles(userIds) {
    try {
      if (!userIds || userIds.length === 0) return {};
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, phone_number, avatar_url')
        .in('id', userIds);
      if (error) { console.error('❌ Failed to fetch user profiles:', error); return {}; }
      const profileMap = {};
      (data || []).forEach(p => { profileMap[p.id] = p; });
      return profileMap;
    } catch (error) { console.error('❌ Error fetching user profiles:', error); return {}; }
  }

  async getAllAttachments(entryIds) {
    try {
      if (!entryIds || entryIds.length === 0) return [];
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .in('work_entry_id', entryIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });
      if (error) { console.error('❌ Failed to fetch attachments:', error); return []; }
      console.log('📎 Fetched', data?.length || 0, 'attachments');
      return data || [];
    } catch (error) { console.error('❌ Error fetching attachments:', error); return []; }
  }

  async getWorkEntriesForReport(contractId, filters = {}) {
    try {
      console.log('📋 Fetching work entries for contract:', contractId);
      let query = supabase
        .from('work_entries')
        .select('id, entry_date, shift, status, created_at, created_by')
        .eq('contract_id', contractId)
        .is('deleted_at', null);

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.dateFrom) query = query.gte('entry_date', filters.dateFrom);
      if (filters.dateTo) query = query.lte('entry_date', filters.dateTo);
      if (!filters.includeAll) query = query.in('status', ['submitted', 'approved']);

      query = query.order('entry_date', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;

      console.log('✅ Found', data?.length || 0, 'work entries');
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

  // ============================================
  // PDF HELPERS
  // ============================================

  downloadPDF(blob, filename) {
    pdfService.downloadPDF(blob, filename);
  }

  openPDFInNewTab(blob) {
    pdfService.openInNewTab(blob);
  }
}

export const reportService = new ReportService();
export default ReportService;
