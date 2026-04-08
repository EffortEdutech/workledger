/**
 * WorkLedger - Router Configuration
 *
 * @file src/router.jsx
 * @updated April 8, 2026 - Session 19: added all missing routes
 *
 * ROUTE ORDERING RULE (critical):
 *   Literal paths MUST be defined BEFORE dynamic /:param paths.
 *   e.g. /work/offline before /work/:id — or React Router matches 'offline' as an ID.
 *   e.g. /work/approvals before /work/:id — same reason.
 *
 * MISSING ROUTES ADDED (Session 19):
 *   Previously the sidebar showed these links but the router had no matching
 *   routes → React Router fell through to * → 404 every time.
 *
 *   Added:
 *     /users                    → UserList
 *     /users/invite             → InviteUser
 *     /work/approvals           → ApprovalsPage  (literal — MUST be before /work/:id)
 *     /subcontractors           → SubcontractorList
 *     /reports/consolidated     → ConsolidatedReport
 *     /reports/rejections       → RejectionAnalytics
 *     /reports/layouts          → ReportLayoutList
 *     /reports/layouts/:id      → ReportLayoutEditor
 *     /reports/layouts/new      → ReportLayoutEditor (new)
 *     /admin/quick-entry        → QuickEntry
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

// Approvals — MUST be imported and registered BEFORE /work/:id
import ApprovalsPage from './pages/workEntries/ApprovalsPage';

// Reports
import GenerateReport      from './pages/reports/GenerateReport';
import ReportHistory       from './pages/reports/ReportHistory';
import ConsolidatedReport  from './pages/reports/ConsolidatedReport';
import RejectionAnalytics  from './pages/reports/RejectionAnalytics';

// Report Layouts — actual path: src/pages/reports/layouts/
import ReportLayoutList   from './pages/reports/layouts/LayoutList';
import ReportLayoutEditor from './pages/reports/layouts/LayoutEditor';

// Templates
import TemplateDemoPage from './pages/demo/TemplateDemoPage';

// Users
import UserList   from './pages/users/UserList';
import InviteUser from './pages/users/InviteUser';

// Subcontractors
import SubcontractorList from './pages/subcontractors/SubcontractorList';

// Quick Entry (BJ Staff)
import QuickEntry from './pages/admin/QuickEntry';

// ── Fallback placeholder for pages not yet built ───────────────────────────
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
  { path: ROUTES.LOGIN,           element: <Login /> },
  { path: ROUTES.REGISTER,        element: <Register /> },
  { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPassword /> },

  // ── Dashboard ────────────────────────────────────────────────────────────
  { path: ROUTES.DASHBOARD, element: <P><Dashboard /></P> },

  // ── Technician dashboard ─────────────────────────────────────────────────
  { path: '/tech', element: <P><TechnicianDashboard /></P> },

  // ── Offline work entries ─────────────────────────────────────────────────
  // MUST be before /work/:id — 'offline' would match as an ID otherwise.
  { path: '/work/offline',               element: <P><OfflineWorkEntryPage /></P> },
  { path: '/work/offline/:localId/edit', element: <P><OfflineEditDraft /></P> },

  // ── Approvals ─────────────────────────────────────────────────────────────
  // Literal path — MUST be before /work/:id
  { path: ROUTES.WORK_ENTRY_APPROVALS,  element: <P><ApprovalsPage /></P> },
  { path: '/work/approvals',            element: <P><ApprovalsPage /></P> },

  // ── Work entries (online) ──────────────────────────────────────────────────
  { path: ROUTES.WORK_ENTRIES, element: <P><WorkEntryListPage /></P> },
  { path: '/work',             element: <P><WorkEntryListPage /></P> },
  { path: '/work/new',         element: <P><NewWorkEntry /></P> },
  { path: '/work/:id',         element: <P><WorkEntryDetail /></P> },
  { path: '/work/:id/edit',    element: <P><EditWorkEntry /></P> },

  // ── Users ─────────────────────────────────────────────────────────────────
  { path: ROUTES.USERS,   element: <P><UserList /></P> },
  { path: '/users',       element: <P><UserList /></P> },
  { path: '/users/invite', element: <P><InviteUser /></P> },

  // ── Subcontractors ────────────────────────────────────────────────────────
  { path: ROUTES.SUBCONTRACTORS, element: <P><SubcontractorList /></P> },
  { path: '/subcontractors',     element: <P><SubcontractorList /></P> },

  // ── Templates ─────────────────────────────────────────────────────────────
  { path: ROUTES.TEMPLATES,  element: <P><TemplateDemoPage /></P> },
  { path: '/demo/templates', element: <P><TemplateDemoPage /></P> },

  // ── Reports ───────────────────────────────────────────────────────────────
  // Literal sub-paths BEFORE dynamic paths
  { path: ROUTES.REPORTS,              element: <P><ReportHistory /></P> },
  { path: '/reports',                  element: <P><ReportHistory /></P> },
  { path: '/reports/generate',         element: <P><GenerateReport /></P> },
  { path: '/reports/history',          element: <P><ReportHistory /></P> },
  { path: ROUTES.REPORT_CONSOLIDATED,  element: <P><ConsolidatedReport /></P> },
  { path: '/reports/consolidated',     element: <P><ConsolidatedReport /></P> },
  { path: ROUTES.REPORT_REJECTIONS,    element: <P><RejectionAnalytics /></P> },
  { path: '/reports/rejections',       element: <P><RejectionAnalytics /></P> },

  // ── Report Layouts ────────────────────────────────────────────────────────
  // /reports/layouts/new BEFORE /reports/layouts/:id — otherwise 'new' matches as :id
  { path: ROUTES.REPORT_LAYOUTS,       element: <P><ReportLayoutList /></P> },
  { path: '/reports/layouts',          element: <P><ReportLayoutList /></P> },
  { path: '/reports/layouts/new',      element: <P><ReportLayoutEditor /></P> },
  { path: '/reports/layouts/:id',      element: <P><ReportLayoutEditor /></P> },

  // ── Quick Entry (BJ Staff only) ───────────────────────────────────────────
  { path: ROUTES.QUICK_ENTRY,   element: <P><QuickEntry /></P> },
  { path: '/admin/quick-entry', element: <P><QuickEntry /></P> },

  // ── Profile ───────────────────────────────────────────────────────────────
  { path: ROUTES.PROFILE, element: <P><ProfilePage /></P> },

  // ── Organizations ──────────────────────────────────────────────────────────
  { path: '/organizations',              element: <P><OrganizationList /></P> },
  { path: '/organizations/new',          element: <P><NewOrganization /></P> },
  { path: '/organizations/:id/settings', element: <P><OrganizationSettings /></P> },

  // ── Projects ──────────────────────────────────────────────────────────────
  { path: '/projects',          element: <P><ProjectListPage /></P> },
  { path: '/projects/new',      element: <P><NewProject /></P> },
  { path: '/projects/:id',      element: <P><ProjectDetail /></P> },
  { path: '/projects/:id/edit', element: <P><EditProject /></P> },

  // ── Contracts ─────────────────────────────────────────────────────────────
  { path: '/contracts',          element: <P><ContractListPage /></P> },
  { path: '/contracts/new',      element: <P><NewContract /></P> },
  { path: '/contracts/:id',      element: <P><ContractDetail /></P> },
  { path: '/contracts/:id/edit', element: <P><EditContract /></P> },

  // ── 404 ───────────────────────────────────────────────────────────────────
  { path: '*', element: <NotFoundPage /> },

], {
  future: { v7_startTransition: true },
});

export default router;
