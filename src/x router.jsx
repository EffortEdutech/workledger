/**
 * WorkLedger - Router Configuration
 * 
 * Defines all application routes using React Router v6.
 * Uses nested routes under AppLayout for consistent GUI structure.
 * 
 * @file src/router.jsx
 * @created January 29, 2026
 * @updated February 1, 2026 - Session 13: Added work entry routes with proper layout structure
 */

import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from './constants/routes';

// Layout Components
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Auth Pages
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

// Demo Pages
import TemplateDemoPage from './pages/demo/TemplateDemoPage';

// Placeholder Components (future sessions)
const PlaceholderPage = ({ title }) => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600">This page will be implemented in future sessions.</p>
    </div>
  </div>
);

const TemplatesPage = () => <PlaceholderPage title="Templates" />;
const ReportsPage = () => <PlaceholderPage title="Reports" />;
const ProfilePage = () => <PlaceholderPage title="Profile" />;
const NotFoundPage = () => <PlaceholderPage title="404 - Page Not Found" />;

/**
 * Router Configuration
 * 
 * Structure:
 * - Public routes (login, register) - no layout
 * - Protected routes - wrapped in AppLayout with nested children
 * - All protected pages inherit AppLayout with sidebar, breadcrumbs, navigation
 */
export const router = createBrowserRouter([
  // ============================================
  // PUBLIC ROUTES (No Authentication Required)
  // ============================================
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

  // ============================================
  // PROTECTED ROUTES (AppLayout + Authentication)
  // ============================================
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      // --------------------------------------------
      // DASHBOARD
      // --------------------------------------------
      {
        index: true,
        element: <Dashboard />,
      },

      // --------------------------------------------
      // ORGANIZATIONS
      // --------------------------------------------
      {
        path: 'organizations',
        element: <OrganizationList />,
      },
      {
        path: 'organizations/new',
        element: <NewOrganization />,
      },
      {
        path: 'organizations/:id/settings',
        element: <OrganizationSettings />,
      },

      // --------------------------------------------
      // PROJECTS (Session 9)
      // --------------------------------------------
      {
        path: 'projects',
        element: <ProjectListPage />,
      },
      {
        path: 'projects/new',
        element: <NewProject />,
      },
      {
        path: 'projects/:id',
        element: <ProjectDetail />,
      },
      {
        path: 'projects/:id/edit',
        element: <EditProject />,
      },

      // --------------------------------------------
      // CONTRACTS (Session 10)
      // --------------------------------------------
      {
        path: 'contracts',
        element: <ContractListPage />,
      },
      {
        path: 'contracts/new',
        element: <NewContract />,
      },
      {
        path: 'contracts/:id',
        element: <ContractDetail />,
      },
      {
        path: 'contracts/:id/edit',
        element: <EditContract />,
      },

      // --------------------------------------------
      // WORK ENTRIES (Session 13)
      // --------------------------------------------
      {
        path: 'work',
        element: <WorkEntryListPage />,
      },
      {
        path: 'work/new',
        element: <NewWorkEntry />,
      },
      {
        path: 'work/:id',
        element: <WorkEntryDetail />,
      },
      {
        path: 'work/:id/edit',
        element: <EditWorkEntry />,
      },

      // Legacy route support (if ROUTES.WORK_ENTRIES is different)
      {
        path: ROUTES.WORK_ENTRIES?.replace(/^\//, ''), // Remove leading slash if present
        element: <WorkEntryListPage />,
      },

      // --------------------------------------------
      // DEMO PAGES
      // --------------------------------------------
      {
        path: 'demo/templates',
        element: <TemplateDemoPage />,
      },

      // --------------------------------------------
      // TEMPLATES (Future)
      // --------------------------------------------
      {
        path: ROUTES.TEMPLATES?.replace(/^\//, ''),
        element: <TemplatesPage />,
      },

      // --------------------------------------------
      // REPORTS (Future)
      // --------------------------------------------
      {
        path: ROUTES.REPORTS?.replace(/^\//, ''),
        element: <ReportsPage />,
      },

      // --------------------------------------------
      // PROFILE (Future)
      // --------------------------------------------
      {
        path: ROUTES.PROFILE?.replace(/^\//, ''),
        element: <ProfilePage />,
      },
    ],
  },

  // ============================================
  // 404 - NOT FOUND
  // ============================================
  {
    path: '*',
    element: <NotFoundPage />,
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  }
});

export default router;
