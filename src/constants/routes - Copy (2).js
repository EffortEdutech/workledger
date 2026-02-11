/**
 * WorkLedger - Route Constants
 * 
 * Centralized route definitions for the entire application.
 * Used by React Router and navigation components.
 * 
 * @module constants/routes
 * @created January 29, 2026
 * @updated February 6, 2026 - Session 19: Added REPORT_GENERATE, REPORT_HISTORY
 */

/**
 * Public Routes (No authentication required)
 */
export const PUBLIC_ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password'
};

/**
 * Protected Routes (Authentication required)
 */
export const PROTECTED_ROUTES = {
  // Dashboard
  DASHBOARD: '/',
  
  // Organizations
  ORGANIZATIONS: '/organizations',
  ORGANIZATION_NEW: '/organizations/new',
  ORGANIZATION_DETAIL: '/organizations/:id',
  ORGANIZATION_SETTINGS: '/organizations/:id/settings',
  ORGANIZATION_MEMBERS: '/organizations/:id/members',
  
  // Projects
  PROJECTS: '/projects',
  PROJECT_NEW: '/projects/new',
  PROJECT_DETAIL: '/projects/:id',
  PROJECT_EDIT: '/projects/:id/edit',
  
  // Contracts
  CONTRACTS: '/contracts',
  CONTRACT_NEW: '/contracts/new',
  CONTRACT_DETAIL: '/contracts/:id',
  CONTRACT_EDIT: '/contracts/:id/edit',
  
  // Work Entries
  WORK_ENTRIES: '/work',
  WORK_ENTRY_NEW: '/work/new',
  WORK_ENTRY_DETAIL: '/work/:id',
  WORK_ENTRY_EDIT: '/work/:id/edit',
  
  // Templates
  TEMPLATES: '/demo/templates', 
  TEMPLATE_NEW: '/templates/new',
  TEMPLATE_DETAIL: '/templates/:id',
  TEMPLATE_EDIT: '/templates/:id/edit',
  
  // Reports (Session 19 - Updated)
  REPORTS: '/reports',                   // ReportHistory landing page
  REPORT_GENERATE: '/reports/generate',  // GenerateReport page (custom reports)
  REPORT_HISTORY: '/reports',            // Alias — same as REPORTS
  REPORT_MONTHLY: '/reports/monthly',    // Future: dedicated monthly page
  REPORT_SLA: '/reports/sla',
  REPORT_CUSTOM: '/reports/custom',
  
  // User Profile
  PROFILE: '/profile',
  PROFILE_SETTINGS: '/profile/settings',
  
  // Admin
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_TEMPLATES: '/admin/templates',
  ADMIN_SETTINGS: '/admin/settings',
  
  // Offline Sync
  SYNC_STATUS: '/sync',
  
  // Help
  HELP: '/help',
  ABOUT: '/about'
};

/**
 * All Routes (Combined)
 */
export const ROUTES = {
  ...PUBLIC_ROUTES,
  ...PROTECTED_ROUTES
};

/**
 * Route Groups (for navigation menus)
 */
export const ROUTE_GROUPS = {
  MAIN: [
    { path: PROTECTED_ROUTES.DASHBOARD, label: 'Dashboard', icon: '🏠' },
    { path: PROTECTED_ROUTES.WORK_ENTRIES, label: 'Work Entries', icon: '📋' },
    { path: PROTECTED_ROUTES.PROJECTS, label: 'Projects', icon: '🏗️' },
    { path: PROTECTED_ROUTES.CONTRACTS, label: 'Contracts', icon: '📄' },
    { path: PROTECTED_ROUTES.REPORTS, label: 'Reports', icon: '📊' }
  ],
  ADMIN: [
    { path: PROTECTED_ROUTES.ORGANIZATIONS, label: 'Organizations', icon: '🏢' },
    { path: PROTECTED_ROUTES.TEMPLATES, label: 'Templates', icon: '📝' },
    { path: PROTECTED_ROUTES.ADMIN_USERS, label: 'Users', icon: '👥' }
  ],
  USER: [
    { path: PROTECTED_ROUTES.PROFILE, label: 'Profile', icon: '👤' },
    { path: PROTECTED_ROUTES.SYNC_STATUS, label: 'Sync Status', icon: '🔄' },
    { path: PROTECTED_ROUTES.HELP, label: 'Help', icon: '❓' }
  ]
};

/**
 * Generate dynamic route path
 * @param {string} route - Route template (e.g., '/projects/:id')
 * @param {Object} params - Route parameters (e.g., { id: '123' })
 * @returns {string} Resolved route path
 */
export const generatePath = (route, params = {}) => {
  let path = route;
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`:${key}`, value);
  });
  return path;
};

/**
 * Check if route is public (no auth required)
 */
export const isPublicRoute = (path) => {
  return Object.values(PUBLIC_ROUTES).includes(path);
};

/**
 * Check if route requires authentication
 */
export const isProtectedRoute = (path) => {
  return !isPublicRoute(path);
};

/**
 * Get route breadcrumbs
 */
export const getBreadcrumbs = (path) => {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs = [
    { label: 'Dashboard', path: PROTECTED_ROUTES.DASHBOARD }
  ];
  
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    if (/^[a-f0-9-]{36}$/i.test(segment)) return;
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    breadcrumbs.push({ label, path: currentPath });
  });
  
  return breadcrumbs;
};

/**
 * Default redirect after login
 */
export const DEFAULT_AUTHENTICATED_ROUTE = PROTECTED_ROUTES.DASHBOARD;

/**
 * Default redirect after logout
 */
export const DEFAULT_UNAUTHENTICATED_ROUTE = PUBLIC_ROUTES.LOGIN;
