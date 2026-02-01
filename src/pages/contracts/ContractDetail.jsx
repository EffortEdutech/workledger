/**
 * WorkLedger - Contract Detail Page
 * 
 * Page for viewing contract details with edit and delete options.
 * 
 * @module pages/contracts/ContractDetail
 * @created January 31, 2026 - Session 10
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import ContractTypeBadge from '../../components/contracts/ContractTypeBadge';
import { contractService } from '../../services/api/contractService';
import { 
  PencilIcon, 
  TrashIcon,
  CalendarIcon,
  DocumentTextIcon,
  ClockIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

export function ContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load contract
  useEffect(() => {
    loadContract();
  }, [id]);

  const loadContract = async () => {
    try {
      setLoading(true);
      setError(null);

      const contractData = await contractService.getContract(id);
      
      if (!contractData) {
        setError('Contract not found or you do not have permission to view it.');
        setLoading(false);
        return;
      }

      setContract(contractData);
      console.log('✅ Loaded contract:', contractData.contract_number);
    } catch (err) {
      console.error('❌ Error loading contract:', err);
      setError('Failed to load contract. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = () => {
    navigate(`/contracts/${id}/edit`);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete contract "${contract.contract_number}"?`)) {
      return;
    }

    try {
      await contractService.deleteContract(id);
      console.log('✅ Contract deleted successfully');
      navigate('/contracts');
    } catch (error) {
      console.error('❌ Error deleting contract:', error);
      alert('Failed to delete contract. Please try again.');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Format datetime
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Status color mapping
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800 border-gray-200',
    active: 'bg-green-100 text-green-800 border-green-200',
    suspended: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200'
  };

  // Status labels
  const statusLabels = {
    draft: 'Draft',
    active: 'Active',
    suspended: 'Suspended',
    completed: 'Completed'
  };

  // Reporting frequency labels
  const frequencyLabels = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    adhoc: 'Ad-hoc'
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
        <div className="max-w-4xl mx-auto">
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
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {contract.contract_number}
                </h1>
                <span 
                  className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border ${
                    statusColors[contract.status] || statusColors.active
                  }`}
                >
                  {statusLabels[contract.status] || 'Active'}
                </span>
                <ContractTypeBadge category={contract.contract_category} />
              </div>
              <p className="text-lg text-gray-700">{contract.contract_name}</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={handleEdit}
              >
                <PencilIcon className="h-5 w-5 mr-2" />
                Edit
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contract Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Contract Information
              </h2>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Project</dt>
                  <dd className="text-sm text-gray-900">
                    <span className="font-medium">{contract.project?.project_code}</span>
                    <br />
                    <span className="text-gray-600">{contract.project?.project_name}</span>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Organization</dt>
                  <dd className="text-sm text-gray-900">
                    {contract.project?.organizations?.name || 'N/A'}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Valid From</dt>
                  <dd className="flex items-center text-sm text-gray-900">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                    {formatDate(contract.valid_from)}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Valid Until</dt>
                  <dd className="flex items-center text-sm text-gray-900">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                    {formatDate(contract.valid_until)}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Reporting Frequency</dt>
                  <dd className="text-sm text-gray-900">
                    {frequencyLabels[contract.reporting_frequency] || contract.reporting_frequency}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Requires Approval</dt>
                  <dd className="text-sm text-gray-900">
                    {contract.requires_approval ? 'Yes' : 'No'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Template Information */}
            {contract.template && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Template Information
                </h2>

                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">Template Name</dt>
                    <dd className="text-sm text-gray-900">{contract.template.template_name}</dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">Template ID</dt>
                    <dd className="text-sm font-mono text-gray-600">{contract.template.template_id}</dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">Contract Category</dt>
                    <dd className="text-sm text-gray-900">
                      <ContractTypeBadge category={contract.template.contract_category} showFullName />
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {/* SLA Configuration (if applicable) */}
            {contract.sla_tier && (
              <div className="bg-indigo-50 rounded-lg shadow p-6 border border-indigo-200">
                <h2 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  SLA Configuration
                </h2>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-indigo-700 mb-1">SLA Tier</dt>
                    <dd className="text-sm font-semibold text-indigo-900">{contract.sla_tier}</dd>
                  </div>

                  {contract.sla_response_time_mins && (
                    <div>
                      <dt className="text-sm font-medium text-indigo-700 mb-1">Response Time</dt>
                      <dd className="text-sm text-indigo-900">{contract.sla_response_time_mins} minutes</dd>
                    </div>
                  )}

                  {contract.sla_resolution_time_hours && (
                    <div>
                      <dt className="text-sm font-medium text-indigo-700 mb-1">Resolution Time</dt>
                      <dd className="text-sm text-indigo-900">{contract.sla_resolution_time_hours} hours</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Maintenance Configuration (if applicable) */}
            {contract.maintenance_cycle && (
              <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
                <h2 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                  <WrenchScrewdriverIcon className="h-5 w-5 mr-2" />
                  Maintenance Configuration
                </h2>

                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-green-700 mb-1">Maintenance Cycle</dt>
                    <dd className="text-sm text-green-900">{contract.maintenance_cycle}</dd>
                  </div>

                  {contract.asset_categories && contract.asset_categories.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-green-700 mb-1">Asset Categories</dt>
                      <dd className="flex flex-wrap gap-2 mt-2">
                        {contract.asset_categories.map((category, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700"
                          >
                            {category}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Work Entries Placeholder */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Work Entries
              </h2>
              <p className="text-sm text-gray-500">
                Work entry management will be implemented in Session 13.
              </p>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Stats
              </h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Work Entries</dt>
                  <dd className="text-sm font-medium text-gray-900">0</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Pending Approval</dt>
                  <dd className="text-sm font-medium text-gray-900">0</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Attachments</dt>
                  <dd className="text-sm font-medium text-gray-900">0</dd>
                </div>
              </dl>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Metadata
              </h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">Created</dt>
                  <dd className="text-gray-900 font-mono text-xs mt-1">
                    {formatDateTime(contract.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Last Updated</dt>
                  <dd className="text-gray-900 font-mono text-xs mt-1">
                    {formatDateTime(contract.updated_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Contract ID</dt>
                  <dd className="text-gray-900 font-mono text-xs mt-1 break-all">
                    {contract.id}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default ContractDetail;
