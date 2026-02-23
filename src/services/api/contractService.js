/**
 * WorkLedger - Contract Service
 *
 * Complete contract service with full CRUD operations.
 * Contracts sit under projects, so org filtering goes via project.
 *
 * SESSION 10 UPDATE: List/count methods accept optional `orgId`.
 * When provided, resolves project IDs for that specific org first,
 * then filters contracts by those projects. Enables BJ staff org switching.
 *
 * SESSION 13 FIX: Super admin bypass in _resolveProjectIds().
 * super_admin users were invisible to orgs they hadn't joined via org_members
 * (e.g. FEST ENT, Mr. Roz, MTSB created via SQL seed). Now super_admin
 * gets all project IDs across the entire platform with no org filter.
 *
 * @module services/api/contractService
 * @created January 29, 2026
 * @updated January 31, 2026 - Session 10: Added full CRUD operations
 * @updated February 20, 2026 - Session 10: orgId param for org switching
 * @updated February 21, 2026 - Session 13: Super admin bypass
 * @updated February 22, 2026 - Session 14: Junction table contract_templates
 *   - getContract() now joins contract_templates (replaces legacy template_id column)
 *   - Added: getContractTemplates(), addContractTemplate(),
 *             removeContractTemplate(), setDefaultContractTemplate(),
 *             updateContractTemplateLabel()
 */

import { supabase } from '../supabase/client';
import { projectService } from './projectService';

export class ContractService {

  // ─────────────────────────────────────────────
  // INTERNAL HELPER
  // ─────────────────────────────────────────────

  /**
   * Resolve project IDs accessible to current user/org.
   * Contracts filter by project_id, which sits under organization_id.
   *
   * SESSION 13 FIX — Super admin bypass:
   *   super_admin users see ALL projects regardless of org_members rows.
   *   This prevents the silent empty-list bug when super_admin hasn't been
   *   manually added to orgs that were created via SQL seed data.
   *
   * Flow for regular users:
   *   orgId provided → filter that one org
   *   no orgId       → look up all org_members orgs, then their projects
   *
   * Flow for super_admin:
   *   orgId provided → filter that one org (respects switcher selection)
   *   no orgId       → ALL projects, no org filter
   */
  async _resolveProjectIds(orgId = null) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // ── Super admin check ─────────────────────────────────────
    // Check global_role on user_profiles, not org_members role,
    // because super_admin may not have org_members rows everywhere.
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('global_role')
      .eq('id', user.id)
      .single();

    const isSuperAdmin = profile?.global_role === 'super_admin';

    // ── Build org filter ──────────────────────────────────────
    let projectQuery = supabase
      .from('projects')
      .select('id')
      .is('deleted_at', null);

    if (orgId) {
      // Specific org selected (org switcher) — applies to all roles
      projectQuery = projectQuery.eq('organization_id', orgId);
    } else if (!isSuperAdmin) {
      // Regular user — filter by their org_members memberships
      const { data: memberships } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const orgIds = (memberships || []).map(m => m.organization_id);
      if (orgIds.length === 0) return [];

      projectQuery = projectQuery.in('organization_id', orgIds);
    }
    // else: super_admin + no orgId → no org filter → all projects ✅

