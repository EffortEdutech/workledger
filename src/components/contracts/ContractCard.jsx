/**
 * WorkLedger - Contract Card Component
 *
 * Displays contract information in a card layout for grid display.
 *
 * SESSION 13 BUGFIX: Added canEdit + canDelete props.
 * SESSION 13 FIX 2: Added amber "No Template" warning badge when
 *   contract.template_id is null. Visible to all roles so managers
 *   and workers both know the contract needs attention.
 *
 * @module components/contracts/ContractCard
 * @created January 31, 2026 - Session 10
 * @updated February 21, 2026 - Session 13: canEdit/canDelete + no-template badge
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import ContractTypeBadge from './ContractTypeBadge';
import {
  CalendarIcon,
  DocumentTextIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';

export function ContractCard({
  contract,
  onDelete,
  canEdit   = false,   // ← NEW: hide Edit  button by default
  canDelete = false,   // ← NEW: hide Delete button by default
}) {
  const navigate = useNavigate();

  const statusColors = {
    draft:     'bg-gray-100  text-gray-800  border-gray-200',
    active:    'bg-green-100 text-green-800 border-green-200',
    suspended: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    completed: 'bg-blue-100  text-blue-800  border-blue-200',
  };

  const statusLabels = {
    draft:     'Draft',
    active:    'Active',
    suspended: 'Suspended',
    completed: 'Completed',
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-MY', {
      year:  'numeric',
      month: 'short',
      day:   'numeric',
    });
  };

  const handleView   = ()  => navigate(`/contracts/${contract.id}`);
  const handleEdit   = (e) => { e.stopPropagation(); navigate(`/contracts/${contract.id}/edit`); };
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
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                  statusColors[contract.status] || statusColors.active
                }`}
              >
                {statusLabels[contract.status] || 'Active'}
              </span>
              <ContractTypeBadge category={contract.contract_category} />
              {/* ── No-template warning badge ───────────────
                  Checks junction table — shows when zero templates assigned. */}
              {(!contract.contract_templates || contract.contract_templates.length === 0) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  No Template
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-gray-900 font-mono truncate">
              {contract.contract_number}
            </h3>
            <p className="text-sm text-gray-600 truncate">{contract.contract_name}</p>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 space-y-3">
        {/* Project */}
        {contract.project && (
          <div className="flex items-center text-sm text-gray-600">
            <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
            <span className="truncate">
              {contract.project.project_code} · {contract.project.project_name}
            </span>
          </div>
        )}

        {/* Organization */}
        {contract.project?.organization && (
          <div className="flex items-center text-sm text-gray-600">
            <BuildingOffice2Icon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
            <span className="truncate">{contract.project.organization.name}</span>
          </div>
        )}

        {/* Dates */}
        {(contract.valid_from || contract.valid_until) && (
          <div className="flex items-center text-sm text-gray-600">
            <CalendarIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
            <span>
              {formatDate(contract.valid_from)} – {formatDate(contract.valid_until)}
            </span>
          </div>
        )}

        {/* SLA badge */}
        {contract.sla_tier && (
          <div className="pt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
              SLA {contract.sla_tier} Tier
              {contract.sla_response_time_mins && (
                <span className="ml-1">· {contract.sla_response_time_mins}min response</span>
              )}
            </span>
          </div>
        )}

        {/* Maintenance cycle */}
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

        {/* Edit / Delete only shown when caller grants permission */}
        {(canEdit || canDelete) && (
          <div className="flex items-center space-x-3">
            {canEdit && (
              <button
                onClick={handleEdit}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ContractCard;
