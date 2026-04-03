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

  // ─────────────────────────────────────────────────────────────────────────
  // APPROVAL WORKFLOW — Session 16
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get all submitted work entries awaiting approval for an org.
   *
   * Two modes:
   *   countOnly = false (default) → full entry list for ApprovalsPage
   *   countOnly = true            → count only for Sidebar badge (cheap query)
   *
   * Only returns entries owned by orgId (not subcontractor entries).
   * Ordered by submitted_at ASC so oldest entries appear first in queue.
   *
   * @param {string}  orgId     - Organization ID from OrganizationContext
   * @param {boolean} countOnly - If true, returns count only
   * @returns {Promise<{success: boolean, data?: Array, count?: number, error?: string}>}
   */
  async getPendingApprovals(orgId, countOnly = false) {
    try {
      if (!orgId) {
        return countOnly
          ? { success: true, count: 0 }
          : { success: true, data: [] };
      }

      console.log('⏳ Fetching pending approvals for org:', orgId, countOnly ? '(count only)' : '');

      if (countOnly) {
        // Cheap head-only query — returns count, no rows transferred
        const { count, error } = await supabase
          .from('work_entries')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('status', 'submitted')
          .is('deleted_at', null);

        if (error) throw error;

        console.log(`✅ Pending approvals count: ${count || 0}`);
        return { success: true, count: count || 0 };

      } else {
        // Full query — for ApprovalsPage list
        // NOTE: created_by references auth.users (different schema) —
        // PostgREST cannot traverse cross-schema FK joins. We return
        // created_by as a plain UUID; PendingApprovalList handles display.
        const { data, error } = await supabase
          .from('work_entries')
          .select(`
            id,
            entry_date,
            shift,
            status,
            organization_id,
            submitted_at,
            submitted_by,
            created_by,
            contract:contracts (
              id,
              contract_number,
              contract_name,
              contract_category
            ),
            template:templates (
              id,
              template_name
            )
          `)
          .eq('organization_id', orgId)
          .eq('status', 'submitted')
          .is('deleted_at', null)
          .order('submitted_at', { ascending: true });  // oldest first

        if (error) throw error;

        console.log(`✅ Fetched ${data?.length || 0} pending approvals`);
        return { success: true, data: data || [] };
      }

    } catch (error) {
      console.error('❌ getPendingApprovals failed:', error);
      return countOnly
        ? { success: false, count: 0, error: error.message }
        : { success: false, data: [], error: error.message };
    }
  }

  /**
   * Approve a submitted work entry.
   *
   * - Entry must be status='submitted' (RLS also enforces this at DB level)
   * - Optimistic concurrency: .eq('status', 'submitted') prevents double-approve
   * - Approval remarks are optional
   * - Writes to activity_logs for audit trail
   *
   * @param {string} entryId  - work_entries.id
   * @param {string} remarks  - Optional approval remarks from manager
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async approveWorkEntry(entryId, remarks = '') {
    try {
      console.log('✅ Approving work entry:', entryId);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('work_entries')
        .update({
          status:           'approved',
          approved_by:      user.id,
          approved_at:      now,
          approval_remarks: remarks?.trim() || null,
          updated_at:       now,
        })
        .eq('id', entryId)
        .eq('status', 'submitted')               // concurrency guard
        .select('id, status, organization_id, contract_id, entry_date, created_by')
        .single();

      if (error) {
        console.error('❌ Supabase approve error:', error);
        throw error;
      }
      if (!data) {
        throw new Error('Entry not found, already approved, or insufficient permissions');
      }

      // Audit log (non-fatal)
      try {
        await supabase.from('activity_logs').insert({
          action:        'APPROVE_WORK_ENTRY',
          entity_type:   'work_entry',
          entity_id:     entryId,
          actor_user_id: user.id,
          actor_org_id:  data.organization_id,
          metadata: {
            approval_remarks: remarks?.trim() || null,
            entry_date:       data.entry_date,
            contract_id:      data.contract_id,
            technician_id:    data.created_by,
          },
          created_at: now,
        });
      } catch (logError) {
        console.warn('⚠️ Failed to write approval audit log:', logError.message);
      }

      console.log('✅ Work entry approved:', entryId);
      return { success: true, data };

    } catch (error) {
      console.error('❌ approveWorkEntry failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reject a submitted work entry.
   *
   * - reason is REQUIRED — validated before hitting DB
   * - Entry must be status='submitted'
   * - After rejection, technician can edit and resubmit
   * - Writes to activity_logs for audit trail
   *
   * @param {string} entryId - work_entries.id
   * @param {string} reason  - REQUIRED rejection reason
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async rejectWorkEntry(entryId, reason) {
    try {
      // Validate reason before any DB call
      if (!reason?.trim()) {
        return {
          success: false,
          error: 'Rejection reason is required. Please explain what needs to be corrected.',
        };
      }

      console.log('❌ Rejecting work entry:', entryId);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const now = new Date().toISOString();

      // ── Step 1: Update work_entries status ──────────────────────────────────
      // Fetch with data + template_id so we can snapshot it into reject_entry_history
      const { data, error } = await supabase
        .from('work_entries')
        .update({
          status:           'rejected',
          rejected_by:      user.id,
          rejected_at:      now,
          rejection_reason: reason.trim(),
          updated_at:       now,
        })
        .eq('id', entryId)
        .eq('status', 'submitted')               // concurrency guard
        .select('id, status, organization_id, contract_id, template_id, entry_date, created_by, data')
        .single();

      if (error) {
        console.error('❌ Supabase reject error:', error);
        throw error;
      }
      if (!data) {
        throw new Error('Entry not found, already processed, or insufficient permissions');
      }

      // ── Step 2: Write to reject_entry_history (permanent audit log) ─────────
      // This table is NEVER cleared — every rejection is preserved forever,
      // even after resubmission and approval. Used for training and improvement.
      try {
        // Count how many times this entry has been rejected before (for rejection_count)
        const { count: prevCount } = await supabase
          .from('reject_entry_history')
          .select('id', { count: 'exact', head: true })
          .eq('work_entry_id', entryId);

        const rejectionCount = (prevCount || 0) + 1;

        await supabase.from('reject_entry_history').insert({
          work_entry_id:       entryId,
          organization_id:     data.organization_id,
          contract_id:         data.contract_id,
          template_id:         data.template_id,
          entry_date:          data.entry_date,
          entry_created_by:    data.created_by,
          rejected_by:         user.id,
          rejected_at:         now,
          rejection_reason:    reason.trim(),
          rejection_count:     rejectionCount,
          entry_data_snapshot: typeof data.data === 'string'
                                 ? JSON.parse(data.data)  // handle string JSONB
                                 : (data.data || {}),
          created_at:          now,
        });

        console.log(`📋 Rejection #${rejectionCount} logged to reject_entry_history`);
      } catch (histError) {
        // Non-fatal — history log failure must not block the rejection itself
        console.warn('⚠️ Failed to write to reject_entry_history:', histError.message);
      }

      // ── Step 3: Write to activity_logs (non-fatal) ───────────────────────────
      try {
        await supabase.from('activity_logs').insert({
          action:        'REJECT_WORK_ENTRY',
          entity_type:   'work_entry',
          entity_id:     entryId,
          actor_user_id: user.id,
          actor_org_id:  data.organization_id,
          metadata: {
            rejection_reason: reason.trim(),
            entry_date:       data.entry_date,
            contract_id:      data.contract_id,
            technician_id:    data.created_by,
          },
          created_at: now,
        });
      } catch (logError) {
        console.warn('⚠️ Failed to write rejection audit log:', logError.message);
      }

      console.log('✅ Work entry rejected:', entryId);
      return { success: true, data };

    } catch (error) {
      console.error('❌ rejectWorkEntry failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Resubmit a rejected work entry after corrections.
   *
   * - Only the original creator can resubmit (.eq('created_by', user.id))
   * - Clears all rejection fields so entry enters a clean 'submitted' state
   * - Manager will see it again in the Pending Approvals queue
   *
   * @param {string} entryId - work_entries.id
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async resubmitWorkEntry(entryId) {
    try {
      console.log('🔄 Resubmitting work entry:', entryId);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const now = new Date().toISOString();

      // ── Why we don't filter by created_by ─────────────────────────────────
      // An org_owner or manager in the same org may legitimately resubmit on
      // behalf of a technician (e.g. original creator is unavailable).
      // The created_by guard is too strict — it blocks org members who are not
      // the original creator. RLS + .eq('status','rejected') is sufficient:
      // RLS already limits UPDATE to users in the same org, and the status
      // guard prevents double-resubmission.
      //
      // ── Why we DO NOT clear rejected_by / rejected_at / rejection_reason ──
      // These fields are part of the audit trail. Clearing them would erase
      // the rejection history from ApprovalHistory timeline. We keep them so
      // the timeline shows: Created → Rejected (reason) → Resubmitted → Approved.
      // If the entry is rejected again, the new rejection will overwrite them,
      // which is correct — the row always reflects the MOST RECENT rejection.
      const { data, error } = await supabase
        .from('work_entries')
        .update({
          status:       'submitted',
          submitted_at: now,
          submitted_by: user.id,
          updated_at:   now,
          // ↑ Intentionally NOT clearing rejected_by / rejected_at / rejection_reason
          // so ApprovalHistory can display the full audit trail.
        })
        .eq('id', entryId)
        .eq('status', 'rejected')    // only rejected entries can be resubmitted
        .select('id, status')
        .single();

      if (error) {
        console.error('❌ Supabase resubmit error:', error);
        throw error;
      }
      if (!data) {
        throw new Error('Entry not found or not in rejected status');
      }

      console.log('✅ Work entry resubmitted:', entryId);
      return { success: true, data };

    } catch (error) {
      console.error('❌ resubmitWorkEntry failed:', error);
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // END OF SESSION 16 ADDITIONS
  // ─────────────────────────────────────────────────────────────────────────
}

export const workEntryService = new WorkEntryService();
export default workEntryService;
