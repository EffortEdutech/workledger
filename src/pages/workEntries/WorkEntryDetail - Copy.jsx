/**
 * WorkLedger - Work Entry Detail Page
 * 
 * Read-only view of work entry with all details.
 * Shows contract info, status, timestamps, and all field values.
 * 
 * @module pages/workEntries/WorkEntryDetail
 * @created February 1, 2026 - Session 13
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import StatusBadge from '../../components/workEntries/StatusBadge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { workEntryService } from '../../services/api/workEntryService';

/**
 * Work Entry Detail Page
 * 
 * Features:
 * - Read-only view of all work entry data
 * - Contract information display
 * - Status and timeline
 * - Action buttons (Edit, Delete, Submit)
 * - Field values from JSONB data
 */
export default function WorkEntryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [workEntry, setWorkEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load work entry on mount
  useEffect(() => {
    loadWorkEntry();
  }, [id]);

  /**
   * Load work entry by ID
   */
  const loadWorkEntry = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📄 Loading work entry:', id);

      const result = await workEntryService.getWorkEntry(id);

      if (result.success) {
        setWorkEntry(result.data);
      } else {
        setError(result.error || 'Work entry not found');
      }

    } catch (err) {
      console.error('❌ Error loading work entry:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle delete
   */
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this work entry?')) {
      return;
    }

    try {
      const result = await workEntryService.deleteWorkEntry(id);

      if (result.success) {
        alert('Work entry deleted successfully');
        navigate('/work');
      } else {
        alert(`Failed to delete: ${result.error}`);
      }
    } catch (err) {
      console.error('Error deleting work entry:', err);
      alert('Failed to delete work entry');
    }
  };

  /**
   * Handle submit
   */
  const handleSubmit = async () => {
    if (!window.confirm('Submit this work entry? You won\'t be able to edit it after submission.')) {
      return;
    }

    try {
      const result = await workEntryService.submitWorkEntry(id);

      if (result.success) {
        alert('Work entry submitted successfully');
        // Reload to show updated status
        loadWorkEntry();
      } else {
        alert(`Failed to submit: ${result.error}`);
      }
    } catch (err) {
      console.error('Error submitting work entry:', err);
      alert('Failed to submit work entry');
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-MY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return dateString;
    }
  };

  /**
   * Render field value based on type
   */
  const renderFieldValue = (value) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">Not provided</span>;
    }

    if (typeof value === 'boolean') {
      return value ? '✅ Yes' : '❌ No';
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'object') {
      return <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(value, null, 2)}</pre>;
    }

    return String(value);
  };

  /**
   * Render data fields grouped by section
   */
  const renderDataFields = () => {
    if (!workEntry?.data || !workEntry?.template?.fields_schema) {
      return null;
    }

    const { data } = workEntry;
    const { sections } = workEntry.template.fields_schema;

    return sections.map((section) => (
      <div key={section.section_id} className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">
          {section.section_name}
        </h3>
        {section.description && (
          <p className="text-sm text-gray-600 mb-3">{section.description}</p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {section.fields?.map((field) => {
            const fieldPath = `${section.section_id}.${field.field_id}`;
            const value = data[fieldPath];

            return (
              <div key={field.field_id} className="bg-gray-50 p-3 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.field_name}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="text-sm text-gray-900">
                  {renderFieldValue(value)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ));
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
  if (error || !workEntry) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-900">{error || 'Work entry not found'}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Determine available actions
  const canEdit = workEntry.status === 'draft';
  const canDelete = workEntry.status === 'draft';
  const canSubmit = workEntry.status === 'draft';

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Work Entry Details</h1>
        </div>

      {/* Status and Actions Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex items-center justify-between">
        <StatusBadge status={workEntry.status} showIcon={true} size="lg" />
        
        <div className="flex gap-2">
          {canEdit && (
            <Button
              variant="outline"
              onClick={() => navigate(`/work/${id}/edit`)}
            >
              ✏️ Edit
            </Button>
          )}
          
          {canSubmit && (
            <Button onClick={handleSubmit}>
              📤 Submit
            </Button>
          )}
          
          {canDelete && (
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              🗑️ Delete
            </Button>
          )}
        </div>
      </div>

      {/* Contract Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Contract Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contract Number
            </label>
            <p className="text-sm text-gray-900 font-medium">
              {workEntry.contract?.contract_number || 'N/A'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contract Name
            </label>
            <p className="text-sm text-gray-900">
              {workEntry.contract?.contract_name || 'N/A'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client
            </label>
            <p className="text-sm text-gray-900">
              {workEntry.contract?.project?.client_name || 'N/A'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            <p className="text-sm text-gray-900">
              {workEntry.contract?.project?.project_name || 'N/A'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entry Date
            </label>
            <p className="text-sm text-gray-900 font-medium">
              {formatDate(workEntry.entry_date)}
            </p>
          </div>

          {workEntry.shift && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shift
              </label>
              <p className="text-sm text-gray-900">
                {workEntry.shift}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Template Information */}
      {workEntry.template && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Template</h2>
          <p className="text-sm text-gray-700">
            {workEntry.template.template_name}
          </p>
        </div>
      )}

      {/* Work Entry Data (Fields from Template) */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Work Details</h2>
        {renderDataFields()}
      </div>

      {/* Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Timeline</h2>
        
        <div className="space-y-3">
          {/* Created */}
          <div className="flex items-start gap-3">
            <span className="text-xl">📝</span>
            <div>
              <p className="text-sm font-medium text-gray-900">Created</p>
              <p className="text-xs text-gray-600">
                {formatDate(workEntry.created_at)}
                {workEntry.creator?.user_profiles?.[0]?.full_name && (
                  <> by {workEntry.creator.user_profiles[0].full_name}</>
                )}
              </p>
            </div>
          </div>

          {/* Submitted */}
          {workEntry.submitted_at && (
            <div className="flex items-start gap-3">
              <span className="text-xl">📤</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Submitted</p>
                <p className="text-xs text-gray-600">
                  {formatDate(workEntry.submitted_at)}
                  {workEntry.submitter?.user_profiles?.[0]?.full_name && (
                    <> by {workEntry.submitter.user_profiles[0].full_name}</>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Approved */}
          {workEntry.approved_at && (
            <div className="flex items-start gap-3">
              <span className="text-xl">✅</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Approved</p>
                <p className="text-xs text-gray-600">
                  {formatDate(workEntry.approved_at)}
                  {workEntry.approver?.user_profiles?.[0]?.full_name && (
                    <> by {workEntry.approver.user_profiles[0].full_name}</>
                  )}
                </p>
                {workEntry.approval_remarks && (
                  <p className="text-xs text-gray-700 mt-1 italic">
                    "{workEntry.approval_remarks}"
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Rejected */}
          {workEntry.rejected_at && (
            <div className="flex items-start gap-3">
              <span className="text-xl">❌</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Rejected</p>
                <p className="text-xs text-gray-600">
                  {formatDate(workEntry.rejected_at)}
                  {workEntry.rejector?.user_profiles?.[0]?.full_name && (
                    <> by {workEntry.rejector.user_profiles[0].full_name}</>
                  )}
                </p>
                {workEntry.rejection_reason && (
                  <p className="text-xs text-red-700 mt-1 italic">
                    Reason: "{workEntry.rejection_reason}"
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </AppLayout>
  );
}
