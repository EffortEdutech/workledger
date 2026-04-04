/**
 * WorkLedger - Router Configuration
 *
 * Defines all application routes using React Router v6.
 * Implements protected routes with authentication checking.
 *
 * @file src/router.jsx
 * @created January 29, 2026
 * @updated February 1, 2026   - Session 13: Added work entry routes
 * @updated April 4, 2026      - Session 19: Added /tech (technician dashboard)
 */

import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from './constants/routes';

// Auth Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Main Pages
import Dashboard from './pages/Dashboard';

// Organization Pages
import OrganizationList from './pages/organizations/OrganizationList';
import NewOrganization from './pages/organizations/NewOrganization';
import OrganizationSettings from './pages/organizations/OrganizationSettings';

// Project Pages (Session 9)
import ProjectListPage from './pages/projects/ProjectListPage';
import NewProject from './pages/projects/NewProject';
import EditProject from './pages/projects/EditProject';
import ProjectDetail from './pages/projects/ProjectDetail';

// Contract Pages (Session 10)
import ContractListPage from './pages/contracts/ContractListPage';
import NewContract from './pages/contracts/NewContract';
import EditContract from './pages/contracts/EditContract';
import ContractDetail from './pages/contracts/ContractDetail';

// Work Entry Pages (Session 13)
import WorkEntryListPage from './pages/workEntries/WorkEntryListPage';
import NewWorkEntry from './pages/workEntries/NewWorkEntry';
import EditWorkEntry from './pages/workEntries/EditWorkEntry';
import WorkEntryDetail from './pages/workEntries/WorkEntryDetail';

// Report Pages
import GenerateReport from './pages/reports/GenerateReport';
import ReportHistory from './pages/reports/ReportHistory';

// Template Demo Page (Session 12)
import TemplateDemoPage from './pages/demo/TemplateDemoPage';

// Technician Dashboard (Session 19) — mobile-first offline home
import TechnicianDashboard from './pages/technician/TechnicianDashboard';

// Placeholder Components (will be replaced in future sessions)
const PlaceholderPage = ({ title }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600">This page will be implemented in the next sessions.</p>
    </div>
  </div>
);

const TemplatesPage = () => <PlaceholderPage title="Templates" />;
const ReportsPage   = () => <PlaceholderPage title="Reports" />;
const ProfilePage   = () => <PlaceholderPage title="Profile" />;
const NotFoundPage  = () => <PlaceholderPage title="404 - Page Not Found" />;

/**
 * Router Configuration
 *
 * ROUTE ORDERING RULE (critical):
 *   Literal paths MUST come before dynamic /:id paths.
 *   e.g. /work/new before /work/:id — or React Router matches 'new' as an ID.
 */
export const router = createBrowserRouter([

  // ── Public Routes (no auth required) ────────────────────────────────────
  { path: ROUTES.LOGIN,          element: <Login /> },
  { path: ROUTES.REGISTER,       element: <Register /> },
  { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPassword /> },

  // ── Dashboard ────────────────────────────────────────────────────────────
  {
    path: ROUTES.DASHBOARD,
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
  },

  // ── Technician Dashboard (Session 19) — /tech ────────────────────────────
  // Mobile-first home for technician / worker roles.
  // Linked from BottomNav when role === 'technician' | 'worker'.
  {
    path: '/tech',
    element: <ProtectedRoute><TechnicianDashboard /></ProtectedRoute>,
  },

  // ── Work Entry Routes ─────────────────────────────────────────────────────
  // ORDERING: /work/new and /work/approvals must be ABOVE /work/:id
  {
    path: ROUTES.WORK_ENTRIES, // /work-entries or equivalent ROUTES constant
    element: <ProtectedRoute><WorkEntryListPage /></ProtectedRoute>,
  },
  {
    path: '/work',
    element: <ProtectedRoute><WorkEntryListPage /></ProtectedRoute>,
  },
  {
    path: '/work/new',
    element: <ProtectedRoute><NewWorkEntry /></ProtectedRoute>,
  },
  // Dynamic route AFTER literals — critical ordering
  {
    path: '/work/:id',
    element: <ProtectedRoute><WorkEntryDetail /></ProtectedRoute>,
  },
  {
    path: '/work/:id/edit',
    element: <ProtectedRoute><EditWorkEntry /></ProtectedRoute>,
  },

  // ── Template Routes ───────────────────────────────────────────────────────
  {
    path: ROUTES.TEMPLATES,
    element: <ProtectedRoute><TemplateDemoPage /></ProtectedRoute>,
  },
  {
    path: '/demo/templates',
    element: <ProtectedRoute><TemplateDemoPage /></ProtectedRoute>,
  },

  // ── Report Routes ─────────────────────────────────────────────────────────
  {
    path: ROUTES.REPORTS,
    element: <ProtectedRoute><ReportHistory /></ProtectedRoute>,
  },
  {
    path: '/reports/generate',
    element: <ProtectedRoute><GenerateReport /></ProtectedRoute>,
  },
  {
    path: '/reports/history',
    element: <ProtectedRoute><ReportHistory /></ProtectedRoute>,
  },

  // ── Profile ───────────────────────────────────────────────────────────────
  {
    path: ROUTES.PROFILE,
    element: <ProtectedRoute><ProfilePage /></ProtectedRoute>,
  },

  // ── Organization Routes ───────────────────────────────────────────────────
  {
    path: '/organizations',
    element: <ProtectedRoute><OrganizationList /></ProtectedRoute>,
  },
  {
    path: '/organizations/new',
    element: <ProtectedRoute><NewOrganization /></ProtectedRoute>,
  },
  {
    path: '/organizations/:id/settings',
    element: <ProtectedRoute><OrganizationSettings /></ProtectedRoute>,
  },

  // ── Project Routes ────────────────────────────────────────────────────────
  {
    path: '/projects',
    element: <ProtectedRoute><ProjectListPage /></ProtectedRoute>,
  },
  {
    path: '/projects/new',
    element: <ProtectedRoute><NewProject /></ProtectedRoute>,
  },
  {
    path: '/projects/:id',
    element: <ProtectedRoute><ProjectDetail /></ProtectedRoute>,
  },
  {
    path: '/projects/:id/edit',
    element: <ProtectedRoute><EditProject /></ProtectedRoute>,
  },

  // ── Contract Routes ───────────────────────────────────────────────────────
  {
    path: '/contracts',
    element: <ProtectedRoute><ContractListPage /></ProtectedRoute>,
  },
  {
    path: '/contracts/new',
    element: <ProtectedRoute><NewContract /></ProtectedRoute>,
  },
  {
    path: '/contracts/:id',
    element: <ProtectedRoute><ContractDetail /></ProtectedRoute>,
  },
  {
    path: '/contracts/:id/edit',
    element: <ProtectedRoute><EditContract /></ProtectedRoute>,
  },

  // ── 404 ──────────────────────────────────────────────────────────────────
  { path: '*', element: <NotFoundPage /> },

], {
  future: {
    v7_startTransition: true,
  },
});

export default router;
