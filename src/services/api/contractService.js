/**
 * WorkLedger - Contract Service
 * 
 * Complete contract service with full CRUD operations.
 * Contracts belong to projects and link to templates.
 * 
 * @module services/api/contractService
 * @created January 29, 2026
 * @updated January 31, 2026 - Session 10: Added full CRUD operations
 */

import { supabase } from '../supabase/client';
import { projectService } from './projectService';

/**
 * Contract Service
 */
export class ContractService {
  /**
   * Get total contracts count for user's organizations
   * @returns {Promise<number>} Total count
   */
  async getContractsCount() {
    try {
      console.log('📊 Getting contracts count...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      // Get user's organizations
      const { data: memberships } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (!memberships || memberships.length === 0) return 0;

      const orgIds = memberships.map(m => m.organization_id);

      // Get projects in these organizations
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .in('organization_id', orgIds)
        .is('deleted_at', null);

      if (!projects || projects.length === 0) return 0;

      const projectIds = projects.map(p => p.id);

      // Count contracts in these projects
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
   * Get user's contracts
   * @param {string} projectId - Optional project ID to filter
   * @returns {Promise<Array>} Array of contracts
   */
  async getUserContracts(projectId = null) {
    try {
      console.log('📊 Getting user contracts...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get user's organizations
      const { data: memberships } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (!memberships || memberships.length === 0) return [];

      const orgIds = memberships.map(m => m.organization_id);

      // Build query
      let query = supabase
        .from('contracts')
        .select(`
          *,
          project:projects(id, project_name, project_code, organization_id, organizations(id, name)),
          template:templates(id, template_id, template_name, contract_category)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      // Filter by project if specified
      if (projectId) {
        query = query.eq('project_id', projectId);
      } else {
        // Filter by organizations
        const { data: projects } = await supabase
          .from('projects')
          .select('id')
          .in('organization_id', orgIds)
          .is('deleted_at', null);

        if (!projects || projects.length === 0) return [];

        const projectIds = projects.map(p => p.id);
        query = query.in('project_id', projectIds);
      }

      const { data, error } = await query;

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
   * Get single contract by ID
   * @param {string} id - Contract ID
   * @returns {Promise<object|null>} Contract object or null
   */
  async getContract(id) {
    try {
      console.log('📊 Getting contract:', id);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get contract with related data
      const { data: contract, error } = await supabase
        .from('contracts')
        .select(`
          *,
          project:projects(
            id, 
            project_name, 
            project_code,
            organization_id,
            organizations(id, name, slug)
          ),
          template:templates(id, template_id, template_name, contract_category, fields_schema)
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.error('❌ Error fetching contract:', error);
        return null;
      }

      // Verify user has access to this contract's project
      const project = await projectService.getProject(contract.project_id);
      if (!project) {
        console.error('❌ User does not have access to this contract');
        return null;
      }

      console.log('✅ Contract fetched:', contract.contract_number);
      return contract;
    } catch (error) {
      console.error('❌ Exception in getContract:', error);
      return null;
    }
  }

  /**
   * Create new contract
   * @param {string} projectId - Project ID
   * @param {object} data - Contract data
   * @returns {Promise<object|null>} Created contract or null
   */
  async createContract(projectId, data) {
    try {
      console.log('📊 Creating contract:', data.contract_name);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Verify user has access to project
      const project = await projectService.getProject(projectId);
      if (!project) {
        throw new Error('Project not found or access denied');
      }

      // Generate contract number if not provided
      const contractNumber = data.contract_number || 
        await this.generateContractNumber(projectId, data.contract_category);

      // Create contract
      const { data: contract, error } = await supabase
        .from('contracts')
        .insert({
          project_id: projectId,
          template_id: data.template_id,
          contract_number: contractNumber,
          contract_name: data.contract_name,
          contract_category: data.contract_category,
          reporting_frequency: data.reporting_frequency || 'daily',
          requires_approval: data.requires_approval !== undefined ? data.requires_approval : true,
          sla_response_time_mins: data.sla_response_time_mins || null,
          sla_resolution_time_hours: data.sla_resolution_time_hours || null,
          sla_tier: data.sla_tier || null,
          maintenance_cycle: data.maintenance_cycle || null,
          asset_categories: data.asset_categories || null,
          valid_from: data.valid_from || null,
          valid_until: data.valid_until || null,
          status: data.status || 'active',
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          project:projects(id, project_name, project_code, organizations(id, name)),
          template:templates(id, template_id, template_name, contract_category)
        `)
        .single();

      if (error) {
        console.error('❌ Contract creation error:', error);
        throw error;
      }

      console.log('✅ Contract created:', contract.id);
      return contract;
    } catch (error) {
      console.error('❌ Exception creating contract:', error);
      throw error;
    }
  }

  /**
   * Update existing contract
   * @param {string} id - Contract ID
   * @param {object} data - Contract data to update
   * @returns {Promise<object|null>} Updated contract or null
   */
  async updateContract(id, data) {
    try {
      console.log('📊 Updating contract:', id);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Get existing contract to verify access
      const existing = await this.getContract(id);
      if (!existing) {
        throw new Error('Contract not found or access denied');
      }

      // Prepare update data
      const updateData = {
        updated_at: new Date().toISOString()
      };

      // Only update provided fields
      if (data.contract_name) updateData.contract_name = data.contract_name;
      if (data.contract_number) updateData.contract_number = data.contract_number;
      if (data.contract_category) updateData.contract_category = data.contract_category;
      if (data.template_id) updateData.template_id = data.template_id;
      if (data.reporting_frequency) updateData.reporting_frequency = data.reporting_frequency;
      if (data.requires_approval !== undefined) updateData.requires_approval = data.requires_approval;
      if (data.sla_response_time_mins !== undefined) updateData.sla_response_time_mins = data.sla_response_time_mins;
      if (data.sla_resolution_time_hours !== undefined) updateData.sla_resolution_time_hours = data.sla_resolution_time_hours;
      if (data.sla_tier !== undefined) updateData.sla_tier = data.sla_tier;
      if (data.maintenance_cycle !== undefined) updateData.maintenance_cycle = data.maintenance_cycle;
      if (data.asset_categories !== undefined) updateData.asset_categories = data.asset_categories;
      if (data.valid_from !== undefined) updateData.valid_from = data.valid_from;
      if (data.valid_until !== undefined) updateData.valid_until = data.valid_until;
      if (data.status) updateData.status = data.status;

      // Update contract
      const { data: contract, error } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          project:projects(id, project_name, project_code, organizations(id, name)),
          template:templates(id, template_id, template_name, contract_category)
        `)
        .single();

      if (error) {
        console.error('❌ Contract update error:', error);
        throw error;
      }

      console.log('✅ Contract updated:', contract.id);
      return contract;
    } catch (error) {
      console.error('❌ Exception updating contract:', error);
      throw error;
    }
  }

  /**
   * Delete contract (soft delete)
   * @param {string} id - Contract ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteContract(id) {
    try {
      console.log('📊 Deleting contract:', id);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Get existing contract to verify access
      const existing = await this.getContract(id);
      if (!existing) {
        throw new Error('Contract not found or access denied');
      }

      // Soft delete (set deleted_at timestamp)
      const { error } = await supabase
        .from('contracts')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('❌ Contract deletion error:', error);
        throw error;
      }

      console.log('✅ Contract deleted (soft):', id);
      return true;
    } catch (error) {
      console.error('❌ Exception deleting contract:', error);
      throw error;
    }
  }

  /**
   * Generate unique contract number
   * @param {string} projectId - Project ID
   * @param {string} category - Contract category
   * @returns {Promise<string>}
   */
  async generateContractNumber(projectId, category) {
    try {
      // Get project to use in code
      const { data: project } = await supabase
        .from('projects')
        .select('project_code, organizations(slug)')
        .eq('id', projectId)
        .single();

      // Get current year
      const year = new Date().getFullYear();

      // Count contracts in this project this year
      const { count } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .gte('created_at', `${year}-01-01`)
        .is('deleted_at', null);

      const nextNumber = (count || 0) + 1;

      // Format: CATEGORY-PROJECT-YEAR-NUM
      // Example: PMC-KLCC-2024-001
      const categoryPrefix = this.getCategoryPrefix(category);
      const projectPrefix = project?.project_code?.substring(0, 4).toUpperCase() || 'PROJ';

      return `${categoryPrefix}-${projectPrefix}-${year}-${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
      console.error('❌ Error generating contract number:', error);
      // Fallback to simple code
      return `CONTRACT-${Date.now()}`;
    }
  }

  /**
   * Get category prefix for contract number
   * @param {string} category - Contract category
   * @returns {string}
   */
  getCategoryPrefix(category) {
    const prefixes = {
      'preventive-maintenance': 'PMC',
      'comprehensive-maintenance': 'CMC',
      'annual-maintenance': 'AMC',
      'sla-based-maintenance': 'SLA',
      'corrective-maintenance': 'COR',
      'emergency-on-call': 'EMG',
      'time-and-material': 'T&M',
      'construction-daily-diary': 'CON'
    };

    return prefixes[category] || 'CTR';
  }
}

// Export singleton instance
export const contractService = new ContractService();

// Export default
export default contractService;
