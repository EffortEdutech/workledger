/**
 * WorkLedger - Router Configuration
 *
 * Defines all application routes using React Router v6.
 * Implements protected routes with authentication checking.
 *
 * @file src/router.jsx
 * @created January 29, 2026
 * @updated February 6, 2026  - Session 19: Report routes reorganized
 * @updated February 7, 2026  - Session 20: Template management routes (replaced demo)
 * @updated February 12, 2026 - Session 6:  Layout management routes added
 * @updated February 21, 2026 - Session 12: User management routes added
 * @updated February 21, 2026 - Session 13: QuickEntry route added (/admin/quick-entry)
 *                                           Removed duplicate hardcoded layout routes
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
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

// Template Pages (Session 20 - Production)
import TemplateListPage from './pages/templates/TemplateListPage';
import TemplateBuilder from './pages/templates/TemplateBuilder';
import TemplateDetail from './pages/templates/TemplateDetail';

// Work Entry Pages
import WorkEntryListPage from './pages/workEntries/WorkEntryListPage';
import NewWorkEntry from './pages/workEntries/NewWorkEntry';
import EditWorkEntry from './pages/workEntries/EditWorkEntry';
import WorkEntryDetail from './pages/workEntries/WorkEntryDetail';

// Report Pages (Session 18 + 19)
import ReportHistory from './pages/reports/ReportHistory';
import GenerateReport from './pages/reports/GenerateReport';

// Layout Management Pages (Session 6)
import LayoutList from './pages/reports/layouts/LayoutList';
import LayoutEditor from './pages/reports/layouts/LayoutEditor';

// User Management Pages (Session 12)
import UserList from './pages/users/UserList';
import InviteUser from './pages/users/InviteUser';

// Admin Pages (Session 13)
import QuickEntry from './pages/admin/QuickEntry';

// Placeholder Components
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

/**
 * Router Configuration
 */
export const router = createBrowserRouter([

  // ============================================================
  // PUBLIC ROUTES (No Authentication Required)
  // ============================================================
  {
    path: ROUTES.LOGIN,
    element: <Login />,
  },
  {
    path: ROUTES.REGISTER,
    element: <Register />,
  },
  {
    path: ROUTES.FORGOT_PASSWORD,
    element: <ForgotPassword />,
  },

  // ============================================================
  // DASHBOARD
  // ============================================================
  {
    path: ROUTES.DASHBOARD,
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },

  // ============================================================
  // ORGANIZATION ROUTES
  // ============================================================
  {
    path: '/organizations',
    element: (
      <ProtectedRoute>
        <OrganizationList />
      </ProtectedRoute>
    ),
  },
  {
    path: '/organizations/new',
    element: (
      <ProtectedRoute>
        <NewOrganization />
      </ProtectedRoute>
    ),
  },
  {
    path: '/organizations/:id/settings',
    element: (
      <ProtectedRoute>
        <OrganizationSettings />
      </ProtectedRoute>
    ),
  },

  // ============================================================
  // PROJECT ROUTES (Session 9)
  // ============================================================
  {
    path: '/projects',
    element: (
      <ProtectedRoute>
        <ProjectListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/projects/new',
    element: (
      <ProtectedRoute>
        <NewProject />
      </ProtectedRoute>
    ),
  },
  {
    path: '/projects/:id',
    element: (
      <ProtectedRoute>
        <ProjectDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: '/projects/:id/edit',
    element: (
      <ProtectedRoute>
        <EditProject />
      </ProtectedRoute>
    ),
  },

  // ============================================================
  // CONTRACT ROUTES (Session 10)
  // ============================================================
  {
    path: '/contracts',
    element: (
      <ProtectedRoute>
        <ContractListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/contracts/new',
    element: (
      <ProtectedRoute>
        <NewContract />
      </ProtectedRoute>
    ),
  },
  {
    path: '/contracts/:id',
    element: (
      <ProtectedRoute>
        <ContractDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: '/contracts/:id/edit',
    element: (
      <ProtectedRoute>
        <EditContract />
      </ProtectedRoute>
    ),
  },

  // ============================================================
  // TEMPLATE ROUTES (Session 20 - Production)
  // ============================================================
  {
    path: '/templates',
    element: (
      <ProtectedRoute>
        <TemplateListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/templates/new',
    element: (
      <ProtectedRoute>
        <TemplateBuilder />
      </ProtectedRoute>
    ),
  },
  {
    path: '/templates/:id',
    element: (
      <ProtectedRoute>
        <TemplateDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: '/templates/:id/edit',
    element: (
      <ProtectedRoute>
        <TemplateBuilder />
      </ProtectedRoute>
    ),
  },
  // Backward compatibility redirect
  {
    path: '/demo/templates',
    element: <Navigate to="/templates" replace />,
  },

  // ============================================================
  // WORK ENTRY ROUTES
  // ============================================================
  {
    path: '/work',
    element: (
      <ProtectedRoute>
        <WorkEntryListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/work/new',
    element: (
      <ProtectedRoute>
        <NewWorkEntry />
      </ProtectedRoute>
    ),
  },
  {
    path: '/work/:id',
    element: (
      <ProtectedRoute>
        <WorkEntryDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: '/work/:id/edit',
    element: (
      <ProtectedRoute>
        <EditWorkEntry />
      </ProtectedRoute>
    ),
  },

  // ============================================================
  // REPORT ROUTES (Session 19)
  // ============================================================
  {
    path: ROUTES.REPORTS,
    element: (
      <ProtectedRoute>
        <ReportHistory />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.REPORT_GENERATE,
    element: (
      <ProtectedRoute>
        <GenerateReport />
      </ProtectedRoute>
    ),
  },

  // ============================================================
  // LAYOUT MANAGEMENT ROUTES (Session 6)
  // ============================================================
  {
    path: ROUTES.REPORT_LAYOUTS,
    element: (
      <ProtectedRoute>
        <LayoutList />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.REPORT_LAYOUT_NEW,
    element: (
      <ProtectedRoute>
        <LayoutEditor />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.REPORT_LAYOUT_DETAIL,
    element: (
      <ProtectedRoute>
        <LayoutEditor />
      </ProtectedRoute>
    ),
  },

  // ============================================================
  // USER MANAGEMENT ROUTES (Session 12)
  // ============================================================
  {
    path: ROUTES.USERS,
    element: (
      <ProtectedRoute>
        <UserList />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.USER_INVITE,
    element: (
      <ProtectedRoute>
        <InviteUser />
      </ProtectedRoute>
    ),
  },

  // ============================================================
  // ADMIN ROUTES (Session 13)
  // ============================================================
  {
    path: ROUTES.QUICK_ENTRY,
    element: (
      <ProtectedRoute>
        <QuickEntry />
      </ProtectedRoute>
    ),
  },

  // ============================================================
  // PROFILE
  // ============================================================
  {
    path: ROUTES.PROFILE,
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },

  // ============================================================
  // 404 - NOT FOUND
  // ============================================================
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
