/**
 * WorkLedger - Project Card Component
 * 
 * Displays project information in a card layout for grid display.
 * 
 * @module components/projects/ProjectCard
 * @created January 30, 2026 - Session 9
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BuildingOffice2Icon, 
  CalendarIcon, 
  MapPinIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

export function ProjectCard({ project, onDelete }) {
  const navigate = useNavigate();

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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Handle view project
  const handleView = () => {
    navigate(`/projects/${project.id}`);
  };

  // Handle edit project
  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/projects/${project.id}/edit`);
  };

  // Handle delete project
  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${project.project_name}"?`)) {
      onDelete(project.id);
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200"
      onClick={handleView}
    >
      {/* Card Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Project Name */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary-600 transition-colors">
              {project.project_name}
            </h3>

            {/* Project Code Badge */}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
              {project.project_code}
            </span>
          </div>

          {/* Status Badge */}
          <span 
            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${
              statusColors[project.status] || statusColors.active
            }`}
          >
            {statusLabels[project.status] || 'Active'}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 space-y-3">
        {/* Client Name */}
        <div className="flex items-center text-sm text-gray-600">
          <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
          <span className="truncate">{project.client_name}</span>
        </div>

        {/* Site Address */}
        {project.site_address && (
          <div className="flex items-start text-sm text-gray-600">
            <MapPinIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{project.site_address}</span>
          </div>
        )}

        {/* Date Range */}
        <div className="flex items-center text-sm text-gray-600">
          <CalendarIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
          <span>
            {formatDate(project.start_date)} - {formatDate(project.end_date)}
          </span>
        </div>

        {/* Organization */}
        {project.organizations && (
          <div className="flex items-center text-sm text-gray-600">
            <BuildingOffice2Icon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
            <span className="truncate">{project.organizations.name}</span>
          </div>
        )}

        {/* Tags */}
        {project.metadata?.tags && project.metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {project.metadata.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700"
              >
                {tag}
              </span>
            ))}
            {project.metadata.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600">
                +{project.metadata.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between rounded-b-lg">
        <button
          onClick={handleView}
          className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          View Details →
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleEdit}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProjectCard;
