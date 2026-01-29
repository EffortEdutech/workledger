/**
 * WorkLedger - Router Configuration
 * 
 * Defines all application routes using React Router v6.
 * Implements protected routes with authentication checking.
 * 
 * @file src/router.jsx
 * @created January 29, 2026
 * @updated January 29, 2026 - Added real pages and protected routes
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

// Placeholder Components (will be replaced in future sessions)
const PlaceholderPage = ({ title }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600">This page will be implemented in the next sessions.</p>
    </div>
  </div>
);

const ProjectsPage = () => <PlaceholderPage title="Projects" />;
const ContractsPage = () => <PlaceholderPage title="Contracts" />;
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
  
  {
    path: ROUTES.PROJECTS,
    element: (
      <ProtectedRoute>
        <ProjectsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.CONTRACTS,
    element: (
      <ProtectedRoute>
        <ContractsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.WORK_ENTRIES,
    element: (
      <ProtectedRoute>
        <WorkEntriesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.TEMPLATES,
    element: (
      <ProtectedRoute>
        <TemplatesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.REPORTS,
    element: (
      <ProtectedRoute>
        <ReportsPage />
      </ProtectedRoute>
    ),
  },
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
