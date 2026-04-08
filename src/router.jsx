/**
 * WorkLedger - Router Configuration
 *
 * @file src/router.jsx
 * @updated April 8, 2026 - Session 19: RouteGuard re-applied to all routes
 *
 * SECURITY MODEL — every protected route has TWO layers:
 *
 *   Layer 1 — ProtectedRoute (authentication)
 *     Checks: is the user logged in?
 *     If not → redirect to /login
 *
 *   Layer 2 — RouteGuard (authorisation)
 *     Checks: does this user's role have the required permission?
 *     If not → redirect to / (dashboard)
 *
 *   Both are required. ProtectedRoute alone only blocks unauthenticated
 *   users. Without RouteGuard, any logged-in user can type any URL in
 *   the address bar and access any page regardless of their role.
 *
 * PERMISSION MAP (mirrors Sidebar + BottomNav exactly):
 *   NAV_DASHBOARD       → all roles
 *   NAV_WORK_ENTRIES    → all roles
 *   NAV_PROJECTS        → all roles
 *   NAV_CONTRACTS       → all roles
 *   NAV_TEMPLATES       → bina_jaya_staff, org_owner, org_admin, manager
 *   NAV_REPORTS         → bina_jaya_staff, org_owner, org_admin, manager
 *   NAV_LAYOUTS         → bina_jaya_staff, org_owner, org_admin
 *   NAV_USERS           → org_owner, org_admin (+ super_admin via globalRole bypass)
 *   NAV_ORGANIZATIONS   → bina_jaya_staff, org_owner, org_admin
 *   NAV_SUBCONTRACTORS  → bina_jaya_staff, org_owner, org_admin, manager
 *   NAV_QUICK_ENTRY     → super_admin, bina_jaya_staff
 *   APPROVE_WORK_ENTRY  → org_owner, org_admin, manager
 *
 * ROUTE ORDERING RULE (critical):
 *   Literal paths MUST be defined BEFORE dynamic /:param paths.
 *   /work/offline, /work/approvals, /work/new → BEFORE /work/:id
 *   /reports/layouts/new → BEFORE /reports/layouts/:id
 *
 */

import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from './constants/routes';

// Auth guards
import ProtectedRoute from './components/auth/ProtectedRoute';
import RouteGuard     from './components/auth/RouteGuard';

// Public pages
import Login          from './pages/auth/Login';
import Register       from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Core
import Dashboard          from './pages/Dashboard';
import TechnicianDashboard from './pages/technician/TechnicianDashboard';

// Profile
import ProfilePage from './pages/profile/ProfilePage';

// Organizations
import OrganizationList     from './pages/organizations/OrganizationList';
import NewOrganization      from './pages/organizations/NewOrganization';
import OrganizationSettings from './pages/organizations/OrganizationSettings';

// Projects
import ProjectListPage from './pages/projects/ProjectListPage';
import NewProject      from './pages/projects/NewProject';
import EditProject     from './pages/projects/EditProject';
import ProjectDetail   from './pages/projects/ProjectDetail';

// Contracts
import ContractListPage from './pages/contracts/ContractListPage';
import NewContract      from './pages/contracts/NewContract';
import EditContract     from './pages/contracts/EditContract';
import ContractDetail   from './pages/contracts/ContractDetail';

// Work Entries — offline (MUST be before /work/:id)
import OfflineWorkEntryPage from './pages/workEntries/OfflineWorkEntryPage';
import OfflineEditDraft     from './pages/workEntries/OfflineEditDraft';

// Work Entries — online (literal paths BEFORE /work/:id)
import ApprovalsPage     from './pages/workEntries/ApprovalsPage';
import WorkEntryListPage from './pages/workEntries/WorkEntryListPage';
import NewWorkEntry      from './pages/workEntries/NewWorkEntry';
import EditWorkEntry     from './pages/workEntries/EditWorkEntry';
import WorkEntryDetail   from './pages/workEntries/WorkEntryDetail';

// Reports
import GenerateReport     from './pages/reports/GenerateReport';
import ReportHistory      from './pages/reports/ReportHistory';
import ConsolidatedReport from './pages/reports/ConsolidatedReport';
import RejectionAnalytics from './pages/reports/RejectionAnalytics';

// Report Layouts (new BEFORE :id)
import ReportLayoutList   from './pages/reports/layouts/LayoutList';
import ReportLayoutEditor from './pages/reports/layouts/LayoutEditor';

