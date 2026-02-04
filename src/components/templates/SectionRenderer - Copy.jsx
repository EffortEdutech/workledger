/**
 * WorkLedger - Section Renderer Component
 * 
 * Renders template sections with different layout types.
 * Handles conditional field visibility (show_if logic).
 * 
 * @module components/templates/SectionRenderer
 * @created January 31, 2026 - Session 12
 */

import React from 'react';
import FieldRenderer from './FieldRenderer';

/**
 * Section Renderer - Renders a template section with its fields
 * 
 * Supported layouts:
 * - single_column (default)
 * - two_column
 * - checklist (compact grid for checkboxes)
 */
export function SectionRenderer({
  section,
  formData,
  onChange,
  errors = {},
  contract = null
}) {
  /**
   * Check if field should be shown based on show_if condition
   */
  const shouldShowField = (field) => {
    if (!field.show_if) return true;

    // Parse show_if condition
    // Format: "field_path == value" or "field_path != value"
    try {
      const condition = field.show_if;
      
      // Simple equality check
      if (condition.includes('==')) {
        const [fieldPath, expectedValue] = condition.split('==').map(s => s.trim());
        const actualValue = getFieldValue(fieldPath);
        return actualValue === expectedValue.replace(/['"]/g, '');
      }
      
      // Simple inequality check
      if (condition.includes('!=')) {
        const [fieldPath, expectedValue] = condition.split('!=').map(s => s.trim());
        const actualValue = getFieldValue(fieldPath);
        return actualValue !== expectedValue.replace(/['"]/g, '');
      }

      // If can't parse, show the field
      return true;
    } catch (error) {
      console.error('Error evaluating show_if condition:', error);
      return true;
    }
  };

  /**
   * Get field value from form data
   */
  const getFieldValue = (fieldPath) => {
    // Remove section prefix if exists
    const cleanPath = fieldPath.replace(`${section.section_id}.`, '');
    const fullPath = `${section.section_id}.${cleanPath}`;
    return formData[fullPath] || formData[cleanPath] || '';
  };

  /**
   * Get layout class based on section layout type
   */
  const getLayoutClass = () => {
    const layout = section.layout || 'single_column';

    switch (layout) {
      case 'two_column':
        return 'grid grid-cols-1 md:grid-cols-2 gap-4';
      case 'checklist':
        return 'grid grid-cols-1 md:grid-cols-2 gap-3';
      case 'single_column':
      default:
        return 'space-y-4';
    }
  };

  /**
   * Check if field should show label separately
   */
  const shouldShowLabel = (field) => {
    // Checkboxes and radios include their own labels
    return field.field_type !== 'checkbox' && field.field_type !== 'radio';
  };

  // Filter fields that should be shown
  const visibleFields = section.fields.filter(shouldShowField);

  // Don't render section if no visible fields
  if (visibleFields.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Section Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {section.section_name}
          {section.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </h3>
        {section.description && (
          <p className="mt-1 text-sm text-gray-600">
            {section.description}
          </p>
        )}
      </div>

      {/* Section Fields */}
      <div className={getLayoutClass()}>
        {visibleFields.map((field) => (
          <div key={field.field_id} className="field-wrapper">
            {/* Field Label (if separate from field) */}
            {shouldShowLabel(field) && (
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.field_name}
                {field.required && <span className="text-red-500 ml-1">*</span>}
                {field.help_text && (
                  <span className="block text-xs text-gray-500 font-normal mt-0.5">
                    {field.help_text}
                  </span>
                )}
              </label>
            )}

            {/* Field Renderer */}
            <FieldRenderer
              field={field}
              section={section}
              value={formData[`${section.section_id}.${field.field_id}`]}
              onChange={onChange}
              error={errors[`${section.section_id}.${field.field_id}`]}
              contract={contract}
            />

            {/* Field Error */}
            {errors[`${section.section_id}.${field.field_id}`] && 
             shouldShowLabel(field) && (
              <p className="mt-1 text-sm text-red-600">
                {errors[`${section.section_id}.${field.field_id}`]}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Section Footer (if any) */}
      {section.footer_text && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            {section.footer_text}
          </p>
        </div>
      )}
    </div>
  );
}

export default SectionRenderer;
