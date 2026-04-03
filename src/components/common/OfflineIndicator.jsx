/**
 * WorkLedger — Offline Indicator Banner
 *
 * A slim full-width banner rendered inside <main> (AppLayout).
 * Shows nothing when online and idle.
 * Three states: offline (red), syncing (blue), sync-error (amber).
 *
 * Placement: inside <main>, OUTSIDE the max-w-7xl container,
 * so it stretches edge-to-edge without layout shift.
 *
 * @module components/common/OfflineIndicator
 * @created March 4, 2026 — Session 18
 *
 * File destination: src/components/common/OfflineIndicator.jsx
 */

import React from 'react';
import { useOffline } from '../../hooks/useOffline';

export function OfflineIndicator() {
  const { isOnline, syncStatus, pendingCount, triggerSync } = useOffline();

  // ── Online and idle — hide completely ─────────────────────────────────
  if (isOnline && syncStatus === 'idle' && pendingCount === 0) return null;

  // ── Offline ───────────────────────────────────────────────────────────
  if (!isOnline) {
    return (
      <div className="bg-red-500 px-4 py-2 flex items-center justify-center gap-2 flex-wrap">
        <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0" />
        <p className="text-sm text-white font-medium text-center">
          You are offline. New entries are saved locally and will sync when reconnected.
        </p>
      </div>
    );
  }

  // ── Syncing ───────────────────────────────────────────────────────────
  if (syncStatus === 'syncing') {
    return (
      <div className="bg-blue-500 px-4 py-2 flex items-center justify-center gap-2">
        {/* Spinner */}
        <svg
          className="w-4 h-4 text-white animate-spin flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-sm text-white font-medium">
          {pendingCount > 0
            ? `Syncing ${pendingCount} pending ${pendingCount === 1 ? 'entry' : 'entries'}...`
            : 'Syncing...'}
        </p>
      </div>
    );
  }

  // ── Sync error ────────────────────────────────────────────────────────
  if (syncStatus === 'error') {
    return (
      <div className="bg-amber-500 px-4 py-2 flex items-center justify-center gap-2 flex-wrap">
        <svg className="w-4 h-4 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-sm text-white font-medium">
          {pendingCount > 0
            ? `${pendingCount} ${pendingCount === 1 ? 'entry' : 'entries'} failed to sync.`
            : 'Sync failed.'}
        </p>
        <button
          onClick={triggerSync}
          className="ml-1 px-2 py-0.5 text-xs bg-white text-amber-700 rounded font-semibold hover:bg-amber-50 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Online but still has pending (transient state between syncs) ──────
  if (isOnline && pendingCount > 0) {
    return (
      <div className="bg-blue-400 px-4 py-2 flex items-center justify-center gap-2">
        <p className="text-sm text-white font-medium">
          {pendingCount} pending {pendingCount === 1 ? 'entry' : 'entries'} queued for sync...
        </p>
      </div>
    );
  }

  return null;
}

export default OfflineIndicator;
