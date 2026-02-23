/**
 * WorkLedger - Work Entry List Page
 *
 * Main page for viewing all work entries.
 * Displays WorkEntryList component with filters and navigation.
 *
 * SESSION 10 WIRING (restored):
 *   - useOrganization() provides currentOrg from the org switcher
 *   - loadData/loadWorkEntries wrapped in useCallback([currentOrg?.id])
 *     so they re-run automatically whenever the active org changes
 *   - currentOrg?.id passed to workEntryService and contractService
 *
 * @module pages/workEntries/WorkEntryListPage
 * @created February 1, 2026 - Session 13
 * @updated February 21, 2026 - Session 13 fix: org wiring restored
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import WorkEntryList from '../../components/workEntries/WorkEntryList';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { workEntryService } from '../../services/api/workEntryService';
import { contractService } from '../../services/api/contractService';
import { useOrganization } from '../../context/OrganizationContext';
import { useRole } from '../../hooks/useRole';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function WorkEntryListPage() {
  const navigate = useNavigate();
  const { currentOrg } = useOrganization();
  const { can } = useRole();

  const [workEntries, setWorkEntries] = useState([]);
  const [contracts, setContracts]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [filters, setFilters]         = useState({
    contractId: '',
    status:     '',
    startDate:  '',
    endDate:    '',
    sortOrder:  'desc',
  });

  const canCreate = can('CREATE_WORK_ENTRY');

  // ── Load work entries (filter-aware) ──────────────────────────────
  const loadWorkEntries = useCallback(async () => {
    try {
      const orgId  = currentOrg?.id ?? null;
      const result = await workEntryService.getUserWorkEntries(filters, orgId);

      if (result.success) {
        setWorkEntries(result.data || []);
        console.log(`✅ Fetched ${result.data?.length || 0} work entries`);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('❌ Error loading work entries:', err);
      setError('Failed to load work entries. Please try again.');
    }
  }, [currentOrg?.id, filters]); // ← re-runs on org switch OR filter change

  // ── Load initial data (contracts + entries) ───────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const orgId = currentOrg?.id ?? null;

      // Load contracts for the filter dropdown
      const contractsData = await contractService.getUserContracts(orgId);
      setContracts(contractsData || []);

      // Load work entries
      await loadWorkEntries();

      console.log('✅ Loaded work entries data');
    } catch (err) {
      console.error('❌ Error loading data:', err);
      setError('Failed to load work entries. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id]); // ← re-runs on org switch

  // Initial load + org switch
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload entries when filters change (after initial load)
  useEffect(() => {
    if (!loading) {
      loadWorkEntries();
    }
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filter handlers ────────────────────────────────────────────────
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      contractId: '',
      status:     '',
      startDate:  '',
      endDate:    '',
      sortOrder:  'desc',
    });
  };

  // ── Delete handler ─────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      const result = await workEntryService.deleteWorkEntry(id);
      if (result.success) {
        await loadWorkEntries();
        console.log('✅ Work entry deleted');
      }
    } catch (err) {
      console.error('❌ Error deleting work entry:', err);
      alert('Failed to delete work entry. Please try again.');
    }
  };

  // ── Loading state ──────────────────────────────────────────────────
  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  // ── Error state ────────────────────────────────────────────────────
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

  // ── Main render ────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">

        {/* Page Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Work Entries</h1>
            <p className="mt-2 text-sm text-gray-600">
              {workEntries.length} {workEntries.length === 1 ? 'entry' : 'entries'}
              {currentOrg && (
                <span className="ml-2 font-medium text-primary-700">
                  — {currentOrg.name}
                </span>
              )}
            </p>
          </div>

          {canCreate && (
            <Button
              variant="primary"
              onClick={() => navigate('/work/new')}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Entry
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Contract filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Contract</label>
              <select
                value={filters.contractId}
                onChange={e => handleFilterChange('contractId', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Contracts</option>
                {contracts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.contract_number} — {c.contract_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={e => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Date range */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={e => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={e => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Sort order + Clear */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Sort Order</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleFilterChange('sortOrder', 'desc')}
                className={`flex-1 px-2 py-2 text-xs rounded-md border transition-colors ${
                  filters.sortOrder === 'desc'
                    ? 'bg-primary-50 border-primary-400 text-primary-700 font-medium'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Newest First
              </button>
              <button
                onClick={() => handleFilterChange('sortOrder', 'asc')}
                className={`flex-1 px-2 py-2 text-xs rounded-md border transition-colors ${
                  filters.sortOrder === 'asc'
                    ? 'bg-primary-50 border-primary-400 text-primary-700 font-medium'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Oldest First
              </button>
            </div>
          </div>

          {/* Clear filters + result count */}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {workEntries.length} {workEntries.length === 1 ? 'entry' : 'entries'} found
            </p>
            {(filters.contractId || filters.status || filters.startDate || filters.endDate) && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Work Entry List */}
        <WorkEntryList
          workEntries={workEntries}
          onDelete={handleDelete}
        />
      </div>
    </AppLayout>
  );
}
