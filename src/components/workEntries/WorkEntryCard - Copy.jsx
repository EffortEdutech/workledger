/**
 * WorkLedger - Work Entry Card Component
 *
 * Displays work entry summary in card format.
 *
 * SESSION 13 UPDATE: Button Guards
 *   - Edit button: shown only if can('EDIT_OWN_WORK_ENTRY')
 *   - Delete button: shown only if can('DELETE_WORK_ENTRY')
 *   - Uses useRole() directly — no prop drilling needed
 *
 * @module components/workEntries/WorkEntryCard
 * @created February 1, 2026 - Session 13
 * @updated February 21, 2026 - Session 13: Permission guards on action buttons
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import Button from '../common/Button';
import { useRole } from '../../hooks/useRole';

export default function WorkEntryCard({ workEntry, onDelete, onEdit, onView }) {
  const navigate = useNavigate();
  const { can } = useRole();

  if (!workEntry) return null;

  const {
    id,
    entry_date,
    shift,
    status,
    contract,
    template,
    data,
    created_at,
  } = workEntry;

  // ── Date formatting ──────────────────────────────────────
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Intl.DateTimeFormat('en-MY', {
        day: 'numeric', month: 'long', year: 'numeric',
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  // ── Preview fields from JSONB data ───────────────────────
  const getPreviewFields = () => {
    if (!data || typeof data !== 'object') return [];
    const previews = [];
    const keys = Object.keys(data);
    const priorityPatterns = ['asset', 'equipment', 'location', 'description', 'incident', 'work_done', 'findings', 'remarks'];
    for (const pattern of priorityPatterns) {
      const matchingKey = keys.find(k => k.toLowerCase().includes(pattern));
      if (matchingKey && data[matchingKey]) {
        previews.push({ key: matchingKey, value: data[matchingKey] });
        if (previews.length >= 2) break;
      }
    }
    return previews;
  };

  const previewFields = getPreviewFields();

  // ── Handlers ─────────────────────────────────────────────
  const handleView   = () => onView  ? onView(workEntry)   : navigate(`/work/${id}`);
  const handleEdit   = () => onEdit  ? onEdit(workEntry)   : navigate(`/work/${id}/edit`);
  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this work entry?')) {
      onDelete(workEntry);
    }
  };

  // Can this user edit THIS entry?
  // Managers+ can edit any; field workers can only edit drafts they created.
  // We show the button if they have at least EDIT_OWN permission;
  // the service/RLS will enforce the actual rules.
  const showEdit   = can('EDIT_OWN_WORK_ENTRY') && status === 'draft';
  const showDelete = can('DELETE_WORK_ENTRY');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">

      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {formatDate(entry_date)}
            {shift && <span className="ml-2 text-xs text-gray-500">({shift} shift)</span>}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {contract?.contract_number} — {contract?.contract_name}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Template name */}
      {template?.template_name && (
        <p className="text-xs text-gray-400 mb-3">{template.template_name}</p>
      )}

      {/* Preview fields */}
      {previewFields.length > 0 && (
        <div className="space-y-1 mb-4">
          {previewFields.map(({ key, value }) => (
            <p key={key} className="text-xs text-gray-600 truncate">
              <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span> {String(value)}
            </p>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        {/* View — always visible */}
        <button
          onClick={handleView}
          className="flex-1 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          View
        </button>

        {/* ── GUARDED: Edit — drafts only, with edit permission ── */}
        {showEdit && (
          <button
            onClick={handleEdit}
            className="flex-1 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            Edit
          </button>
        )}

        {/* ── GUARDED: Delete — managers+ only ── */}
        {showDelete && (
          <button
            onClick={handleDelete}
            className="flex-1 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
