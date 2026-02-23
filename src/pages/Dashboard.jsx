/**
 * WorkLedger - Dashboard Page
 *
 * Main dashboard displaying statistics, recent activity, and quick actions.
 *
 * SESSION 10 UPDATE: Now uses useOrganization() for orgId.
 * Stats re-fetch automatically when BJ staff switches organization.
 * Work entries count added to stats (using workEntryService).
 *
 * @module pages/Dashboard
 * @created January 29, 2026
 * @updated January 29, 2026 - Session 8: Added StatsCards and RecentActivity
 * @updated February 20, 2026 - Session 10: Org-aware stats + org switch re-fetch
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';
import AppLayout from '../components/layout/AppLayout';
import StatsCard from '../components/dashboard/StatsCard';
import RecentActivity from '../components/dashboard/RecentActivity';
import { projectService } from '../services/api/projectService';
import { contractService } from '../services/api/contractService';
import { workEntryService } from '../services/api/workEntryService';
import { organizationService } from '../services/api/organizationService';
import {
  DocumentTextIcon,
  FolderIcon,
  DocumentDuplicateIcon,
  BuildingOffice2Icon,
  PlusIcon,
} from '@heroicons/react/24/outline';

export function Dashboard() {
  const { user, profile } = useAuth();
  const { orgId, currentOrg, isBinaJayaStaff } = useOrganization();

  const [stats, setStats] = useState({
    workEntries: 0,
    projects: 0,
    contracts: 0,
    organizations: 0,
  });
  const [loading, setLoading] = useState(true);

  // ──────────────────────────────────────────────────────────
  // Load stats — wrapped in useCallback so it's stable
  // ──────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      console.log('📊 Dashboard: Loading stats for org:', currentOrg?.name || 'all');
      setLoading(true);

      // Pass orgId to all services so they filter to the active org.
      // For regular users, orgId is their own org. For BJ staff, it's
      // whatever org they've selected in the switcher.
      const [
        projectsCount,
        contractsCount,
        workEntriesCount,
        orgsData,
      ] = await Promise.all([
        projectService.getProjectsCount(orgId),
        contractService.getContractsCount(orgId),
        workEntryService.getWorkEntriesCount(orgId),
        organizationService.getUserOrganizations(),
      ]);

      setStats({
        projects:      projectsCount,
        contracts:     contractsCount,
        workEntries:   workEntriesCount,
        organizations: orgsData?.length || 0,
      });

      console.log('✅ Dashboard: Stats loaded', {
        projectsCount,
        contractsCount,
        workEntriesCount,
      });
    } catch (error) {
      console.error('❌ Dashboard: Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }, [orgId]); // ← Re-run whenever active org changes

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // ──────────────────────────────────────────────────────────
  // Stats card definitions
  // ──────────────────────────────────────────────────────────
  const statCards = [
    {
      title: 'Work Entries',
      value: loading ? '…' : stats.workEntries,
      icon: <DocumentTextIcon className="w-6 h-6" />,
      color: 'blue',
      link: '/work',
      description: currentOrg ? `In ${currentOrg.name}` : 'Across all orgs',
    },
    {
      title: 'Projects',
      value: loading ? '…' : stats.projects,
      icon: <FolderIcon className="w-6 h-6" />,
      color: 'green',
      link: '/projects',
      description: currentOrg ? `In ${currentOrg.name}` : 'Across all orgs',
    },
    {
      title: 'Contracts',
      value: loading ? '…' : stats.contracts,
      icon: <DocumentDuplicateIcon className="w-6 h-6" />,
      color: 'purple',
      link: '/contracts',
      description: currentOrg ? `In ${currentOrg.name}` : 'Across all orgs',
    },
    {
      title: 'Organizations',
      value: loading ? '…' : stats.organizations,
      icon: <BuildingOffice2Icon className="w-6 h-6" />,
      color: 'orange',
      link: '/organizations',
      description: isBinaJayaStaff ? 'All client orgs' : 'Your organization',
    },
  ];

  // ──────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            {currentOrg
              ? `Viewing: ${currentOrg.name}`
              : `Welcome back, ${profile?.full_name || user?.email}`
            }
          </p>
        </div>

        {/* Organization onboarding alert (for users with no org) */}
        {!loading && stats.organizations === 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <div className="text-amber-500 mt-0.5">⚠️</div>
            <div>
              <p className="text-sm font-medium text-amber-800">
                You're not part of any organization yet.
              </p>
              <p className="text-sm text-amber-700 mt-0.5">
                Create your first organization to get started.
              </p>
              <Link
                to="/organizations/new"
                className="mt-2 inline-block text-sm font-medium text-amber-700 underline hover:text-amber-900"
              >
                Create Organization →
              </Link>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => (
            <StatsCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
              link={card.link}
              description={card.description}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              to="/work/new"
              className="flex flex-col items-center justify-center p-4 bg-white border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors group"
            >
              <PlusIcon className="w-6 h-6 text-gray-400 group-hover:text-blue-500 mb-2" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">New Work Entry</span>
            </Link>
            <Link
              to="/projects/new"
              className="flex flex-col items-center justify-center p-4 bg-white border-2 border-dashed border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-colors group"
            >
              <PlusIcon className="w-6 h-6 text-gray-400 group-hover:text-green-500 mb-2" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-green-600">New Project</span>
            </Link>
            <Link
              to="/contracts/new"
              className="flex flex-col items-center justify-center p-4 bg-white border-2 border-dashed border-gray-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-colors group"
            >
              <PlusIcon className="w-6 h-6 text-gray-400 group-hover:text-purple-500 mb-2" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-purple-600">New Contract</span>
            </Link>
            <Link
              to="/reports/generate"
              className="flex flex-col items-center justify-center p-4 bg-white border-2 border-dashed border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-colors group"
            >
              <DocumentTextIcon className="w-6 h-6 text-gray-400 group-hover:text-orange-500 mb-2" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-orange-600">Generate Report</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <RecentActivity orgId={orgId} />
        </div>

      </div>
    </AppLayout>
  );
}

export default Dashboard;
