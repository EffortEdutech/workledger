/**
 * WorkLedger - User Service
 *
 * Manages org members: listing, role changes, activate/deactivate, invite.
 *
 * All mutations are org-scoped — only touches org_members rows for
 * the caller's current organization. Super admin / BJ staff bypass
 * is handled at RLS level but is intentionally NOT exposed through
 * this service (they manage clients via OrganizationContext, not here).
 *
 * @module services/api/userService
 * @created February 23, 2026 - Session 12
 */

import { supabase } from '../supabase/client';

// Roles that org_admin / org_owner are allowed to assign.
// super_admin and bina_jaya_staff are platform-level — never assigned via this UI.
export const ASSIGNABLE_ORG_ROLES = [
  'org_owner',
  'org_admin',
  'manager',
  'technician',
  'worker',
  'subcontractor',
  'client',
];

class UserService {
  // ─────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────

  /**
   * Get all members of an organization.
   * Joins user_profiles so we get name + email + global_role.
   *
   * @param {string} orgId
   * @returns {Promise<Array>} Array of member objects
   */
  async getOrgMembers(orgId) {
    try {
      console.log('👥 Loading org members for:', orgId);

      const { data, error } = await supabase
        .from('org_members')
        .select(`
          id,
          user_id,
          organization_id,
          role,
          is_active,
          joined_at,
          created_at,
          user:user_profiles (
            id,
            full_name,
            email,
            global_role,
            avatar_url
          )
        `)
        .eq('organization_id', orgId)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      console.log('✅ Loaded members:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Exception in getOrgMembers:', error);
      return [];
    }
  }

