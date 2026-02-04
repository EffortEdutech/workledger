/**
 * WorkLedger - Edit Work Entry Page
 * 
 * Page for editing work entries.
 * Only draft entries can be edited.
 * 
 * @module pages/workEntries/EditWorkEntry
 * @created February 1, 2026 - Session 13
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import WorkEntryForm from '../../components/workEntries/WorkEntryForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { workEntryService } from '../../services/api/workEntryService';

/**
 * Edit Work Entry Page
 * 
 * Features:
 * - Load existing work entry
 * - Pre-fill form with existing data
 * - Only allow editing drafts
 * - Redirect to detail if not draft
 * - Update work entry
 */
export default function EditWorkEntry() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [workEntry, setWorkEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        const entry = result.data;
        
        // Check if entry is editable (must be draft)
        if (entry.status !== 'draft') {
          alert('Only draft entries can be edited. Redirecting to view mode.');
          navigate(`/work/${id}`);
          return;
        }

        setWorkEntry(entry);
      } else {
        setError(result.error || 'Work entry not found');
        alert('Failed to load work entry');
        navigate('/work');
      }

    } catch (err) {
      console.error('❌ Error loading work entry:', err);
      setError(err.message);
      alert('Failed to load work entry');
      navigate('/work');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle save (update)
   */
  const handleSave = async (workEntryData) => {
    try {
      setSaving(true);
      setError(null);

      console.log('💾 Updating work entry:', id);

      // Update only the data field
      const result = await workEntryService.updateWorkEntry(id, {
        entry_date: workEntryData.entry_date,
        shift: workEntryData.shift,
        data: workEntryData.data
      });

      if (result.success) {
        console.log('✅ Work entry updated');
        
        alert('Work entry updated successfully!');
        navigate('/work');
      } else {
        setError(result.error || 'Failed to update work entry');
        alert(`Failed to update: ${result.error}`);
      }

    } catch (err) {
      console.error('❌ Error updating work entry:', err);
      setError(err.message);
      alert('Failed to update work entry');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle submit (update and change status)
   */
  const handleSubmit = async (workEntryData) => {
    try {
      setSaving(true);
      setError(null);

      console.log('📤 Updating and submitting work entry:', id);

      // First update the data
      const updateResult = await workEntryService.updateWorkEntry(id, {
        entry_date: workEntryData.entry_date,
        shift: workEntryData.shift,
        data: workEntryData.data
      });

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update work entry');
      }

      // Then submit
      const submitResult = await workEntryService.submitWorkEntry(id);

      if (submitResult.success) {
        console.log('✅ Work entry submitted');
        
        alert('Work entry submitted successfully!');
        navigate(`/work/${id}`);
      } else {
        setError(submitResult.error || 'Failed to submit work entry');
        alert(`Failed to submit: ${submitResult.error}`);
      }

    } catch (err) {
      console.error('❌ Error submitting work entry:', err);
      setError(err.message);
      alert('Failed to submit work entry');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    navigate(`/work/${id}`);
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
  if (error && !workEntry) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-900">{error}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // No work entry found
  if (!workEntry) {
    return null;
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Edit Work Entry</h1>
          </div>
          <p className="text-sm text-gray-600">
            Update your work entry information
          </p>
        </div>

        {/* Work Entry Info Banner */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <p className="font-medium text-blue-900">
                {workEntry.contract?.contract_number} - {workEntry.contract?.contract_name}
              </p>
              <p className="text-sm text-blue-700">
                Entry Date: {new Date(workEntry.entry_date).toLocaleDateString('en-MY')}
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Work Entry Form */}
        <WorkEntryForm
          mode="edit"
          initialData={workEntry}
          onSave={handleSave}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </AppLayout>
  );
}
