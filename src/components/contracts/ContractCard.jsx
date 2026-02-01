/**
 * WorkLedger - Contract Card Component
 * 
 * Displays contract information in a card layout for grid display.
 * 
 * @module components/contracts/ContractCard
 * @created January 31, 2026 - Session 10
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import ContractTypeBadge from './ContractTypeBadge';
import { 
  CalendarIcon, 
  DocumentTextIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';

export function ContractCard({ contract, onDelete }) {
  const navigate = useNavigate();

  // Status color mapping
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800 border-gray-200',
    active: 'bg-green-100 text-green-800 border-green-200',
    suspended: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200'
  };

  // Status labels
  const statusLabels = {
    draft: 'Draft',
    active: 'Active',
    suspended: 'Suspended',
    completed: 'Completed'
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

  // Handle view contract
  const handleView = () => {
    navigate(`/contracts/${contract.id}`);
  };

  // Handle edit contract
  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/contracts/${contract.id}/edit`);
  };

  // Handle delete contract
  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete contract "${contract.contract_number}"?`)) {
      onDelete(contract.id);
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200"
      onClick={handleView}
    >
      {/* Card Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            {/* Contract Number */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary-600 transition-colors">
              {contract.contract_number}
            </h3>

            {/* Contract Name */}
            <p className="text-sm text-gray-600 line-clamp-1">
              {contract.contract_name}
            </p>
          </div>

          {/* Status Badge */}
          <span 
            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${
              statusColors[contract.status] || statusColors.active
            }`}
          >
            {statusLabels[contract.status] || 'Active'}
          </span>
        </div>

        {/* Contract Type Badge */}
        <div className="mt-2">
          <ContractTypeBadge category={contract.contract_category} size="md" />
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 space-y-3">
        {/* Project */}
        <div className="flex items-center text-sm text-gray-600">
          <BuildingOffice2Icon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
          <div className="flex-1 truncate">
            <span className="font-medium text-gray-900">
              {contract.project?.project_code || 'N/A'}
            </span>
            <span className="mx-1">·</span>
            <span className="truncate">
              {contract.project?.project_name || 'N/A'}
            </span>
          </div>
        </div>

        {/* Template */}
        {contract.template && (
          <div className="flex items-center text-sm text-gray-600">
            <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
            <span className="truncate">{contract.template.template_name}</span>
          </div>
        )}

        {/* Valid Period */}
        <div className="flex items-center text-sm text-gray-600">
          <CalendarIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
          <span>
            {formatDate(contract.valid_from)} - {formatDate(contract.valid_until)}
          </span>
        </div>

        {/* SLA Badge (if applicable) */}
        {contract.sla_tier && (
          <div className="pt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
              SLA {contract.sla_tier} Tier
              {contract.sla_response_time_mins && (
                <span className="ml-1">
                  · {contract.sla_response_time_mins}min response
                </span>
              )}
            </span>
          </div>
        )}

        {/* Maintenance Cycle (if applicable) */}
        {contract.maintenance_cycle && (
          <div className="pt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
              {contract.maintenance_cycle} Cycle
            </span>
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

export default ContractCard;
