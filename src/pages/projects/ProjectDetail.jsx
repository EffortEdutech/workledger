/**
 * WorkLedger - Project Detail Page
 * 
 * Page for viewing project details with edit and delete options.
 * 
 * @module pages/projects/ProjectDetail
 * @created January 30, 2026 - Session 9
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { projectService } from '../../services/api/projectService';
import { 
  PencilIcon, 
  TrashIcon,
  BuildingOffice2Icon,
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

export function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load project
  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);

      const projectData = await projectService.getProject(id);
      
      if (!projectData) {
        setError('Project not found or you do not have permission to view it.');
        setLoading(false);
        return;
      }

      setProject(projectData);
      console.log('✅ Loaded project:', projectData.project_name);
    } catch (err) {
      console.error('❌ Error loading project:', err);
      setError('Failed to load project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = () => {
    navigate(`/projects/${id}/edit`);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${project.project_name}"?`)) {
      return;
    }

    try {
      await projectService.deleteProject(id);
      console.log('✅ Project deleted successfully');
      navigate('/projects');
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Format datetime
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Status color mapping
  const statusColors = {
    active: 'bg-green-100 text-green-800 border-green-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
    on_hold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  // Status labels
  const statusLabels = {
    active: 'Active',
    completed: 'Completed',
    on_hold: 'On Hold',
    cancelled: 'Cancelled'
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
  if (error || !project) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-900 mb-2">
              Error Loading Project
            </h3>
            <p className="text-red-800 mb-4">
              {error || 'Project not found.'}
            </p>
            <button
              onClick={() => navigate('/projects')}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {project.project_name}
                </h1>
                <span 
                  className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border ${
                    statusColors[project.status] || statusColors.active
                  }`}
                >
                  {statusLabels[project.status] || 'Active'}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Project Code: <span className="font-mono font-medium text-gray-700">{project.project_code}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={handleEdit}
              >
                <PencilIcon className="h-5 w-5 mr-2" />
                Edit
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Basic Information
              </h2>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Client Name</dt>
                  <dd className="flex items-center text-sm text-gray-900">
                    <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
                    {project.client_name}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Organization</dt>
                  <dd className="flex items-center text-sm text-gray-900">
                    <BuildingOffice2Icon className="h-5 w-5 text-gray-400 mr-2" />
                    {project.organizations?.name || 'N/A'}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500 mb-1">Site Address</dt>
                  <dd className="flex items-start text-sm text-gray-900">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <span>{project.site_address || 'Not specified'}</span>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Start Date</dt>
                  <dd className="flex items-center text-sm text-gray-900">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                    {formatDate(project.start_date)}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">End Date</dt>
                  <dd className="flex items-center text-sm text-gray-900">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                    {formatDate(project.end_date)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Notes */}
            {project.metadata?.notes && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Notes
                </h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {project.metadata.notes}
                </p>
              </div>
            )}

            {/* Contacts */}
            {project.metadata?.contacts && project.metadata.contacts.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Contacts
                </h2>
                <div className="space-y-3">
                  {project.metadata.contacts.map((contact, index) => (
                    <div 
                      key={index}
                      className="flex items-start p-3 bg-gray-50 rounded-lg"
                    >
                      <UserGroupIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{contact.name}</p>
                        <p className="text-sm text-gray-600">{contact.role}</p>
                        {contact.phone && (
                          <p className="text-sm text-gray-500 flex items-center mt-1">
                            <PhoneIcon className="h-4 w-4 mr-1" />
                            {contact.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contracts Placeholder */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Contracts
              </h2>
              <p className="text-sm text-gray-500">
                Contract management will be implemented in Session 10.
              </p>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Stats
              </h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Contracts</dt>
                  <dd className="text-sm font-medium text-gray-900">0</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Work Entries</dt>
                  <dd className="text-sm font-medium text-gray-900">0</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Attachments</dt>
                  <dd className="text-sm font-medium text-gray-900">0</dd>
                </div>
              </dl>
            </div>

            {/* Tags */}
            {project.metadata?.tags && project.metadata.tags.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {project.metadata.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Metadata
              </h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">Created</dt>
                  <dd className="text-gray-900 font-mono text-xs mt-1">
                    {formatDateTime(project.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Last Updated</dt>
                  <dd className="text-gray-900 font-mono text-xs mt-1">
                    {formatDateTime(project.updated_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Project ID</dt>
                  <dd className="text-gray-900 font-mono text-xs mt-1 break-all">
                    {project.id}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default ProjectDetail;
