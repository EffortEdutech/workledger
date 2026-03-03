/**
 * WorkLedger - Sidebar Component
 *
 * Desktop sidebar navigation with active states and icons.
 * Hidden on mobile, visible on md+ screens.
 *
 * SESSION 11 UPDATE: Role-filtered navigation.
 * Uses useRole() to check NAV_* permissions and only shows
 * items the current user is allowed to see.
 *
 * SESSION 13 UPDATE: Quick Entry nav item added.
 *   - Visible to: super_admin, bina_jaya_staff only
 *   - Permission: NAV_QUICK_ENTRY
 *   - Bug fix: Quick Entry item now uses `path:` (was `to:`) consistent
 *     with all other items so the Link render does not crash.
 *
 * SESSION 16 UPDATE: Approvals nav item added.
 *   - Visible to: org_owner, org_admin, manager
 *   - Permission: APPROVE_WORK_ENTRY
 *   - Shows live pending count badge, refreshed every 30 seconds
 *   - Positioned directly under Work Entries in the nav list
 *
 * SESSION 17 UPDATE: Two new report nav items added.
 *   - Consolidated Report (path: /reports/consolidated)
 *       Permission: NAV_SUBCONTRACTORS — only main contractors (MTSB) see this
 *       Positioned under Reports item
 *   - Rejection Analytics (path: /reports/rejections)
 *       Permission: APPROVE_WORK_ENTRY — managers and above
 *       Positioned under Consolidated Report
 *
 * Role visibility summary:
 *   super_admin / bina_jaya_staff  → all items (incl. Quick Entry)
 *   org_owner / org_admin          → all standard items + Approvals (no Quick Entry)
 *   manager                        → work, approvals, projects, contracts, reports, templates
 *   technician / worker            → dashboard, work entries, projects, contracts
 *   subcontractor                  → dashboard, work entries, projects, contracts
 *
 * @module components/layout/Sidebar
 * @created January 29, 2026
 * @updated February 21, 2026 - Session 11: Role-filtered nav items
 * @updated February 21, 2026 - Session 13: Quick Entry added; `to:` → `path:` fix
 * @updated February 27, 2026 - Session 16: Approvals nav item + pending badge
 * @updated March 2, 2026    - Session 17: Consolidated Report + Rejection Analytics nav items
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useRole } from '../../hooks/useRole';
import { useOrganization } from '../../context/OrganizationContext';
import { workEntryService } from '../../services/api/workEntryService';

export function Sidebar({ isCollapsed = false }) {
  const location = useLocation();
  const { can }  = useRole();
  const { currentOrg } = useOrganization();

  // ─────────────────────────────────────────────────────────
  // Session 16: Live pending approval count for badge
  // Refreshes every 30s. Only fetched when user can approve.
  // ─────────────────────────────────────────────────────────
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const canApprove = can('APPROVE_WORK_ENTRY');
    if (!canApprove || !currentOrg?.id) {
      setPendingCount(0);
      return;
    }

    let cancelled = false;

    const fetchCount = async () => {
      try {
        const result = await workEntryService.getPendingApprovals(currentOrg.id, true);
        if (!cancelled && result.success) {
          setPendingCount(result.count || 0);
        }
      } catch {
        // Non-fatal — badge simply won't show if fetch fails
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrg?.id]);
  // Note: `can` is excluded from deps — it's stable (doesn't change after mount).
  // Including it would cause an infinite loop since it's a function reference.

  // ─────────────────────────────────────────────────────────
  // Full nav item definitions
  // ALL items use `path` (not `to`) — render uses item.path.
  // Each item linked to a NAV_* or feature permission.
  // Optional `badge` field: number > 0 shows a count bubble.
  // ─────────────────────────────────────────────────────────
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

    // ── Session 16: Approvals — positioned directly under Work Entries ──
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

    // ── Session 17: Consolidated Report — main contractors only ──────────
    // NAV_SUBCONTRACTORS permission ensures only orgs with linked subcontractors
    // (e.g. MTSB) see this item. FEST ENT managers will NOT see it.
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

    // ── Session 17: Rejection Analytics — managers and above ─────────────
    // Same permission as Approvals (APPROVE_WORK_ENTRY) — only those who
    // can approve/reject entries should see the analytics about rejections.
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

    // ── Subcontractors (Session 15) ────────────────────────────────────────
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

    // ── BJ Staff only (Session 13) ─────────────────────────
    {
      label:      'Quick Entry',
      path:       ROUTES.QUICK_ENTRY,       // ← MUST be `path:`, not `to:`
      permission: 'NAV_QUICK_ENTRY',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  // ─────────────────────────────────────────────────────────
  // Filter by permission — items without a matching role are
  // silently hidden (no error, no flash).
  // ─────────────────────────────────────────────────────────
  const navItems = allNavItems.filter(item => can(item.permission));

  // ─────────────────────────────────────────────────────────
  // Active state — exact match for '/', prefix for everything else
  // ─────────────────────────────────────────────────────────
  const isActive = (path) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(path);

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
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

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
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
              {/* Icon */}
              <span className={`flex-shrink-0 ${active ? 'text-primary-600' : 'text-gray-400'}`}>
                {item.icon}
              </span>

              {/* Label + optional badge (hidden in collapsed mode) */}
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

              {/* Collapsed mode: show dot indicator when badge > 0 */}
              {isCollapsed && item.badge != null && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom spacer */}
      <div className="h-4 flex-shrink-0" />
    </aside>
  );
}

export default Sidebar;
