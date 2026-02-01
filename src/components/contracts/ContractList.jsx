/**
 * WorkLedger - Contract List Component
 * 
 * Displays contracts in grid layout with filters and search.
 * 
 * @module components/contracts/ContractList
 * @created January 31, 2026 - Session 10
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ContractCard from './ContractCard';
import { getContractTypeOptions } from './ContractTypeBadge';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { 
  PlusIcon, 
  FunnelIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';

export function ContractList({ 
  contracts = [], 
  projects = [],
  isLoading = false,
  onDelete,
  onRefresh 
}) {
  const navigate = useNavigate();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Contract category options
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...getContractTypeOptions()
  ];

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'completed', label: 'Completed' }
  ];

  // Sort options
  const sortOptions = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'contract_number', label: 'Contract Number' },
    { value: 'contract_name', label: 'Contract Name' },
    { value: 'valid_from', label: 'Valid From Date' },
    { value: 'status', label: 'Status' }
  ];

  // Filter and sort contracts
  const filteredAndSortedContracts = useMemo(() => {
    let filtered = [...contracts];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(contract => 
        contract.contract_number.toLowerCase().includes(search) ||
        contract.contract_name.toLowerCase().includes(search) ||
        (contract.project?.project_name && contract.project.project_name.toLowerCase().includes(search)) ||
        (contract.project?.project_code && contract.project.project_code.toLowerCase().includes(search))
      );
    }

    // Project filter
    if (selectedProject !== 'all') {
      filtered = filtered.filter(contract => contract.project_id === selectedProject);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(contract => contract.contract_category === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(contract => contract.status === selectedStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle nested values (e.g., project.project_name)
      if (sortBy.includes('.')) {
        const keys = sortBy.split('.');
        aValue = keys.reduce((obj, key) => obj?.[key], a);
        bValue = keys.reduce((obj, key) => obj?.[key], b);
      }

      // Handle null values
      if (!aValue) return sortOrder === 'asc' ? 1 : -1;
      if (!bValue) return sortOrder === 'asc' ? -1 : 1;

      // String comparison
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Compare
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [contracts, searchTerm, selectedProject, selectedCategory, selectedStatus, sortBy, sortOrder]);

  // Handle create new contract
  const handleCreateContract = () => {
    navigate('/contracts/new');
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedProject('all');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSortBy('created_at');
    setSortOrder('desc');
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || selectedProject !== 'all' || 
                          selectedCategory !== 'all' || selectedStatus !== 'all';

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search contracts by number, name, or project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              className="whitespace-nowrap"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                  Active
                </span>
              )}
            </Button>

            <Button
              variant="primary"
              onClick={handleCreateContract}
              className="whitespace-nowrap"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Contract
            </Button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="border-t border-gray-200 pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Project Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Projects</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.project_code}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contract Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.shortLabel || option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sort Order & Reset */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Sort Order:
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleResetFilters}
                >
                  Reset Filters
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <p>
          Showing <span className="font-medium text-gray-900">{filteredAndSortedContracts.length}</span> of{' '}
          <span className="font-medium text-gray-900">{contracts.length}</span> contracts
        </p>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Refresh
          </button>
        )}
      </div>

      {/* Contracts Grid */}
      {filteredAndSortedContracts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedContracts.map(contract => (
            <ContractCard
              key={contract.id}
              contract={contract}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="max-w-md mx-auto">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {hasActiveFilters ? 'No contracts found' : 'No contracts yet'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {hasActiveFilters
                ? 'Try adjusting your filters to find what you\'re looking for.'
                : 'Get started by creating your first contract.'}
            </p>
            {hasActiveFilters ? (
              <Button
                variant="primary"
                onClick={handleResetFilters}
                className="mt-6"
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleCreateContract}
                className="mt-6"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create First Contract
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ContractList;
