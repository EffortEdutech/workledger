/**
 * WorkLedger - Work Entry Detail Page (Updated for Session 15)
 * 
 * Read-only view of work entry with all details including photos.
 * Now displays photos using PhotoGallery component.
 * 
 * @module pages/workEntries/WorkEntryDetail
 * @created February 1, 2026 - Session 13
 * @updated February 2, 2026 - Session 15 (Added photo/signature display)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import StatusBadge from '../../components/workEntries/StatusBadge';
import PhotoGallery from '../../components/attachments/PhotoGallery';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { workEntryService } from '../../services/api/workEntryService';
import { attachmentService } from '../../services/api/attachmentService';

/**
 * Work Entry Detail Page
 * 
 * Features:
 * - Read-only view of all work entry data
 * - Contract information display
 * - Status and timeline
 * - Action buttons (Edit, Delete, Submit)
 * - Field values from JSONB data
 * - Photo gallery for photo fields (Session 15)
 * - Signature display for signature fields (Session 15)
 */
export default function WorkEntryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [workEntry, setWorkEntry] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load work entry
  useEffect(() => {
    loadWorkEntry();
    loadAttachments();
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
   * Load attachments for this work entry
   */
  const loadAttachments = async () => {
    try {
      const result = await attachmentService.getAttachments(id);
      if (result.success) {
        setAttachments(result.data);
      }
    } catch (err) {
      console.error('❌ Error loading attachments:', err);
    }
  };

  /**
   * Handle delete
   */
  const handleDelete = async () => {
    if (!window.confirm('Delete this work entry? This cannot be undone.')) {
      return;
    }

    try {
      const result = await workEntryService.deleteWorkEntry(id);

      if (result.success) {
        navigate('/work');
      } else {
        alert(`Delete failed: ${result.error}`);
      }
    } catch (err) {
      console.error('❌ Error deleting work entry:', err);
      alert(`Error: ${err.message}`);
    }
  };

  /**
   * Handle submit
   */
  const handleSubmit = async () => {
    if (!window.confirm('Submit this work entry for approval?')) {
      return;
    }

    try {
      const result = await workEntryService.submitWorkEntry(id);

      if (result.success) {
        // Reload to show updated status
        loadWorkEntry();
      } else {
        alert(`Submit failed: ${result.error}`);
      }
    } catch (err) {
      console.error('❌ Error submitting work entry:', err);
      alert(`Error: ${err.message}`);
    }
  };

  /**
   * Render field value based on field type
   */
  const renderFieldValue = (field, section) => {
    const fieldPath = `${section.section_id}.${field.field_id}`;
    const value = workEntry.data?.[fieldPath];

    if (value === undefined || value === null || value === '') {
      return <span className="text-gray-400 italic">Not provided</span>;
    }

    // Handle different field types
    switch (field.field_type) {
      case 'checkbox':
        return value ? '✓ Yes' : '✗ No';

      case 'date':
        return new Date(value).toLocaleDateString();

      case 'datetime':
        return new Date(value).toLocaleString();

      case 'photo':
        // Get attachments for this field
        const photoAttachments = attachments.filter(
          a => a.field_id === fieldPath && a.file_type === 'photo'
        );
        
        if (photoAttachments.length === 0) {
          return <span className="text-gray-400 italic">No photos</span>;
        }

        return (
          <div className="mt-2">
            <PhotoGallery
              attachments={photoAttachments}
              readOnly={true}
              columns={3}
            />
          </div>
        );

      case 'signature':
        // Get signature attachment for this field
        const signatureAttachment = attachments.find(
          a => a.field_id === fieldPath && a.file_type === 'signature'
        );

        if (!signatureAttachment) {
          return <span className="text-gray-400 italic">Not signed</span>;
        }

        return (
          <div className="mt-2">
            <img
              src={signatureAttachment.storage_url}
              alt="Signature"
              className="max-w-xs border border-gray-300 rounded-lg bg-white p-2"
            />
          </div>
        );

      case 'textarea':
        return (
          <div className="whitespace-pre-wrap text-sm text-gray-700">
            {value}
          </div>
        );

      default:
        return <span className="text-gray-900">{value}</span>;
    }
  };

  /**
   * Render data fields from template
   */
  const renderDataFields = () => {
    if (!workEntry.template?.fields_schema?.sections) {
      return null;
    }

    return workEntry.template.fields_schema.sections.map((section) => (
      <div key={section.section_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Section Header */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {section.section_name}
        </h3>

        {/* Section Fields */}
        <div className="space-y-4">
          {section.fields.map((field) => (
            <div key={field.field_id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
              <dt className="text-sm font-medium text-gray-700 mb-1">
                {field.field_name}
              </dt>
              <dd className="text-sm text-gray-900">
                {renderFieldValue(field, section)}
              </dd>
            </div>
          ))}
        </div>
      </div>
    ));
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
        <div className="max-w-5xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-900">{error || 'Work entry not found'}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Work Entry Details</h1>
        </div>

        {/* Entry Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Contract</p>
                <p className="text-lg font-semibold text-gray-900">
                  {workEntry.contract?.contract_number || 'N/A'}
                </p>
                <p className="text-sm text-gray-700">
                  {workEntry.contract?.contract_name}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="text-gray-900">
                  {new Date(workEntry.entry_date).toLocaleDateString()}
                </p>
              </div>

              {workEntry.shift && (
                <div>
                  <p className="text-sm text-gray-600">Shift</p>
                  <p className="text-gray-900">{workEntry.shift}</p>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <StatusBadge status={workEntry.status} />
              </div>

              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-gray-900">
                  {new Date(workEntry.created_at).toLocaleString()}
                </p>
              </div>

              {workEntry.submitted_at && (
                <div>
                  <p className="text-sm text-gray-600">Submitted</p>
                  <p className="text-gray-900">
                    {new Date(workEntry.submitted_at).toLocaleString()}
                  </p>
                </div>
              )}

              {workEntry.approved_at && (
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-gray-900">
                    {new Date(workEntry.approved_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Approval Remarks */}
          {workEntry.approval_remarks && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600 mb-1">Approval Remarks</p>
              <p className="text-gray-900">{workEntry.approval_remarks}</p>
            </div>
          )}

          {/* Rejection Reason */}
          {workEntry.rejection_reason && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600 mb-1">Rejection Reason</p>
              <p className="text-red-900">{workEntry.rejection_reason}</p>
            </div>
          )}
        </div>

        {/* Work Entry Data */}
        <div className="space-y-6 mb-6">
          {renderDataFields()}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pb-6">
          {workEntry.status === 'draft' && (
            <>
              <Button
                onClick={() => navigate(`/work/${id}/edit`)}
                variant="primary"
              >
                Edit
              </Button>
              <Button
                onClick={handleSubmit}
                variant="primary"
              >
                Submit for Approval
              </Button>
              <Button
                onClick={handleDelete}
                variant="danger"
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
