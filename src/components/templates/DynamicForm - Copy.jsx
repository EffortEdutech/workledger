/**
 * WorkLedger - Dynamic Form Component
 * 
 * Main form component that renders an entire template dynamically.
 * Handles form state, validation, and submission.
 * 
 * @module components/templates/DynamicForm
 * @created January 31, 2026 - Session 12
 */

import React, { useState, useEffect } from 'react';
import SectionRenderer from './SectionRenderer';
import Button from '../common/Button';

/**
 * Dynamic Form - Renders complete form from template schema
 * 
 * Features:
 * - Dynamic rendering from template.fields_schema
 * - Form state management
 * - Validation against template.validation_rules
 * - Conditional field visibility
 * - Auto-prefilling from contract data
 */
export function DynamicForm({
  template,
  contract = null,
  initialData = {},
  onSubmit,
  onCancel,
  submitLabel = 'Submit',
  showCancel = true
}) {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values on mount
  useEffect(() => {
    if (template && Object.keys(formData).length === 0) {
      const defaultData = {};
      
      // Process each section
      template.fields_schema?.sections?.forEach(section => {
        section.fields?.forEach(field => {
          const fieldPath = `${section.section_id}.${field.field_id}`;
          
          // Skip if value already exists
          if (formData[fieldPath] !== undefined) return;

          // Handle default_value
          if (field.default_value) {
            if (field.default_value === 'now') {
              const now = new Date();
              if (field.field_type === 'date') {
                defaultData[fieldPath] = now.toISOString().split('T')[0];
              } else if (field.field_type === 'datetime') {
                defaultData[fieldPath] = now.toISOString().slice(0, 16);
              }
            } else {
              defaultData[fieldPath] = field.default_value;
            }
          }

          // Handle prefill_from contract
          if (field.prefill_from && contract) {
            const contractPath = field.prefill_from.replace('contract.', '');
            if (contract[contractPath]) {
              defaultData[fieldPath] = contract[contractPath];
            }
          }

          // Set default values for specific types
          if (field.field_type === 'checkbox' && defaultData[fieldPath] === undefined) {
            defaultData[fieldPath] = false;
          }
        });
      });

      setFormData(prev => ({ ...defaultData, ...prev }));
    }
  }, [template, contract]);

  /**
   * Handle field change
   */
  const handleFieldChange = (fieldPath, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldPath]: value
    }));

    // Clear error for this field
    if (errors[fieldPath]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldPath];
        return newErrors;
      });
    }
  };

  /**
   * Validate form against template validation rules
   */
  const validateForm = () => {
    const newErrors = {};

    if (!template?.fields_schema?.sections) {
      return newErrors;
    }

    // Validate each section
    template.fields_schema.sections.forEach(section => {
      section.fields?.forEach(field => {
        const fieldPath = `${section.section_id}.${field.field_id}`;
        const value = formData[fieldPath];

        // Check required
        if (field.required) {
          if (value === undefined || value === null || value === '' || 
              (typeof value === 'string' && value.trim() === '')) {
            newErrors[fieldPath] = `${field.field_name} is required`;
          }
        }

        // Check min/max for numbers
        if (field.field_type === 'number' && value !== undefined && value !== '') {
          const numValue = parseFloat(value);
          if (field.min !== undefined && numValue < field.min) {
            newErrors[fieldPath] = `${field.field_name} must be at least ${field.min}`;
          }
          if (field.max !== undefined && numValue > field.max) {
            newErrors[fieldPath] = `${field.field_name} must be at most ${field.max}`;
          }
        }

        // Check pattern (regex) for text fields
        if (field.pattern && value) {
          const regex = new RegExp(field.pattern);
          if (!regex.test(value)) {
            newErrors[fieldPath] = field.pattern_message || `${field.field_name} format is invalid`;
          }
        }

        // Check minLength/maxLength for text
        if (field.field_type === 'text' || field.field_type === 'textarea') {
          if (field.minLength && value && value.length < field.minLength) {
            newErrors[fieldPath] = `${field.field_name} must be at least ${field.minLength} characters`;
          }
          if (field.maxLength && value && value.length > field.maxLength) {
            newErrors[fieldPath] = `${field.field_name} must be at most ${field.maxLength} characters`;
          }
        }
      });
    });

    // Apply custom validation rules from template
    if (template.validation_rules) {
      // Additional validation logic can be added here
      // For example: cross-field validation
    }

    return newErrors;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      
      // Scroll to first error
      const firstErrorField = Object.keys(validationErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      
      return;
    }

    // Submit form
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ _form: error.message || 'Failed to submit form' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show error if template is invalid
  if (!template || !template.fields_schema || !template.fields_schema.sections) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-900 mb-2">
          Invalid Template
        </h3>
        <p className="text-red-800">
          The template schema is invalid or missing. Please contact support.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template Header */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-primary-900">
          {template.template_name}
        </h2>
        {template.description && (
          <p className="mt-1 text-sm text-primary-700">
            {template.description}
          </p>
        )}
        {template.metadata?.estimated_completion_time && (
          <p className="mt-2 text-xs text-primary-600">
            Estimated time: {template.metadata.estimated_completion_time}
          </p>
        )}
      </div>

      {/* Render Sections */}
      {template.fields_schema.sections.map((section, index) => (
        <SectionRenderer
          key={section.section_id || index}
          section={section}
          formData={formData}
          onChange={handleFieldChange}
          errors={errors}
          contract={contract}
        />
      ))}

      {/* Form-level Error */}
      {errors._form && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            {errors._form}
          </p>
        </div>
      )}

      {/* Validation Summary */}
      {Object.keys(errors).length > 0 && errors._form === undefined && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm font-medium text-yellow-900 mb-2">
            Please fix the following errors:
          </p>
          <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
            {Object.entries(errors).map(([fieldPath, errorMessage]) => (
              <li key={fieldPath}>
                {errorMessage}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        {showCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default DynamicForm;
