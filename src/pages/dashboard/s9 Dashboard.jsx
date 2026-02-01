// src/pages/Dashboard.jsx
/**
 * Dashboard Page
 * Main dashboard after login showing stats and quick actions
 * Created: Session 8
 * Updated: Session 9
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatsCard from '../components/dashboard/StatsCard';
import RecentActivity from '../components/dashboard/RecentActivity';
import { organizationService } from '../services/api/organizationService';
import { projectService } from '../services/api/projectService';
import { contractService } from '../services/api/contractService';
import {
  DocumentTextIcon,
  FolderIcon,
  DocumentDuplicateIcon,
  BuildingOffice2Icon,
  PlusIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { user, profile } = useAuth();

  // Stats state
  const [stats, setStats] = useState({
    workEntries: 0,
    projects: 0,
    contracts: 0,
    organizations: 0
  });
  const [loading, setLoading] = useState(true);

  // Load stats on mount
  useEffect(() => {
    console.log('📊 Dashboard: Component mounted');
    loadStats();
  }, []);

  // Load all stats
  const loadStats = async () => {
    try {
      console.log('📊 Dashboard: Loading stats...');
      setLoading(true);

      // Load stats in parallel
      const [projectsResult, contractsResult, orgsResult] = await Promise.all([
        projectService.getProjectsCount(),
        contractService.getContractsCount(),
        organizationService.getUserOrganizations()
      ]);

      console.log('📊 Dashboard: Projects count:', projectsResult.data);
      console.log('📊 Dashboard: Contracts count:', contractsResult.data);
      console.log('📊 Dashboard: Organizations count:', orgsResult.data?.length || 0);

      setStats({
        workEntries: 0, // Will be implemented in future sessions
        projects: projectsResult.data || 0,
        contracts: contractsResult.data || 0,
        organizations: orgsResult.data?.length || 0
      });

      console.log('✅ Dashboard: Stats loaded successfully');
    } catch (error) {
      console.error('❌ Dashboard: Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Stats cards configuration
  const statsCards = [
    {
      title: 'Work Entries',
      value: stats.workEntries,
      icon: DocumentTextIcon,
      color: 'blue',
      link: '/work-entries'
    },
    {
      title: 'Projects',
      value: stats.projects,
      icon: FolderIcon,
      color: 'green',
      link: '/projects'
    },
    {
      title: 'Contracts',
      value: stats.contracts,
      icon: DocumentDuplicateIcon,
      color: 'purple',
      link: '/contracts'
    },
    {
      title: 'Organizations',
      value: stats.organizations,
      icon: BuildingOffice2Icon,
      color: 'orange',
      link: '/organizations'
    }
  ];

  // Recent activity (mock data for now)
  const recentActivities = [
    // Will be populated from database in future sessions
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome back, {profile?.full_name || user?.email || 'User'}! 👋
        </p>
      </div>

      {/* Onboarding Alert - Show if no organizations */}
      {!loading && stats.organizations === 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="h-6 w-6 text-blue-600 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800">Get Started</h3>
              <p className="mt-1 text-sm text-blue-700">
                Create your first organization to start managing projects and work entries.
              </p>
              <Link
                to="/organizations/new"
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Organization
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statsCards.map((card) => (
          <StatsCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
            link={card.link}
            loading={loading}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity activities={recentActivities} />
        </div>

        {/* Quick Actions */}
        <div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/work-entries/new"
                className="flex items-center p-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
              >
                <DocumentTextIcon className="h-5 w-5 mr-3" />
                <span className="font-medium">New Work Entry</span>
              </Link>

              <Link
                to="/projects/new"
                className="flex items-center p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FolderIcon className="h-5 w-5 mr-3" />
                <span className="font-medium">Create Project</span>
              </Link>

              <Link
                to="/templates"
                className="flex items-center p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <DocumentDuplicateIcon className="h-5 w-5 mr-3" />
                <span className="font-medium">Browse Templates</span>
              </Link>

              <Link
                to="/reports"
                className="flex items-center p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium">Generate Report</span>
              </Link>
            </div>
          </div>

          {/* User Info Card */}
          {user && (
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Account Information
              </h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile?.full_name || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile?.phone_number || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">User ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono text-xs break-all">{user.id}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
