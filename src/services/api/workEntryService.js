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

      // ── Org filter ──────────────────────────────────────────────────
      // SESSION 15 FIX: When orgId is supplied (main contractor like MTSB),
      // we must ALSO include entries from linked subcontractor orgs.
      // Without this: MTSB fetches 4 entries via RLS (which allows it)
      // but the .eq('organization_id', MTSB) kills FEST ENT entries.
      //
      // Strategy: look up active subcon org IDs, then .in() all of them.
      if (orgId) {
        // Find subcontractor org IDs for this org (if any)
        const { data: subconRels } = await supabase
          .from('subcontractor_relationships')
          .select('subcontractor_org_id')
          .eq('main_contractor_org_id', orgId)
          .eq('status', 'active');

        const subconOrgIds = (subconRels || []).map(r => r.subcontractor_org_id);

        if (subconOrgIds.length > 0) {
          // Main contractor: include own entries + all subcon org entries
          query = query.in('organization_id', [orgId, ...subconOrgIds]);
          console.log(`🔗 Including subcontractor entries from ${subconOrgIds.length} orgs`);
        } else {
          // Regular org or subcontractor itself: only own entries
          query = query.eq('organization_id', orgId);
        }
      }
      // If null → RLS handles visibility (user sees their own entries)

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
        // Include subcontractor org entries for main contractors
        const { data: subconRels } = await supabase
          .from('subcontractor_relationships')
          .select('subcontractor_org_id')
          .eq('main_contractor_org_id', orgId)
          .eq('status', 'active');

        const subconOrgIds = (subconRels || []).map(r => r.subcontractor_org_id);

        if (subconOrgIds.length > 0) {
          query = query.in('organization_id', [orgId, ...subconOrgIds]);
        } else {
          query = query.eq('organization_id', orgId);
        }
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
  /**
   * Create a new work entry.
   *
   * Accepts EITHER a flat object OR three separate arguments (backward-compat).
   *
   *   Flat object (NewWorkEntry.jsx pattern):
   *     createWorkEntry({ contract_id, template_id, entry_date, shift, data, status })
   *
   *   Three args (legacy pattern):
   *     createWorkEntry(contractId, templateId, { entry_date, shift, data })
   */
  async createWorkEntry(contractIdOrFlat, templateId, entryData) {
    try {
      // ── Normalise to flat object ──────────────────────────────────
      let flat;
      if (contractIdOrFlat !== null && typeof contractIdOrFlat === 'object') {
        // Called with a flat object — NewWorkEntry.jsx style
        flat = contractIdOrFlat;
      } else {
        // Called with 3 separate args — legacy style
        flat = {
          contract_id:  contractIdOrFlat,
          template_id:  templateId,
          entry_date:   entryData?.entry_date,
          shift:        entryData?.shift,
          data:         entryData?.data,
          status:       entryData?.status || 'draft',
        };
      }

      console.log('📝 Creating work entry for contract:', flat.contract_id);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      const payload = {
        contract_id:  flat.contract_id,
        template_id:  flat.template_id  || null,
        entry_date:   flat.entry_date   || new Date().toISOString().split('T')[0],
        shift:        flat.shift        || null,
        data:         flat.data         || {},
        status:       flat.status       || 'draft',
        submitted_at: flat.submitted_at || null,
        created_by:   user.id,
        created_at:   new Date().toISOString(),
        updated_at:   new Date().toISOString(),
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
  /**
   * Soft-delete a work entry.
   *
   * SESSION 15 — Ownership guard + audit log:
   *   1. Fetch entry to confirm caller's org OWNS it
   *   2. Refuse if organization_id ≠ caller's org (subcon protection)
   *   3. Soft-delete (set deleted_at)
   *   4. Write to activity_logs table for audit trail
   *
   * @param {string} id - Work entry ID
   * @param {string} callerOrgId - Caller's current org ID (from OrganizationContext)
   */
  async deleteWorkEntry(id, callerOrgId = null) {
    try {
      console.log('🗑️ Deleting work entry:', id);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      // ── Ownership guard ───────────────────────────────────────────
      // Fetch the entry to check who owns it.
      const { data: entry, error: fetchError } = await supabase
        .from('work_entries')
        .select('id, organization_id, contract_id, entry_date, status, created_by')
        .eq('id', id)
        .single();

      if (fetchError || !entry) {
        return { success: false, error: 'Work entry not found.' };
      }

      // If callerOrgId supplied, enforce ownership.
      // super_admin (no callerOrgId) bypasses this check.
      if (callerOrgId && entry.organization_id !== callerOrgId) {
        console.warn('⛔ Delete blocked — entry belongs to org:', entry.organization_id, 'caller org:', callerOrgId);
        return {
          success: false,
          error: "You cannot delete a subcontractor's work entry. Only the performing organisation can delete their own entries.",
        };
      }

      // ── Soft delete ───────────────────────────────────────────────
      const now = new Date().toISOString();

      const { error: deleteError } = await supabase
        .from('work_entries')
        .update({ deleted_at: now, updated_at: now })
        .eq('id', id);

      if (deleteError) {
        console.error('❌ Error deleting work entry:', deleteError);
        return { success: false, error: deleteError.message };
      }

      // ── Audit log ─────────────────────────────────────────────────
      // Log to activity_logs (non-blocking — failure here doesn't
      // fail the delete operation).
      try {
        await supabase.from('activity_logs').insert({
          action:          'DELETE_WORK_ENTRY',
          entity_type:     'work_entry',
          entity_id:       id,
          actor_user_id:   user.id,
          actor_org_id:    callerOrgId,
          target_org_id:   entry.organization_id,
          metadata: {
            entry_date:    entry.entry_date,
            entry_status:  entry.status,
            contract_id:   entry.contract_id,
            created_by:    entry.created_by,
          },
          created_at: now,
        });
        console.log('📋 Audit log written for delete:', id);
      } catch (auditErr) {
        // Non-fatal — log a warning but don't block the response
        console.warn('⚠️ Could not write audit log:', auditErr.message);
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
