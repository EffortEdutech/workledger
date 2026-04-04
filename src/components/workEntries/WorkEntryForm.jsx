/**
 * WorkLedger - Work Entry Form Component
 *
 * Main form for creating and editing work entries.
 * Integrates with DynamicForm for template-driven data entry.
 *
 * SESSION 14 FIX (Feb 24, 2026):
 *   Previous version still checked contracts.template_id (old single FK,
 *   dropped in Session 14 migration). Fixed to use contract_templates
 *   junction table via contractService.getContractTemplates().
 *
 *   Changes:
 *   - handleContractChange: reads contract_templates junction rows
 *   - loadExistingData: same
 *   - loadContracts: now org-aware (useOrganization + useCallback)
 *   - New state: contractTemplates, selectedTemplateId
 *   - New UI: template selector dropdown when contract has multiple templates
 *   - Removed floating JSX fragment outside return (lines 251-260 in old version)
 *
 * SESSION 19 — OFFLINE-FIRST (Apr 4, 2026):
 *   All data-loading functions now fall back to IndexedDB (offlineDataService)
 *   when the device is offline. The form remains fully functional offline:
 *   - loadContracts  → offlineDataService.getContractsForOrg()
 *   - resolveJunctionRows → offlineDataService.getTemplatesForContractCategory()
 *     shaped into the same junction-row structure the form expects
 *   - loadTemplate   → offlineDataService.getTemplateById()
 *   useOffline() drives the branch — no duplicate code paths.
 *
 * @module components/workEntries/WorkEntryForm
 * @created February 1, 2026 - Session 13
 * @updated February 24, 2026 - Session 14 fix: junction table + org-aware
 * @updated April 4, 2026 - Session 19: offline-first data loading
 */

import React, { useState, useEffect, useCallback } from 'react';
import { DynamicForm } from '../templates/DynamicForm';
import { contractService } from '../../services/api/contractService';
import { templateService } from '../../services/api/templateService';
import { useOrganization } from '../../context/OrganizationContext';
import { useOffline } from '../../hooks/useOffline';
import { offlineDataService } from '../../services/offline/offlineDataService';
import Button from '../common/Button';

