/**
 * WorkLedger - Work Entry Form Component
 * 
 * Main form for creating and editing work entries.
 * Integrates with DynamicForm (Session 12) for template-driven data entry.
 * 
 * @module components/workEntries/WorkEntryForm
 * @created February 1, 2026 - Session 13
 */

import React, { useState, useEffect } from 'react';
import { DynamicForm } from '../templates/DynamicForm';
import { contractService } from '../../services/api/contractService';
import { templateService } from '../../services/api/templateService';
import Button from '../common/Button';

/**
 * Work Entry Form - Create/edit work entries with template-driven forms
 * 
 * Features:
 * - Contract selector
 * - Entry date picker
 * - Shift selector (if applicable)
 * - DynamicForm integration (Session 12!)
 * - Save as Draft
 * - Submit entry
 * - Validation
 */
export default function WorkEntryForm({
  initialData = null,
  mode = 'create', // 'create' or 'edit'
  onSave,
  onSubmit,
  onCancel
}) {
  // Form state
  const [selectedContract, setSelectedContract] = useState(null);
  const [template, setTemplate] = useState(null);
  const [entryDate, setEntryDate] = useState(
    initialData?.entry_date || new Date().toISOString().split('T')[0]
  );
  const [shift, setShift] = useState(initialData?.shift || '');
  const [formData, setFormData] = useState(initialData?.data || {});
  
  // Loading states
  const [contracts, setContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Error state
  const [error, setError] = useState(null);

  // Load contracts on mount
  useEffect(() => {
    loadContracts();
  }, []);

  // If editing, load contract and template
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      loadExistingData();
    }
  }, [mode, initialData]);

  /**
   * Load available contracts
   */
  const loadContracts = async () => {
    try {
      setLoadingContracts(true);
      const contractsData = await contractService.getUserContracts();
      
      // Filter only active contracts
      const activeContracts = (contractsData || []).filter(
        c => c.status === 'active'
      );
      setContracts(activeContracts);
      
    } catch (err) {
      console.error('Error loading contracts:', err);
      setError('Failed to load contracts');
    } finally {
      setLoadingContracts(false);
    }
  };

  /**
   * Load existing data for edit mode
   */
  const loadExistingData = async () => {
    try {
      if (!initialData?.contract_id) return;

      // Load contract (getContract returns contract directly, not { success, data })
      const contract = await contractService.getContract(initialData.contract_id);
      if (contract) {
        setSelectedContract(contract);
        
        // Load template
        if (contract.template_id) {
          await loadTemplate(contract.template_id);
        }
      }
    } catch (err) {
      console.error('Error loading existing data:', err);
    }
  };

  /**
   * Handle contract selection
   */
  const handleContractChange = async (contractId) => {
    try {
      setError(null);
      setLoadingTemplate(true);

      // Find selected contract
      const contract = contracts.find(c => c.id === contractId);
      if (!contract) {
        setError('Contract not found');
        return;
      }

      setSelectedContract(contract);

      // Load template from contract
      if (contract.template_id) {
        await loadTemplate(contract.template_id);
      } else {
        setError('This contract does not have a template assigned');
        setTemplate(null);
      }

    } catch (err) {
      console.error('Error loading contract:', err);
      setError('Failed to load template');
    } finally {
      setLoadingTemplate(false);
    }
  };

  /**
   * Load template by ID
   */
  const loadTemplate = async (templateId) => {
    try {
      // templateService.getTemplate() returns template directly, not { success, data }
      const template = await templateService.getTemplate(templateId);
      
      if (template) {
        console.log('✅ Template loaded:', template.template_name);
        setTemplate(template);
      } else {
        console.error('❌ Template not found');
        setError('Failed to load template');
      }
    } catch (err) {
      console.error('Error loading template:', err);
      setError('Failed to load template');
    }
  };

  /**
   * Handle save as draft
   */
  const handleSaveAsDraft = async (data) => {
    try {
      setSaving(true);
      setError(null);

      if (!selectedContract) {
        setError('Please select a contract');
        return;
      }

      if (!template) {
        setError('Template not loaded');
        return;
      }

      const workEntryData = {
        contract_id: selectedContract.id,
        template_id: template.id,
        entry_date: entryDate,
        shift: shift || null,
        data: data,
        status: 'draft'
      };

      if (onSave) {
        await onSave(workEntryData);
      }

    } catch (err) {
      console.error('Error saving draft:', err);
      setError(err.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle submit entry
   */
  const handleSubmitEntry = async (data) => {
    try {
      setSubmitting(true);
      setError(null);

      if (!selectedContract) {
        setError('Please select a contract');
        return;
      }

      if (!template) {
        setError('Template not loaded');
        return;
      }

      const workEntryData = {
        contract_id: selectedContract.id,
        template_id: template.id,
        entry_date: entryDate,
        shift: shift || null,
        data: data,
        status: 'submitted'
      };

      if (onSubmit) {
        await onSubmit(workEntryData);
      }

    } catch (err) {
      console.error('Error submitting entry:', err);
      setError(err.message || 'Failed to submit entry');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle form data changes from DynamicForm
   */
  const handleFormDataChange = (newData) => {
    setFormData(newData);
    console.log('📝 Form data updated:', newData);
  };

  // Then in JSX, pass onChange to DynamicForm:
  <DynamicForm
    template={template}
    contract={selectedContract}
    initialData={formData}
    //onChange={handleFormDataChange}  // ← ADD THIS LINE!
    onSubmit={handleSubmitEntry}
    submitLabel={submitting ? 'Submitting...' : 'Submit Entry'}
    showCancel={false}
  />



  // Shift options (can be customized per contract type)
  const shiftOptions = [
    { value: '', label: 'No Shift' },
    { value: 'morning', label: 'Morning' },
    { value: 'afternoon', label: 'Afternoon' },
    { value: 'evening', label: 'Evening' },
    { value: 'night', label: 'Night' }
  ];

  return (
    <div className="space-y-6">
      {/* Error Alert */}
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

      {/* Basic Information Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contract Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contract <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedContract?.id || ''}
              onChange={(e) => handleContractChange(e.target.value)}
              disabled={mode === 'edit' || loadingContracts}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
            >
              <option value="">Select a contract</option>
              {contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.contract_number} - {contract.contract_name}
                </option>
              ))}
            </select>
            {loadingContracts && (
              <p className="text-xs text-gray-500 mt-1">Loading contracts...</p>
            )}
          </div>

          {/* Entry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entry Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Shift (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shift (Optional)
            </label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {shiftOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contract Preview */}
        {selectedContract && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <span className="font-medium">Contract:</span> {selectedContract.contract_number}
            </p>
            <p className="text-sm text-blue-700">
              {selectedContract.contract_name}
            </p>
            {selectedContract.project && (
              <p className="text-xs text-blue-600 mt-1">
                Client: {selectedContract.project.client_name}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Template Loading State */}
      {loadingTemplate && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading template...</p>
        </div>
      )}

      {/* Dynamic Form Section (Session 12 Integration!) */}
      {template && !loadingTemplate && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {template.template_name}
            </h3>
            <p className="text-sm text-gray-600">
              Fill in the required fields below
            </p>
          </div>

          <DynamicForm
            template={template}
            contract={selectedContract}
            initialData={formData}
            onChange={handleFormDataChange}  // ← ADD THIS LINE!
            onSubmit={handleSubmitEntry}
            submitLabel={submitting ? 'Submitting...' : 'Submit Entry'}
            showCancel={false}
          />

          {/* Custom Action Buttons */}
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
              onClick={() => {
                // Get current form data from DynamicForm
                // For now, we'll need to modify DynamicForm to expose getData method
                // Or handle this differently
                const formElement = document.querySelector('form');
                if (formElement) {
                  // This is a workaround - ideally DynamicForm should expose getData
                  console.log('Save as draft clicked');
                  handleSaveAsDraft(formData); // ← ADD THIS!
                }
              }}
              disabled={saving || submitting || !selectedContract || !template}
            >
              {saving ? 'Saving...' : '💾 Save as Draft'}
            </Button>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!selectedContract && !loadingContracts && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Select a Contract to Begin
          </h3>
          <p className="text-gray-600">
            Choose a contract from the dropdown above to load the appropriate work entry form.
          </p>
        </div>
      )}
    </div>
  );
}
