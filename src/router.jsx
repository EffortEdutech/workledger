/**
 * WorkLedger - Router Configuration
 *
 * @file src/router.jsx
 * @updated April 5, 2026 - Session 19: /work/offline + /work/offline/:localId/edit
 *
 * ROUTE ORDERING RULE (critical):
 *   Literal paths MUST be defined BEFORE dynamic /:param paths.
 *   e.g. /work/offline before /work/:id — or React Router matches 'offline' as an ID.
 */

import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from './constants/routes';

// Auth
import ProtectedRoute    from './components/auth/ProtectedRoute';
import Login             from './pages/auth/Login';
import Register          from './pages/auth/Register';
import ForgotPassword    from './pages/auth/ForgotPassword';

// Core
import Dashboard         from './pages/Dashboard';

// Technician
import TechnicianDashboard from './pages/technician/TechnicianDashboard';

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

// Work Entries (online)
import WorkEntryListPage from './pages/workEntries/WorkEntryListPage';
import NewWorkEntry      from './pages/workEntries/NewWorkEntry';
import EditWorkEntry     from './pages/workEntries/EditWorkEntry';
import WorkEntryDetail   from './pages/workEntries/WorkEntryDetail';

// Work Entries (offline — Session 19)
import OfflineWorkEntryPage from './pages/workEntries/OfflineWorkEntryPage';
import OfflineEditDraft     from './pages/workEntries/OfflineEditDraft';

// Reports
import GenerateReport from './pages/reports/GenerateReport';
import ReportHistory  from './pages/reports/ReportHistory';

// Templates
import TemplateDemoPage from './pages/demo/TemplateDemoPage';

// Placeholders
const PlaceholderPage = ({ title }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600">This page will be implemented in the next sessions.</p>
    </div>
  </div>
);
const ProfilePage  = () => <PlaceholderPage title="Profile" />;
const NotFoundPage = () => <PlaceholderPage title="404 - Page Not Found" />;

const P = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>;

export const router = createBrowserRouter([

  // ── Public ──────────────────────────────────────────────────────────────
  { path: ROUTES.LOGIN,          element: <Login /> },
  { path: ROUTES.REGISTER,       element: <Register /> },
  { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPassword /> },

  // ── Dashboard ────────────────────────────────────────────────────────────
  { path: ROUTES.DASHBOARD, element: <P><Dashboard /></P> },

  // ── Technician dashboard ─────────────────────────────────────────────────
  { path: '/tech',              element: <P><TechnicianDashboard /></P> },

  // ── Offline work entries — SESSION 19 ────────────────────────────────────
  // These MUST be before /work/:id to prevent 'offline' being matched as an ID.
  { path: '/work/offline',                    element: <P><OfflineWorkEntryPage /></P> },
  { path: '/work/offline/:localId/edit',      element: <P><OfflineEditDraft /></P> },

  // ── Work entries (online) ─────────────────────────────────────────────────
  // Literal paths (/work/new, /work/approvals) BEFORE dynamic /work/:id
  { path: ROUTES.WORK_ENTRIES, element: <P><WorkEntryListPage /></P> },
  { path: '/work',             element: <P><WorkEntryListPage /></P> },
  { path: '/work/new',         element: <P><NewWorkEntry /></P> },
  { path: '/work/:id',         element: <P><WorkEntryDetail /></P> },
  { path: '/work/:id/edit',    element: <P><EditWorkEntry /></P> },

  // ── Templates ─────────────────────────────────────────────────────────────
  { path: ROUTES.TEMPLATES,    element: <P><TemplateDemoPage /></P> },
  { path: '/demo/templates',   element: <P><TemplateDemoPage /></P> },

  // ── Reports ───────────────────────────────────────────────────────────────
  { path: ROUTES.REPORTS,      element: <P><ReportHistory /></P> },
  { path: '/reports/generate', element: <P><GenerateReport /></P> },
  { path: '/reports/history',  element: <P><ReportHistory /></P> },

  // ── Profile ───────────────────────────────────────────────────────────────
  { path: ROUTES.PROFILE,      element: <P><ProfilePage /></P> },

  // ── Organizations ──────────────────────────────────────────────────────────
  { path: '/organizations',                element: <P><OrganizationList /></P> },
  { path: '/organizations/new',            element: <P><NewOrganization /></P> },
  { path: '/organizations/:id/settings',   element: <P><OrganizationSettings /></P> },

  // ── Projects ──────────────────────────────────────────────────────────────
  { path: '/projects',         element: <P><ProjectListPage /></P> },
  { path: '/projects/new',     element: <P><NewProject /></P> },
  { path: '/projects/:id',     element: <P><ProjectDetail /></P> },
  { path: '/projects/:id/edit', element: <P><EditProject /></P> },

  // ── Contracts ─────────────────────────────────────────────────────────────
  { path: '/contracts',         element: <P><ContractListPage /></P> },
  { path: '/contracts/new',     element: <P><NewContract /></P> },
  { path: '/contracts/:id',     element: <P><ContractDetail /></P> },
  { path: '/contracts/:id/edit', element: <P><EditContract /></P> },

  // ── 404 ───────────────────────────────────────────────────────────────────
  { path: '*', element: <NotFoundPage /> },

], {
  future: { v7_startTransition: true },
});

export default router;
