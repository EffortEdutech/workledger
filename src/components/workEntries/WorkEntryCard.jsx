/**
 * WorkLedger - Work Entry Card Component
 * 
 * Displays work entry summary in a card format.
 * Shows contract info, entry date, status, and action buttons.
 * 
 * @module components/workEntries/WorkEntryCard
 * @created February 1, 2026 - Session 13
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import Button from '../common/Button';

/**
 * Work Entry Card - Summary display of work entry
 * 
 * Features:
 * - Entry date prominently displayed
 * - Contract number and name
 * - Status badge
 * - Key field preview (from data JSONB)
 * - Action buttons (View, Edit, Delete)
 * - Conditional actions based on status
 */
export default function WorkEntryCard({ workEntry, onDelete, onEdit, onView }) {
  const navigate = useNavigate();

  if (!workEntry) {
    return null;
  }

  // Extract data
  const { 
    id, 
    entry_date, 
    shift,
    status, 
    contract, 
    template,
    data,
    created_at
  } = workEntry;

  // Format entry date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-MY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      return dateString;
    }
  };

  // Extract key preview fields from data
  const getPreviewFields = () => {
    if (!data || typeof data !== 'object') {
      return [];
    }

    const previews = [];
    
    // Try to extract some meaningful fields
    // Look for common field patterns
    const keys = Object.keys(data);
    
    // Priority fields to show
    const priorityPatterns = [
      'asset', 'equipment', 'location', 'description', 
      'incident', 'work_done', 'findings', 'remarks'
    ];

    for (const pattern of priorityPatterns) {
      const matchingKey = keys.find(key => 
        key.toLowerCase().includes(pattern)
      );
      
      if (matchingKey && data[matchingKey]) {
        previews.push({
          key: matchingKey,
          value: data[matchingKey]
        });
        
        if (previews.length >= 2) break; // Limit to 2 preview fields
      }
    }

    return previews;
  };

  const previewFields = getPreviewFields();

  // Handlers
  const handleView = () => {
    if (onView) {
      onView(workEntry);
    } else {
      navigate(`/work/${id}`);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(workEntry);
    } else {
      navigate(`/work/${id}/edit`);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      if (window.confirm('Are you sure you want to delete this work entry?')) {
        onDelete(workEntry);
      }
    }
  };

  // Determine available actions based on status
  const canEdit = status === 'draft';
  const canDelete = status === 'draft';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header: Date and Status */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📅</span>
            <h3 className="text-lg font-semibold text-gray-900">
              {formatDate(entry_date)}
            </h3>
          </div>
          {shift && (
            <p className="text-sm text-gray-500">
              Shift: <span className="font-medium">{shift}</span>
            </p>
          )}
        </div>
        <StatusBadge status={status} showIcon={true} />
      </div>

      {/* Contract Information */}
      <div className="mb-3 pb-3 border-b border-gray-100">
        <div className="flex items-start gap-2">
          <span className="text-xl">📋</span>
          <div>
            <p className="font-medium text-gray-900">
              {contract?.contract_number || 'N/A'}
            </p>
            <p className="text-sm text-gray-600">
              {contract?.contract_name || 'No contract name'}
            </p>
            {contract?.project && (
              <p className="text-xs text-gray-500 mt-1">
                {contract.project.client_name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Template Info */}
      {template && (
        <div className="mb-3">
          <p className="text-xs text-gray-500">
            Template: <span className="font-medium">{template.template_name}</span>
          </p>
        </div>
      )}

      {/* Preview Fields (Key data from JSONB) */}
      {previewFields.length > 0 && (
        <div className="mb-3 space-y-1">
          {previewFields.map((field, index) => (
            <div key={index} className="text-sm">
              <span className="text-gray-500">
                {field.key.split('.').pop().replace(/_/g, ' ')}:
              </span>
              <span className="ml-2 text-gray-700 font-medium">
                {typeof field.value === 'boolean' 
                  ? (field.value ? 'Yes' : 'No')
                  : String(field.value).substring(0, 50)
                }
                {String(field.value).length > 50 ? '...' : ''}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Created Date */}
      <div className="text-xs text-gray-400 mb-3">
        Created: {formatDate(created_at)}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleView}
        >
          👁️ View
        </Button>

        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
          >
            ✏️ Edit
          </Button>
        )}

        {canDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            🗑️ Delete
          </Button>
        )}
      </div>
    </div>
  );
}
