/**
 * WorkLedger - Edit Contract Page
 * 
 * Page for editing an existing contract.
 * 
 * @module pages/contracts/EditContract
 * @created January 31, 2026 - Session 10
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import ContractForm from '../../components/contracts/ContractForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { contractService } from '../../services/api/contractService';
import { projectService } from '../../services/api/projectService';
import { supabase } from '../../services/supabase/client';

export function EditContract() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [contract, setContract] = useState(null);
  const [projects, setProjects] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load contract, projects, and templates
  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load contract, projects, and templates in parallel
      const [contractData, projectsData, templatesResult] = await Promise.all([
        contractService.getContract(id),
        projectService.getUserProjects(),
        supabase.from('templates').select('*').order('template_name')
      ]);

      if (!contractData) {
        setError('Contract not found or you do not have permission to edit it.');
        setLoading(false);
        return;
      }

      if (templatesResult.error) throw templatesResult.error;

      setContract(contractData);
      setProjects(projectsData || []);
      setTemplates(templatesResult.data || []);

      console.log('✅ Loaded contract for editing:', contractData.contract_number);
    } catch (err) {
      console.error('❌ Error loading contract:', err);
      setError('Failed to load contract. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submit
  const handleSubmit = async (projectId, data) => {
    try {
      setSubmitting(true);
      console.log('📝 Updating contract:', data);

      const updatedContract = await contractService.updateContract(id, data);
      
      if (updatedContract) {
        console.log('✅ Contract updated successfully');
        // Redirect to contract detail page
        navigate(`/contracts/${id}`);
      }
    } catch (error) {
      console.error('❌ Error updating contract:', error);
      alert('Failed to update contract. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/contracts/${id}`);
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
  if (error || !contract) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-900 mb-2">
              Error Loading Contract
            </h3>
            <p className="text-red-800 mb-4">
              {error || 'Contract not found.'}
            </p>
            <button
              onClick={() => navigate('/contracts')}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Back to Contracts
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Contract</h1>
          <p className="mt-2 text-sm text-gray-600">
            Update the contract details below.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Contract: <span className="font-medium text-gray-700">{contract.contract_number}</span>
          </p>
        </div>

        {/* Contract Form */}
        <ContractForm
          contract={contract}
          projects={projects}
          templates={templates}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={submitting}
        />
      </div>
    </AppLayout>
  );
}

export default EditContract;
