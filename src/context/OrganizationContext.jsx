/**
 * WorkLedger - Organization Context
 *
 * Manages the active organization for the current session.
 * Provides org switching for Bina Jaya staff and org-scoped data access.
 *
 * SESSION 9: Initial implementation
 *   - orgId, currentOrg, isBinaJayaStaff, switchOrganization
 *   - localStorage persistence
 *
 * SESSION 11 UPDATE: Added userOrgRole
 *   - Fetches user's role in the ACTIVE org from org_members
 *   - BJ staff: userOrgRole = their global_role ('super_admin' / 'bina_jaya_staff')
 *   - Regular users: userOrgRole = org_members.role for their org
 *   - Updates automatically when org switches
 *   - This is the single source of truth for permission checks
 *
 * @module context/OrganizationContext
 * @created February 20, 2026 - Session 9
 * @updated February 21, 2026 - Session 11: userOrgRole added
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabase/client';

const OrganizationContext = createContext(null);

export function OrganizationProvider({ children }) {
  const { user, profile, loading: authLoading } = useAuth();

  const [allOrgs, setAllOrgs]           = useState([]);
  const [currentOrg, setCurrentOrg]     = useState(null);
  const [userOrgRole, setUserOrgRole]   = useState(null);  // ← NEW Session 11
  const [loading, setLoading]           = useState(true);

  // ─────────────────────────────────────────────────────────
  // Derived: Is this user Bina Jaya platform staff?
  // ─────────────────────────────────────────────────────────
  const isBinaJayaStaff = !!(
    profile?.global_role === 'super_admin' ||
    profile?.global_role === 'bina_jaya_staff'
  );

  // Shorthand: active org's ID (used in every service call)
  const orgId = currentOrg?.id ?? null;

  // ─────────────────────────────────────────────────────────
  // Load organizations (runs when auth settles)
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setAllOrgs([]);
      setCurrentOrg(null);
      setUserOrgRole(null);
      setLoading(false);
      return;
    }
    loadOrganizations();
  }, [authLoading, user, profile?.global_role]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      let orgs = [];

      if (isBinaJayaStaff) {
        // BJ staff can see ALL organizations
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name, slug, subscription_tier, settings')
          .is('deleted_at', null)
          .order('name');

        if (error) throw error;
        orgs = data || [];
      } else {
        // Regular users: only orgs they're members of
        const { data, error } = await supabase
          .from('org_members')
          .select(`
            role,
            organization:organizations(id, name, slug, subscription_tier, settings)
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .is('organizations.deleted_at', null);

        if (error) throw error;
        orgs = (data || [])
          .filter(m => m.organization)
          .map(m => m.organization);
      }

      setAllOrgs(orgs);

      // ── Restore previously selected org, or default to first ──
      const savedOrgId = localStorage.getItem('wl_active_org_id');
      const savedOrg = savedOrgId
        ? orgs.find(o => o.id === savedOrgId)
        : null;
      const active = savedOrg || orgs[0] || null;
      setCurrentOrg(active);

      console.log('✅ OrganizationContext: Loaded', orgs.length, 'orgs. Active:', active?.name);
    } catch (error) {
      console.error('❌ OrganizationContext: Failed to load orgs:', error);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // Fetch userOrgRole whenever currentOrg changes
  // ─────────────────────────────────────────────────────────
  // This is the KEY addition for Session 11.
  // Every permission check reads from userOrgRole.
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchUserOrgRole();
  }, [currentOrg?.id, user?.id, profile?.global_role]);

  const fetchUserOrgRole = useCallback(async () => {
    if (!user || !currentOrg) {
      setUserOrgRole(null);
      return;
    }

    // BJ staff: their "role" is their global_role — no org_members row needed
    if (isBinaJayaStaff) {
      setUserOrgRole(profile.global_role); // 'super_admin' or 'bina_jaya_staff'
      return;
    }

    // Regular users: look up their role in the active org
    try {
      const { data, error } = await supabase
        .from('org_members')
        .select('role')
        .eq('organization_id', currentOrg.id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.warn('⚠️ No org_members row found for user in org:', currentOrg.name);
        setUserOrgRole(null);
      } else {
        setUserOrgRole(data.role);
        console.log('✅ userOrgRole:', data.role, 'in', currentOrg.name);
      }
    } catch (error) {
      console.error('❌ Failed to fetch userOrgRole:', error);
      setUserOrgRole(null);
    }
  }, [currentOrg?.id, user?.id, isBinaJayaStaff, profile?.global_role]);

  // ─────────────────────────────────────────────────────────
  // Switch organization (BJ staff only)
  // ─────────────────────────────────────────────────────────
  const switchOrganization = useCallback((orgIdToSwitch) => {
    const org = allOrgs.find(o => o.id === orgIdToSwitch);
    if (!org) {
      console.warn('⚠️ switchOrganization: org not found:', orgIdToSwitch);
      return;
    }
    setCurrentOrg(org);
    localStorage.setItem('wl_active_org_id', org.id);
    console.log('🔄 Switched to org:', org.name);
  }, [allOrgs]);

  // Clear org on logout (when user becomes null)
  useEffect(() => {
    if (!user) {
      localStorage.removeItem('wl_active_org_id');
    }
  }, [user]);

  // ─────────────────────────────────────────────────────────
  // Context value
  // ─────────────────────────────────────────────────────────
  const value = {
    // State
    allOrgs,
    currentOrg,
    loading,

    // Derived
    orgId,                // shorthand for currentOrg?.id
    isBinaJayaStaff,      // true for super_admin / bina_jaya_staff
    userOrgRole,          // ← NEW: user's role in the active org

    // Methods
    switchOrganization,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

/**
 * useOrganization hook
 * Access org state and switching from any component.
 */
export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}

export default OrganizationContext;