    const { data: projects } = await projectQuery;
    return (projects || []).map(p => p.id);
  }

  // ─────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────

  /**
   * Get total contracts count.
   * @param {string|null} orgId - From OrganizationContext.
   */
  async getContractsCount(orgId = null) {
    try {
      console.log('📊 Getting contracts count...', orgId ? `(org: ${orgId})` : '(all user orgs)');

      const projectIds = await this._resolveProjectIds(orgId);
      if (projectIds.length === 0) return 0;

      const { count, error } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds)
        .is('deleted_at', null);

      if (error) {
        console.error('❌ Error getting contracts count:', error);
        return 0;
      }

      console.log('✅ Contracts count:', count);
      return count || 0;
    } catch (error) {
      console.error('❌ Exception getting contracts count:', error);
      return 0;
    }
  }

  /**
   * Get contracts list.
   * @param {string|null} orgId - From OrganizationContext.
   */
  async getUserContracts(orgId = null) {
    try {
      console.log('📊 Getting contracts...', orgId ? `(org: ${orgId})` : '(all user orgs)');

      const projectIds = await this._resolveProjectIds(orgId);
      if (projectIds.length === 0) return [];

      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          project:projects(
            id,
            project_name,
            project_code,
            organization:organizations(id, name)
          ),
          contract_templates(
            id,
            template_id,
            label,
            is_default,
            sort_order,
            templates(id, template_name, contract_category)
          )
        `)
        .in('project_id', projectIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error getting contracts:', error);
        return [];
      }

      console.log('✅ Retrieved contracts:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Exception getting contracts:', error);
      return [];
    }
  }

  /**
   * Get single contract by ID.
   * @param {string} id - Contract ID
   */
  async getContract(id) {
    try {
      console.log('📊 Getting contract:', id);

      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          project:projects(
            id,
            project_name,
            client_name,
            organization:organizations(id, name, slug)
          ),
          contract_templates(
            id,
            template_id,
            label,
            sort_order,
            is_default,
            assigned_at,
            templates(
              id,
              template_id,
              template_name,
              contract_category,
              report_type,
              fields_schema
            )
          )
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.error('❌ Error fetching contract:', error);
        return null;
      }

      console.log('✅ Contract retrieved:', data.contract_number);
      return data;
    } catch (error) {
      console.error('❌ Exception getting contract:', error);
      return null;
    }
  }

  /**
   * Get contracts for a specific project.
   * @param {string} projectId
   */
  async getContractsByProject(projectId) {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          contract_templates(
            id,
            template_id,
            label,
            is_default,
            templates(id, template_name, contract_category)
          )
        `)
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error getting project contracts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Exception getting project contracts:', error);
      return [];
    }
  }

  // ─────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────

  /**
   * Create a new contract.
   * @param {string} projectId - Target project
   * @param {Object} data - Contract data
   */
  async createContract(projectId, data) {
    try {
      console.log('📊 Creating contract for project:', projectId);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const contractData = {
        project_id: projectId,
        contract_number: data.contract_number,
        contract_name: data.contract_name,
        contract_category: data.contract_category,
        contract_type: data.contract_type || null,
        status: data.status || 'active',
        valid_from: data.valid_from || null,
        valid_until: data.valid_until || null,
        contract_value: data.contract_value || null,
        reporting_frequency: data.reporting_frequency || 'monthly',
        maintenance_cycle: data.maintenance_cycle || null,
        description: data.description || null,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: contract, error } = await supabase
        .from('contracts')
        .insert(contractData)
        .select(`
          *,
          project:projects(id, project_name, organization:organizations(id, name))
        `)
        .single();

      if (error) {
        console.error('❌ Error creating contract:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Contract created:', contract.id);
      return { success: true, data: contract };
    } catch (error) {
      console.error('❌ Exception creating contract:', error);
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────

  /**
   * Update contract.
   * @param {string} id - Contract ID
   * @param {Object} data - Fields to update
   */
  async updateContract(id, data) {
    try {
      console.log('📊 Updating contract:', id);

      const updateData = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      delete updateData.id;
      delete updateData.project_id;
      delete updateData.created_by;
      delete updateData.created_at;

      const { data: contract, error } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          project:projects(id, project_name, organization:organizations(id, name))
        `)
        .single();

      if (error) {
        console.error('❌ Error updating contract:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Contract updated:', id);
      return { success: true, data: contract };
    } catch (error) {
      console.error('❌ Exception updating contract:', error);
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────

  /**
   * Soft delete contract.
   * @param {string} id - Contract ID
   */
  async deleteContract(id) {
    try {
      console.log('📊 Deleting contract:', id);

      const { error } = await supabase
        .from('contracts')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting contract:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Contract deleted (soft):', id);
      return { success: true };
    } catch (error) {
      console.error('❌ Exception deleting contract:', error);
      return { success: false, error: error.message };
    }
  }
  // ─────────────────────────────────────────────
  // CONTRACT TEMPLATES — Junction Table CRUD
  // Session 14: one contract → many templates
  // ─────────────────────────────────────────────

  /**
   * Get all templates assigned to a contract, ordered by sort_order.
   * @param {string} contractId
   * @returns {Promise<Array>}
   */
  async getContractTemplates(contractId) {
    try {
      console.log('📊 Loading templates for contract:', contractId);

      const { data, error } = await supabase
        .from('contract_templates')
        .select(`
          id,
          contract_id,
          template_id,
          label,
          sort_order,
          is_default,
          assigned_at,
          templates(
            id,
            template_id,
            template_name,
            contract_category,
            report_type,
            industry
          )
        `)
        .eq('contract_id', contractId)
        .order('sort_order', { ascending: true })
        .order('assigned_at', { ascending: true });

      if (error) {
        console.error('❌ Error loading contract templates:', error);
        return [];
      }

      console.log('✅ Contract templates loaded:', data?.length || 0);
      return data || [];
    } catch (err) {
      console.error('❌ Exception in getContractTemplates:', err);
      return [];
    }
  }

  /**
   * Add a template to a contract.
   * Auto-sets is_default = true when it is the first template.
   * @param {string} contractId
   * @param {string} templateId
   * @param {{ label?: string, isDefault?: boolean }} options
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async addContractTemplate(contractId, templateId, { label = null, isDefault = false } = {}) {
    try {
      console.log('📝 Adding template to contract:', { contractId, templateId, label });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const existing = await this.getContractTemplates(contractId);
      const shouldBeDefault = isDefault || existing.length === 0;

      // Clear existing defaults if this one will become default
      if (shouldBeDefault && existing.length > 0) {
        await supabase
          .from('contract_templates')
          .update({ is_default: false })
          .eq('contract_id', contractId);
      }

      const { data, error } = await supabase
        .from('contract_templates')
        .insert({
          contract_id:  contractId,
          template_id:  templateId,
          label:        label || null,
          is_default:   shouldBeDefault,
          sort_order:   existing.length,
          assigned_by:  user.id,
        })
        .select(`
          id, contract_id, template_id, label, sort_order, is_default, assigned_at,
          templates(id, template_id, template_name, contract_category, report_type, industry)
        `)
        .single();

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'This template is already assigned to this contract.' };
        }
        console.error('❌ Error adding contract template:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Template added to contract:', data.id);
      return { success: true, data };
    } catch (err) {
      console.error('❌ Exception in addContractTemplate:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Remove a template assignment from a contract.
   * Auto-promotes next template as default if the removed one was default.
   * @param {string} contractTemplateId - Junction table row ID
   * @param {string} contractId
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async removeContractTemplate(contractTemplateId, contractId) {
    try {
      console.log('🗑️ Removing contract template:', contractTemplateId);

      const { data: row } = await supabase
        .from('contract_templates')
        .select('is_default')
        .eq('id', contractTemplateId)
        .single();

      const wasDefault = row?.is_default || false;

      const { error } = await supabase
        .from('contract_templates')
        .delete()
        .eq('id', contractTemplateId);

      if (error) {
        console.error('❌ Error removing contract template:', error);
        return { success: false, error: error.message };
      }

      // Promote first remaining template as default if needed
      if (wasDefault && contractId) {
        const { data: remaining } = await supabase
          .from('contract_templates')
          .select('id')
          .eq('contract_id', contractId)
          .order('sort_order')
          .limit(1);

        if (remaining?.length > 0) {
          await supabase
            .from('contract_templates')
            .update({ is_default: true })
            .eq('id', remaining[0].id);
          console.log('✅ Promoted new default:', remaining[0].id);
        }
      }

      console.log('✅ Contract template removed');
      return { success: true };
    } catch (err) {
      console.error('❌ Exception in removeContractTemplate:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Set a specific assignment as the default template for its contract.
   * Clears is_default on all other assignments for the same contract.
   * @param {string} contractId
   * @param {string} contractTemplateId - Junction row ID to promote
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async setDefaultContractTemplate(contractId, contractTemplateId) {
    try {
      console.log('⭐ Setting default template:', contractTemplateId);

      const { error: clearError } = await supabase
        .from('contract_templates')
        .update({ is_default: false })
        .eq('contract_id', contractId);

      if (clearError) return { success: false, error: clearError.message };

      const { error } = await supabase
        .from('contract_templates')
        .update({ is_default: true })
        .eq('id', contractTemplateId);

      if (error) return { success: false, error: error.message };

      console.log('✅ Default template set');
      return { success: true };
    } catch (err) {
      console.error('❌ Exception in setDefaultContractTemplate:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Update the custom label of a contract-template assignment.
   * e.g. rename "PMC Daily Checklist" → "HVAC Unit A Checklist"
   * @param {string} contractTemplateId
   * @param {string|null} label
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updateContractTemplateLabel(contractTemplateId, label) {
    try {
      const { error } = await supabase
        .from('contract_templates')
        .update({ label: label || null })
        .eq('id', contractTemplateId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

}

export const contractService = new ContractService();
export default contractService;
