/**
 * WorkLedger - New Work Entry Page
 * 
 * Page for creating new work entries.
 * Multi-step workflow: Select contract → Fill form → Submit
 * 
 * @module pages/workEntries/NewWorkEntry
 * @created February 1, 2026 - Session 13
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import WorkEntryForm from '../../components/workEntries/WorkEntryForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { workEntryService } from '../../services/api/workEntryService';

/**
 * New Work Entry Page
 * 
 * Workflow:
 * 1. User selects contract (WorkEntryForm handles this)
 * 2. Template loads automatically
 * 3. User fills DynamicForm
 * 4. Save as draft OR submit
 * 5. Redirect to list on success
 */
export default function NewWorkEntry() {
  const navigate = useNavigate();

  // State
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handle save as draft
   */
  const handleSave = async (workEntryData) => {
    try {
      setSaving(true);
      setError(null);

      console.log('💾 Saving work entry as draft:', workEntryData);

      const result = await workEntryService.createWorkEntry(workEntryData);

      if (result.success) {
        console.log('✅ Work entry saved:', result.data.id);
        
        // Show success message
        alert('Work entry saved as draft!');
        
        // Redirect to list
        navigate('/work');
      } else {
        setError(result.error || 'Failed to save work entry');
        alert(`Failed to save: ${result.error}`);
      }

    } catch (err) {
      console.error('❌ Error saving work entry:', err);
      setError(err.message || 'Failed to save work entry');
      alert('Failed to save work entry');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle submit entry
   */
  const handleSubmit = async (workEntryData) => {
    try {
      setSaving(true);
      setError(null);

      console.log('📤 Submitting work entry:', workEntryData);

      const result = await workEntryService.createWorkEntry(workEntryData);

      if (result.success) {
        console.log('✅ Work entry submitted:', result.data.id);
        
        // Show success message
        alert('Work entry submitted successfully!');
        
        // Redirect to detail page
        navigate(`/work/${result.data.id}`);
      } else {
        setError(result.error || 'Failed to submit work entry');
        alert(`Failed to submit: ${result.error}`);
      }

    } catch (err) {
      console.error('❌ Error submitting work entry:', err);
      setError(err.message || 'Failed to submit work entry');
      alert('Failed to submit work entry');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    if (window.confirm('Are you sure? Any unsaved changes will be lost.')) {
      navigate('/work');
    }
  };

  // Loading state
  if (saving) {
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
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">New Work Entry</h1>
          </div>
          <p className="text-sm text-gray-600">
            Create a new work entry by selecting a contract and filling in the required information
          </p>
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
          mode="create"
          onSave={handleSave}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            📝 How to Create a Work Entry
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Select a contract from the dropdown above</li>
            <li>Choose the entry date (defaults to today)</li>
            <li>Fill in all required fields in the form</li>
            <li>
              <strong>Save as Draft</strong> to continue later, or{' '}
              <strong>Submit Entry</strong> to send for approval
            </li>
          </ol>
          <div className="mt-4 p-3 bg-blue-100 rounded">
            <p className="text-xs text-blue-900">
              💡 <strong>Tip:</strong> You can save your work as a draft and come back to it later. 
              Draft entries can be edited until you submit them.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
