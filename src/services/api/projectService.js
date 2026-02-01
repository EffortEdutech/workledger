/**
 * WorkLedger - Project Service
 * 
 * Complete project service with full CRUD operations
 * 
 * @module services/api/projectService
 * @created January 29, 2026
 * @updated January 30, 2026 - Session 9: Added full CRUD operations
 */

import { supabase } from '../supabase/client';
import { organizationService } from './organizationService';

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
          organizations(id, name, slug)
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

  /**
   * Get single project by ID
   * @param {string} id - Project ID
   * @returns {Promise<object|null>} Project object or null
   */
  async getProject(id) {
    try {
      console.log('📊 Getting project:', id);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get project with organization details
      const { data: project, error } = await supabase
        .from('projects')
        .select(`
          *,
          organizations(id, name, slug)
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.error('❌ Error fetching project:', error);
        return null;
      }

      // Verify user has access to this project's organization
      const role = await organizationService.getUserRole(project.organization_id, user.id);
      if (!role) {
        console.error('❌ User does not have access to this project');
        return null;
      }

      console.log('✅ Project fetched:', project.project_name);
      return project;
    } catch (error) {
      console.error('❌ Exception in getProject:', error);
      return null;
    }
  }

  /**
   * Create new project
   * @param {string} organizationId - Organization ID
   * @param {object} data - Project data
   * @returns {Promise<object|null>} Created project or null
   */
  async createProject(organizationId, data) {
    try {
      console.log('📊 Creating project:', data.project_name);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Verify user is member of organization
      const role = await organizationService.getUserRole(organizationId, user.id);
      if (!role) {
        throw new Error('Not a member of this organization');
      }

      // Generate project code if not provided
      const projectCode = data.project_code || await this.generateProjectCode(organizationId);

      // Prepare metadata
      const metadata = {
        tags: data.tags || [],
        notes: data.notes || '',
        contacts: data.contacts || []
      };

      // Create project
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          organization_id: organizationId,
          project_name: data.project_name,
          project_code: projectCode,
          client_name: data.client_name,
          site_address: data.site_address || null,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          status: data.status || 'active',
          metadata: metadata,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          organizations(id, name, slug)
        `)
        .single();

      if (error) {
        console.error('❌ Project creation error:', error);
        throw error;
      }

      console.log('✅ Project created:', project.id);
      return project;
    } catch (error) {
      console.error('❌ Exception creating project:', error);
      throw error;
    }
  }

  /**
   * Update existing project
   * @param {string} id - Project ID
   * @param {object} data - Project data to update
   * @returns {Promise<object|null>} Updated project or null
   */
  async updateProject(id, data) {
    try {
      console.log('📊 Updating project:', id);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Get existing project to verify access
      const existing = await this.getProject(id);
      if (!existing) {
        throw new Error('Project not found or access denied');
      }

      // Prepare update data
      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (data.project_name) updateData.project_name = data.project_name;
      if (data.project_code) updateData.project_code = data.project_code;
      if (data.client_name) updateData.client_name = data.client_name;
      if (data.site_address !== undefined) updateData.site_address = data.site_address;
      if (data.start_date !== undefined) updateData.start_date = data.start_date;
      if (data.end_date !== undefined) updateData.end_date = data.end_date;
      if (data.status) updateData.status = data.status;

      // Update metadata if provided
      if (data.tags !== undefined || data.notes !== undefined || data.contacts !== undefined) {
        const currentMetadata = existing.metadata || {};
        updateData.metadata = {
          tags: data.tags !== undefined ? data.tags : currentMetadata.tags,
          notes: data.notes !== undefined ? data.notes : currentMetadata.notes,
          contacts: data.contacts !== undefined ? data.contacts : currentMetadata.contacts
        };
      }

      // Update project
      const { data: project, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          organizations(id, name, slug)
        `)
        .single();

      if (error) {
        console.error('❌ Project update error:', error);
        throw error;
      }

      console.log('✅ Project updated:', project.id);
      return project;
    } catch (error) {
      console.error('❌ Exception updating project:', error);
      throw error;
    }
  }

  /**
   * Delete project (soft delete)
   * @param {string} id - Project ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteProject(id) {
    try {
      console.log('📊 Deleting project:', id);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Get existing project to verify access
      const existing = await this.getProject(id);
      if (!existing) {
        throw new Error('Project not found or access denied');
      }

      // Verify user has permission
      const role = await organizationService.getUserRole(existing.organization_id, user.id);
      if (!role || (role !== 'org_admin' && role !== 'manager')) {
        throw new Error('Insufficient permissions to delete project');
      }

      // Soft delete (set deleted_at timestamp)
      const { error } = await supabase
        .from('projects')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('❌ Project deletion error:', error);
        throw error;
      }

      console.log('✅ Project deleted (soft):', id);
      return true;
    } catch (error) {
      console.error('❌ Exception deleting project:', error);
      throw error;
    }
  }

  /**
   * Generate unique project code
   * @param {string} organizationId - Organization ID
   * @returns {Promise<string>}
   */
  async generateProjectCode(organizationId) {
    try {
      // Get organization to use in code
      const { data: org } = await supabase
        .from('organizations')
        .select('slug')
        .eq('id', organizationId)
        .single();

      // Get current year
      const year = new Date().getFullYear();

      // Count projects in this org this year
      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', `${year}-01-01`)
        .is('deleted_at', null);

      const nextNumber = (count || 0) + 1;
      const orgPrefix = org?.slug?.substring(0, 3).toUpperCase() || 'PRJ';

      return `${orgPrefix}-${year}-${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
      console.error('❌ Error generating project code:', error);
      // Fallback to simple code
      return `PRJ-${Date.now()}`;
    }
  }
}

// Export singleton instance
export const projectService = new ProjectService();

// Export default
export default projectService;
