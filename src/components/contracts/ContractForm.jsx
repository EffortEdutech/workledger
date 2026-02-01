/**
 * WorkLedger - Contract Form Component
 * 
 * Form for creating and editing contracts with conditional fields based on contract category.
 * 
 * @module components/contracts/ContractForm
 * @created January 31, 2026 - Session 10
 */

import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import ContractTypeBadge, { getContractTypeOptions } from './ContractTypeBadge';

export function ContractForm({ 
  contract = null, 
  projects = [],
  templates = [],
  onSubmit, 
  onCancel,
  isLoading = false 
}) {
  // Form state
  const [formData, setFormData] = useState({
    project_id: contract?.project_id || '',
    contract_number: contract?.contract_number || '',
    contract_name: contract?.contract_name || '',
    contract_category: contract?.contract_category || '',
    template_id: contract?.template_id || '',
    reporting_frequency: contract?.reporting_frequency || 'daily',
    requires_approval: contract?.requires_approval !== undefined ? contract.requires_approval : true,
    valid_from: contract?.valid_from || '',
    valid_until: contract?.valid_until || '',
    status: contract?.status || 'active',
    // SLA fields
    sla_response_time_mins: contract?.sla_response_time_mins || '',
    sla_resolution_time_hours: contract?.sla_resolution_time_hours || '',
    sla_tier: contract?.sla_tier || '',
    // Maintenance fields
    maintenance_cycle: contract?.maintenance_cycle || '',
    asset_categories: contract?.asset_categories || []
  });

  // UI state
  const [errors, setErrors] = useState({});
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [assetCategoryInput, setAssetCategoryInput] = useState('');

  // Contract type options
  const contractTypeOptions = getContractTypeOptions();

  // Reporting frequency options
  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'adhoc', label: 'Ad-hoc' }
  ];

  // Status options
  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'completed', label: 'Completed' }
  ];

  // SLA tier options
  const slaTierOptions = [
    { value: '', label: 'Select tier...' },
    { value: 'Gold', label: 'Gold (Premium)' },
    { value: 'Silver', label: 'Silver (Standard)' },
    { value: 'Bronze', label: 'Bronze (Basic)' }
  ];

  // Maintenance cycle options
  const maintenanceCycleOptions = [
    { value: '', label: 'Select cycle...' },
    { value: 'Weekly', label: 'Weekly' },
    { value: 'Bi-weekly', label: 'Bi-weekly' },
    { value: 'Monthly', label: 'Monthly' },
    { value: 'Quarterly', label: 'Quarterly' },
    { value: 'Semi-annually', label: 'Semi-annually' },
    { value: 'Annually', label: 'Annually' }
  ];

  // Filter templates when contract category changes
  useEffect(() => {
    if (formData.contract_category && templates.length > 0) {
      const filtered = templates.filter(
        t => t.contract_category === formData.contract_category
      );
      setFilteredTemplates(filtered);
      
      // Auto-select template if only one available
      if (filtered.length === 1) {
        setFormData(prev => ({
          ...prev,
          template_id: filtered[0].id
        }));
      }
    } else {
      setFilteredTemplates([]);
    }
  }, [formData.contract_category, templates]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Check if SLA fields should be shown
  const showSLAFields = () => {
    return formData.contract_category === 'sla-based-maintenance';
  };

  // Check if maintenance fields should be shown
  const showMaintenanceFields = () => {
    const maintenanceCategories = [
      'preventive-maintenance',
      'comprehensive-maintenance',
      'annual-maintenance'
    ];
    return maintenanceCategories.includes(formData.contract_category);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.project_id) {
      newErrors.project_id = 'Project is required';
    }
    if (!formData.contract_name || formData.contract_name.trim().length < 3) {
      newErrors.contract_name = 'Contract name must be at least 3 characters';
    }
    if (!formData.contract_category) {
      newErrors.contract_category = 'Contract category is required';
    }
    if (!formData.template_id) {
      newErrors.template_id = 'Template is required';
    }

    // Date validation
    if (formData.valid_from && formData.valid_until) {
      const fromDate = new Date(formData.valid_from);
      const untilDate = new Date(formData.valid_until);
      if (untilDate < fromDate) {
        newErrors.valid_until = 'End date must be after start date';
      }
    }

    // SLA validation
    if (showSLAFields()) {
      if (!formData.sla_response_time_mins || formData.sla_response_time_mins <= 0) {
        newErrors.sla_response_time_mins = 'Response time is required for SLA contracts';
      }
      if (!formData.sla_tier) {
        newErrors.sla_tier = 'SLA tier is required';
      }
    }

    // Maintenance validation
    if (showMaintenanceFields()) {
      if (!formData.maintenance_cycle) {
        newErrors.maintenance_cycle = 'Maintenance cycle is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare submission data
    const submitData = {
      contract_number: formData.contract_number.trim() || null,
      contract_name: formData.contract_name.trim(),
      contract_category: formData.contract_category,
      template_id: formData.template_id,
      reporting_frequency: formData.reporting_frequency,
      requires_approval: formData.requires_approval,
      valid_from: formData.valid_from || null,
      valid_until: formData.valid_until || null,
      status: formData.status,
      sla_response_time_mins: showSLAFields() ? parseInt(formData.sla_response_time_mins) || null : null,
      sla_resolution_time_hours: showSLAFields() ? parseInt(formData.sla_resolution_time_hours) || null : null,
      sla_tier: showSLAFields() ? formData.sla_tier : null,
      maintenance_cycle: showMaintenanceFields() ? formData.maintenance_cycle : null,
      asset_categories: showMaintenanceFields() ? formData.asset_categories : null
    };

    onSubmit(formData.project_id, submitData);
  };

  // Handle add asset category
  const handleAddAssetCategory = () => {
    const category = assetCategoryInput.trim();
    if (category && !formData.asset_categories.includes(category)) {
      setFormData(prev => ({
        ...prev,
        asset_categories: [...prev.asset_categories, category]
      }));
      setAssetCategoryInput('');
    }
  };

  // Handle remove asset category
  const handleRemoveAssetCategory = (categoryToRemove) => {
    setFormData(prev => ({
      ...prev,
      asset_categories: prev.asset_categories.filter(cat => cat !== categoryToRemove)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>

        {/* Project Select */}
        <Select
          label="Project"
          name="project_id"
          value={formData.project_id}
          onChange={handleChange}
          error={errors.project_id}
          required
          disabled={!!contract}
        >
          <option value="">Select project...</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.project_code} - {project.project_name}
            </option>
          ))}
        </Select>

        {/* Contract Name */}
        <Input
          label="Contract Name"
          name="contract_name"
          value={formData.contract_name}
          onChange={handleChange}
          error={errors.contract_name}
          placeholder="e.g., HVAC Maintenance Contract"
          required
        />

        {/* Contract Number */}
        <Input
          label="Contract Number"
          name="contract_number"
          value={formData.contract_number}
          onChange={handleChange}
          error={errors.contract_number}
          placeholder="e.g., PMC-KLCC-2024-001 (auto-generated if empty)"
          helpText="Leave empty to auto-generate"
        />

        {/* Contract Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contract Category <span className="text-red-500">*</span>
          </label>
          <select
            name="contract_category"
            value={formData.contract_category}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
              errors.contract_category ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          >
            <option value="">Select contract category...</option>
            {contractTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.contract_category && (
            <p className="mt-1 text-sm text-red-600">{errors.contract_category}</p>
          )}
          {formData.contract_category && (
            <div className="mt-2">
              <ContractTypeBadge category={formData.contract_category} showFullName />
            </div>
          )}
        </div>

        {/* Template Select (filtered by category) */}
        <Select
          label="Template"
          name="template_id"
          value={formData.template_id}
          onChange={handleChange}
          error={errors.template_id}
          required
          disabled={!formData.contract_category}
        >
          <option value="">
            {formData.contract_category 
              ? 'Select template...' 
              : 'Select contract category first...'}
          </option>
          {filteredTemplates.map(template => (
            <option key={template.id} value={template.id}>
              {template.template_name}
            </option>
          ))}
        </Select>

        {/* Status */}
        <Select
          label="Status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          error={errors.status}
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Reporting Configuration */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reporting Configuration</h3>

        {/* Reporting Frequency */}
        <Select
          label="Reporting Frequency"
          name="reporting_frequency"
          value={formData.reporting_frequency}
          onChange={handleChange}
          error={errors.reporting_frequency}
        >
          {frequencyOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        {/* Requires Approval */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="requires_approval"
            id="requires_approval"
            checked={formData.requires_approval}
            onChange={handleChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="requires_approval" className="ml-2 block text-sm text-gray-700">
            Work entries require approval
          </label>
        </div>
      </div>

      {/* Valid Period */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Valid Period</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Valid From"
            name="valid_from"
            type="date"
            value={formData.valid_from}
            onChange={handleChange}
            error={errors.valid_from}
          />

          <Input
            label="Valid Until"
            name="valid_until"
            type="date"
            value={formData.valid_until}
            onChange={handleChange}
            error={errors.valid_until}
          />
        </div>
      </div>

      {/* SLA Configuration (conditional) */}
      {showSLAFields() && (
        <div className="bg-indigo-50 rounded-lg shadow p-6 space-y-4 border border-indigo-200">
          <h3 className="text-lg font-semibold text-indigo-900 mb-4">SLA Configuration</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Response Time (minutes)"
              name="sla_response_time_mins"
              type="number"
              min="1"
              value={formData.sla_response_time_mins}
              onChange={handleChange}
              error={errors.sla_response_time_mins}
              placeholder="e.g., 30"
              required
            />

            <Input
              label="Resolution Time (hours)"
              name="sla_resolution_time_hours"
              type="number"
              min="1"
              value={formData.sla_resolution_time_hours}
              onChange={handleChange}
              error={errors.sla_resolution_time_hours}
              placeholder="e.g., 4"
            />
          </div>

          <Select
            label="SLA Tier"
            name="sla_tier"
            value={formData.sla_tier}
            onChange={handleChange}
            error={errors.sla_tier}
            required
          >
            {slaTierOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Maintenance Configuration (conditional) */}
      {showMaintenanceFields() && (
        <div className="bg-green-50 rounded-lg shadow p-6 space-y-4 border border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-4">Maintenance Configuration</h3>

          <Select
            label="Maintenance Cycle"
            name="maintenance_cycle"
            value={formData.maintenance_cycle}
            onChange={handleChange}
            error={errors.maintenance_cycle}
            required
          >
            {maintenanceCycleOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          {/* Asset Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset Categories
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={assetCategoryInput}
                onChange={(e) => setAssetCategoryInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAssetCategory())}
                placeholder="e.g., HVAC, Lift, Pump"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddAssetCategory}
                disabled={!assetCategoryInput.trim()}
              >
                Add
              </Button>
            </div>

            {formData.asset_categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.asset_categories.map((category, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700"
                  >
                    {category}
                    <button
                      type="button"
                      onClick={() => handleRemoveAssetCategory(category)}
                      className="hover:text-green-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : contract ? 'Update Contract' : 'Create Contract'}
        </Button>
      </div>

      {/* General Error Message */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            Please fix the errors above before submitting.
          </p>
        </div>
      )}
    </form>
  );
}

export default ContractForm;
