/**
 * WorkLedger - Template Service
 * 
 * Service for loading and managing work entry templates.
 * Templates define form structure dynamically without database schema changes.
 * 
 * @module services/api/templateService
 * @created January 31, 2026 - Session 12
 */

import { supabase } from '../supabase/client';

/**
 * Template Service
 */
export class TemplateService {
  /**
   * Get all templates
   * @param {object} filters - Optional filters
   * @returns {Promise<Array>}
   */
  async getTemplates(filters = {}) {
    try {
      console.log('📊 Getting templates...');

      let query = supabase
        .from('templates')
        .select('*')
        .is('deleted_at', null)
        .order('template_name');

      // Apply filters
      if (filters.industry) {
        query = query.eq('industry', filters.industry);
      }
      if (filters.contract_category) {
        query = query.eq('contract_category', filters.contract_category);
      }
      if (filters.is_public !== undefined) {
        query = query.eq('is_public', filters.is_public);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching templates:', error);
        throw error;
      }

      console.log('✅ Retrieved templates:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Exception in getTemplates:', error);
      throw error;
    }
  }

  /**
   * Get templates by contract category
   * @param {string} category - Contract category (PMC, CMC, SLA, etc.)
   * @returns {Promise<Array>}
   */
  async getTemplatesByCategory(category) {
    try {
      console.log('📊 Getting templates for category:', category);

      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('contract_category', category)
        .is('deleted_at', null)
        .order('version', { ascending: false });

      if (error) {
        console.error('❌ Error fetching templates by category:', error);
        throw error;
      }

      console.log('✅ Retrieved templates:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Exception in getTemplatesByCategory:', error);
      throw error;
    }
  }

  /**
   * Get single template by ID
   * @param {string} id - Template UUID or template_id
   * @returns {Promise<object|null>}
   */
  async getTemplate(id) {
    try {
      console.log('📊 Getting template:', id);

      // Try by UUID first
      let { data: template, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single();

      // If not found, try by template_id
      if (error || !template) {
        const result = await supabase
          .from('templates')
          .select('*')
          .eq('template_id', id)
          .single();
        
        template = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ Error fetching template:', error);
        return null;
      }

      console.log('✅ Template fetched:', template.template_name);
      return template;
    } catch (error) {
      console.error('❌ Exception in getTemplate:', error);
      return null;
    }
  }

  /**
   * Get template by contract
   * Fetches the template associated with a contract
   * @param {string} contractId - Contract UUID
   * @returns {Promise<object|null>}
   */
  async getTemplateByContract(contractId) {
    try {
      console.log('📊 Getting template for contract:', contractId);

      // Get contract with template
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('template_id')
        .eq('id', contractId)
        .single();

      if (contractError || !contract) {
        console.error('❌ Contract not found');
        return null;
      }

      // Get template
      return await this.getTemplate(contract.template_id);
    } catch (error) {
      console.error('❌ Exception in getTemplateByContract:', error);
      return null;
    }
  }

  /**
   * Parse and validate template schema
   * @param {object} template - Template object
   * @returns {object} Validation result
   */
  validateTemplateSchema(template) {
    const errors = [];

    // Check required fields
    if (!template.template_id) {
      errors.push('Missing template_id');
    }
    if (!template.template_name) {
      errors.push('Missing template_name');
    }
    if (!template.fields_schema) {
      errors.push('Missing fields_schema');
    }

    // Validate fields_schema structure
    if (template.fields_schema) {
      if (!template.fields_schema.sections || !Array.isArray(template.fields_schema.sections)) {
        errors.push('fields_schema.sections must be an array');
      } else {
        // Validate sections
        template.fields_schema.sections.forEach((section, sIndex) => {
          if (!section.section_id) {
            errors.push(`Section ${sIndex} missing section_id`);
          }
          if (!section.section_name) {
            errors.push(`Section ${sIndex} missing section_name`);
          }
          if (!section.fields || !Array.isArray(section.fields)) {
            errors.push(`Section ${sIndex} missing or invalid fields array`);
          } else {
            // Validate fields
            section.fields.forEach((field, fIndex) => {
              if (!field.field_id) {
                errors.push(`Section ${sIndex}, Field ${fIndex} missing field_id`);
              }
              if (!field.field_name) {
                errors.push(`Section ${sIndex}, Field ${fIndex} missing field_name`);
              }
              if (!field.field_type) {
                errors.push(`Section ${sIndex}, Field ${fIndex} missing field_type`);
              }
            });
          }
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get field count for a template
   * @param {object} template - Template object
   * @returns {number}
   */
  getFieldCount(template) {
    if (!template?.fields_schema?.sections) return 0;

    return template.fields_schema.sections.reduce((count, section) => {
      return count + (section.fields?.length || 0);
    }, 0);
  }

  /**
   * Get section count for a template
   * @param {object} template - Template object
   * @returns {number}
   */
  getSectionCount(template) {
    return template?.fields_schema?.sections?.length || 0;
  }

  /**
   * Extract field IDs from template
   * @param {object} template - Template object
   * @returns {Array<string>}
   */
  getFieldIds(template) {
    if (!template?.fields_schema?.sections) return [];

    const fieldIds = [];
    template.fields_schema.sections.forEach(section => {
      section.fields?.forEach(field => {
        fieldIds.push(`${section.section_id}.${field.field_id}`);
      });
    });

    return fieldIds;
  }

  /**
   * Get template metadata summary
   * @param {object} template - Template object
   * @returns {object}
   */
  getTemplateSummary(template) {
    return {
      id: template.id,
      template_id: template.template_id,
      name: template.template_name,
      industry: template.industry,
      category: template.contract_category,
      version: template.version,
      sectionCount: this.getSectionCount(template),
      fieldCount: this.getFieldCount(template),
      estimatedTime: template.metadata?.estimated_completion_time,
      requiresApproval: template.metadata?.approval_required,
      offlineCapable: template.metadata?.offline_capable
    };
  }
}

// Export singleton instance
export const templateService = new TemplateService();

// Export default
export default templateService;
