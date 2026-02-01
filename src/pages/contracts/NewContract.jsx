/**
 * WorkLedger - New Contract Page
 * 
 * Page for creating a new contract.
 * 
 * @module pages/contracts/NewContract
 * @created January 31, 2026 - Session 10
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import ContractForm from '../../components/contracts/ContractForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { contractService } from '../../services/api/contractService';
import { projectService } from '../../services/api/projectService';
import { supabase } from '../../services/supabase/client';

export function NewContract() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load projects and templates
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load projects
      const projectsData = await projectService.getUserProjects();
      setProjects(projectsData || []);

      // Load templates
      const { data: templatesData, error } = await supabase
        .from('templates')
        .select('*')
        .order('template_name');

      if (error) throw error;
      setTemplates(templatesData || []);

      console.log('✅ Loaded projects and templates');
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submit
  const handleSubmit = async (projectId, data) => {
    try {
      setSubmitting(true);
      console.log('📝 Creating contract:', data);

      const contract = await contractService.createContract(projectId, data);
      
      if (contract) {
        console.log('✅ Contract created successfully:', contract.id);
        // Redirect to contract detail page
        navigate(`/contracts/${contract.id}`);
      }
    } catch (error) {
      console.error('❌ Error creating contract:', error);
      alert('Failed to create contract. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/contracts');
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

  // No projects warning
  if (projects.length === 0) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-yellow-900 mb-2">
              No Projects Found
            </h3>
            <p className="text-yellow-800 mb-4">
              You need to create a project before you can create contracts.
            </p>
            <button
              onClick={() => navigate('/projects/new')}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
            >
              Create Project
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // No templates warning
  if (templates.length === 0) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-900 mb-2">
              No Templates Found
            </h3>
            <p className="text-red-800 mb-4">
              System templates are required to create contracts. Please contact support.
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
          <h1 className="text-3xl font-bold text-gray-900">Create New Contract</h1>
          <p className="mt-2 text-sm text-gray-600">
            Fill in the contract details and select the appropriate template.
          </p>
        </div>

        {/* Contract Form */}
        <ContractForm
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

export default NewContract;
