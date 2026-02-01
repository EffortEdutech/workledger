/**
 * WorkLedger - Contract List Page
 * 
 * Main page for displaying all contracts with filters and search.
 * 
 * @module pages/contracts/ContractListPage
 * @created January 31, 2026 - Session 10
 */

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import ContractList from '../../components/contracts/ContractList';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { contractService } from '../../services/api/contractService';
import { projectService } from '../../services/api/projectService';

export function ContractListPage() {
  const [contracts, setContracts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load contracts and projects on mount
  useEffect(() => {
    loadData();
  }, []);

  // Load all data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load contracts and projects in parallel
      const [contractsData, projectsData] = await Promise.all([
        contractService.getUserContracts(),
        projectService.getUserProjects()
      ]);

      setContracts(contractsData || []);
      setProjects(projectsData || []);

      console.log('✅ Loaded contracts:', contractsData?.length || 0);
    } catch (err) {
      console.error('❌ Error loading data:', err);
      setError('Failed to load contracts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete contract
  const handleDelete = async (id) => {
    try {
      await contractService.deleteContract(id);
      
      // Refresh list
      await loadData();
      
      console.log('✅ Contract deleted successfully');
    } catch (err) {
      console.error('❌ Error deleting contract:', err);
      alert('Failed to delete contract. Please try again.');
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
          <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your contracts, templates, and work entry requirements.
          </p>
        </div>

        {/* Contract List Component */}
        <ContractList
          contracts={contracts}
          projects={projects}
          isLoading={loading}
          onDelete={handleDelete}
          onRefresh={loadData}
        />
      </div>
    </AppLayout>
  );
}

export default ContractListPage;
