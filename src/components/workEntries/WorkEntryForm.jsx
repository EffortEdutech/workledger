/**
 * WorkLedger - Work Entry Form Component
 *
 * SESSION 14 FIX (Feb 24, 2026):
 *   Fixed to use contract_templates junction table via contractService.getContractTemplates().
 *
 * SESSION 19 — OFFLINE-FIRST (Apr 4, 2026):
 *   Online/offline branching in loadContracts, resolveJunctionRows, loadTemplate.
 *
 *   KEY FIX in resolveJunctionRows (offline path):
 *     Old: getTemplatesForContractCategory(contract.contract_category)
 *          → category slug 'preventive-maintenance' didn't match template
 *            abbreviation 'PMC' → zero templates → "template not found"
 *     New: offlineDataService.getContractJunctionRows(contract.id)
 *          → queries db.contractTemplates (Dexie v2) by contract UUID
 *          → returns rows with full template.fields_schema inline
 *          → exact same shape as online junction rows
 *          → no category mismatch possible
 *
 * @module components/workEntries/WorkEntryForm
 * @created February 1, 2026 - Session 13
 * @updated February 24, 2026 - Session 14: junction table + org-aware
 * @updated April 4, 2026 - Session 19: offline-first + junction-based template lookup
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
  mode = 'create',
  onSave,
  onSubmit,
  onCancel,
}) {
  const { currentOrg } = useOrganization();
  const { isOnline }   = useOffline();

  // ── Core state ───────────────────────────────────────────────────────────
  const [selectedContract,   setSelectedContract]   = useState(null);
  const [template,           setTemplate]           = useState(null);
  const [entryDate,          setEntryDate]          = useState(
    initialData?.entry_date || new Date().toISOString().split('T')[0]
  );
  const [shift,              setShift]              = useState(initialData?.shift || '');
  const [formData,           setFormData]           = useState(initialData?.data || {});
  const [contractTemplates,  setContractTemplates]  = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [contracts,          setContracts]          = useState([]);
  const [loadingContracts,   setLoadingContracts]   = useState(true);
  const [loadingTemplate,    setLoadingTemplate]    = useState(false);
  const [saving,             setSaving]             = useState(false);
  const [submitting,         setSubmitting]         = useState(false);
  const [error,              setError]              = useState(null);

  const shiftOptions = [
    { value: '',          label: 'No Shift'   },
    { value: 'morning',   label: 'Morning'    },
    { value: 'afternoon', label: 'Afternoon'  },
    { value: 'evening',   label: 'Evening'    },
    { value: 'night',     label: 'Night'      },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // LOAD CONTRACTS
  // Online  → contractService.getUserContracts()
  // Offline → offlineDataService.getContractsForOrg() from IndexedDB
  // ─────────────────────────────────────────────────────────────────────────
  const loadContracts = useCallback(async () => {
    try {
      setLoadingContracts(true);
      const orgId = currentOrg?.id ?? null;
      let active;

      if (!isOnline) {
        console.log('📱 Offline: loading contracts from IndexedDB for org:', orgId);
        active = await offlineDataService.getContractsForOrg(orgId);

        if (active.length === 0) {
          setError(
            'No contracts cached for offline use. Connect to the internet ' +
            'and open WorkLedger to cache your contracts.'
          );
        }
      } else {
        const data = await contractService.getUserContracts(orgId);
        active = (data || []).filter(c => c.status === 'active');
      }

      setContracts(active);
      console.log(`✅ ${active.length} contracts loaded (${isOnline ? 'online' : 'offline cached'})`);
    } catch (err) {
      console.error('❌ Error loading contracts:', err);
      setError('Failed to load contracts');
    } finally {
      setLoadingContracts(false);
    }
  }, [currentOrg?.id, isOnline]);

  useEffect(() => { loadContracts(); }, [loadContracts]);

  useEffect(() => {
    if (mode === 'edit' && initialData) loadExistingData();
  }, [mode, initialData]); // eslint-disable-line

  // ─────────────────────────────────────────────────────────────────────────
  // LOAD EXISTING DATA (edit mode)
  // ─────────────────────────────────────────────────────────────────────────
  const loadExistingData = async () => {
    try {
      if (!initialData?.contract_id) return;

      const contract = isOnline
        ? await contractService.getContract(initialData.contract_id)
        : await offlineDataService.getContractById(initialData.contract_id);
      if (!contract) return;

      setSelectedContract(contract);

      const junctionRows = await resolveJunctionRows(contract);
      setContractTemplates(junctionRows);

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

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLE CONTRACT SELECTION
  // ─────────────────────────────────────────────────────────────────────────
  const handleContractChange = async (contractId) => {
    if (!contractId) {
      setSelectedContract(null); setContractTemplates([]); setSelectedTemplateId(null);
      setTemplate(null); setError(null);
      return;
    }

    try {
      setError(null);
      setLoadingTemplate(true);
      setTemplate(null); setContractTemplates([]); setSelectedTemplateId(null); setFormData({});

      const contract = contracts.find(c => c.id === contractId);
      if (!contract) { setError('Contract not found'); return; }
      setSelectedContract(contract);

      const junctionRows = await resolveJunctionRows(contract);

      if (junctionRows.length === 0) {
        setError(
          isOnline
            ? 'This contract has no templates assigned. Go to Contracts → Edit Contract to assign a template first.'
            : 'No templates cached for this contract. Connect to the internet and re-open WorkLedger to cache templates.'
        );
        return;
      }

      setContractTemplates(junctionRows);

      const defaultRow = junctionRows.find(jt => jt.is_default) ?? junctionRows[0];
      setSelectedTemplateId(defaultRow.template_id);
      await loadTemplate(defaultRow.template_id, junctionRows);

    } catch (err) {
      console.error('❌ Error handling contract change:', err);
      setError('Failed to load template. Please try again.');
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleTemplateChange = async (templateId) => {
    if (!templateId || templateId === selectedTemplateId) return;
    try {
      setLoadingTemplate(true);
      setTemplate(null); setFormData({});
      setSelectedTemplateId(templateId);
      await loadTemplate(templateId, contractTemplates);
    } catch (err) {
      console.error('❌ Error switching template:', err);
      setError('Failed to load template');
    } finally {
      setLoadingTemplate(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RESOLVE JUNCTION ROWS
  //
  // Online: uses contract.contract_templates (pre-loaded by getUserContracts)
  //         or falls back to contractService.getContractTemplates() query.
  //
  // Offline: PRIMARY — offlineDataService.getContractJunctionRows(contract.id)
  //          Queries db.contractTemplates (Dexie v2) by contract UUID.
  //          Returns rows with full template.fields_schema inline.
  //          FALLBACK — category-based (last resort, may not match)
  //
  // WHY the change: category slugs ('preventive-maintenance') don't match
  // template abbreviations ('PMC') in the database, so the old offline path
  // returned zero rows for every contract → "template not found".
  // ─────────────────────────────────────────────────────────────────────────
  const resolveJunctionRows = async (contract) => {
    if (!isOnline) {
      console.log('📱 Offline: resolving junction rows from IndexedDB for contract:', contract.id);

      // PRIMARY: cached junction table (Dexie v2, populated by sync)
      const rows = await offlineDataService.getContractJunctionRows(contract.id);
      if (rows.length > 0) {
        console.log(`✅ ${rows.length} junction rows from db.contractTemplates`);
        return rows;
      }

      // FALLBACK A: try category-based template lookup
      console.log('⚠️  No junction rows cached — trying category fallback');
      if (contract.contract_category) {
        const byCategory = await offlineDataService.getTemplatesForContractCategory(
          contract.contract_category
        );
        if (byCategory.length > 0) {
          return byCategory.map((t, i) => ({
            template_id: t.template_id, // text slug — getTemplateById handles this
            is_default:  i === 0,
            label:       t.template_name,
            templates:   t,
          }));
        }
      }

      // FALLBACK B: all cached templates (absolute last resort)
      console.log('⚠️  Category fallback empty — using all cached templates');
      const all = await offlineDataService.getAllTemplates();
      return all.map((t, i) => ({
        template_id: t.template_id,
        is_default:  i === 0,
        label:       t.template_name,
        templates:   t,
      }));
    }

    // Online: use pre-loaded junction rows from getUserContracts()
    if (contract.contract_templates?.length > 0) {
      console.log('✅ Using pre-loaded contract_templates:', contract.contract_templates.length);
      return contract.contract_templates;
    }

    // Online fallback: query junction table directly
    console.log('⏳ Fetching contract_templates from DB for:', contract.id);
    const rows = await contractService.getContractTemplates(contract.id);
    console.log(`✅ Fetched ${rows.length} junction rows from DB`);
    return rows;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // LOAD TEMPLATE BY ID
  //
  // Fast path: if junctionRows carries the full template inline (fields_schema
  // present), use it directly — zero extra reads.
  //
  // Standard path: templateService (online) or offlineDataService (offline).
  //
  // The templateId here can be a UUID (from junction rows, online or offline
  // via getContractJunctionRows) or a text slug (from fallback category path).
  // Both templateService.getTemplate() and offlineDataService.getTemplateById()
  // handle both formats.
  // ─────────────────────────────────────────────────────────────────────────
  const loadTemplate = async (templateId, junctionRows = []) => {
    try {
      // Fast path: inline template in junction row (offline primary path has this)
      const inlineRow = junctionRows.find(
        jt => jt.template_id === templateId && jt.templates?.fields_schema
      );
      if (inlineRow) {
        console.log('✅ Template loaded inline from junction row:', inlineRow.templates.template_name);
        setTemplate(inlineRow.templates);
        return;
      }

      // Standard path
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
          : 'Template not cached. Connect to the internet, open WorkLedger, ' +
            'and navigate to your contracts so templates sync to your device.';
        console.error('❌ Template not found for ID:', templateId);
        setError(msg);
      }
    } catch (err) {
      console.error('❌ Error loading template:', err);
      setError('Failed to load template');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FORM HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  const handleFormDataChange = (newData) => setFormData(newData);

  const handleSaveAsDraft = async (data) => {
    try {
      setSaving(true); setError(null);
      if (!selectedContract) { setError('Please select a contract'); return; }
      if (!template)         { setError('Template not loaded'); return; }

      await onSave?.({
        contract_id:     selectedContract.id,
        template_id:     template.id ?? template.template_id,
        entry_date:      entryDate,
        shift:           shift || null,
        data:            data || formData,
        status:          'draft',
        organization_id: currentOrg?.id,
      });
    } catch (err) {
      console.error('❌ Error saving draft:', err);
      setError(err.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitEntry = async (data) => {
    if (!isOnline) {
      setError(
        'You are offline. Submission requires internet. ' +
        'Save as Draft — it will sync automatically when you reconnect.'
      );
      return;
    }
    try {
      setSubmitting(true); setError(null);
      if (!selectedContract) { setError('Please select a contract'); return; }
      if (!template)         { setError('Template not loaded'); return; }

      await onSubmit?.({
        contract_id:     selectedContract.id,
        template_id:     template.id ?? template.template_id,
        entry_date:      entryDate,
        shift:           shift || null,
        data:            data || formData,
        status:          'submitted',
        submitted_at:    new Date().toISOString(),
        organization_id: currentOrg?.id,
      });
    } catch (err) {
      console.error('❌ Error submitting entry:', err);
      setError(err.message || 'Failed to submit entry');
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <span className="text-xl mt-0.5">📡</span>
          <div>
            <p className="font-medium text-amber-900 text-sm">You are offline</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Contracts and templates load from local cache.
              Save as Draft — syncs automatically when reconnected.
              Submission for approval requires internet.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Basic Information */}
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
                  {c.contract_number} — {c.contract_name}
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

          {/* Template selector — only shown when contract has > 1 template */}
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
                This contract has {contractTemplates.length} templates — select the one for this entry.
              </p>
            </div>
          )}
        </div>

        {/* Contract preview */}
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

      {/* Template loading spinner */}
      {loadingTemplate && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-600">
            {isOnline ? 'Loading template…' : 'Loading cached template…'}
          </p>
        </div>
      )}

      {/* Dynamic Form */}
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
                ? '🔴 Offline — save as draft instead'
                : submitting ? 'Submitting…' : 'Submit Entry'
            }
            submitDisabled={!isOnline}
            showCancel={false}
          />

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end border-t pt-6">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={saving || submitting}>
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

      {/* Empty state */}
      {!selectedContract && !loadingContracts && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Contract to Begin</h3>
          <p className="text-gray-600">
            {contracts.length === 0
              ? isOnline
                ? 'No active contracts found.'
                : 'No contracts cached. Connect and open WorkLedger to cache your data.'
              : 'Choose a contract from the dropdown above.'}
          </p>
        </div>
      )}
    </div>
  );
}
