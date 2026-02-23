/**
 * WorkLedger - Work Entry List Component
 *
 * Pure display component — renders work entry cards only.
 * ALL filtering is owned by WorkEntryListPage (parent).
 *
 * SESSION 14 FIX: Removed duplicate filter state + filter UI.
 * Previously this component had its own filters that duplicated
 * the filters already in WorkEntryListPage, causing two sets
 * of filter controls to appear on screen simultaneously.
 *
 * @module components/workEntries/WorkEntryList
 * @created February 1, 2026 - Session 13
 * @updated February 22, 2026 - Session 14: removed duplicate filters
 */

import React from 'react';
import WorkEntryCard from './WorkEntryCard';

export default function WorkEntryList({
  workEntries = [],
  onDelete,
  onEdit,
  onView,
}) {
  if (workEntries.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No work entries found
        </h3>
        <p className="text-gray-600">
          Try adjusting your filters, or create a new work entry.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {workEntries.map((workEntry) => (
        <WorkEntryCard
          key={workEntry.id}
          workEntry={workEntry}
          onDelete={onDelete}
          onEdit={onEdit}
          onView={onView}
        />
      ))}
    </div>
  );
}
