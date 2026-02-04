/**
 * WorkLedger - Work Entry Service
 * 
 * Handles all work entry operations (CRUD, status transitions, filtering).
 * Integrates with template system for dynamic form data storage.
 * 
 * @module services/api/workEntryService
 * @created February 1, 2026 - Session 13
 */

import { supabase } from '../supabase/client';

/**
 * Work Entry Service Class
 * 
 * Manages work entries with template-driven JSONB data storage.
 * Supports draft/submitted/approved/rejected workflow.
 */
class WorkEntryService {
  /**
   * Get all work entries for current user
   * Workers see only their entries, Managers see all entries in their org
   * 
   * @param {Object} filters - Optional filters
   * @param {string} filters.contractId - Filter by contract
   * @param {string} filters.status - Filter by status (draft, submitted, approved, rejected)
   * @param {string} filters.startDate - Filter by entry_date >= startDate
   * @param {string} filters.endDate - Filter by entry_date <= endDate
   * @param {string} filters.sortBy - Sort field (default: entry_date)
   * @param {string} filters.sortOrder - Sort order (asc or desc, default: desc)
   * @returns {Promise<Object>} { success, data, error }
   */
  async getWorkEntries(filters = {}) {
    try {
      console.log('📋 Fetching work entries with filters:', filters);

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

      // Apply filters
      if (filters.contractId) {
        query = query.eq('contract_id', filters.contractId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.startDate) {
        query = query.gte('entry_date', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('entry_date', filters.endDate);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'entry_date';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) {
        console.error('❌ Failed to fetch work entries:', error);
        throw error;
      }

      console.log(`✅ Fetched ${data.length} work entries`);

      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Error in getWorkEntries:', error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }

  /**
   * Get work entries for current user only
   * Used by workers to see their own entries
   * 
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} { success, data, error }
   */
  async getUserWorkEntries(filters = {}) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      console.log('👤 Fetching work entries for user:', user.id);

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
        .eq('created_by', user.id)
        .is('deleted_at', null);

      // Apply filters (same as getWorkEntries)
      if (filters.contractId) {
        query = query.eq('contract_id', filters.contractId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.startDate) {
        query = query.gte('entry_date', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('entry_date', filters.endDate);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'entry_date';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) {
        console.error('❌ Failed to fetch user work entries:', error);
        throw error;
      }

      console.log(`✅ Fetched ${data.length} work entries for user`);

      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Error in getUserWorkEntries:', error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }

  /**
   * Get single work entry by ID
   * 
   * @param {string} id - Work entry ID
   * @returns {Promise<Object>} { success, data, error }
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
              organization:organizations (
                id,
                name
              )
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

      if (!data) {
        throw new Error('Work entry not found');
      }

      console.log('✅ Fetched work entry:', data.id);

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Error in getWorkEntry:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * Create new work entry
   * 
   * @param {Object} workEntryData - Work entry data
   * @param {string} workEntryData.contract_id - Contract ID
   * @param {string} workEntryData.template_id - Template ID
   * @param {string} workEntryData.entry_date - Entry date (YYYY-MM-DD)
   * @param {string} workEntryData.shift - Shift (optional)
   * @param {Object} workEntryData.data - Template field data (JSONB)
   * @param {string} workEntryData.status - Status (draft or submitted)
   * @returns {Promise<Object>} { success, data, error }
   */
  async createWorkEntry(workEntryData) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      console.log('➕ Creating work entry for contract:', workEntryData.contract_id);

      // Validate required fields
      if (!workEntryData.contract_id) {
        throw new Error('Contract ID is required');
      }

      if (!workEntryData.template_id) {
        throw new Error('Template ID is required');
      }

      if (!workEntryData.entry_date) {
        throw new Error('Entry date is required');
      }

      if (!workEntryData.data || typeof workEntryData.data !== 'object') {
        throw new Error('Template data is required and must be an object');
      }

      // Prepare work entry object
      const newWorkEntry = {
        contract_id: workEntryData.contract_id,
        template_id: workEntryData.template_id,
        entry_date: workEntryData.entry_date,
        shift: workEntryData.shift || null,
        data: workEntryData.data,
        status: workEntryData.status || 'draft',
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // If status is submitted, set submitted_at and submitted_by
      if (newWorkEntry.status === 'submitted') {
        newWorkEntry.submitted_at = new Date().toISOString();
        newWorkEntry.submitted_by = user.id;
      }

      const { data, error } = await supabase
        .from('work_entries')
        .insert(newWorkEntry)
        .select(`
          id,
          contract_id,
          template_id,
          entry_date,
          shift,
          data,
          status,
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
            contract_name
          ),
          template:templates (
            id,
            template_name
          )
        `)
        .single();

      if (error) {
        console.error('❌ Failed to create work entry:', error);
        throw error;
      }

      console.log('✅ Work entry created:', data.id);

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Error in createWorkEntry:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * Update work entry (only allowed for drafts)
   * 
   * @param {string} id - Work entry ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} { success, data, error }
   */
  async updateWorkEntry(id, updates) {
    try {
      console.log('✏️ Updating work entry:', id);

      // First check if entry exists and is editable
      const { data: existing, error: fetchError } = await supabase
        .from('work_entries')
        .select('id, status, created_by')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (fetchError || !existing) {
        throw new Error('Work entry not found');
      }

      // Only drafts can be edited
      if (existing.status !== 'draft') {
        throw new Error('Only draft entries can be edited');
      }

      // Verify user is the creator
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      if (existing.created_by !== user.id) {
        throw new Error('You can only edit your own entries');
      }

      // Prepare updates
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Don't allow changing created_by or id
      delete updateData.id;
      delete updateData.created_by;
      delete updateData.created_at;

      const { data, error } = await supabase
        .from('work_entries')
        .update(updateData)
        .eq('id', id)
        .select(`
          id,
          contract_id,
          template_id,
          entry_date,
          shift,
          data,
          status,
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
            contract_name
          ),
          template:templates (
            id,
            template_name
          )
        `)
        .single();

      if (error) {
        console.error('❌ Failed to update work entry:', error);
        throw error;
      }

      console.log('✅ Work entry updated:', data.id);

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Error in updateWorkEntry:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * Delete work entry (soft delete, only drafts)
   * 
   * @param {string} id - Work entry ID
   * @returns {Promise<Object>} { success, error }
   */
  async deleteWorkEntry(id) {
    try {
      console.log('🗑️ Deleting work entry:', id);

      // First check if entry exists and is deletable
      const { data: existing, error: fetchError } = await supabase
        .from('work_entries')
        .select('id, status, created_by')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (fetchError || !existing) {
        throw new Error('Work entry not found');
      }

      // Only drafts can be deleted
      if (existing.status !== 'draft') {
        throw new Error('Only draft entries can be deleted');
      }

      // Verify user is the creator
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      if (existing.created_by !== user.id) {
        throw new Error('You can only delete your own entries');
      }

      // Soft delete
      const { error } = await supabase
        .from('work_entries')
        .update({ 
          deleted_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) {
        console.error('❌ Failed to delete work entry:', error);
        throw error;
      }

      console.log('✅ Work entry deleted:', id);

      return {
        success: true
      };

    } catch (error) {
      console.error('❌ Error in deleteWorkEntry:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Submit work entry (change status from draft to submitted)
   * 
   * @param {string} id - Work entry ID
   * @returns {Promise<Object>} { success, data, error }
   */
  async submitWorkEntry(id) {
    try {
      console.log('📤 Submitting work entry:', id);

      // Get current entry
      const { data: existing, error: fetchError } = await supabase
        .from('work_entries')
        .select('id, status, created_by')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (fetchError || !existing) {
        throw new Error('Work entry not found');
      }

      // Must be draft to submit
      if (existing.status !== 'draft') {
        throw new Error('Only draft entries can be submitted');
      }

      // Verify user is the creator
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      if (existing.created_by !== user.id) {
        throw new Error('You can only submit your own entries');
      }

      // Update status to submitted
      const { data, error } = await supabase
        .from('work_entries')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          submitted_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          id,
          contract_id,
          template_id,
          entry_date,
          shift,
          data,
          status,
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
            contract_name
          )
        `)
        .single();

      if (error) {
        console.error('❌ Failed to submit work entry:', error);
        throw error;
      }

      console.log('✅ Work entry submitted:', data.id);

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Error in submitWorkEntry:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * Get work entries count
   * 
   * @param {Object} filters - Optional filters
   * @returns {Promise<number>} Count of work entries
   */
  async getWorkEntriesCount(filters = {}) {
    try {
      let query = supabase
        .from('work_entries')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null);

      // Apply filters
      if (filters.contractId) {
        query = query.eq('contract_id', filters.contractId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.createdBy) {
        query = query.eq('created_by', filters.createdBy);
      }

      const { count, error } = await query;

      if (error) {
        console.error('❌ Failed to count work entries:', error);
        return 0;
      }

      return count || 0;

    } catch (error) {
      console.error('❌ Error in getWorkEntriesCount:', error);
      return 0;
    }
  }

  /**
   * Get work entries by contract
   * 
   * @param {string} contractId - Contract ID
   * @returns {Promise<Object>} { success, data, error }
   */
  async getWorkEntriesByContract(contractId) {
    return this.getWorkEntries({ contractId });
  }

  /**
   * Get work entries by status
   * 
   * @param {string} status - Status (draft, submitted, approved, rejected)
   * @returns {Promise<Object>} { success, data, error }
   */
  async getWorkEntriesByStatus(status) {
    return this.getWorkEntries({ status });
  }
}

// Export singleton instance
export const workEntryService = new WorkEntryService();

// Export class for testing
export default WorkEntryService;
