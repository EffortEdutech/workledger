/**
 * WorkLedger - Route Guard Component
 *
 * Used in Router.jsx to protect entire routes by permission.
 * Unlike PermissionGuard (which hides elements), RouteGuard
 * REDIRECTS to /dashboard when the user lacks the required permission.
 *
 * This prevents direct URL access by unauthorized roles.
 *
 * USAGE in Router.jsx:
 *   <ProtectedRoute>
 *     <RouteGuard permission="NAV_USERS">
 *       <UserList />
 *     </RouteGuard>
 *   </ProtectedRoute>
 *
 * @module components/auth/RouteGuard
 * @created February 23, 2026 - Session 12
 */

import { Navigate } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * RouteGuard
 *
 * @param {string}          permission  - Permission key from permissions.js
 * @param {React.ReactNode} children    - Page component to render if allowed
 * @param {string}          [redirectTo] - Where to redirect if denied (default: /dashboard)
 */
export default function RouteGuard({
  permission,
  children,
  redirectTo = '/',   // ROUTES.DASHBOARD = '/' — not '/dashboard'
}) {
  const { can, loading } = useRole();

  // While role loads, show spinner — avoids flash of content or premature redirect
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!can(permission)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
