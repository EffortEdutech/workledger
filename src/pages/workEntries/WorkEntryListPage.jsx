/**
 * WorkLedger - Work Entry List Page
 *
 * SESSION 10: Org switching wired via useOrganization()
 * SESSION 15: Source tabs — All | Internal | Subcontractor
 * SESSION 16: Approval tab for managers — "Pending (N)" tab added
 * SESSION 19: Pending Sync section — shows local-only entries from IndexedDB
 *   (entries with remoteId=null that haven't reached Supabase yet).
 *   These entries are invisible in the main Supabase-fetched list. This
 *   section makes them visible and allows deletion.
 *
 * @module pages/workEntries/WorkEntryListPage
 * @created February 1, 2026 - Session 13
 * @updated February 27, 2026 - Session 16: Pending tab + approval count badge
 * @updated April 4, 2026     - Session 19: Pending sync section + local delete
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate }          from 'react-router-dom';
import AppLayout                from '../../components/layout/AppLayout';
import WorkEntryList            from '../../components/workEntries/WorkEntryList';
import Button                   from '../../components/common/Button';
import LoadingSpinner            from '../../components/common/LoadingSpinner';
import { workEntryService }     from '../../services/api/workEntryService';
import { contractService }      from '../../services/api/contractService';
import { subcontractorService } from '../../services/api/subcontractorService';
import { useOrganization }      from '../../context/OrganizationContext';
import { useRole }              from '../../hooks/useRole';
import { useOffline }           from '../../hooks/useOffline';
import { db }                   from '../../services/offline/db';
import { PlusIcon }             from '@heroicons/react/24/outline';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-MY', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

const STATUS_LABEL = {
  draft:     { label: 'Draft',     bg: 'bg-gray-100',  text: 'text-gray-700'  },
  submitted: { label: 'Submitted', bg: 'bg-blue-100',  text: 'text-blue-800'  },
  approved:  { label: 'Approved',  bg: 'bg-green-100', text: 'text-green-800' },
  rejected:  { label: 'Rejected',  bg: 'bg-red-100',   text: 'text-red-800'   },
};

function StatusPill({ status }) {
  const s = STATUS_LABEL[status] ?? STATUS_LABEL.draft;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PendingSyncSection — shows local-only IndexedDB entries (remoteId=null)
// ─────────────────────────────────────────────────────────────────────────────

function PendingSyncSection({ contracts, onDeleted, onSyncNow }) {
  const [localEntries, setLocalEntries] = useState([]);
  const [deleting, setDeleting]         = useState(null); // localId being deleted
  const { pendingCount, triggerSync, isOnline } = useOffline();

  const loadLocalEntries = useCallback(async () => {
    try {
      const entries = await db.workEntries
        .filter(e => !e.remoteId && !e.deleted_at)
        .toArray();

      // Sort newest first
      entries.sort((a, b) => (b.entry_date || '').localeCompare(a.entry_date || ''));
      setLocalEntries(entries);
    } catch (err) {
      console.error('❌ PendingSyncSection: failed to load local entries:', err);
    }
  }, []);

  // Reload whenever pendingCount changes (e.g. after successful sync → some entries get remoteId)
  useEffect(() => {
    loadLocalEntries();
  }, [loadLocalEntries, pendingCount]);

  const handleDelete = async (localId) => {
    if (!window.confirm('Delete this local entry? It has not been synced to the server and cannot be recovered.')) return;

    try {
      setDeleting(localId);

      // Remove from IndexedDB
      await db.workEntries.delete(localId);

      // Remove any associated sync queue items
      await db.syncQueue
        .filter(q => q.entity_type === 'work_entry' && q.entity_local_id === localId)
        .delete();

      setLocalEntries(prev => prev.filter(e => e.localId !== localId));
      onDeleted?.();
      console.log(`🗑️ Deleted local entry (localId: ${localId})`);
    } catch (err) {
      console.error('❌ Failed to delete local entry:', err);
      alert('Failed to delete. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const resolveContractName = (contractId) => {
    if (!contracts?.length) return contractId?.slice(0, 8) + '…' || '—';
    const c = contracts.find(c => c.id === contractId);
    return c ? `${c.contract_number} — ${c.contract_name}` : contractId?.slice(0, 8) + '…' || '—';
  };

  if (localEntries.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-amber-100 border-b border-amber-200">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-amber-900">
            Pending Sync — {localEntries.length} {localEntries.length === 1 ? 'entry' : 'entries'} on this device
          </h3>
        </div>
        {isOnline && (
          <button
            onClick={triggerSync}
            className="text-xs font-semibold text-amber-800 bg-white border border-amber-300 px-3 py-1 rounded-full hover:bg-amber-50 transition-colors"
          >
            Sync Now
          </button>
        )}
      </div>

      {/* Info strip */}
      <div className="px-4 py-2 text-xs text-amber-700 bg-amber-50 border-b border-amber-100">
        {isOnline
          ? 'These entries are saved on this device and will sync to the server. Tap "Sync Now" to push them immediately.'
          : 'These entries are saved on this device. They will sync automatically when you reconnect.'}
      </div>

      {/* Entry rows */}
      <div className="divide-y divide-amber-100">
        {localEntries.map(entry => (
          <div key={entry.localId} className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-amber-50 transition-colors">

            {/* Date + contract */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{formatDate(entry.entry_date)}</p>
              <p className="text-xs text-gray-500 truncate mt-0.5">{resolveContractName(entry.contract_id)}</p>
            </div>

            {/* Status */}
            <StatusPill status={entry.status} />

            {/* Sync badge */}
            <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full whitespace-nowrap">
              Not synced
            </span>

            {/* Delete button */}
            <button
              onClick={() => handleDelete(entry.localId)}
              disabled={deleting === entry.localId}
              className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50 whitespace-nowrap"
            >
              {deleting === entry.localId ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Source Tab sub-component
// ─────────────────────────────────────────────────────────────────────────────

function SourceTab({ label, active, onClick, badge = null, isLink = false }) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium
        border-b-2 whitespace-nowrap transition-colors flex-shrink-0
        ${active
          ? 'border-primary-600 text-primary-700'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
        ${isLink ? 'cursor-pointer' : ''}
      `}
    >
      {label}
      {badge !== null && (
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-red-500 text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function WorkEntryListPage() {
  const navigate       = useNavigate();
  const { currentOrg } = useOrganization();
  const { can }        = useRole();
  const { pendingCount, triggerSync } = useOffline();

  const [workEntries,         setWorkEntries]         = useState([]);
  const [contracts,           setContracts]           = useState([]);
  const [loading,             setLoading]             = useState(true);
  const [error,               setError]               = useState(null);

  const [sourceTab,           setSourceTab]           = useState('all');
  const [subcontractorOrgIds, setSubcontractorOrgIds] = useState([]);
  const [hasSubcontractors,   setHasSubcontractors]   = useState(false);

  const [approvalPendingCount, setApprovalPendingCount] = useState(0);

  const [filters, setFilters] = useState({
    contractId: '',
    status:     '',
    startDate:  '',
    endDate:    '',
    sortOrder:  'desc',
  });

  const canCreate  = can('CREATE_WORK_ENTRY');
  const canApprove = can('APPROVE_WORK_ENTRY');

  // ── Load pending count for manager approval badge ─────────────────────────
  const loadApprovalCount = useCallback(async () => {
    if (!currentOrg?.id || !canApprove) return;
    try {
      const result = await workEntryService.getPendingApprovals(currentOrg.id, true);
      if (result.success) setApprovalPendingCount(result.count || 0);
    } catch { /* non-fatal */ }
  }, [currentOrg?.id, canApprove]);

  // ── Load subcontractor org IDs ────────────────────────────────────────────
  const loadSubcontractorOrgIds = useCallback(async () => {
    if (!currentOrg?.id) return;
    try {
      const ids = await subcontractorService.getSubcontractorOrgIds(currentOrg.id);
      setSubcontractorOrgIds(ids);
      setHasSubcontractors(ids.length > 0);
      if (ids.length === 0) setSourceTab('all');
    } catch (err) {
      console.error('❌ Error loading subcon org IDs:', err);
    }
  }, [currentOrg?.id]);

  // ── Load server work entries ──────────────────────────────────────────────
  const loadWorkEntries = useCallback(async () => {
    try {
      const orgId  = currentOrg?.id ?? null;
      const result = await workEntryService.getUserWorkEntries(filters, orgId);
      if (result.success) {
        setWorkEntries(result.data || []);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('❌ Error loading work entries:', err);
      setError('Failed to load work entries. Please try again.');
    }
  }, [currentOrg?.id, filters]);

  // ── Full initial load ─────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const orgId = currentOrg?.id ?? null;

      await Promise.all([
        contractService.getUserContracts(orgId).then(d => setContracts(d || [])),
        loadSubcontractorOrgIds(),
        loadWorkEntries(),
        loadApprovalCount(),
      ]);
    } catch (err) {
      console.error('❌ Error loading data:', err);
      setError('Failed to load work entries. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id, loadSubcontractorOrgIds, loadWorkEntries, loadApprovalCount]);

  useEffect(() => { loadData(); }, [loadData]);

  // Reload server entries when filters change
  useEffect(() => {
    if (!loading) loadWorkEntries();
  }, [filters]); // eslint-disable-line

  // Reload server entries when a pending entry successfully syncs
  // (pendingCount drops → an entry moved from local → server → should appear in list)
  useEffect(() => {
    if (!loading) loadWorkEntries();
  }, [pendingCount]); // eslint-disable-line

  // ── Delete server entry ───────────────────────────────────────────────────
  const handleDelete = async (entry) => {
    try {
      const result = await workEntryService.deleteWorkEntry(entry.id, currentOrg?.id);
      if (result.success) {
        setWorkEntries(prev => prev.filter(e => e.id !== entry.id));
      } else {
        alert(`Failed to delete: ${result.error}`);
      }
    } catch {
      alert('Failed to delete work entry');
    }
  };

  // ── Source tab filtering ──────────────────────────────────────────────────
  const displayedEntries = (() => {
    if (sourceTab === 'internal')     return workEntries.filter(e => e.organization_id === currentOrg?.id);
    if (sourceTab === 'subcontractor') return workEntries.filter(e => subcontractorOrgIds.includes(e.organization_id));
    return workEntries;
  })();

  const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-5">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Work Entries</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading ? 'Loading…' : `${displayedEntries.length} entries`}
            </p>
          </div>
          {canCreate && (
            <Button
              onClick={() => navigate('/work/new')}
              variant="primary"
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              New Entry
            </Button>
          )}
        </div>

        {/* ── SESSION 19: Pending Sync section ─────────────────────────────
            Shows local-only IndexedDB entries (remoteId=null) that haven't
            reached Supabase yet. Completely separate from server-fetched list.
            After sync succeeds, entries disappear here and appear in the main list below.
        ─────────────────────────────────────────────────────────────────── */}
        <PendingSyncSection
          contracts={contracts}
          onDeleted={() => loadApprovalCount()}
          onSyncNow={triggerSync}
        />

        {/* Source tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto">
          <SourceTab label="All"      active={sourceTab === 'all'}      onClick={() => setSourceTab('all')} />
          <SourceTab label="Internal" active={sourceTab === 'internal'} onClick={() => setSourceTab('internal')} />

          {hasSubcontractors && (
            <SourceTab label="Subcontractor" active={sourceTab === 'subcontractor'} onClick={() => setSourceTab('subcontractor')} />
          )}

          {canApprove && (
            <SourceTab
              label="Pending Approval"
              badge={approvalPendingCount > 0 ? approvalPendingCount : null}
              active={false}
              onClick={() => navigate('/work/approvals')}
              isLink
            />
          )}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-3">

          <select
            value={filters.contractId}
            onChange={(e) => updateFilter('contractId', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            <option value="">All Contracts</option>
            {contracts.map(c => (
              <option key={c.id} value={c.id}>{c.contract_name}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <input
            type="date" value={filters.startDate}
            onChange={(e) => updateFilter('startDate', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
          <input
            type="date" value={filters.endDate}
            onChange={(e) => updateFilter('endDate', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
          />

          <select
            value={filters.sortOrder}
            onChange={(e) => updateFilter('sortOrder', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            <option value="desc">Latest First</option>
            <option value="asc">Oldest First</option>
          </select>

          {(filters.contractId || filters.status || filters.startDate || filters.endDate) && (
            <button
              onClick={() => setFilters({ contractId: '', status: '', startDate: '', endDate: '', sortOrder: 'desc' })}
              className="text-sm text-gray-500 hover:text-gray-700 underline px-2"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Server work entries */}
        <WorkEntryList
          workEntries={displayedEntries}
          loading={loading}
          onDelete={handleDelete}
          onEdit={(entry) => navigate(`/work/${entry.id}/edit`)}
          onView={(entry) => navigate(`/work/${entry.id}`)}
          currentOrgId={currentOrg?.id}
          subcontractorOrgIds={subcontractorOrgIds}
          showSourceBadge={sourceTab === 'all' && hasSubcontractors}
          isSubcontractorView={sourceTab === 'subcontractor'}
        />

      </div>
    </AppLayout>
  );
}
