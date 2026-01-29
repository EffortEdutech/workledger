/**
 * WorkLedger - Dashboard Page
 * 
 * Main dashboard page showing user information and quick stats.
 * Will be enhanced with widgets in future sessions.
 * 
 * @module pages/Dashboard
 * @created January 29, 2026
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';
import AppLayout from '../components/layout/AppLayout';

export function Dashboard() {
  const { user, profile } = useAuth();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}! 👋
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your work today.
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Account
          </h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500 w-32">Email:</span>
              <span className="text-sm text-gray-900">{user?.email}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500 w-32">Full Name:</span>
              <span className="text-sm text-gray-900">{profile?.full_name || 'Not set'}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500 w-32">Phone:</span>
              <span className="text-sm text-gray-900">{profile?.phone_number || 'Not set'}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500 w-32">User ID:</span>
              <span className="text-sm text-gray-400 font-mono">{user?.id}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to={ROUTES.WORK_ENTRIES}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Work Entries
            </h3>
            <p className="text-sm text-gray-600">
              View and create work reports
            </p>
          </Link>

          <Link
            to={ROUTES.PROJECTS}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-4xl mb-3">🏗️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Projects
            </h3>
            <p className="text-sm text-gray-600">
              Manage your projects
            </p>
          </Link>

          <Link
            to={ROUTES.CONTRACTS}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-4xl mb-3">📄</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Contracts
            </h3>
            <p className="text-sm text-gray-600">
              View contract details
            </p>
          </Link>

          <Link
            to={ROUTES.REPORTS}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Reports
            </h3>
            <p className="text-sm text-gray-600">
              Generate reports
            </p>
          </Link>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            🚧 Coming Soon
          </h3>
          <p className="text-blue-700 mb-4">
            We're building amazing features for you:
          </p>
          <ul className="space-y-2 text-sm text-blue-700">
            <li>• Real-time work entry statistics</li>
            <li>• Recent activity feed</li>
            <li>• Pending approvals counter</li>
            <li>• Contract expiry alerts</li>
            <li>• Team performance metrics</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}

export default Dashboard;