// Templates
import TemplateDemoPage from './pages/demo/TemplateDemoPage';

// Users
import UserList   from './pages/users/UserList';
import InviteUser from './pages/users/InviteUser';

// Subcontractors
import SubcontractorList from './pages/subcontractors/SubcontractorList';

// Admin (BJ Staff)
import QuickEntry from './pages/admin/QuickEntry';

// 404
const NotFoundPage = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
      <p className="text-gray-600">The page you are looking for does not exist.</p>
    </div>
  </div>
);

// ── Shorthand wrappers ────────────────────────────────────────────────────────

// Authenticated only (no role requirement — e.g. profile, dashboard)
const Auth = ({ children }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

// Authenticated + permission check
const Guard = ({ permission, children }) => (
  <ProtectedRoute>
    <RouteGuard permission={permission}>
      {children}
    </RouteGuard>
  </ProtectedRoute>
);

// ── Router ────────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([

  // ── Public ────────────────────────────────────────────────────────────────
  { path: ROUTES.LOGIN,           element: <Login /> },
  { path: ROUTES.REGISTER,        element: <Register /> },
  { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPassword /> },

  // ── Dashboard — all authenticated roles ───────────────────────────────────
  { path: ROUTES.DASHBOARD, element: <Guard permission="NAV_DASHBOARD"><Dashboard /></Guard> },
  { path: '/tech',          element: <Auth><TechnicianDashboard /></Auth> },

  // ── Profile — all authenticated users (no specific permission needed) ──────
  { path: ROUTES.PROFILE, element: <Auth><ProfilePage /></Auth> },

  // ── Offline work entries ──────────────────────────────────────────────────
  // MUST be before /work/:id
  {
    path: '/work/offline',
    element: <Guard permission="NAV_WORK_ENTRIES"><OfflineWorkEntryPage /></Guard>,
  },
  {
    path: '/work/offline/:localId/edit',
    element: <Guard permission="NAV_WORK_ENTRIES"><OfflineEditDraft /></Guard>,
  },

  // ── Approvals — literal path BEFORE /work/:id ─────────────────────────────
  {
    path: ROUTES.WORK_ENTRY_APPROVALS,
    element: <Guard permission="APPROVE_WORK_ENTRY"><ApprovalsPage /></Guard>,
  },
  {
    path: '/work/approvals',
    element: <Guard permission="APPROVE_WORK_ENTRY"><ApprovalsPage /></Guard>,
  },

  // ── Work entries — literal paths BEFORE /work/:id ─────────────────────────
  {
    path: ROUTES.WORK_ENTRIES,
    element: <Guard permission="NAV_WORK_ENTRIES"><WorkEntryListPage /></Guard>,
  },
  {
    path: '/work',
    element: <Guard permission="NAV_WORK_ENTRIES"><WorkEntryListPage /></Guard>,
  },
  {
    path: '/work/new',
    element: <Guard permission="NAV_WORK_ENTRIES"><NewWorkEntry /></Guard>,
  },
  {
    path: '/work/:id',
    element: <Guard permission="NAV_WORK_ENTRIES"><WorkEntryDetail /></Guard>,
  },
  {
    path: '/work/:id/edit',
    element: <Guard permission="NAV_WORK_ENTRIES"><EditWorkEntry /></Guard>,
  },

  // ── Users ─────────────────────────────────────────────────────────────────
  {
    path: ROUTES.USERS,
    element: <Guard permission="NAV_USERS"><UserList /></Guard>,
  },
  {
    path: '/users',
    element: <Guard permission="NAV_USERS"><UserList /></Guard>,
  },
  {
    path: '/users/invite',
    element: <Guard permission="INVITE_USERS"><InviteUser /></Guard>,
  },

  // ── Subcontractors ────────────────────────────────────────────────────────
  {
    path: ROUTES.SUBCONTRACTORS,
    element: <Guard permission="NAV_SUBCONTRACTORS"><SubcontractorList /></Guard>,
  },
  {
    path: '/subcontractors',
    element: <Guard permission="NAV_SUBCONTRACTORS"><SubcontractorList /></Guard>,
  },

  // ── Templates ─────────────────────────────────────────────────────────────
  {
    path: ROUTES.TEMPLATES,
    element: <Guard permission="NAV_TEMPLATES"><TemplateDemoPage /></Guard>,
  },
  {
    path: '/demo/templates',
    element: <Guard permission="NAV_TEMPLATES"><TemplateDemoPage /></Guard>,
  },

  // ── Reports — literal sub-paths BEFORE dynamic paths ─────────────────────
  {
    path: ROUTES.REPORTS,
    element: <Guard permission="NAV_REPORTS"><ReportHistory /></Guard>,
  },
  {
    path: '/reports',
    element: <Guard permission="NAV_REPORTS"><ReportHistory /></Guard>,
  },
  {
    path: '/reports/generate',
    element: <Guard permission="NAV_REPORTS"><GenerateReport /></Guard>,
  },
  {
    path: '/reports/history',
    element: <Guard permission="NAV_REPORTS"><ReportHistory /></Guard>,
  },
  {
    path: ROUTES.REPORT_CONSOLIDATED,
    element: <Guard permission="NAV_SUBCONTRACTORS"><ConsolidatedReport /></Guard>,
  },
  {
    path: '/reports/consolidated',
    element: <Guard permission="NAV_SUBCONTRACTORS"><ConsolidatedReport /></Guard>,
  },
  {
    path: ROUTES.REPORT_REJECTIONS,
    element: <Guard permission="APPROVE_WORK_ENTRY"><RejectionAnalytics /></Guard>,
  },
  {
    path: '/reports/rejections',
    element: <Guard permission="APPROVE_WORK_ENTRY"><RejectionAnalytics /></Guard>,
  },

  // ── Report Layouts — /new BEFORE /:id ─────────────────────────────────────
  {
    path: ROUTES.REPORT_LAYOUTS,
    element: <Guard permission="NAV_LAYOUTS"><ReportLayoutList /></Guard>,
  },
  {
    path: '/reports/layouts',
    element: <Guard permission="NAV_LAYOUTS"><ReportLayoutList /></Guard>,
  },
  {
    path: '/reports/layouts/new',
    element: <Guard permission="NAV_LAYOUTS"><ReportLayoutEditor /></Guard>,
  },
  {
    path: '/reports/layouts/:id',
    element: <Guard permission="NAV_LAYOUTS"><ReportLayoutEditor /></Guard>,
  },

  // ── Quick Entry — BJ Staff / super_admin only ─────────────────────────────
  {
    path: ROUTES.QUICK_ENTRY,
    element: <Guard permission="NAV_QUICK_ENTRY"><QuickEntry /></Guard>,
  },
  {
    path: '/admin/quick-entry',
    element: <Guard permission="NAV_QUICK_ENTRY"><QuickEntry /></Guard>,
  },

  // ── Organizations ─────────────────────────────────────────────────────────
  {
    path: '/organizations',
    element: <Guard permission="NAV_ORGANIZATIONS"><OrganizationList /></Guard>,
  },
  {
    path: '/organizations/new',
    element: <Guard permission="NAV_ORGANIZATIONS"><NewOrganization /></Guard>,
  },
  {
    path: '/organizations/:id/settings',
    element: <Guard permission="NAV_ORGANIZATIONS"><OrganizationSettings /></Guard>,
  },

  // ── Projects ──────────────────────────────────────────────────────────────
  {
    path: '/projects',
    element: <Guard permission="NAV_PROJECTS"><ProjectListPage /></Guard>,
  },
  {
    path: '/projects/new',
    element: <Guard permission="NAV_PROJECTS"><NewProject /></Guard>,
  },
  {
    path: '/projects/:id',
    element: <Guard permission="NAV_PROJECTS"><ProjectDetail /></Guard>,
  },
  {
    path: '/projects/:id/edit',
    element: <Guard permission="NAV_PROJECTS"><EditProject /></Guard>,
  },

  // ── Contracts ─────────────────────────────────────────────────────────────
  {
    path: '/contracts',
    element: <Guard permission="NAV_CONTRACTS"><ContractListPage /></Guard>,
  },
  {
    path: '/contracts/new',
    element: <Guard permission="NAV_CONTRACTS"><NewContract /></Guard>,
  },
  {
    path: '/contracts/:id',
    element: <Guard permission="NAV_CONTRACTS"><ContractDetail /></Guard>,
  },
  {
    path: '/contracts/:id/edit',
    element: <Guard permission="NAV_CONTRACTS"><EditContract /></Guard>,
  },

  // ── 404 ───────────────────────────────────────────────────────────────────
  { path: '*', element: <NotFoundPage /> },

], {
  future: { v7_startTransition: true },
});

export default router;
