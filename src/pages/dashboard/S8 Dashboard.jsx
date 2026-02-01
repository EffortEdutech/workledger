/**
 * WorkLedger - Dashboard Page
 * 
 * Main dashboard displaying statistics, recent activity, and quick actions.
 * 
 * @module pages/Dashboard
 * @created January 29, 2026
 * @updated January 29, 2026 - Session 8: Added StatsCards and RecentActivity
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import StatsCard from '../components/dashboard/StatsCard';
import RecentActivity from '../components/dashboard/RecentActivity';
import { organizationService } from '../services/api/organizationService';
import { projectService } from '../services/api/projectService';
import { contractService } from '../services/api/contractService';
import { supabase } from '../services/supabase/client';

export function Dashboard() {
  const { user, profile } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [stats, setStats] = useState({
    workEntries: 0,
    projects: 0,
    contracts: 0,
    organizations: 0
  });
  const [loading, setLoading] = useState(true);

  // Load user's organizations and stats
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        // Load organizations
        const orgs = await organizationService.getUserOrganizations();
        setOrganizations(orgs);
        
        // Fetch real counts using services (they filter by user's organizations)
        const [projectsCount, contractsCount, workEntriesCount] = await Promise.all([
          projectService.getProjectsCount(),
          contractService.getContractsCount(),
          supabase
            .from('work_entries')
            .select('*', { count: 'exact', head: true })
            .is('deleted_at', null)
            .then(({ count }) => count || 0)
        ]);
        
        setStats({
          workEntries: workEntriesCount,
          projects: projectsCount,
          contracts: contractsCount,
          organizations: orgs.length
        });
        
        console.log('✅ Dashboard stats loaded:', {
          workEntries: workEntriesCount,
          projects: projectsCount,
          contracts: contractsCount,
          organizations: orgs.length
        });
      } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Stats cards configuration
  const statsCards = [
    {
      title: 'Work Entries',
      value: stats.workEntries.toString(),
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      link: '/work-entries',
      color: 'blue'
    },
    {
      title: 'Projects',
      value: stats.projects.toString(),
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      link: '/projects',
      color: 'purple'
    },
    {
      title: 'Contracts',
      value: stats.contracts.toString(),
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      link: '/contracts',
      color: 'green'
    },
    {
      title: 'Organizations',
      value: stats.organizations.toString(),
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      link: '/organizations',
      color: 'orange'
    }
  ];

  // Mock recent activity - will be real data in future sessions
  const recentActivities = [
    {
      type: 'member_joined',
      message: 'joined WorkLedger',
      user: profile?.full_name || user?.email,
      timestamp: new Date().toISOString()
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile?.full_name || user?.email?.split('@')[0]}! 👋
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Here's what's happening with your work today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              link={stat.link}
              color={stat.color}
            />
          ))}
        </div>

        {/* Organization Check */}
        {!loading && organizations.length === 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Get Started:</strong> You haven't joined or created an organization yet.{' '}
                  <Link to="/organizations/new" className="font-medium underline hover:text-yellow-600">
                    Create your first organization
                  </Link>
                  {' '}to start managing projects and work entries.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Recent Activity */}
          <RecentActivity activities={recentActivities} maxItems={5} />

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link
                to="/work-entries/new"
                className="flex items-center p-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">Create Work Entry</span>
              </Link>

              <Link
                to="/projects/new"
                className="flex items-center p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">Create Project</span>
              </Link>

              <Link
                to="/templates"
                className="flex items-center p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                <span className="font-medium">Browse Templates</span>
              </Link>

              <Link
                to="/reports"
                className="flex items-center p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium">Generate Report</span>
              </Link>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        {user && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Account Information
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
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
                <dd className="mt-1 text-sm text-gray-900 font-mono text-xs">{user.id}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default Dashboard;
