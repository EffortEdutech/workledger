/**
 * WorkLedger - Bottom Navigation Component
 *
 * Mobile bottom navigation bar (max 5 tabs for good UX).
 * Hidden on md+ screens.
 *
 * SESSION 11 UPDATE: Role-filtered tabs.
 * Field workers (technician/worker/subcontractor) only see:
 *   Work Entries + Dashboard
 * Managers and above see:
 *   Work + Projects + Reports + More
 * Admins and owners see:
 *   Work + Projects + Reports + Users + More
 *
 * @module components/layout/BottomNav
 * @created January 29, 2026
 * @updated February 21, 2026 - Session 11: Role-filtered tabs
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useRole } from '../../hooks/useRole';

export function BottomNav() {
  const location = useLocation();
  const { can } = useRole();

  // ─────────────────────────────────────────────────────────
  // All possible bottom nav tabs (priority-ordered)
  // We render max 5 — filter by permission then slice
  // ─────────────────────────────────────────────────────────
  const allTabs = [
    {
      label:      'Work',
      path:       ROUTES.WORK_ENTRIES,
      permission: 'NAV_WORK_ENTRIES',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      label:      'Reports',
      path:       ROUTES.REPORTS,
      permission: 'NAV_REPORTS',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label:      'Users',
      path:       '/users',
      permission: 'NAV_USERS',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      label:      'More',
      path:       ROUTES.DASHBOARD,
      permission: 'NAV_DASHBOARD',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
  ];

  // Filter by permission, keep max 5
  const tabs = allTabs.filter(tab => can(tab.permission)).slice(0, 5);

  const isActive = (path) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`
                flex flex-col items-center justify-center
                flex-1 h-full gap-1
                transition-colors duration-200
                ${active
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              {tab.icon}
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
