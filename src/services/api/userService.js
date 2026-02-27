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
import { ASSIGNABLE_ORG_ROLES } from '../../constants/permissions';

// Re-export so existing code importing from userService still works
export { ASSIGNABLE_ORG_ROLES } from '../../constants/permissions';

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

      // ── Step 1: Fetch org_members rows ───────────────────────────────────
      // NOTE: org_members.user_id is a FK to auth.users (not user_profiles),
      // so PostgREST CANNOT traverse user_profiles via a join (PGRST200).
      // We do two queries and merge manually.
      const { data: members, error: membersError } = await supabase
        .from('org_members')
        .select('id, user_id, organization_id, role, is_active, joined_at, created_at')
        .eq('organization_id', orgId)
        .order('joined_at', { ascending: true });

      if (membersError) throw membersError;
      if (!members || members.length === 0) {
        console.log('✅ Loaded members: 0');
        return [];
      }

      // ── Step 2: Fetch user_profiles for those user_ids ───────────────────
      const userIds = members.map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, phone_number, global_role, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        // Non-fatal: return members without profile data rather than failing
        console.warn('⚠️ Could not load user profiles:', profilesError.message);
      }

      // ── Step 3: Merge profiles into members ──────────────────────────────
      const profileMap = {};
      (profiles || []).forEach(p => { profileMap[p.id] = p; });

      const merged = members.map(m => ({
        ...m,
        user: profileMap[m.user_id] || null,
      }));

      // SESSION 15 FIX: Exclude platform staff (super_admin, bina_jaya_staff).
      // They access orgs via the org switcher — never via org_members.
      // This is a second layer of defence after Migration 029f.
      const filtered = merged.filter(m => {
        const g = m.user?.global_role;
        return g !== 'super_admin' && g !== 'bina_jaya_staff';
      });

      console.log(`✅ Loaded members: ${filtered.length} (${merged.length - filtered.length} platform staff excluded)`);
      return filtered;
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

      // user_profiles does not store email — it lives in auth.users.
      // We use a direct auth lookup via Supabase's built-in signInWithOtp
      // trick-free approach: query auth.users through the admin API isn't
      // available on anon key. Instead we attempt to match via a custom
      // RPC if available, otherwise fall back to checking org_members by
      // asking the caller to enter the user_id directly.
      //
      // Practical zero-budget solution: try to find the profile by calling
      // supabase.auth.signInWithOtp to verify the email exists — but that
      // sends an email which we don't want.
      //
      // Best available approach without service_role: use a database function.
      // If no RPC exists, we return not_found and the UI shows the signup link.
      // The admin can then add by user_id once the user registers.

      const { data, error } = await supabase
        .rpc('find_user_by_email', { p_email: email.toLowerCase().trim() });

      if (error) {
        // RPC doesn't exist yet — fall back to "not found" gracefully
        if (error.code === 'PGRST202' || error.message?.includes('find_user_by_email')) {
          console.log('ℹ️ find_user_by_email RPC not available — treating as not found');
          return { found: false };
        }
        throw error;
      }

      if (data && data.length > 0) {
        const profile = data[0];
        console.log('✅ User found:', profile.full_name);
        return { found: true, userId: profile.id, profile };
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
