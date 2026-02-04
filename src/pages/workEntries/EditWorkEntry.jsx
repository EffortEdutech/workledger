/**
 * WorkLedger - Edit Work Entry Page (Updated for Session 15)
 * 
 * Edit existing work entry (draft only).
 * Now passes workEntryId to enable photo/signature editing.
 * 
 * @module pages/workEntries/EditWorkEntry
 * @created February 1, 2026 - Session 13
 * @updated February 2, 2026 - Session 15 (Added workEntryId support)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import DynamicForm from '../../components/templates/DynamicForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { workEntryService } from '../../services/api/workEntryService';

/**
 * Edit Work Entry Page
 * 
 * Features:
 * - Edit draft work entries
 * - Template-driven form (DynamicForm)
 * - Photo/signature editing support (Session 15)
 * - Validation before save
 * - Cancel returns to detail view
 */
export default function EditWorkEntry() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [workEntry, setWorkEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load work entry
  useEffect(() => {
    loadWorkEntry();
  }, [id]);

  /**
   * Load work entry data
   */
  const loadWorkEntry = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await workEntryService.getWorkEntry(id);

      if (result.success) {
        // Check if entry is editable
        if (result.data.status !== 'draft') {
          setError('Only draft entries can be edited');
          return;
        }

        setWorkEntry(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('❌ Error loading work entry:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (formData) => {
    try {
      console.log('💾 Updating work entry:', formData);

      const result = await workEntryService.updateWorkEntry(id, {
        data: formData
      });

      if (result.success) {
        console.log('✅ Work entry updated');
        navigate(`/work/${id}`);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('❌ Error updating work entry:', err);
      throw err;
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
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  // Error state
  if (error || !workEntry) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-900">{error || 'Work entry not found'}</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Edit Work Entry</h1>
          <p className="text-gray-600 mt-2">
            {workEntry.contract?.contract_number} - {workEntry.contract?.contract_name}
          </p>
        </div>

        {/* Edit Form */}
        {workEntry.template && (
          <DynamicForm
            template={workEntry.template}
            contract={workEntry.contract}
            initialData={workEntry.data}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel="Save Changes"
            workEntryId={id} // ← Pass workEntryId to enable photo/signature editing
          />
        )}
      </div>
    </AppLayout>
  );
}
