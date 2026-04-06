/**
 * WorkLedger - Work Entry Card Component
 *
 * Displays work entry summary in card format.
 *
 * SESSION 13: Initial version
 * SESSION 13 UPDATE: RBAC button guards — Edit only if EDIT_OWN_WORK_ENTRY,
 *   Delete only if DELETE_WORK_ENTRY
 * SESSION 15 UPDATE: Ownership guard for delete (MTSB cannot delete FEST ENT)
 * SESSION 16 UPDATE:
 *   - ApprovalBadge replaces StatusBadge (richer status display with pulse)
 *   - Edit button hidden when status = 'approved' (immutable)
 *   - Rejected entries show rejection reason as subtitle
 * SESSION 19 FIX:
 *   - isCreator (created_by === user.id) added to BOTH showEdit and showDelete
 *   - Technicians can only edit/delete entries THEY created
 *   - Managers (EDIT_ANY_WORK_ENTRY) can edit/delete any entry in own org
 *   - Previously showEdit had no creator check → Amirul (tech) could see Edit
 *     on Fazrul's rejected entry and Hafiz's draft entry (same org, wrong user)
 *
 * @module components/workEntries/WorkEntryCard
 * @created February 1, 2026 - Session 13
 * @updated February 27, 2026 - Session 16: ApprovalBadge + immutability guards
 * @updated April 6, 2026    - Session 19: isCreator guard on showEdit + showDelete
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import ApprovalBadge from './ApprovalBadge';
import Button from '../common/Button';
import { useRole } from '../../hooks/useRole';
import { useAuth } from '../../context/AuthContext';

export default function WorkEntryCard({
  workEntry,
  onDelete,
  onEdit,
  onView,
  // SESSION 15: ownership props for multi-tenant delete guard
  isOwnEntry = true,
  showSourceBadge = false,
  isSubcontractorView = false,
}) {
  const navigate = useNavigate();
  const { can }  = useRole();
  const { user } = useAuth();

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
    rejection_reason,
    creator,
  } = workEntry;

  // ── Date formatting ──────────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Intl.DateTimeFormat('en-MY', {
        day: 'numeric', month: 'long', year: 'numeric',
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  // ── Preview fields from JSONB data ───────────────────────────────────────
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

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleView   = () => onView  ? onView(workEntry)   : navigate(`/work/${id}`);
  const handleEdit   = () => onEdit  ? onEdit(workEntry)   : navigate(`/work/${id}/edit`);
  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this work entry?')) {
      onDelete(workEntry);
    }
  };

  // ── Button visibility ─────────────────────────────────────────────────────
  //
  // SESSION 19 FIX: Two levels of ownership check:
  //
  //   isOwnEntry    = entry belongs to user's ORG  (prevents MTSB editing FEST ENT)
  //   isCreator     = entry was created by THIS user (prevents tech A editing tech B)
  //   isManagerOrAbove = has EDIT_ANY_WORK_ENTRY permission
  //
  // Rules:
  //   Managers/admins/owners → org-level check (isOwnEntry) is sufficient
  //   Technicians/workers/subcontractors → must be the creator (isCreator)
  //
  const isEditable       = status === 'draft' || status === 'rejected';
  const isCreator        = !!user && workEntry.created_by === user.id;
  const isManagerOrAbove = can('EDIT_ANY_WORK_ENTRY');

  // Edit: managers can edit any editable entry in own org
  //       technicians can only edit entries they created
  const showEdit = can('EDIT_OWN_WORK_ENTRY')
    && isEditable
    && !isSubcontractorView
    && (isManagerOrAbove ? isOwnEntry : isCreator);

  // Delete: draft only; same ownership rule as edit
  const showDelete = can('DELETE_WORK_ENTRY')
    && status === 'draft'
    && !isSubcontractorView
    && (isManagerOrAbove ? isOwnEntry : isCreator);

  // Creator name
  const creatorName = creator?.user_profiles?.[0]?.full_name || creator?.email || null;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className={`
      bg-white rounded-xl border p-5 transition-shadow hover:shadow-md
      ${status === 'approved' ? 'border-green-100' : ''}
      ${status === 'rejected' ? 'border-red-100' : ''}
      ${status === 'submitted' ? 'border-blue-100' : ''}
      ${status === 'draft' ? 'border-gray-200' : ''}
    `}>

      {/* Header row: date inline with ApprovalBadge, contract below */}
      <div className="mb-3">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-sm font-semibold text-gray-900">
            {formatDate(entry_date)}
            {shift && (
              <span className="ml-2 text-xs font-normal text-gray-500">({shift} shift)</span>
            )}
          </p>
          {/* SESSION 16: Badge inline with date — not floating opposite corner */}
          <ApprovalBadge status={status} size="sm" />
        </div>
        <p className="text-xs text-gray-500 truncate">
          {contract?.contract_number} — {contract?.contract_name}
        </p>
      </div>

      {/* Template name */}
      {template?.template_name && (
        <p className="text-xs text-gray-400 mb-2">{template.template_name}</p>
      )}

      {/* Creator name (visible in multi-tenant views) */}
      {showSourceBadge && creatorName && (
        <p className="text-xs text-blue-600 font-medium mb-2">
          👤 {creatorName}
        </p>
      )}

      {/* SOURCE badge for subcontractor entries in "All" tab */}
      {showSourceBadge && (
        <span className="inline-block px-2 py-0.5 text-xs font-medium
                         bg-orange-50 text-orange-700 border border-orange-100
                         rounded-full mb-2">
          Subcontractor
        </span>
      )}

      {/* Preview fields from JSONB */}
      {previewFields.length > 0 && (
        <div className="space-y-1 mb-3">
          {previewFields.map(({ key, value }) => (
            <p key={key} className="text-xs text-gray-600 truncate">
              <span className="font-medium capitalize">
                {key.replace(/[._]/g, ' ')}:
              </span>{' '}
              {String(value).substring(0, 80)}{String(value).length > 80 ? '…' : ''}
            </p>
          ))}
        </div>
      )}

      {/* SESSION 16: Rejection reason snippet (visible to technician) */}
      {status === 'rejected' && rejection_reason && (
        <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
          <p className="text-xs text-red-600 font-medium mb-0.5">Rejected</p>
          <p className="text-xs text-red-500 truncate">
            {rejection_reason}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">

        {/* View — always visible */}
        <button
          onClick={handleView}
          className="flex-1 py-1.5 text-xs font-medium text-gray-700
                     bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          View
        </button>

        {/* Edit — own draft/rejected only; hidden for approved/submitted */}
        {showEdit && (
          <button
            onClick={handleEdit}
            className="flex-1 py-1.5 text-xs font-medium text-primary-700
                       bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            Edit
          </button>
        )}

        {/* Delete — own draft only */}
        {showDelete && (
          <button
            onClick={handleDelete}
            className="flex-1 py-1.5 text-xs font-medium text-red-700
                       bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
