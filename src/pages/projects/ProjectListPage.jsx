/**
 * WorkLedger - Project List Page
 * 
 * Main page for displaying all projects with filters and search.
 * 
 * @module pages/projects/ProjectListPage
 * @created January 30, 2026 - Session 9
 */

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import ProjectList from '../../components/projects/ProjectList';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { projectService } from '../../services/api/projectService';
import { organizationService } from '../../services/api/organizationService';

export function ProjectListPage() {
  const [projects, setProjects] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load projects and organizations on mount
  useEffect(() => {
    loadData();
  }, []);

  // Load all data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load projects and organizations in parallel
      const [projectsData, orgsData] = await Promise.all([
        projectService.getUserProjects(),
        organizationService.getUserOrganizations()
      ]);

      setProjects(projectsData || []);
      setOrganizations(orgsData || []);

      console.log('✅ Loaded projects:', projectsData?.length || 0);
    } catch (err) {
      console.error('❌ Error loading data:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete project
  const handleDelete = async (id) => {
    try {
      await projectService.deleteProject(id);
      
      // Refresh list
      await loadData();
      
      console.log('✅ Project deleted successfully');
    } catch (err) {
      console.error('❌ Error deleting project:', err);
      alert('Failed to delete project. Please try again.');
    }
  };

  // Loading state
  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={loadData}
              className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your projects, contracts, and work entries.
          </p>
        </div>

        {/* Project List Component */}
        <ProjectList
          projects={projects}
          organizations={organizations}
          isLoading={loading}
          onDelete={handleDelete}
          onRefresh={loadData}
        />
      </div>
    </AppLayout>
  );
}

export default ProjectListPage;
