/**
 * WorkLedger - Work Entry Service
 *
 * Handles all work entry operations (CRUD, status transitions, filtering).
 * Integrates with template system for dynamic form data storage.
 *
 * SESSION 10 UPDATE: getUserWorkEntries and getWorkEntriesCount now accept
 * optional `orgId` from OrganizationContext. When passed, queries filter
 * directly by organization_id (column added in Session 9 migration 023).
 *
 * @module services/api/workEntryService
 * @created February 1, 2026 - Session 13
 * @updated February 20, 2026 - Session 10: orgId param for org switching
 */

import { supabase } from '../supabase/client';

class WorkEntryService {

  // ─────────────────────────────────────────────
  // READ — LIST
  // ─────────────────────────────────────────────

  /**
   * Get work entries visible to current user.
   *
   * For regular users: RLS limits results to their own entries + manager-visible entries.
   * For BJ staff viewing a specific org: filters by organization_id directly.
   *
   * @param {Object} filters - Optional filters (contractId, status, startDate, endDate, sortBy, sortOrder)
   * @param {string|null} orgId - From OrganizationContext. Pass null for own-org behaviour.
   * @returns {Promise<{success: boolean, data: Array, error: string|null}>}
   */
  async getUserWorkEntries(filters = {}, orgId = null) {
    try {
      console.log('📋 Fetching work entries...', orgId ? `(org: ${orgId})` : '(user scope)');

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      let query = supabase
        .from('work_entries')
        .select(`
          id,
          contract_id,
          template_id,
          entry_date,
          shift,
          data,
          status,
          organization_id,
          created_by,
          created_at,
          updated_at,
          submitted_at,
          submitted_by,
          approved_at,
          approved_by,
          approval_remarks,
          rejected_at,
          rejected_by,
          rejection_reason,
          deleted_at,
          contract:contracts (
            id,
            contract_number,
            contract_name,
            contract_category,
            project:projects (
              id,
              project_name,
              client_name
            )
          ),
          template:templates (
            id,
            template_name,
            contract_category
          )
        `)
        .is('deleted_at', null);

      // ── Org filter ──
      // If orgId supplied (BJ staff org switch) → filter by org directly.
      // If null → RLS handles visibility (user sees their own entries).
      if (orgId) {
        query = query.eq('organization_id', orgId);
      }

      // ── Additional filters ──
      if (filters.contractId) query = query.eq('contract_id', filters.contractId);
      if (filters.status)     query = query.eq('status', filters.status);
      if (filters.startDate)  query = query.gte('entry_date', filters.startDate);
      if (filters.endDate)    query = query.lte('entry_date', filters.endDate);

      // ── Sorting ──
      const sortBy    = filters.sortBy    || 'entry_date';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) {
        console.error('❌ Failed to fetch work entries:', error);
        throw error;
      }

      console.log(`✅ Fetched ${data.length} work entries`);
      return { success: true, data: data || [] };

    } catch (error) {
      console.error('❌ Error in getUserWorkEntries:', error);
      return { success: false, data: [], error: error.message };
    }
  }

  /**
   * Get work entries count for dashboard stats.
   * @param {string|null} orgId - From OrganizationContext.
   */
  async getWorkEntriesCount(orgId = null) {
    try {
      let query = supabase
        .from('work_entries')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);

      if (orgId) {
        query = query.eq('organization_id', orgId);
      }

      const { count, error } = await query;

      if (error) {
        console.error('❌ Error getting work entries count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('❌ Exception getting work entries count:', error);
      return 0;
    }
  }

  // ─────────────────────────────────────────────
  // READ — SINGLE
  // ─────────────────────────────────────────────

  /**
   * Get single work entry by ID.
   * @param {string} id - Work entry ID
   * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
   */
  async getWorkEntry(id) {
    try {
      console.log('📄 Fetching work entry:', id);

      const { data, error } = await supabase
        .from('work_entries')
        .select(`
          id,
          contract_id,
          template_id,
          entry_date,
          shift,
          data,
          status,
          organization_id,
          created_by,
          created_at,
          updated_at,
          submitted_at,
          submitted_by,
          approved_at,
          approved_by,
          approval_remarks,
          rejected_at,
          rejected_by,
          rejection_reason,
          deleted_at,
          contract:contracts (
            id,
            contract_number,
            contract_name,
            contract_category,
            contract_type,
            reporting_frequency,
            project:projects (
              id,
              project_name,
              client_name,
              organization:organizations (id, name)
            )
          ),
          template:templates (
            id,
            template_id,
            template_name,
            contract_category,
            fields_schema
          )
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.error('❌ Failed to fetch work entry:', error);
        throw error;
      }

      if (!data) throw new Error('Work entry not found');

      console.log('✅ Fetched work entry:', data.id);
      return { success: true, data };

    } catch (error) {
      console.error('❌ Error in getWorkEntry:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  // ─────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────

  /**
   * Create a new work entry.
   * NOTE: organization_id is auto-set by DB trigger (migration 023).
   * No need to pass it from frontend.
   *
   * @param {string} contractId
   * @param {string} templateId
   * @param {Object} entryData - { entry_date, shift, data }
   */
  async createWorkEntry(contractId, templateId, entryData) {
    try {
      console.log('📝 Creating work entry for contract:', contractId);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      const payload = {
        contract_id: contractId,
        template_id: templateId,
        entry_date: entryData.entry_date || new Date().toISOString().split('T')[0],
        shift: entryData.shift || null,
        data: entryData.data || {},
        status: 'draft',
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // organization_id auto-set by trigger — do NOT pass it here
      };

      const { data, error } = await supabase
        .from('work_entries')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating work entry:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Work entry created:', data.id);
      return { success: true, data };

    } catch (error) {
      console.error('❌ Exception creating work entry:', error);
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────

  /**
   * Update work entry data (draft only).
   * @param {string} id - Work entry ID
   * @param {Object} updates - Fields to update
   */
  async updateWorkEntry(id, updates) {
    try {
      console.log('📝 Updating work entry:', id);

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Protect immutable fields
      delete updateData.id;
      delete updateData.contract_id;
      delete updateData.created_by;
      delete updateData.created_at;
      delete updateData.organization_id;

      const { data, error } = await supabase
        .from('work_entries')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating work entry:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Work entry updated:', id);
      return { success: true, data };

    } catch (error) {
      console.error('❌ Exception updating work entry:', error);
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────────
  // STATUS TRANSITIONS
  // ─────────────────────────────────────────────

  /**
   * Submit work entry for approval.
   * @param {string} id - Work entry ID
   */
  async submitWorkEntry(id) {
    try {
      console.log('📤 Submitting work entry:', id);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const { data, error } = await supabase
        .from('work_entries')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          submitted_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('status', 'draft')  // Can only submit drafts
        .select()
        .single();

      if (error) {
        console.error('❌ Error submitting work entry:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Work entry submitted:', id);
      return { success: true, data };

    } catch (error) {
      console.error('❌ Exception submitting work entry:', error);
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────

  /**
   * Soft delete work entry (draft only).
   * @param {string} id - Work entry ID
   */
  async deleteWorkEntry(id) {
    try {
      console.log('🗑️ Deleting work entry:', id);

      const { error } = await supabase
        .from('work_entries')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting work entry:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Work entry deleted (soft):', id);
      return { success: true };

    } catch (error) {
      console.error('❌ Exception deleting work entry:', error);
      return { success: false, error: error.message };
    }
  }
}

export const workEntryService = new WorkEntryService();
export default workEntryService;
