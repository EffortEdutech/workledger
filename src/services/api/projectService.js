/**
 * WorkLedger - Project Service
 * 
 * Basic service for getting project counts (will be expanded in Session 9)
 * 
 * @module services/api/projectService
 * @created January 29, 2026
 */

import { supabase } from '../supabase/client';

/**
 * Project Service
 */
export class ProjectService {
  /**
   * Get total projects count for user's organizations
   * @returns {Promise<number>} Total count
   */
  async getProjectsCount() {
    try {
      console.log('📊 Getting projects count...');

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

      // Count projects in these organizations
      const { count, error } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .in('organization_id', orgIds)
        .is('deleted_at', null);

      if (error) {
        console.error('❌ Error getting projects count:', error);
        return 0;
      }

      console.log('✅ Projects count:', count);
      return count || 0;
    } catch (error) {
      console.error('❌ Exception getting projects count:', error);
      return 0;
    }
  }

  /**
   * Get user's projects
   * @returns {Promise<Array>} Array of projects
   */
  async getUserProjects() {
    try {
      console.log('📊 Getting user projects...');

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

      // Get projects
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          organization:organizations(id, name, slug)
        `)
        .in('organization_id', orgIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error getting projects:', error);
        return [];
      }

      console.log('✅ Retrieved projects:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Exception getting projects:', error);
      return [];
    }
  }
}

// Export singleton instance
export const projectService = new ProjectService();

// Export default
export default projectService;
