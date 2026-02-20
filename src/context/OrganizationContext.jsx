/**
 * WorkLedger - Organization Context
 *
 * Manages multi-tenancy across the app.
 *
 * HOW IT WORKS:
 *   - Regular client users   → auto-detects their single org from org_members
 *   - Bina Jaya super_admin  → can see and switch between ALL organizations
 *   - Bina Jaya bina_jaya_staff → same as super_admin for org visibility
 *
 * IMPORTANT — profile.global_role:
 *   This field is added by migration 022. It comes from user_profiles table
 *   which AuthContext already fetches via authService.getUserProfile() with select('*').
 *   So profile.global_role is available automatically once migration 022 runs. ✅
 *
 * HOW TO USE orgId IN SERVICES/PAGES:
 *   const { orgId } = useOrganization();
 *   supabase.from('work_entries').select('*').eq('organization_id', orgId)
 *
 * @file src/context/OrganizationContext.jsx
 * @created February 20, 2026
 * @session Session 9 - Multi-Tenancy Foundation
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabase/client';

// ──────────────────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────────────────
const OrganizationContext = createContext(null);

// Persist selected org for Bina Jaya staff across page refreshes
const STORAGE_KEY = 'wl_active_org_id';

// ──────────────────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────────────────
export function OrganizationProvider({ children }) {
  const { user, profile, loading: authLoading } = useAuth();

  const [allOrgs, setAllOrgs] = useState([]);
  const [currentOrg, setCurrentOrgState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Derived: is this user Bina Jaya platform staff?
  // Uses global_role from user_profiles (added by migration 022)
  const isBinaJayaStaff = Boolean(
    profile?.global_role === 'super_admin' || 
    profile?.global_role === 'bina_jaya_staff'
  );

  // ────────────────────────────────────────────────────────
  // Load organizations — runs when auth state is ready
  // ────────────────────────────────────────────────────────
  const loadOrganizations = useCallback(async () => {
    // Wait for AuthContext to finish loading before we act
    if (authLoading) return;

    if (!user) {
      setAllOrgs([]);
      setCurrentOrgState(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let orgs = [];

      if (isBinaJayaStaff) {
        // ── Bina Jaya staff: load ALL organizations ──
        console.log('🏢 OrgContext: Loading ALL orgs (Bina Jaya staff)');
        const { data, error: fetchError } = await supabase
          .from('organizations')
          .select('id, name, slug, subscription_tier, user_limit, settings')
          .is('deleted_at', null)
          .order('name');

        if (fetchError) throw fetchError;
        orgs = data || [];

      } else {
        // ── Regular client user: load only orgs they belong to ──
        console.log('🏢 OrgContext: Loading user orgs via org_members');
        const { data, error: fetchError } = await supabase
          .from('org_members')
          .select(`
            organization_id,
            role,
            is_active,
            organizations (
              id,
              name,
              slug,
              subscription_tier,
              user_limit,
              settings
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (fetchError) throw fetchError;

        orgs = (data || [])
          .map(m => m.organizations)
          .filter(Boolean);
      }

      console.log(`✅ OrgContext: Loaded ${orgs.length} org(s)`);
      setAllOrgs(orgs);

      // ── Determine which org to activate ──
      // Priority: 1) last saved in localStorage, 2) first in list
      const savedOrgId = localStorage.getItem(STORAGE_KEY);
      const savedOrg = savedOrgId ? orgs.find(o => o.id === savedOrgId) : null;
      const activeOrg = savedOrg || orgs[0] || null;

      setCurrentOrgState(activeOrg);

      if (activeOrg) {
        localStorage.setItem(STORAGE_KEY, activeOrg.id);
        console.log(`✅ OrgContext: Active org → "${activeOrg.name}"`);
      }

    } catch (err) {
      console.error('❌ OrgContext: Failed to load organizations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, profile, authLoading, isBinaJayaStaff]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  // ────────────────────────────────────────────────────────
  // Switch org (Bina Jaya staff only)
  // ────────────────────────────────────────────────────────
  const switchOrganization = useCallback((orgId) => {
    if (!isBinaJayaStaff) {
      console.warn('⚠️ OrgContext: Only Bina Jaya staff can switch orgs');
      return;
    }

    const org = allOrgs.find(o => o.id === orgId);
    if (!org) {
      console.error('❌ OrgContext: Org not found:', orgId);
      return;
    }

    console.log(`🔄 OrgContext: Switching to "${org.name}"`);
    setCurrentOrgState(org);
    localStorage.setItem(STORAGE_KEY, orgId);
  }, [allOrgs, isBinaJayaStaff]);

  // ────────────────────────────────────────────────────────
  // Refresh (call after creating a new organization)
  // ────────────────────────────────────────────────────────
  const refreshOrganizations = useCallback(() => {
    return loadOrganizations();
  }, [loadOrganizations]);

  // ────────────────────────────────────────────────────────
  // Context value
  // ────────────────────────────────────────────────────────
  const value = {
    // State
    allOrgs,
    currentOrg,
    loading,
    error,

    // Computed (use these in components and services)
    isBinaJayaStaff,
    orgId: currentOrg?.id || null,  // ← use this in ALL Supabase queries!

    // Actions
    switchOrganization,
    refreshOrganizations,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

// ──────────────────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────────────────
export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used inside <OrganizationProvider>');
  }
  return context;
}

export default OrganizationContext;
