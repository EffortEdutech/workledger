/**
 * WorkLedger - Router Configuration
 * 
 * Defines all application routes using React Router v6.
 * Implements protected routes with authentication checking.
 * 
 * @file src/router.jsx
 * @created January 29, 2026
 * @updated January 31, 2026 - Session 10: Added contract routes
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

// Placeholder Components (will be replaced in future sessions)
const PlaceholderPage = ({ title }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600">This page will be implemented in the next sessions.</p>
    </div>
  </div>
);

const WorkEntriesPage = () => <PlaceholderPage title="Work Entries" />;
const TemplatesPage = () => <PlaceholderPage title="Templates" />;
const ReportsPage = () => <PlaceholderPage title="Reports" />;
const ProfilePage = () => <PlaceholderPage title="Profile" />;
const NotFoundPage = () => <PlaceholderPage title="404 - Page Not Found" />;

/**
 * Router Configuration
 */
export const router = createBrowserRouter([
  // Public Routes (No auth required)
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
  
  // Protected Routes (Auth required)
  {
    path: ROUTES.DASHBOARD,
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  
  // Organization Routes
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
  
  // Project Routes (Session 9)
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
  
  // Contract Routes (Session 10)
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
  
  // Work Entry Routes (Placeholder - Session 13)
  {
    path: ROUTES.WORK_ENTRIES,
    element: (
      <ProtectedRoute>
        <WorkEntriesPage />
      </ProtectedRoute>
    ),
  },
  
  // Template Routes (Placeholder - Future sessions)
  {
    path: ROUTES.TEMPLATES,
    element: (
      <ProtectedRoute>
        <TemplatesPage />
      </ProtectedRoute>
    ),
  },
  
  // Report Routes (Placeholder - Future sessions)
  {
    path: ROUTES.REPORTS,
    element: (
      <ProtectedRoute>
        <ReportsPage />
      </ProtectedRoute>
    ),
  },
  
  // Profile Routes (Placeholder - Future sessions)
  {
    path: ROUTES.PROFILE,
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  
  // 404 - Not Found
  {
    path: '*',
    element: <NotFoundPage />,
  },
], {
  future: {
    v7_startTransition: true, // Enable React Router v7 future flag
  }
});

export default router;
