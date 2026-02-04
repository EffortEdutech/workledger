/**
 * WorkLedger - Work Entry List Component
 * 
 * Displays a grid of work entry cards with filtering and sorting.
 * Supports filters by contract, status, and date range.
 * 
 * @module components/workEntries/WorkEntryList
 * @created February 1, 2026 - Session 13
 */

import React, { useState } from 'react';
import WorkEntryCard from './WorkEntryCard';

/**
 * Work Entry List - Grid display with filters
 * 
 * Features:
 * - Grid of WorkEntryCard components
 * - Filter by contract, status, date range
 * - Sort by date (newest/oldest first)
 * - Empty state
 * - Loading state
 */
export default function WorkEntryList({ 
  workEntries = [], 
  contracts = [],
  loading = false,
  onDelete,
  onEdit,
  onView,
  onFilterChange
}) {
  // Filter state
  const [filters, setFilters] = useState({
    contractId: '',
    status: '',
    startDate: '',
    endDate: '',
    sortOrder: 'desc'
  });

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    const newFilters = {
      ...filters,
      [field]: value
    };
    
    setFilters(newFilters);
    
    // Notify parent component
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    const emptyFilters = {
      contractId: '',
      status: '',
      startDate: '',
      endDate: '',
      sortOrder: 'desc'
    };
    
    setFilters(emptyFilters);
    
    if (onFilterChange) {
      onFilterChange(emptyFilters);
    }
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return filters.contractId || filters.status || filters.startDate || filters.endDate;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading work entries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Contract Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Contract
            </label>
            <select
              value={filters.contractId}
              onChange={(e) => handleFilterChange('contractId', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Contracts</option>
              {contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.contract_number} - {contract.contract_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Start Date Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* End Date Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Sort Order */}
        <div className="mt-3 flex items-center gap-3">
          <label className="text-xs font-medium text-gray-700">
            Sort by:
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange('sortOrder', 'desc')}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                filters.sortOrder === 'desc'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Newest First
            </button>
            <button
              onClick={() => handleFilterChange('sortOrder', 'asc')}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                filters.sortOrder === 'asc'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Oldest First
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {workEntries.length} {workEntries.length === 1 ? 'entry' : 'entries'} found
        </p>
      </div>

      {/* Work Entries Grid */}
      {workEntries.length === 0 ? (
        // Empty State
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No work entries found
          </h3>
          <p className="text-gray-600 mb-4">
            {hasActiveFilters()
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by creating your first work entry.'}
          </p>
          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        // Work Entries Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workEntries.map((workEntry) => (
            <WorkEntryCard
              key={workEntry.id}
              workEntry={workEntry}
              onDelete={onDelete}
              onEdit={onEdit}
              onView={onView}
            />
          ))}
        </div>
      )}
    </div>
  );
}
