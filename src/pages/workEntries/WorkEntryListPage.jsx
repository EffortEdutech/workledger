/**
 * WorkLedger - Work Entry List Page
 *
 * Main page for viewing all work entries.
 *
 * SESSION 10: Org switching wired via useOrganization()
 * SESSION 15: Source tabs — All | Internal | Subcontractor
 * SESSION 16: Approval tab for managers — "Pending (N)" tab added
 *   - Only visible when can('APPROVE_WORK_ENTRY')
 *   - Clicking tab navigates to /work/approvals (dedicated approval queue page)
 *   - Count badge shows live pending count from workEntryService
 *
 * @module pages/workEntries/WorkEntryListPage
 * @created February 1, 2026 - Session 13
 * @updated February 27, 2026 - Session 16: Pending tab + approval count badge
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
import { PlusIcon }             from '@heroicons/react/24/outline';

export default function WorkEntryListPage() {
  const navigate       = useNavigate();
  const { currentOrg } = useOrganization();
  const { can }        = useRole();

  const [workEntries,         setWorkEntries]         = useState([]);
  const [contracts,           setContracts]           = useState([]);
  const [loading,             setLoading]             = useState(true);
  const [error,               setError]               = useState(null);

  // ── Source tab state ─────────────────────────────────────────────────────
  // 'all' | 'internal' | 'subcontractor'
  const [sourceTab,           setSourceTab]           = useState('all');
  const [subcontractorOrgIds, setSubcontractorOrgIds] = useState([]);
  const [hasSubcontractors,   setHasSubcontractors]   = useState(false);

  // ── SESSION 16: Pending approval count for tab badge ─────────────────────
  const [pendingCount,        setPendingCount]        = useState(0);

  // ── Standard filter state ─────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    contractId: '',
    status:     '',
    startDate:  '',
    endDate:    '',
    sortOrder:  'desc',
  });

  const canCreate  = can('CREATE_WORK_ENTRY');
  const canApprove = can('APPROVE_WORK_ENTRY');   // SESSION 16

  // ── Load pending count for manager badge ─────────────────────────────────
  const loadPendingCount = useCallback(async () => {
    if (!currentOrg?.id || !canApprove) return;
    try {
      const result = await workEntryService.getPendingApprovals(currentOrg.id, true);
      if (result.success) setPendingCount(result.count || 0);
    } catch {
      // Non-fatal
    }
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

  // ── Load work entries ─────────────────────────────────────────────────────
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

  // ── Full initial data load ─────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const orgId = currentOrg?.id ?? null;

      await Promise.all([
        contractService.getUserContracts(orgId).then(d => setContracts(d || [])),
        loadSubcontractorOrgIds(),
        loadWorkEntries(),
        loadPendingCount(),    // SESSION 16
      ]);
    } catch (err) {
      console.error('❌ Error loading data:', err);
      setError('Failed to load work entries. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id, loadSubcontractorOrgIds, loadWorkEntries, loadPendingCount]);

  useEffect(() => { loadData(); }, [loadData]);

  // Reload when filters change (after initial load)
  useEffect(() => {
    if (!loading) loadWorkEntries();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleDelete = async (entry) => {
    try {
      const result = await workEntryService.deleteWorkEntry(entry.id, currentOrg?.id);
      if (result.success) {
        setWorkEntries(prev => prev.filter(e => e.id !== entry.id));
      } else {
        alert(`Failed to delete: ${result.error}`);
      }
    } catch (err) {
      alert('Failed to delete work entry');
    }
  };

  // ── Source tab filtering ──────────────────────────────────────────────────
  const displayedEntries = (() => {
    if (sourceTab === 'all') return workEntries;

    if (sourceTab === 'internal') {
      return workEntries.filter(e => e.organization_id === currentOrg?.id);
    }

    if (sourceTab === 'subcontractor') {
      return workEntries.filter(e => subcontractorOrgIds.includes(e.organization_id));
    }

    return workEntries;
  })();

  // ── Filter update helper ──────────────────────────────────────────────────
  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-5">

        {/* ── Page header ────────────────────────────────────────────────── */}
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

        {/* ── Source tabs + Pending Approval tab (SESSION 16) ───────────── */}
        <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto">

          {/* All */}
          <SourceTab
            label="All"
            active={sourceTab === 'all'}
            onClick={() => setSourceTab('all')}
          />

          {/* Internal */}
          <SourceTab
            label="Internal"
            active={sourceTab === 'internal'}
            onClick={() => setSourceTab('internal')}
          />

          {/* Subcontractor — only when org has subcon relationships */}
          {hasSubcontractors && (
            <SourceTab
              label="Subcontractor"
              active={sourceTab === 'subcontractor'}
              onClick={() => setSourceTab('subcontractor')}
            />
          )}

          {/* SESSION 16: Pending Approval tab — managers/admins only */}
          {canApprove && (
            <SourceTab
              label="Pending Approval"
              badge={pendingCount > 0 ? pendingCount : null}
              active={false}
              onClick={() => navigate('/work/approvals')}
              isLink
            />
          )}
        </div>

        {/* ── Filters row ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3">

          {/* Contract filter */}
          <select
            value={filters.contractId}
            onChange={(e) => updateFilter('contractId', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white
                       focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            <option value="">All Contracts</option>
            {contracts.map(c => (
              <option key={c.id} value={c.id}>
                {c.contract_name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white
                       focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Date range */}
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => updateFilter('startDate', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white
                       focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => updateFilter('endDate', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white
                       focus:outline-none focus:ring-2 focus:ring-primary-300"
          />

          {/* Sort */}
          <select
            value={filters.sortOrder}
            onChange={(e) => updateFilter('sortOrder', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white
                       focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            <option value="desc">Latest First</option>
            <option value="asc">Oldest First</option>
          </select>

          {/* Clear filters */}
          {(filters.contractId || filters.status || filters.startDate || filters.endDate) && (
            <button
              onClick={() => setFilters({ contractId: '', status: '', startDate: '', endDate: '', sortOrder: 'desc' })}
              className="text-sm text-gray-500 hover:text-gray-700 underline px-2"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── Work entry grid ───────────────────────────────────────────────── */}
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
          ? 'border-primary-600 text-primary-600'
          : isLink
            ? 'border-transparent text-blue-600 hover:text-blue-700 hover:border-blue-300'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }
      `}
    >
      {label}
      {badge !== null && (
        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold
                         text-white bg-blue-600 rounded-full">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {isLink && (
        <span className="text-xs opacity-60">→</span>
      )}
    </button>
  );
}
