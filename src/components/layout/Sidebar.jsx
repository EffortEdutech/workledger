/**
 * WorkLedger - Sidebar Component
 *
 * Desktop sidebar navigation with active states and icons.
 * Hidden on mobile, visible on md+ screens.
 *
 * SESSION 11 UPDATE: Role-filtered navigation.
 * SESSION 13 UPDATE: Quick Entry nav item added.
 * SESSION 16 UPDATE: Approvals nav item + pending badge.
 * SESSION 17 UPDATE: Consolidated Report + Rejection Analytics nav items.
 *
 * SESSION 19 UPDATE — No-org fallback state:
 *   When a user is authenticated but has no org_members record (just
 *   registered, not yet added to an org), all can() calls return false →
 *   navItems is empty → sidebar nav area is completely blank.
 *
 *   Fix: detect this state and render a friendly "Pending access" block
 *   in the nav area instead of empty space. The logo + sidebar chrome
 *   still render so the layout doesn't collapse.
 *
 * Role visibility summary:
 *   super_admin / bina_jaya_staff  → all items (incl. Quick Entry)
 *   org_owner / org_admin          → all standard items + Approvals
 *   manager                        → work, approvals, projects, contracts, reports, templates
 *   technician / worker            → dashboard, work entries, projects, contracts
 *   subcontractor                  → dashboard, work entries, projects, contracts
 *   (no role)                      → "Pending access" fallback state
 *
 * @module components/layout/Sidebar
 * @created January 29, 2026
 * @updated February 21, 2026 - Session 11
 * @updated February 21, 2026 - Session 13
 * @updated February 27, 2026 - Session 16
 * @updated March 2, 2026    - Session 17
 * @updated April 7, 2026    - Session 19: no-org fallback state
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useRole } from '../../hooks/useRole';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { workEntryService } from '../../services/api/workEntryService';

export function Sidebar({ isCollapsed = false }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { can, loading: roleLoading } = useRole();
  const { profile, logout } = useAuth();
  const { currentOrg } = useOrganization();

  // ── Pending approval count badge (Session 16) ─────────────────────────────
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const canApprove = can('APPROVE_WORK_ENTRY');
    if (!canApprove || !currentOrg?.id) { setPendingCount(0); return; }

    let cancelled = false;
    const fetchCount = async () => {
      try {
        const result = await workEntryService.getPendingApprovals(currentOrg.id, true);
        if (!cancelled && result.success) setPendingCount(result.count || 0);
      } catch { /* non-fatal */ }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrg?.id]);

  // ── Nav item definitions ──────────────────────────────────────────────────
  const allNavItems = [
    {
      label:      'Dashboard',
      path:       ROUTES.DASHBOARD,
      permission: 'NAV_DASHBOARD',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label:      'Work Entries',
      path:       ROUTES.WORK_ENTRIES,
      permission: 'NAV_WORK_ENTRIES',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label:      'Approvals',
      path:       ROUTES.WORK_ENTRY_APPROVALS,
      permission: 'APPROVE_WORK_ENTRY',
      badge:      pendingCount > 0 ? pendingCount : null,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label:      'Projects',
      path:       ROUTES.PROJECTS,
      permission: 'NAV_PROJECTS',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      label:      'Contracts',
      path:       ROUTES.CONTRACTS,
      permission: 'NAV_CONTRACTS',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label:      'Templates',
      path:       ROUTES.TEMPLATES,
      permission: 'NAV_TEMPLATES',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
    },
    {
      label:      'Reports',
      path:       ROUTES.REPORTS,
      permission: 'NAV_REPORTS',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label:      'Consolidated',
      path:       ROUTES.REPORT_CONSOLIDATED,
      permission: 'NAV_SUBCONTRACTORS',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      label:      'Rejections',
      path:       ROUTES.REPORT_REJECTIONS,
      permission: 'APPROVE_WORK_ENTRY',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label:      'Layouts',
      path:       ROUTES.REPORT_LAYOUTS,
      permission: 'NAV_LAYOUTS',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM14 5a1 1 0 011-1h4a1 1 0 011 1v12a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
        </svg>
      ),
    },
    {
      label:      'Organizations',
      path:       ROUTES.ORGANIZATIONS,
      permission: 'NAV_ORGANIZATIONS',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      label:      'Users',
      path:       ROUTES.USERS,
      permission: 'NAV_USERS',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      label:      'Subcontractors',
      path:       ROUTES.SUBCONTRACTORS,
      permission: 'NAV_SUBCONTRACTORS',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label:      'Quick Entry',
      path:       ROUTES.QUICK_ENTRY,
      permission: 'NAV_QUICK_ENTRY',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const navItems = allNavItems.filter(item => can(item.permission));

  const isActive = (path) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(path);

  // ── No-Org Fallback ───────────────────────────────────────────────────────
  // User authenticated + role loading done + zero nav items resolved.
  // The user has no org membership and no platform role — show a clear
  // "pending" state in the nav area instead of invisible blank space.
  const isNoOrgState = !roleLoading && !!profile && navItems.length === 0;

  return (
    <aside className={`
      hidden md:flex flex-col
      bg-white border-r border-gray-200
      transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-16' : 'w-60'}
    `}>

      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200 flex-shrink-0">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">W</span>
        </div>
        {!isCollapsed && (
          <span className="ml-3 text-lg font-bold text-gray-900 truncate">
            WorkLedger
          </span>
        )}
      </div>

      {/* Nav Items — or No-Org State */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">

        {isNoOrgState ? (
          /* ── No-org fallback ── */
          <div className="px-2 py-4">
            {!isCollapsed ? (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                  <p className="text-xs font-semibold text-amber-800">No organisation yet</p>
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Your account is set up but hasn&apos;t been added to an
                  organisation. Contact your administrator to get access.
                </p>
                <button
                  onClick={async () => { await logout(); navigate(ROUTES.LOGIN); }}
                  className="w-full mt-1 flex items-center justify-center gap-1.5 px-3 py-1.5
                             text-xs font-medium text-gray-600 bg-white border border-gray-200
                             rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            ) : (
              /* Collapsed: just a dot indicator + logout icon */
              <div className="flex flex-col items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <button
                  onClick={async () => { await logout(); navigate(ROUTES.LOGIN); }}
                  className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500
                             hover:bg-gray-100 transition-colors"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ── Normal nav items ── */
          navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className={`
                  flex items-center px-2 py-2.5 rounded-lg
                  text-sm font-medium transition-colors duration-150
                  ${active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <span className={`flex-shrink-0 ${active ? 'text-primary-600' : 'text-gray-400'}`}>
                  {item.icon}
                </span>

                {!isCollapsed && (
                  <span className="ml-3 flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">{item.label}</span>
                    {item.badge != null && (
                      <span className="ml-2 flex-shrink-0 inline-flex items-center justify-center
                                       min-w-[1.25rem] h-5 px-1 text-xs font-bold
                                       text-white bg-blue-600 rounded-full">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </span>
                )}

                {isCollapsed && item.badge != null && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full" />
                )}
              </Link>
            );
          })
        )}
      </nav>

      <div className="h-4 flex-shrink-0" />
    </aside>
  );
}

export default Sidebar;