export default function WorkEntryForm({
  initialData = null,
  mode = 'create', // 'create' | 'edit'
  onSave,
  onSubmit,
  onCancel
}) {
  // Organisation context — filters contracts to the active org
  const { currentOrg } = useOrganization();

  // Offline context — drives online vs IndexedDB branching
  const { isOnline } = useOffline();

  // ── Core form state ──────────────────────────────────────────────────
  const [selectedContract,   setSelectedContract]   = useState(null);
  const [template,           setTemplate]           = useState(null);
  const [entryDate,          setEntryDate]          = useState(
    initialData?.entry_date || new Date().toISOString().split('T')[0]
  );
  const [shift,              setShift]              = useState(initialData?.shift || '');
  const [formData,           setFormData]           = useState(initialData?.data || {});

  // ── Multi-template state (Session 14) ────────────────────────────────
  // contractTemplates: junction rows for the currently selected contract
  //   shape: { id, template_id, is_default, label, templates: { template_name, ... } }
  // selectedTemplateId: which template the user has picked (UUID or text slug offline)
  const [contractTemplates,  setContractTemplates]  = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  // ── Loading / error state ────────────────────────────────────────────
  const [contracts,          setContracts]          = useState([]);
  const [loadingContracts,   setLoadingContracts]   = useState(true);
  const [loadingTemplate,    setLoadingTemplate]    = useState(false);
  const [saving,             setSaving]             = useState(false);
  const [submitting,         setSubmitting]         = useState(false);
  const [error,              setError]              = useState(null);

  // ── Shift options ────────────────────────────────────────────────────
  const shiftOptions = [
    { value: '',          label: 'No Shift'   },
    { value: 'morning',   label: 'Morning'    },
    { value: 'afternoon', label: 'Afternoon'  },
    { value: 'evening',   label: 'Evening'    },
    { value: 'night',     label: 'Night'      },
  ];

  // ─────────────────────────────────────────────────────────────────────
  // LOAD CONTRACTS
  // Online  → contractService.getUserContracts() from Supabase
  // Offline → offlineDataService.getContractsForOrg() from IndexedDB
  // Re-runs when org switcher changes OR network state changes
  // ─────────────────────────────────────────────────────────────────────
  const loadContracts = useCallback(async () => {
    try {
      setLoadingContracts(true);
      const orgId = currentOrg?.id ?? null;

      let activeContracts;

      if (!isOnline) {
        console.log('📱 Offline: loading contracts from IndexedDB for org:', orgId);
        activeContracts = await offlineDataService.getContractsForOrg(orgId);
      } else {
        const contractsData = await contractService.getUserContracts(orgId);
        activeContracts = (contractsData || []).filter(c => c.status === 'active');
      }

      setContracts(activeContracts);
      console.log(`✅ Loaded ${activeContracts.length} contracts (${isOnline ? 'online' : 'offline cached'})`);

      if (!isOnline && activeContracts.length === 0) {
        setError(
          'No contracts cached offline. Connect to the internet and open WorkLedger ' +
          'to cache your contracts for offline use.'
        );
      }
    } catch (err) {
      console.error('❌ Error loading contracts:', err);
      setError('Failed to load contracts');
    } finally {
      setLoadingContracts(false);
    }
  }, [currentOrg?.id, isOnline]);

  useEffect(() => { loadContracts(); }, [loadContracts]);

  // If editing, load contract + template on mount
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      loadExistingData();
    }
  }, [mode, initialData]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────
  // LOAD EXISTING DATA (edit mode)
  // Uses junction table — NOT contracts.template_id (dropped S14)
  // ─────────────────────────────────────────────────────────────────────
  const loadExistingData = async () => {
    try {
      if (!initialData?.contract_id) return;

      let contract;
      if (!isOnline) {
        contract = await offlineDataService.getContractById(initialData.contract_id);
      } else {
        contract = await contractService.getContract(initialData.contract_id);
      }
      if (!contract) return;

      setSelectedContract(contract);

      // ── Get junction rows ───────────────────────────────────────────
      const junctionRows = await resolveJunctionRows(contract);
      setContractTemplates(junctionRows);

      // ── Find which template this work entry used ────────────────────
      const templateIdToLoad = initialData.template_id
        ?? junctionRows.find(jt => jt.is_default)?.template_id
        ?? junctionRows[0]?.template_id;

      if (templateIdToLoad) {
        setSelectedTemplateId(templateIdToLoad);
        await loadTemplate(templateIdToLoad, junctionRows);
      }
    } catch (err) {
      console.error('❌ Error loading existing work entry data:', err);
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  // HANDLE CONTRACT SELECTION
  // Uses junction table — NOT contracts.template_id (dropped S14)
  // ─────────────────────────────────────────────────────────────────────
  const handleContractChange = async (contractId) => {
    if (!contractId) {
      setSelectedContract(null);
      setContractTemplates([]);
      setSelectedTemplateId(null);
      setTemplate(null);
      setError(null);
      return;
    }

    try {
      setError(null);
      setLoadingTemplate(true);
      setTemplate(null);
      setContractTemplates([]);
      setSelectedTemplateId(null);
      setFormData({});

      const contract = contracts.find(c => c.id === contractId);
      if (!contract) {
        setError('Contract not found');
        return;
      }

      setSelectedContract(contract);

      // ── Resolve junction rows (online or offline) ───────────────────
      const junctionRows = await resolveJunctionRows(contract);

      if (junctionRows.length === 0) {
        setError(
          isOnline
            ? 'This contract has no templates assigned. ' +
              'Go to Contracts → Edit Contract to assign a template first.'
            : 'No templates cached for this contract. Connect to the internet ' +
              'and open WorkLedger to cache templates for offline use.'
        );
        setLoadingTemplate(false);
        return;
      }

      setContractTemplates(junctionRows);

      // Auto-select the default template (or first if none marked default)
      const defaultRow = junctionRows.find(jt => jt.is_default) ?? junctionRows[0];
      setSelectedTemplateId(defaultRow.template_id);

      // Optimization: offline junction rows carry the full template object inline
      // — no second IndexedDB read needed
      await loadTemplate(defaultRow.template_id, junctionRows);

    } catch (err) {
      console.error('❌ Error handling contract change:', err);
      setError('Failed to load template. Please try again.');
    } finally {
      setLoadingTemplate(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  // HANDLE TEMPLATE SWITCH (multi-template contracts)
  // User manually selects a different template from the dropdown
  // ─────────────────────────────────────────────────────────────────────
  const handleTemplateChange = async (templateId) => {
    if (!templateId || templateId === selectedTemplateId) return;
    try {
      setLoadingTemplate(true);
      setTemplate(null);
      setFormData({}); // reset form data — different template has different fields
      setSelectedTemplateId(templateId);
      await loadTemplate(templateId, contractTemplates);
    } catch (err) {
      console.error('❌ Error switching template:', err);
      setError('Failed to load template');
    } finally {
      setLoadingTemplate(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  // RESOLVE JUNCTION ROWS
  // Online  → uses contract.contract_templates (pre-loaded) or DB query
  // Offline → reads cached templates by contract_category, shapes them
  //           into the same { template_id, is_default, label, templates }
  //           structure the rest of the form expects
  // ─────────────────────────────────────────────────────────────────────
  const resolveJunctionRows = async (contract) => {
    if (!isOnline) {
      console.log('📱 Offline: resolving templates from IndexedDB for category:', contract.contract_category);

      let cachedTemplates = [];

      // Try by contract_category first (most accurate match)
      if (contract.contract_category) {
        cachedTemplates = await offlineDataService.getTemplatesForContractCategory(
          contract.contract_category
        );
      }

      // Fallback: try all cached templates (edge case — no category on contract)
      if (cachedTemplates.length === 0) {
        console.log('⚠️  No category match — falling back to all cached templates');
        cachedTemplates = await offlineDataService.getAllTemplates();
      }

      // Shape into junction-row format the form expects
      // template_id uses the TEXT SLUG (Dexie pk) so loadTemplate can find it offline
      return cachedTemplates.map((t, i) => ({
        template_id: t.template_id, // text slug — e.g. 'pmc-preventive-maintenance-v1'
        is_default:  i === 0,
        label:       t.template_name,
        templates:   t,             // full object inline — avoids second DB read
      }));
    }

    // Online: original logic — use pre-loaded data or query junction table
    if (contract.contract_templates && contract.contract_templates.length > 0) {
      console.log('✅ Using pre-loaded contract_templates:', contract.contract_templates.length);
      return contract.contract_templates;
    }

    console.log('⏳ Fetching contract_templates from DB for:', contract.id);
    const rows = await contractService.getContractTemplates(contract.id);
    console.log(`✅ Fetched ${rows.length} junction rows from DB`);
    return rows;
  };

  // ─────────────────────────────────────────────────────────────────────
  // LOAD TEMPLATE BY ID
  // Online  → templateService.getTemplate() from Supabase
  // Offline → offlineDataService.getTemplateById() from IndexedDB
  //
  // Optimization: if junctionRows are provided and a row carries the full
  // template object inline (offline path), use it directly — zero extra reads.
  // ─────────────────────────────────────────────────────────────────────
  const loadTemplate = async (templateId, junctionRows = []) => {
    try {
      // Fast path: the junction row already has the full template object inline
      const inlineRow = junctionRows.find(
        jt => jt.template_id === templateId && jt.templates?.fields_schema
      );
      if (inlineRow) {
        console.log('✅ Template loaded from inline junction row:', inlineRow.templates.template_name);
        setTemplate(inlineRow.templates);
        return;
      }

      // Standard path: fetch from Supabase or IndexedDB
      let tpl;
      if (!isOnline) {
        tpl = await offlineDataService.getTemplateById(templateId);
      } else {
        tpl = await templateService.getTemplate(templateId);
      }

      if (tpl) {
        console.log('✅ Template loaded:', tpl.template_name, `(${isOnline ? 'online' : 'offline cached'})`);
        setTemplate(tpl);
      } else {
        const msg = isOnline
          ? 'Template not found. It may have been deleted.'
          : 'Template not cached for offline use. Connect to the internet, ' +
            'open WorkLedger, and navigate to your contracts to cache templates.';
        console.error('❌ Template not found for ID:', templateId);
        setError(msg);
      }
    } catch (err) {
      console.error('❌ Error loading template:', err);
      setError('Failed to load template');
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  // FORM DATA CHANGE
  // ─────────────────────────────────────────────────────────────────────
  const handleFormDataChange = (newData) => {
    setFormData(newData);
  };

  // ─────────────────────────────────────────────────────────────────────
  // SAVE AS DRAFT
  // ─────────────────────────────────────────────────────────────────────
  const handleSaveAsDraft = async (data) => {
    try {
      setSaving(true);
      setError(null);

      if (!selectedContract) { setError('Please select a contract'); return; }
      if (!template)         { setError('Template not loaded'); return; }

      const workEntryData = {
        contract_id:     selectedContract.id,
        template_id:     template.id ?? template.template_id, // UUID online, text slug offline
        entry_date:      entryDate,
        shift:           shift || null,
        data:            data || formData,
        status:          'draft',
        organization_id: currentOrg?.id,   // SESSION 15 FIX: must be explicit
      };

      if (onSave) await onSave(workEntryData);

    } catch (err) {
      console.error('❌ Error saving draft:', err);
      setError(err.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  // SUBMIT ENTRY
  // Submitting requires online — approval needs the server.
  // Offline: block submission; guide user to save as draft instead.
  // ─────────────────────────────────────────────────────────────────────
  const handleSubmitEntry = async (data) => {
    // Guard: cannot submit while offline (approval workflow requires server)
    if (!isOnline) {
      setError(
        'You are offline. Entry submission requires an internet connection. ' +
        'Save as Draft instead — it will be saved locally and you can submit when online.'
      );
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (!selectedContract) { setError('Please select a contract'); return; }
      if (!template)         { setError('Template not loaded'); return; }

      const workEntryData = {
        contract_id:     selectedContract.id,
        template_id:     template.id ?? template.template_id,
        entry_date:      entryDate,
        shift:           shift || null,
        data:            data || formData,
        status:          'submitted',
        submitted_at:    new Date().toISOString(),
        organization_id: currentOrg?.id,   // SESSION 15 FIX: must be explicit
      };

      if (onSubmit) await onSubmit(workEntryData);

    } catch (err) {
      console.error('❌ Error submitting entry:', err);
      setError(err.message || 'Failed to submit entry');
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Offline warning banner ──────────────────────────────────────── */}
      {!isOnline && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <span className="text-xl mt-0.5">📡</span>
          <div>
            <p className="font-medium text-amber-900 text-sm">You are offline</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Contracts and templates are loaded from local cache.
              You can save entries as drafts — they will sync automatically when you reconnect.
              Submitting for approval requires an internet connection.
            </p>
          </div>
        </div>
      )}

      {/* ── Error Alert ────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Basic Information ───────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Contract selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contract <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedContract?.id || ''}
              onChange={e => handleContractChange(e.target.value)}
              disabled={mode === 'edit' || loadingContracts}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
            >
              <option value="">Select a contract…</option>
              {contracts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.contract_number} - {c.contract_name}
                </option>
              ))}
            </select>
            {loadingContracts && (
              <p className="text-xs text-gray-500 mt-1">
                {isOnline ? 'Loading contracts…' : 'Loading cached contracts…'}
              </p>
            )}
          </div>

          {/* Entry date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entry Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={entryDate}
              onChange={e => setEntryDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Shift */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shift <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              value={shift}
              onChange={e => setShift(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {shiftOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* ── Template selector — only shown when contract has > 1 template ── */}
          {contractTemplates.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedTemplateId || ''}
                onChange={e => handleTemplateChange(e.target.value)}
                disabled={loadingTemplate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                {contractTemplates.map(jt => (
                  <option key={jt.template_id} value={jt.template_id}>
                    {jt.label || jt.templates?.template_name || jt.template_id}
                    {jt.is_default ? ' (default)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                This contract has {contractTemplates.length} templates. Select the one for this entry.
              </p>
            </div>
          )}
        </div>

        {/* Contract preview card */}
        {selectedContract && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <span className="font-medium">Contract:</span> {selectedContract.contract_number}
            </p>
            <p className="text-sm text-blue-700">{selectedContract.contract_name}</p>
            {selectedContract.project && (
              <p className="text-xs text-blue-600 mt-1">
                Client: {selectedContract.project.client_name}
              </p>
            )}
            {/* Template assignment status hint */}
            {contractTemplates.length === 0 && !loadingTemplate && (
              <p className="text-xs text-amber-700 mt-1 font-medium">
                ⚠️ No templates {isOnline ? 'assigned to this contract' : 'cached for this contract'}.
                {isOnline && (
                  <a href={`/contracts/${selectedContract.id}/edit`} className="ml-1 underline">
                    Edit contract →
                  </a>
                )}
              </p>
            )}
            {contractTemplates.length === 1 && template && (
              <p className="text-xs text-blue-500 mt-1">
                Template: {template.template_name}
                {!isOnline && <span className="ml-1 text-amber-600">(cached)</span>}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Template loading spinner ─────────────────────────────────────── */}
      {loadingTemplate && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-600">
            {isOnline ? 'Loading template…' : 'Loading cached template…'}
          </p>
        </div>
      )}

      {/* ── Dynamic Form ─────────────────────────────────────────────────── */}
      {template && !loadingTemplate && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{template.template_name}</h3>
            <p className="text-sm text-gray-600">Fill in the required fields below</p>
          </div>

          <DynamicForm
            template={template}
            contract={selectedContract}
            initialData={formData}
            onChange={handleFormDataChange}
            onSubmit={handleSubmitEntry}
            submitLabel={
              !isOnline
                ? '🔴 Offline — save as draft'
                : submitting ? 'Submitting…' : 'Submit Entry'
            }
            submitDisabled={!isOnline}
            showCancel={false}
          />

          {/* Action buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end border-t pt-6">
            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={saving || submitting}
              >
                Cancel
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => handleSaveAsDraft(formData)}
              disabled={saving || submitting || !selectedContract || !template}
            >
              {saving ? 'Saving…' : '💾 Save as Draft'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Empty state — no contract selected ───────────────────────────── */}
      {!selectedContract && !loadingContracts && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Contract to Begin</h3>
          <p className="text-gray-600">
            {contracts.length === 0
              ? isOnline
                ? 'No active contracts found. Create a contract first.'
                : 'No contracts cached. Connect to the internet and open WorkLedger to cache your contracts.'
              : 'Choose a contract from the dropdown above to load the work entry form.'
            }
          </p>
        </div>
      )}

    </div>
  );
}
