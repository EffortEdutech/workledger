/**
 * WorkLedger - Router Configuration
 * 
 * Defines all application routes using React Router v6.
 * Implements protected routes with authentication checking.
 * 
 * @file src/router.jsx
 * @created January 29, 2026
 * @updated February 6, 2026 - Session 19: Report routes reorganized
 * @updated February 7, 2026 - Session 20: Template management routes (replaced demo)
 * @updated February 12, 2026 - Session 6: Layout management routes added
 *   - /reports/layouts → LayoutList (browse layouts)
 *   - /reports/layouts/new → LayoutEditor (create mode)
 *   - /reports/layouts/:id → LayoutEditor (edit mode)
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

// Work Entry Pages (Session 13)
import WorkEntryListPage from './pages/workEntries/WorkEntryListPage';
import NewWorkEntry from './pages/workEntries/NewWorkEntry';
import EditWorkEntry from './pages/workEntries/EditWorkEntry';
import WorkEntryDetail from './pages/workEntries/WorkEntryDetail';

// Report Pages (Session 18 + 19)
import ReportHistory from './pages/reports/ReportHistory';
import GenerateReport from './pages/reports/GenerateReport';

// Layout Management Pages (Session 6 - NEW!)
import LayoutList from './pages/reports/layouts/LayoutList';
import LayoutEditor from './pages/reports/layouts/LayoutEditor';

// ── IMPORTS (add to top of router.jsx) ──────────────────────
import UserList from './pages/users/UserList';
import InviteUser from './pages/users/InviteUser';

// Placeholder Components (will be replaced in future sessions)
const PlaceholderPage = ({ title }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600">This page will be implemented in the next sessions.</p>
    </div>
  </div>
);

const ProfilePage = () => <PlaceholderPage title="Profile" />;
const NotFoundPage = () => <PlaceholderPage title="404 - Page Not Found" />;

/**
 * Router Configuration
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
  // PROTECTED ROUTES (Authentication Required)
  // ============================================

  // Dashboard
  {
    path: ROUTES.DASHBOARD,
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  
  // ============================================
  // ORGANIZATION ROUTES
  // ============================================
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
  
  // ============================================
  // PROJECT ROUTES (Session 9)
  // ============================================
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
  
  // ============================================
  // CONTRACT ROUTES (Session 10)
  // ============================================
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
  
  // ============================================
  // TEMPLATE ROUTES (Session 20 - Production)
  // Replaces /demo/templates with full management
  // ============================================
  
  // /templates → TemplateListPage (management table)
  {
    path: '/templates',
    element: (
      <ProtectedRoute>
        <TemplateListPage />
      </ProtectedRoute>
    ),
  },
  
  // /templates/new → TemplateBuilder (create mode)
  {
    path: '/templates/new',
    element: (
      <ProtectedRoute>
        <TemplateBuilder />
      </ProtectedRoute>
    ),
  },
  
  // /templates/:id → TemplateDetail (view + preview + test)
  {
    path: '/templates/:id',
    element: (
      <ProtectedRoute>
        <TemplateDetail />
      </ProtectedRoute>
    ),
  },
  
  // /templates/:id/edit → TemplateBuilder (edit mode)
  {
    path: '/templates/:id/edit',
    element: (
      <ProtectedRoute>
        <TemplateBuilder />
      </ProtectedRoute>
    ),
  },
  
  // /demo/templates → Redirect to /templates (backward compatibility)
  {
    path: '/demo/templates',
    element: <Navigate to="/templates" replace />,
  },
  
  // ============================================
  // WORK ENTRY ROUTES (Session 13)
  // ============================================
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

// Layout Routes (Session 8)
  {
    path: '/reports/layouts',
    element: (
      <ProtectedRoute>
        <LayoutList />
      </ProtectedRoute>
    ),
  },
  {
    path: '/reports/layouts/new',
    element: (
      <ProtectedRoute>
        <LayoutEditor />
      </ProtectedRoute>
    ),
  },
  {
    path: '/reports/layouts/:id/edit',
    element: (
      <ProtectedRoute>
        <LayoutEditor />
      </ProtectedRoute>
    ),
  },



  
  // ============================================
  // REPORT ROUTES (Session 19 - Reorganized)
  // ============================================
  
  // /reports → ReportHistory (LANDING PAGE)
  {
    path: ROUTES.REPORTS,
    element: (
      <ProtectedRoute>
        <ReportHistory />
      </ProtectedRoute>
    ),
  },
  
  // /reports/generate → GenerateReport (Custom report generator)
  {
    path: ROUTES.REPORT_GENERATE,
    element: (
      <ProtectedRoute>
        <GenerateReport />
      </ProtectedRoute>
    ),
  },
  
  // ============================================
  // LAYOUT MANAGEMENT ROUTES (Session 6 - NEW!)
  // ============================================
  
  // /reports/layouts → LayoutList (Browse layouts)
  {
    path: ROUTES.REPORT_LAYOUTS,
    element: (
      <ProtectedRoute>
        <LayoutList />
      </ProtectedRoute>
    ),
  },
  
  // /reports/layouts/new → LayoutEditor (Create new layout)
  {
    path: ROUTES.REPORT_LAYOUT_NEW,
    element: (
      <ProtectedRoute>
        <LayoutEditor />
      </ProtectedRoute>
    ),
  },
  
  // /reports/layouts/:id → LayoutEditor (Edit existing layout)
  {
    path: ROUTES.REPORT_LAYOUT_DETAIL,
    element: (
      <ProtectedRoute>
        <LayoutEditor />
      </ProtectedRoute>
    ),
  },
  
  // ============================================
  // USER ROUTES
  // ============================================
  {
    path: ROUTES.PROFILE,
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },

  // ── ROUTES (add before the 404 route) ───────────────────────
  // User Management Routes (Session 12)
  {
    path: '/users',
    element: (
      <ProtectedRoute>
        <UserList />
      </ProtectedRoute>
    ),
  },
  {
    path: '/users/invite',
    element: (
      <ProtectedRoute>
        <InviteUser />
      </ProtectedRoute>
    ),
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
  }
});

export default router;
