/**
 * WorkLedger - Router Configuration
 *
 * Every protected route is wrapped with:
 *   1. ProtectedRoute  — ensures user is authenticated (redirects to /login)
 *   2. RouteGuard      — ensures user has the NAV_ permission (redirects to /)
 *
 * Permission map (matches Sidebar + BottomNav exactly):
 *   NAV_DASHBOARD       → all roles
 *   NAV_WORK_ENTRIES    → all roles
 *   NAV_PROJECTS        → all roles
 *   NAV_CONTRACTS       → all roles
 *   NAV_TEMPLATES       → bina_jaya_staff, org_owner, org_admin, manager
 *   NAV_REPORTS         → bina_jaya_staff, org_owner, org_admin, manager
 *   NAV_LAYOUTS         → bina_jaya_staff, org_owner, org_admin
 *   NAV_USERS           → org_owner, org_admin
 *   NAV_ORGANIZATIONS   → bina_jaya_staff, org_owner, org_admin
 *   NAV_SUBCONTRACTORS  → bina_jaya_staff, org_owner, org_admin, manager
 *   NAV_QUICK_ENTRY     → super_admin, bina_jaya_staff
 *
 * @file src/Router.jsx
 * @updated February 23, 2026 - Session 12: RouteGuard applied to all routes
 * @updated February 24, 2026 - Session 15: SubcontractorList route added
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ROUTES } from './constants/routes';

// Auth
import ProtectedRoute from './components/auth/ProtectedRoute';
import RouteGuard from './components/auth/RouteGuard';

// Pages - Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Pages - Core
import Dashboard from './pages/Dashboard';

// Pages - Organizations
import OrganizationList from './pages/organizations/OrganizationList';
import NewOrganization from './pages/organizations/NewOrganization';
import OrganizationSettings from './pages/organizations/OrganizationSettings';

// Pages - Projects
import ProjectListPage from './pages/projects/ProjectListPage';
import NewProject from './pages/projects/NewProject';
import EditProject from './pages/projects/EditProject';
import ProjectDetail from './pages/projects/ProjectDetail';

// Pages - Contracts
import ContractListPage from './pages/contracts/ContractListPage';
import NewContract from './pages/contracts/NewContract';
import EditContract from './pages/contracts/EditContract';
import ContractDetail from './pages/contracts/ContractDetail';

// Pages - Templates
import TemplateListPage from './pages/templates/TemplateListPage';
import TemplateBuilder from './pages/templates/TemplateBuilder';
import TemplateDetail from './pages/templates/TemplateDetail';

// Pages - Work Entries
import WorkEntryListPage from './pages/workEntries/WorkEntryListPage';
import NewWorkEntry from './pages/workEntries/NewWorkEntry';
import EditWorkEntry from './pages/workEntries/EditWorkEntry';
import WorkEntryDetail from './pages/workEntries/WorkEntryDetail';

// Pages - Reports
import ReportHistory from './pages/reports/ReportHistory';
import GenerateReport from './pages/reports/GenerateReport';

// Pages - Layouts
import LayoutList from './pages/reports/layouts/LayoutList';
import LayoutEditor from './pages/reports/layouts/LayoutEditor';

// Pages - Users
import UserList from './pages/users/UserList';
import InviteUser from './pages/users/InviteUser';

// Pages - Subcontractors (Session 15)
import SubcontractorList from './pages/subcontractors/SubcontractorList';

// Pages - Admin (BJ Staff only)
import QuickEntry from './pages/admin/QuickEntry';

// Fallbacks
const NotFoundPage = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-gray-600 mb-6">Page not found.</p>
      <a href="/" className="text-primary-600 hover:underline">Back to Dashboard</a>
    </div>
  </div>
);
const ProfilePage = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <p className="text-gray-500">Profile — coming soon.</p>
  </div>
);

// ─────────────────────────────────────────────────────────
// Helper: wrap a page component in ProtectedRoute + RouteGuard
// Usage: guarded('NAV_TEMPLATES', TemplateListPage)
// ─────────────────────────────────────────────────────────
const guarded = (permission, Page) => (
  <ProtectedRoute>
    <RouteGuard permission={permission}>
      <Page />
    </RouteGuard>
  </ProtectedRoute>
);

// auth-only, no extra permission (profile page etc.)
const authed = (Page) => (
  <ProtectedRoute>
    <Page />
  </ProtectedRoute>
);

// ─────────────────────────────────────────────────────────
export const router = createBrowserRouter([

  // ══════════════════════════════════════════════════════
  // PUBLIC ROUTES
  // ══════════════════════════════════════════════════════
  { path: ROUTES.LOGIN,           element: <Login /> },
  { path: ROUTES.REGISTER,        element: <Register /> },
  { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPassword /> },

  // ══════════════════════════════════════════════════════
  // DASHBOARD — all roles  (ROUTES.DASHBOARD = '/')
  // ══════════════════════════════════════════════════════
  {
    path: ROUTES.DASHBOARD,
    element: guarded('NAV_DASHBOARD', Dashboard),
  },

  // ══════════════════════════════════════════════════════
  // ORGANIZATIONS — bina_jaya_staff, org_owner, org_admin
  // ══════════════════════════════════════════════════════
  {
    path: '/organizations',
    element: guarded('NAV_ORGANIZATIONS', OrganizationList),
  },
  {
    path: '/organizations/new',
    element: guarded('NAV_ORGANIZATIONS', NewOrganization),
  },
  {
    path: '/organizations/:id/settings',
    element: guarded('NAV_ORGANIZATIONS', OrganizationSettings),
  },

  // ══════════════════════════════════════════════════════
  // PROJECTS — all roles
  // ══════════════════════════════════════════════════════
  {
    path: '/projects',
    element: guarded('NAV_PROJECTS', ProjectListPage),
  },
  {
    path: '/projects/new',
    element: guarded('NAV_PROJECTS', NewProject),
  },
  {
    path: '/projects/:id',
    element: guarded('NAV_PROJECTS', ProjectDetail),
  },
  {
    path: '/projects/:id/edit',
    element: guarded('NAV_PROJECTS', EditProject),
  },

  // ══════════════════════════════════════════════════════
  // CONTRACTS — all roles
  // ══════════════════════════════════════════════════════
  {
    path: '/contracts',
    element: guarded('NAV_CONTRACTS', ContractListPage),
  },
  {
    path: '/contracts/new',
    element: guarded('NAV_CONTRACTS', NewContract),
  },
  {
    path: '/contracts/:id',
    element: guarded('NAV_CONTRACTS', ContractDetail),
  },
  {
    path: '/contracts/:id/edit',
    element: guarded('NAV_CONTRACTS', EditContract),
  },

  // ══════════════════════════════════════════════════════
  // TEMPLATES — bina_jaya_staff, org_owner, org_admin, manager
  // ══════════════════════════════════════════════════════
  {
    path: '/templates',
    element: guarded('NAV_TEMPLATES', TemplateListPage),
  },
  {
    path: '/templates/new',
    element: guarded('NAV_TEMPLATES', TemplateBuilder),
  },
  {
    path: '/templates/:id',
    element: guarded('NAV_TEMPLATES', TemplateDetail),
  },
  {
    path: '/templates/:id/edit',
    element: guarded('NAV_TEMPLATES', TemplateBuilder),
  },
  // Backward compatibility
  { path: '/demo/templates', element: <Navigate to="/templates" replace /> },

  // ══════════════════════════════════════════════════════
  // WORK ENTRIES — all roles
  // ══════════════════════════════════════════════════════
  {
    path: '/work',
    element: guarded('NAV_WORK_ENTRIES', WorkEntryListPage),
  },
  {
    path: '/work/new',
    element: guarded('NAV_WORK_ENTRIES', NewWorkEntry),
  },
  {
    path: '/work/:id',
    element: guarded('NAV_WORK_ENTRIES', WorkEntryDetail),
  },
  {
    path: '/work/:id/edit',
    element: guarded('NAV_WORK_ENTRIES', EditWorkEntry),
  },

  // ══════════════════════════════════════════════════════
  // REPORTS — bina_jaya_staff, org_owner, org_admin, manager
  // ══════════════════════════════════════════════════════
  {
    path: ROUTES.REPORTS,
    element: guarded('NAV_REPORTS', ReportHistory),
  },
  {
    path: ROUTES.REPORT_GENERATE,
    element: guarded('NAV_REPORTS', GenerateReport),
  },

  // ══════════════════════════════════════════════════════
  // LAYOUTS — bina_jaya_staff, org_owner, org_admin
  // ══════════════════════════════════════════════════════
  {
    path: '/reports/layouts',
    element: guarded('NAV_LAYOUTS', LayoutList),
  },
  {
    path: '/reports/layouts/new',
    element: guarded('NAV_LAYOUTS', LayoutEditor),
  },
  {
    path: '/reports/layouts/:id/edit',
    element: guarded('NAV_LAYOUTS', LayoutEditor),
  },
  // ROUTES constants (may differ from hardcoded paths above — keep both)
  ...(ROUTES.REPORT_LAYOUTS && ROUTES.REPORT_LAYOUTS !== '/reports/layouts'
    ? [{ path: ROUTES.REPORT_LAYOUTS,      element: guarded('NAV_LAYOUTS', LayoutList) }]
    : []),
  ...(ROUTES.REPORT_LAYOUT_NEW && ROUTES.REPORT_LAYOUT_NEW !== '/reports/layouts/new'
    ? [{ path: ROUTES.REPORT_LAYOUT_NEW,   element: guarded('NAV_LAYOUTS', LayoutEditor) }]
    : []),
  ...(ROUTES.REPORT_LAYOUT_DETAIL
    ? [{ path: ROUTES.REPORT_LAYOUT_DETAIL, element: guarded('NAV_LAYOUTS', LayoutEditor) }]
    : []),

  // ══════════════════════════════════════════════════════
  // USERS — org_owner, org_admin only
  // ══════════════════════════════════════════════════════
  {
    path: '/users',
    element: guarded('NAV_USERS', UserList),
  },
  {
    path: '/users/invite',
    element: guarded('INVITE_USERS', InviteUser),
  },

  // ══════════════════════════════════════════════════════
  // SUBCONTRACTORS — bina_jaya_staff, org_owner, org_admin, manager
  // technician/worker/subcontractor → redirect /
  // Session 15
  // ══════════════════════════════════════════════════════
  {
    path: '/subcontractors',
    element: guarded('NAV_SUBCONTRACTORS', SubcontractorList),
  },

  // ══════════════════════════════════════════════════════
  // QUICK ENTRY — super_admin, bina_jaya_staff only
  // ══════════════════════════════════════════════════════
  {
    path: '/admin/quick-entry',
    element: guarded('NAV_QUICK_ENTRY', QuickEntry),
  },

  // ══════════════════════════════════════════════════════
  // PROFILE — any authenticated user (no nav permission)
  // ══════════════════════════════════════════════════════
  {
    path: ROUTES.PROFILE,
    element: authed(ProfilePage),
  },

  // ══════════════════════════════════════════════════════
  // 404
  // ══════════════════════════════════════════════════════
  {
    path: '*',
    element: <NotFoundPage />,
  },

], {
  future: {
    v7_startTransition: true,
  },
});

export default router;
