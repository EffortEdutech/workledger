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
 * Role visibility summary:
 *   super_admin / bina_jaya_staff  → all items (incl. Quick Entry)
 *   org_owner / org_admin          → all standard items (no Quick Entry)
 *   manager                        → work, projects, contracts, reports, templates
 *   technician / worker            → dashboard, work entries, projects, contracts
 *   subcontractor                  → dashboard, work entries, projects, contracts
 *
 * @module components/layout/Sidebar
 * @created January 29, 2026
 * @updated February 21, 2026 - Session 11: Role-filtered nav items
 * @updated February 21, 2026 - Session 13: Quick Entry added; `to:` → `path:` fix
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useRole } from '../../hooks/useRole';

export function Sidebar({ isCollapsed = false }) {
  const location = useLocation();
  const { can }  = useRole();

  // ─────────────────────────────────────────────────────────
  // Full nav item definitions
  // ALL items use `path` (not `to`) — render uses item.path.
  // Each item linked to a NAV_* permission from permissions.js.
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
              <span className={`flex-shrink-0 ${active ? 'text-primary-600' : 'text-gray-400'}`}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <span className="ml-3 truncate">{item.label}</span>
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
