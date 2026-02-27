/**
 * WorkLedger - Work Entry List Page
 *
 * Main page for viewing all work entries.
 *
 * SESSION 10 WIRING:
 *   - useOrganization() provides currentOrg from the org switcher
 *   - loadData/loadWorkEntries wrapped in useCallback([currentOrg?.id])
 *     so they re-run automatically whenever the active org changes
 *
 * SESSION 15 UPDATE — Source Tab Row:
 *   - New horizontal tab strip: All | Internal | Subcontractor
 *   - "Subcontractor" tab only visible when the current org has active
 *     subcontractor relationships (i.e. org is a main contractor like MTSB)
 *   - Source filtering uses subcontractorOrgIds loaded from
 *     subcontractorService.getSubcontractorOrgIds()
 *   - "Subcontractor" entries are identified by organization_id NOT being
 *     the current org's id (i.e. they came from a linked subcon org)
 *   - Each entry in the subcontractor view shows an org name badge
 *
 * @module pages/workEntries/WorkEntryListPage
 * @created February 1, 2026 - Session 13
 * @updated February 21, 2026 - Session 13 fix: org wiring restored
 * @updated February 24, 2026 - Session 15: Source tab row added
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import WorkEntryList from '../../components/workEntries/WorkEntryList';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { workEntryService }       from '../../services/api/workEntryService';
import { contractService }        from '../../services/api/contractService';
import { subcontractorService }   from '../../services/api/subcontractorService';
import { useOrganization }        from '../../context/OrganizationContext';
import { useRole }                from '../../hooks/useRole';
import { PlusIcon }               from '@heroicons/react/24/outline';

export default function WorkEntryListPage() {
  const navigate     = useNavigate();
  const { currentOrg } = useOrganization();
  const { can }        = useRole();

  const [workEntries,         setWorkEntries]         = useState([]);
  const [contracts,           setContracts]           = useState([]);
  const [loading,             setLoading]             = useState(true);
  const [error,               setError]               = useState(null);

  // ── Source tab state ───────────────────────────────────────────────────
  // 'all' | 'internal' | 'subcontractor'
  const [sourceTab,           setSourceTab]           = useState('all');
  const [subcontractorOrgIds, setSubcontractorOrgIds] = useState([]); // FEST ENT IDs etc.
  const [hasSubcontractors,   setHasSubcontractors]   = useState(false);

  // ── Standard filter state ──────────────────────────────────────────────
  const [filters, setFilters] = useState({
    contractId: '',
    status:     '',
    startDate:  '',
    endDate:    '',
    sortOrder:  'desc',
  });

  const canCreate = can('CREATE_WORK_ENTRY');

  // ── Load subcontractor org IDs for this org (once on org switch) ───────
  const loadSubcontractorOrgIds = useCallback(async () => {
    if (!currentOrg?.id) return;
    try {
      const ids = await subcontractorService.getSubcontractorOrgIds(currentOrg.id);
      setSubcontractorOrgIds(ids);
      setHasSubcontractors(ids.length > 0);
      // Reset to 'all' if we switch to an org that has no subcontractors
      if (ids.length === 0) setSourceTab('all');
      console.log('🏗️ Subcontractor org IDs for', currentOrg.name, ':', ids);
    } catch (err) {
      console.error('❌ Error loading subcontractor org IDs:', err);
    }
  }, [currentOrg?.id]);

  // ── Load work entries (filter-aware) ──────────────────────────────────
  const loadWorkEntries = useCallback(async () => {
    try {
      const orgId  = currentOrg?.id ?? null;
      const result = await workEntryService.getUserWorkEntries(filters, orgId);

      if (result.success) {
        setWorkEntries(result.data || []);
        console.log(`✅ Fetched ${result.data?.length || 0} work entries`);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('❌ Error loading work entries:', err);
      setError('Failed to load work entries. Please try again.');
    }
  }, [currentOrg?.id, filters]);

  // ── Load initial data (contracts + entries + subcon IDs) ──────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const orgId = currentOrg?.id ?? null;

      await Promise.all([
        contractService.getUserContracts(orgId).then(d => setContracts(d || [])),
        loadSubcontractorOrgIds(),
        loadWorkEntries(),
      ]);

      console.log('✅ Loaded work entries data');
    } catch (err) {
      console.error('❌ Error loading data:', err);
      setError('Failed to load work entries. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id, loadSubcontractorOrgIds, loadWorkEntries]);

  useEffect(() => { loadData(); }, [loadData]);

  // Reload entries when filters change (after initial load)
  useEffect(() => {
    if (!loading) loadWorkEntries();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Source tab filtering (client-side — RLS already returned the rows) ─
  const displayedEntries = (() => {
    if (sourceTab === 'all') return workEntries;

    if (sourceTab === 'internal') {
      // Internal = organization_id strictly matches currentOrg.id
      // NOTE: We no longer treat null org_id as "internal" — that was masking
      // old seed data. All new entries will have organization_id set explicitly.
      // Entries with null org_id appear in "All" tab only.
      return workEntries.filter(e =>
        e.organization_id === currentOrg?.id
      );
    }

    if (sourceTab === 'subcontractor') {
      // Subcontractor = organization_id is one of the known subcon org IDs
      return workEntries.filter(e =>
        e.organization_id && subcontractorOrgIds.includes(e.organization_id)
      );
    }

    return workEntries;
  })();

  // ── Count helpers ──────────────────────────────────────────────────────
  const internalCount      = workEntries.filter(e => e.organization_id === currentOrg?.id).length;
  const subcontractorCount = workEntries.filter(e => e.organization_id && subcontractorOrgIds.includes(e.organization_id)).length;
  // Entries with null org_id (legacy seed data) are only visible in "All" tab

  // ── Filter handlers ────────────────────────────────────────────────────
  const handleFilterChange  = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const handleClearFilters  = () => setFilters({ contractId: '', status: '', startDate: '', endDate: '', sortOrder: 'desc' });

  // ── Delete handler ─────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      const result = await workEntryService.deleteWorkEntry(id, currentOrg?.id);
      if (result.success) {
        await loadWorkEntries();
        console.log('✅ Work entry deleted');
      }
    } catch (err) {
      console.error('❌ Error deleting work entry:', err);
      alert('Failed to delete work entry. Please try again.');
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button onClick={loadData} className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium">
              Try Again
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 pb-24">

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Work Entries</h1>
            <p className="mt-1 text-sm text-gray-500">
              {displayedEntries.length} {displayedEntries.length === 1 ? 'entry' : 'entries'}
              {currentOrg && (
                <span className="ml-2 font-medium text-primary-700">— {currentOrg.name}</span>
              )}
            </p>
          </div>

          {canCreate && (
            <Button variant="primary" onClick={() => navigate('/work/new')}>
              <PlusIcon className="h-5 w-5 mr-2" />
              New Entry
            </Button>
          )}
        </div>

        {/* ── SOURCE TAB ROW ───────────────────────────────────────────
            Only shown when this org has active subcontractor relationships.
            For FEST ENT / Mr. Roz: hidden entirely (they have no subcons).
            For MTSB: shows All | Internal | Subcontractor tabs.
        ─────────────────────────────────────────────────────────────── */}
        {hasSubcontractors && (
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl mb-4 w-fit">
            {[
              { key: 'all',           label: 'All',           count: workEntries.length      },
              { key: 'internal',      label: 'Internal',      count: internalCount           },
              { key: 'subcontractor', label: 'Subcontractor', count: subcontractorCount      },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSourceTab(tab.key)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${sourceTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'}
                `}
              >
                {tab.key === 'subcontractor' && (
                  <svg className="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
                {tab.label}
                <span className={`
                  inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-xs font-semibold
                  ${sourceTab === tab.key ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-500'}
                `}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ── Filter Row ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Contract filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Contract</label>
              <select
                value={filters.contractId}
                onChange={e => handleFilterChange('contractId', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Contracts</option>
                {contracts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.contract_number} — {c.contract_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={e => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Date from */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={e => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Date to */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={e => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Sort + Clear */}
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <div className="flex gap-2">
              {[
                { val: 'desc', label: 'Newest First' },
                { val: 'asc',  label: 'Oldest First' },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => handleFilterChange('sortOrder', opt.val)}
                  className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                    filters.sortOrder === opt.val
                      ? 'bg-primary-50 border-primary-400 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {(filters.contractId || filters.status || filters.startDate || filters.endDate) && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-gray-400 hover:text-gray-600 underline ml-auto"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* ── Subcontractor context banner ─────────────────────────────
            Shown only in Subcontractor tab — reminds user whose entries
            they're seeing and that this is read-only.
        ─────────────────────────────────────────────────────────────── */}
        {sourceTab === 'subcontractor' && (
          <div className="mb-4 flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4">
            <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-orange-800">
                Showing subcontractor work entries
              </p>
              <p className="text-xs text-orange-600 mt-0.5">
                These entries were created by your subcontractor organizations
                for projects you're managing. They are read-only from your view.
              </p>
            </div>
          </div>
        )}

        {/* ── Work Entry List ──────────────────────────────────────────── */}
        <WorkEntryList
          workEntries={displayedEntries}
          contracts={contracts}
          onDelete={handleDelete}
          onRefresh={loadWorkEntries}
          currentOrgId={currentOrg?.id}
          subcontractorOrgIds={subcontractorOrgIds}
          showSourceBadge={sourceTab === 'all' && hasSubcontractors}
          isSubcontractorView={sourceTab === 'subcontractor'}
        />

      </div>
    </AppLayout>
  );
}