  /**
   * Count active members in an org.
   * @param {string} orgId
   * @returns {Promise<number>}
   */
  async getActiveMemberCount(orgId) {
    try {
      const { count, error } = await supabase
        .from('org_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('is_active', true);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('❌ Exception in getActiveMemberCount:', error);
      return 0;
    }
  }

  /**
   * Count org_owner members in an org.
   * Used to prevent demoting the last owner.
   * @param {string} orgId
   * @returns {Promise<number>}
   */
  async getOwnerCount(orgId) {
    try {
      const { count, error } = await supabase
        .from('org_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('role', 'org_owner')
        .eq('is_active', true);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('❌ Exception in getOwnerCount:', error);
      return 0;
    }
  }

  // ─────────────────────────────────────────────
  // ROLE MANAGEMENT
  // ─────────────────────────────────────────────

  /**
   * Change the role of an org member.
   *
   * Safety checks:
   * - Cannot demote the last active org_owner
   * - Cannot assign platform roles (super_admin, bina_jaya_staff)
   *
   * @param {string} orgId
   * @param {string} memberId  — the org_members.id (junction row id)
   * @param {string} newRole
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updateMemberRole(orgId, memberId, newRole) {
    try {
      console.log('🔄 Updating member role:', { memberId, newRole });

      // Guard: only assignable roles
      if (!ASSIGNABLE_ORG_ROLES.includes(newRole)) {
        return { success: false, error: `Invalid role: ${newRole}` };
      }

      // Fetch current member row to check current role
      const { data: member, error: fetchError } = await supabase
        .from('org_members')
        .select('role, is_active')
        .eq('id', memberId)
        .eq('organization_id', orgId)
        .single();

      if (fetchError || !member) {
        return { success: false, error: 'Member not found' };
      }

      // Guard: cannot demote last org_owner
      if (member.role === 'org_owner' && newRole !== 'org_owner') {
        const ownerCount = await this.getOwnerCount(orgId);
        if (ownerCount <= 1) {
          return {
            success: false,
            error: 'Cannot change role — this is the last Owner. Assign another Owner first.',
          };
        }
      }

      const { error } = await supabase
        .from('org_members')
        .update({
          role:       newRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId)
        .eq('organization_id', orgId);

      if (error) throw error;

      console.log('✅ Role updated to:', newRole);
      return { success: true };
    } catch (error) {
      console.error('❌ Exception in updateMemberRole:', error);
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────────
  // ACTIVATE / DEACTIVATE
  // ─────────────────────────────────────────────

  /**
   * Deactivate (soft-remove) a member from an org.
   * Their data is preserved; they just can't log in to this org.
   *
   * @param {string} orgId
   * @param {string} memberId  — org_members.id
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deactivateMember(orgId, memberId) {
    try {
      console.log('🚫 Deactivating member:', memberId);

      // Guard: cannot deactivate last owner
      const { data: member } = await supabase
        .from('org_members')
        .select('role')
        .eq('id', memberId)
        .eq('organization_id', orgId)
        .single();

      if (member?.role === 'org_owner') {
        const ownerCount = await this.getOwnerCount(orgId);
        if (ownerCount <= 1) {
          return {
            success: false,
            error: 'Cannot deactivate the last Owner. Assign another Owner first.',
          };
        }
      }

      const { error } = await supabase
        .from('org_members')
        .update({
          is_active:    false,
          updated_at:   new Date().toISOString(),
        })
        .eq('id', memberId)
        .eq('organization_id', orgId);

      if (error) throw error;

      console.log('✅ Member deactivated');
      return { success: true };
    } catch (error) {
      console.error('❌ Exception in deactivateMember:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reactivate a previously deactivated member.
   *
   * @param {string} orgId
   * @param {string} memberId  — org_members.id
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async reactivateMember(orgId, memberId) {
    try {
      console.log('✅ Reactivating member:', memberId);

      const { error } = await supabase
        .from('org_members')
        .update({
          is_active:  true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId)
        .eq('organization_id', orgId);

      if (error) throw error;

      console.log('✅ Member reactivated');
      return { success: true };
    } catch (error) {
      console.error('❌ Exception in reactivateMember:', error);
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────────
  // INVITE
  // ─────────────────────────────────────────────

  /**
   * Look up whether an email address is already registered
   * in user_profiles (i.e. they have a WorkLedger account).
   *
   * Note: We query user_profiles, not auth.users, because RLS
   * only allows reading your own auth row. user_profiles is
   * readable by org admins within their org context.
   *
   * @param {string} email
   * @returns {Promise<{found: boolean, userId?: string, profile?: object}>}
   */
  async findUserByEmail(email) {
    try {
      console.log('🔍 Looking up user by email:', email);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, global_role')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        console.log('✅ User found:', data.full_name);
        return { found: true, userId: data.id, profile: data };
      }

      console.log('ℹ️ User not found in system');
      return { found: false };
    } catch (error) {
      console.error('❌ Exception in findUserByEmail:', error);
      return { found: false, error: error.message };
    }
  }

  /**
   * Check if a user is already a member of this org.
   *
   * @param {string} orgId
   * @param {string} userId
   * @returns {Promise<{isMember: boolean, member?: object}>}
   */
  async checkExistingMembership(orgId, userId) {
    try {
      const { data, error } = await supabase
        .from('org_members')
        .select('id, role, is_active')
        .eq('organization_id', orgId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return { isMember: !!data, member: data || null };
    } catch (error) {
      console.error('❌ Exception in checkExistingMembership:', error);
      return { isMember: false };
    }
  }

  /**
   * Add an existing WorkLedger user to this organization.
   * Used when the invited email is already registered.
   *
   * @param {string} orgId
   * @param {string} userId
   * @param {string} role
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async addExistingUserToOrg(orgId, userId, role) {
    try {
      console.log('➕ Adding user to org:', { orgId, userId, role });

      if (!ASSIGNABLE_ORG_ROLES.includes(role)) {
        return { success: false, error: `Invalid role: ${role}` };
      }

      // Check for existing (possibly inactive) membership
      const { isMember, member } = await this.checkExistingMembership(orgId, userId);

      if (isMember && member.is_active) {
        return { success: false, error: 'This user is already a member of the organization.' };
      }

      if (isMember && !member.is_active) {
        // Reactivate with new role
        const { error } = await supabase
          .from('org_members')
          .update({ is_active: true, role, updated_at: new Date().toISOString() })
          .eq('id', member.id);

        if (error) throw error;
        console.log('✅ Reactivated existing member with new role');
        return { success: true, reactivated: true };
      }

      // New membership
      const { error } = await supabase
        .from('org_members')
        .insert({
          organization_id: orgId,
          user_id:         userId,
          role,
          is_active:       true,
          joined_at:       new Date().toISOString(),
          created_at:      new Date().toISOString(),
          updated_at:      new Date().toISOString(),
        });

      if (error) throw error;

      console.log('✅ User added to org');
      return { success: true };
    } catch (error) {
      console.error('❌ Exception in addExistingUserToOrg:', error);
      return { success: false, error: error.message };
    }
  }
}

export const userService = new UserService();
export default userService;
