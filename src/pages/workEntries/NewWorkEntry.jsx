/**
 * COMPLETE WORKING VERSION - NewWorkEntry.jsx
 * Copy this entire file to: src/pages/workEntries/NewWorkEntry.jsx
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import WorkEntryForm from '../../components/workEntries/WorkEntryForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { workEntryService } from '../../services/api/workEntryService';

export default function NewWorkEntry() {
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  /**
   * ✅ FIXED - Handle save as draft
   */
  const handleSave = async (workEntryData) => {
    try {
      setSaving(true);
      setError(null);

      console.log('💾 Saving work entry as draft:', workEntryData);

      // ✅ FIX: Add status='draft'
      const draftEntry = {
        ...workEntryData,
        status: 'draft'
      };

      console.log('💾 Draft entry with status:', draftEntry);

      const result = await workEntryService.createWorkEntry(draftEntry);

      if (result.success) {
        console.log('✅ Work entry saved:', result.data.id);
        alert('Work entry saved as draft!');
        navigate(`/work`);
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
   * ✅ FIXED - Handle submit entry
   */
  const handleSubmit = async (workEntryData) => {
    try {
      setSaving(true);
      setError(null);

      console.log('📤 Submitting work entry:', workEntryData);

      // ✅ FIX: Add status='submitted' and submitted_at
      const submittedEntry = {
        ...workEntryData,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      };

      console.log('📤 Submitted entry with status:', submittedEntry);

      const result = await workEntryService.createWorkEntry(submittedEntry);

      if (result.success) {
        console.log('✅ Work entry submitted:', result.data.id);
        alert('Work entry submitted successfully!');
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
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">New Work Entry</h1>
          </div>
          <p className="text-sm text-gray-600">
            Create a new work entry by selecting a contract and filling in the required information
          </p>
        </div>

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

        <WorkEntryForm
          mode="create"
          onSave={handleSave}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            📝 How to Create a Work Entry
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Select a contract from the dropdown above</li>
            <li>Choose the entry date (defaults to today)</li>
            <li>Fill in all required fields in the form</li>
            <li>
              <strong>Save as Draft</strong> to continue later (can add photos after), or{' '}
              <strong>Submit Entry</strong> to send for approval
            </li>
          </ol>
        </div>
      </div>
    </AppLayout>
  );
}
