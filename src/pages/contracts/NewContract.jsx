/**
 * WorkLedger - New Contract Page
 *
 * Page for creating a new contract.
 *
 * SESSION 13 FIX: Templates now loaded via templateService.getTemplates()
 * instead of a direct supabase query. The direct query was silently returning
 * [] due to RLS on the templates table.
 *
 * @module pages/contracts/NewContract
 * @created January 31, 2026 - Session 10
 * @updated February 21, 2026 - Session 13: use templateService for templates
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import ContractForm from '../../components/contracts/ContractForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { contractService } from '../../services/api/contractService';
import { projectService } from '../../services/api/projectService';
import { templateService } from '../../services/api/templateService';
import { useOrganization } from '../../context/OrganizationContext';

export function NewContract() {
  const navigate = useNavigate();
  const { currentOrg } = useOrganization();

  const [projects, setProjects]     = useState([]);
  const [templates, setTemplates]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentOrg?.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      const orgId = currentOrg?.id ?? null;

      const [projectsData, templatesData] = await Promise.all([
        projectService.getUserProjects(orgId),
        templateService.getTemplates(),          // ← FIXED (no RLS issue)
      ]);

      setProjects(projectsData   || []);
      setTemplates(templatesData || []);

      console.log('✅ Loaded projects:', projectsData?.length || 0);
      console.log('✅ Loaded templates:', templatesData?.length || 0);
    } catch (err) {
      console.error('❌ Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (projectId, data) => {
    try {
      setSubmitting(true);

      // 1. Extract template_ids from payload (not a DB column)
      const { template_ids = [], ...contractData } = data;

      console.log('📝 Creating contract:', contractData);
      const result = await contractService.createContract(projectId, contractData);

      if (!result.success) {
        alert(result.error || 'Failed to create contract. Please try again.');
        return;
      }

      const contractId = result.data.id;
      console.log('✅ Contract created:', contractId);

      // 2. Assign selected templates to the junction table.
      //    First template in the list becomes the default.
      if (template_ids.length > 0) {
        for (let i = 0; i < template_ids.length; i++) {
          await contractService.addContractTemplate(contractId, template_ids[i], {
            isDefault: i === 0,
          });
        }
        console.log('✅ Templates assigned:', template_ids.length);
      }

      navigate(`/contracts/${contractId}`);
    } catch (err) {
      console.error('❌ Error creating contract:', err);
      alert('Failed to create contract. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => navigate('/contracts');

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">New Contract</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a new contract and link it to a template.
            {currentOrg && (
              <span className="ml-1 font-medium text-primary-700">
                — {currentOrg.name}
              </span>
            )}
          </p>
        </div>

        <ContractForm
          projects={projects}
          templates={templates}
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={submitting}
        />
      </div>
    </AppLayout>
  );
}

export default NewContract;
