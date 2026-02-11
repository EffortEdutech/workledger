/**
 * WorkLedger - Generate Report Page
 * 
 * Main page for generating PDF reports.
 * PROPERLY WRAPPED in AppLayout component.
 * 
 * @module pages/reports/GenerateReport
 * @created February 5, 2026 - Session 18
 * @updated February 5, 2026 - FIXED: Wrapped in AppLayout + correct field names
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase/client';
import ReportGenerator from '../../components/reports/ReportGenerator';
import AppLayout from '../../components/layout/AppLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function GenerateReport() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  
  /**
   * Load contracts with CORRECT field names
   */
  useEffect(() => {
    loadContracts();
  }, []);
  
  const loadContracts = async () => {
    try {
      console.log('📊 Loading contracts for report generation...');
      setLoading(true);
      
      // FIXED: Use correct field names + JOIN with projects
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          id,
          contract_number,
          contract_name,
          contract_type,
          contract_category,
          status,
          valid_from,
          valid_until,
          project:projects (
            id,
            project_name,
            client_name,
            project_code
          )
        `)
        .is('deleted_at', null)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error loading contracts:', error);
        throw error;
      }
      
      console.log('✅ Loaded contracts:', data?.length || 0);
      
      setContracts(data || []);
      
      // Auto-select first contract if available
      if (data && data.length > 0) {
        setSelectedContract(data[0].id);
        console.log('✅ Auto-selected:', data[0].contract_number);
      }
      
    } catch (error) {
      console.error('❌ Failed to load contracts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }
  
  // Show message if no contracts
  if (contracts.length === 0) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Generate Report</h1>
            <p className="text-gray-600 mt-2">
              Select a contract to generate PDF reports
            </p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  No Active Contracts Found
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>You need to create at least one active contract before generating reports.</p>
                  <button
                    onClick={() => navigate('/contracts/new')}
                    className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Create New Contract
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Generate Report</h1>
          <p className="text-gray-600 mt-2">
            Select a contract to generate PDF reports from work entries
          </p>
        </div>
        
        {/* Contract Selector */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Contract
          </label>
          <select
            value={selectedContract || ''}
            onChange={(e) => setSelectedContract(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">-- Select Contract --</option>
            {contracts.map(contract => (
              <option key={contract.id} value={contract.id}>
                {contract.contract_number} - {contract.project?.client_name || 'Unknown Client'} - {contract.contract_name}
              </option>
            ))}
          </select>
          
          {/* Contract Info (if selected) */}
          {selectedContract && contracts.find(c => c.id === selectedContract) && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Contract Details</h4>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-gray-500">Contract:</dt>
                <dd className="text-gray-900">
                  {contracts.find(c => c.id === selectedContract)?.contract_number}
                </dd>
                
                <dt className="text-gray-500">Client:</dt>
                <dd className="text-gray-900">
                  {contracts.find(c => c.id === selectedContract)?.project?.client_name}
                </dd>
                
                <dt className="text-gray-500">Project:</dt>
                <dd className="text-gray-900">
                  {contracts.find(c => c.id === selectedContract)?.project?.project_name}
                </dd>
                
                <dt className="text-gray-500">Type:</dt>
                <dd className="text-gray-900">
                  {contracts.find(c => c.id === selectedContract)?.contract_type || 'N/A'}
                </dd>
                
                <dt className="text-gray-500">Category:</dt>
                <dd className="text-gray-900">
                  {contracts.find(c => c.id === selectedContract)?.contract_category?.replace(/-/g, ' ').toUpperCase() || 'N/A'}
                </dd>
                
                <dt className="text-gray-500">Period:</dt>
                <dd className="text-gray-900">
                  {contracts.find(c => c.id === selectedContract)?.valid_from} to {contracts.find(c => c.id === selectedContract)?.valid_until}
                </dd>
              </dl>
            </div>
          )}
        </div>
        
        {/* Report Generator Component */}
        {selectedContract ? (
          <ReportGenerator
            key={selectedContract}
            contractId={selectedContract}
          />
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No Contract Selected
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Select a contract above to generate reports
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
