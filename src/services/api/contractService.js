/**
 * WorkLedger - Contract Service
 * 
 * Basic service for getting contract counts (will be expanded in Session 10)
 * 
 * @module services/api/contractService
 * @created January 29, 2026
 */

import { supabase } from '../supabase/client';

/**
 * Contract Service
 */
export class ContractService {
  /**
   * Get total contracts count for user's projects
   * @returns {Promise<number>} Total count
   */
  async getContractsCount() {
    try {
      console.log('📊 Getting contracts count...');

      // Get user's organizations first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      // Get org IDs
      const { data: memberships } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (!memberships || memberships.length === 0) return 0;

      const orgIds = memberships.map(m => m.organization_id);

      // Get project IDs in these organizations
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
   * @returns {Promise<Array>} Array of contracts
   */
  async getUserContracts() {
    try {
      console.log('📊 Getting user contracts...');

      // Get user's organizations first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get org IDs
      const { data: memberships } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (!memberships || memberships.length === 0) return [];

      const orgIds = memberships.map(m => m.organization_id);

      // Get project IDs
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .in('organization_id', orgIds)
        .is('deleted_at', null);

      if (!projects || projects.length === 0) return [];

      const projectIds = projects.map(p => p.id);

      // Get contracts
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          project:projects(
            id,
            project_name,
            organization:organizations(id, name)
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
}

// Export singleton instance
export const contractService = new ContractService();

// Export default
export default contractService;
