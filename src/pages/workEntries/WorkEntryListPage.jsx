/**
 * WorkLedger - Work Entry List Page
 * 
 * Main page for viewing all work entries.
 * Displays WorkEntryList component with filters and navigation.
 * 
 * @module pages/workEntries/WorkEntryListPage
 * @created February 1, 2026 - Session 13
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import WorkEntryList from '../../components/workEntries/WorkEntryList';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { workEntryService } from '../../services/api/workEntryService';
import { contractService } from '../../services/api/contractService';

/**
 * Work Entry List Page
 * 
 * Features:
 * - Load all work entries for user
 * - Display WorkEntryList component
 * - "New Entry" button
 * - Filter controls
 * - Entry count display
 */
export default function WorkEntryListPage() {
  const navigate = useNavigate();

  // State
  const [workEntries, setWorkEntries] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    contractId: '',
    status: '',
    startDate: '',
    endDate: '',
    sortOrder: 'desc'
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Reload when filters change
  useEffect(() => {
    loadWorkEntries();
  }, [filters]);

  /**
   * Load initial data (contracts and work entries)
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load contracts for filter dropdown (use same function as ContractListPage)
      const contractsData = await contractService.getUserContracts();
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
  };

  /**
   * Load work entries with current filters
   */
  const loadWorkEntries = async () => {
    try {
      // Prepare filter object (exclude empty values)
      const activeFilters = {};
      
      if (filters.contractId) activeFilters.contractId = filters.contractId;
      if (filters.status) activeFilters.status = filters.status;
      if (filters.startDate) activeFilters.startDate = filters.startDate;
      if (filters.endDate) activeFilters.endDate = filters.endDate;
      if (filters.sortOrder) activeFilters.sortOrder = filters.sortOrder;

      const result = await workEntryService.getUserWorkEntries(activeFilters);
      
      if (result.success) {
        setWorkEntries(result.data);
      } else {
        console.error('Failed to load work entries:', result.error);
        setWorkEntries([]);
      }
    } catch (error) {
      console.error('Error loading work entries:', error);
      setWorkEntries([]);
    }
  };

  /**
   * Handle filter changes from WorkEntryList component
   */
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  /**
   * Handle delete work entry
   */
  const handleDelete = async (workEntry) => {
    try {
      const result = await workEntryService.deleteWorkEntry(workEntry.id);
      
      if (result.success) {
        // Reload work entries
        await loadWorkEntries();
        
        // Show success message
        alert('Work entry deleted successfully');
      } else {
        alert(`Failed to delete: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting work entry:', error);
      alert('Failed to delete work entry');
    }
  };

  /**
   * Handle edit work entry
   */
  const handleEdit = (workEntry) => {
    navigate(`/work/${workEntry.id}/edit`);
  };

  /**
   * Handle view work entry
   */
  const handleView = (workEntry) => {
    navigate(`/work/${workEntry.id}`);
  };

  /**
   * Navigate to new entry page
   */
  const handleNewEntry = () => {
    navigate('/work/new');
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
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Work Entries</h1>
              <p className="mt-2 text-sm text-gray-600">
                View and manage your work entries
              </p>
            </div>
            <Button onClick={handleNewEntry}>
              ➕ New Entry
            </Button>
          </div>
        </div>

        {/* Work Entry List with Filters */}
        <WorkEntryList
          workEntries={workEntries}
          contracts={contracts}
          loading={loading}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onView={handleView}
          onFilterChange={handleFilterChange}
        />
      </div>
    </AppLayout>
  );
}
