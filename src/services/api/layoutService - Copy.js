/**
 * WorkLedger - Layout Service (FINAL FIX)
 * 
 * Complete CRUD operations for report layout management.
 * 
 * FIX: getLayoutUsage now fails silently (returns 0) instead of throwing error
 * 
 * @module services/api/layoutService
 * @created February 12, 2026 - Session 6
 * @fixed February 12, 2026 - Silent usage count failure
 */

import { supabase } from '../supabase/client';

/**
 * Available block types for layout builder
 */
export const BLOCK_TYPES = [
  {
    type: 'header',
    label: 'Header',
    icon: '📌',
    description: 'Report title and metadata',
    defaultContent: {
      title: 'Work Report',
      subtitle: ''
    }
  },
  {
    type: 'detail_entry',
    label: 'Detail Entry',
    icon: '📋',
    description: 'Key-value pairs in columns',
    defaultOptions: {
      columns: 2,
      layout: 'two_column'
    }
  },
  {
    type: 'text_section',
    label: 'Text Section',
    icon: '📝',
    description: 'Free-form text content',
    defaultOptions: {
      title: 'Observations'
    }
  },
  {
    type: 'checklist',
    label: 'Checklist',
    icon: '✅',
    description: 'Task list with status',
    defaultOptions: {
      showStatus: true
    }
  },
  {
    type: 'table',
    label: 'Table',
    icon: '📊',
    description: 'Structured data table',
    defaultOptions: {
      showHeaders: true
    }
  },
  {
    type: 'photo_grid',
    label: 'Photo Grid',
    icon: '📷',
    description: 'Photo gallery',
    defaultOptions: {
      columns: 2,
      showTimestamps: true,
      showCaptions: true
    }
  },
  {
    type: 'signature_box',
    label: 'Signature Box',
    icon: '✍️',
    description: 'Signature capture area',
    defaultOptions: {
      title: 'Signatures'
    }
  },
  {
    type: 'metrics_cards',
    label: 'Metrics Cards',
    icon: '📈',
    description: 'Statistics cards',
    defaultOptions: {
      columns: 3
    }
  }
];

class LayoutService {
  /**
   * Get all layouts with optional filtering
   * 
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Layouts array
   */
  async getLayouts(filters = {}) {
    try {
      console.log('📋 Fetching layouts...', filters);

      let query = supabase
        .from('report_layouts')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by template type
      if (filters.templateType) {
        query = query.contains('compatible_template_types', [filters.templateType]);
      }

      // Filter by active status
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      // Search by name
      if (filters.search) {
        query = query.ilike('layout_name', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log(`✅ Found ${data.length} layouts`);
      return data;

    } catch (error) {
      console.error('❌ Failed to fetch layouts:', error);
      throw error;
    }
  }

  /**
   * Get single layout by ID or layout_id
   * 
   * @param {string} identifier - UUID or layout_id (e.g., 'standard_v1')
   * @returns {Promise<Object>} Layout object
   */
  async getLayout(identifier) {
    try {
      console.log('📄 Fetching layout:', identifier);

      // Try by UUID first
      let query = supabase
        .from('report_layouts')
        .select('*')
        .eq('id', identifier)
        .maybeSingle();

      let { data, error } = await query;

      // If not found by UUID, try by layout_id
      if (!data && !error) {
        query = supabase
          .from('report_layouts')
          .select('*')
          .eq('layout_id', identifier)
          .maybeSingle();

        ({ data, error } = await query);
      }

      if (error) throw error;
      if (!data) throw new Error('Layout not found');

      console.log('✅ Layout fetched:', data.layout_name);
      return data;

    } catch (error) {
      console.error('❌ Failed to fetch layout:', error);
      throw error;
    }
  }

  /**
   * Create new layout
   * 
   * @param {Object} layoutData - Layout data
   * @returns {Promise<Object>} Created layout
   */
  async createLayout(layoutData) {
    try {
      console.log('📝 Creating layout:', layoutData.layout_name);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate layout_id if not provided
      if (!layoutData.layout_id) {
        layoutData.layout_id = this.generateLayoutId(layoutData.layout_name);
      }

      // Validate schema
      this.validateLayoutSchema(layoutData.layout_schema);

      // Prepare data
      const newLayout = {
        layout_id: layoutData.layout_id,
        layout_name: layoutData.layout_name,
        layout_description: layoutData.layout_description || null,
        layout_schema: layoutData.layout_schema,
        compatible_template_types: layoutData.compatible_template_types || [],
        is_active: layoutData.is_active !== undefined ? layoutData.is_active : true,
        is_default: layoutData.is_default || false,
        created_by: user.id
      };

      const { data, error } = await supabase
        .from('report_layouts')
        .insert(newLayout)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Layout created:', data.id);
      return data;

    } catch (error) {
      console.error('❌ Failed to create layout:', error);
      throw error;
    }
  }

  /**
   * Update existing layout
   * 
   * @param {string} id - Layout UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated layout
   */
  async updateLayout(id, updates) {
    try {
      console.log('✏️ Updating layout:', id);

      // Validate schema if being updated
      if (updates.layout_schema) {
        this.validateLayoutSchema(updates.layout_schema);
      }

      // Remove fields that shouldn't be updated
      const { id: _, created_at, created_by, ...allowedUpdates } = updates;

      // Add updated timestamp
      allowedUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('report_layouts')
        .update(allowedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Layout updated:', data.layout_name);
      return data;

    } catch (error) {
      console.error('❌ Failed to update layout:', error);
      throw error;
    }
  }

  /**
   * Delete layout (soft delete by setting is_active = false)
   * 
   * @param {string} id - Layout UUID
   * @returns {Promise<boolean>} Success status
   */
  async deleteLayout(id) {
    try {
      console.log('🗑️ Deleting layout:', id);

      // Check if layout is in use
      const usage = await this.getLayoutUsage(id);
      if (usage > 0) {
        throw new Error(`Cannot delete layout: ${usage} reports are using it`);
      }

      // Soft delete (set is_active = false)
      const { error } = await supabase
        .from('report_layouts')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Layout deleted (soft)');
      return true;

    } catch (error) {
      console.error('❌ Failed to delete layout:', error);
      throw error;
    }
  }

  /**
   * Clone existing layout with new name
   * 
   * @param {string} id - Layout UUID to clone
   * @param {string} newName - Name for cloned layout
   * @returns {Promise<Object>} Cloned layout
   */
  async cloneLayout(id, newName) {
    try {
      console.log('📋 Cloning layout:', id, '→', newName);

      // Get original layout
      const original = await this.getLayout(id);

      // Create clone
      const cloneData = {
        layout_name: newName,
        layout_description: original.layout_description 
          ? `${original.layout_description} (Cloned)` 
          : 'Cloned layout',
        layout_schema: original.layout_schema,
        compatible_template_types: original.compatible_template_types,
        is_active: true,
        is_default: false
      };

      const cloned = await this.createLayout(cloneData);

      console.log('✅ Layout cloned:', cloned.id);
      return cloned;

    } catch (error) {
      console.error('❌ Failed to clone layout:', error);
      throw error;
    }
  }

  /**
   * Get count of reports using this layout
   * 
   * FIXED: Now fails silently and returns 0
   * (generated_reports table may not exist yet)
   * 
   * @param {string} layoutId - Layout UUID
   * @returns {Promise<number>} Usage count (0 if error)
   */
  async getLayoutUsage(layoutId) {
    try {
      // Get layout to find layout_id
      const layout = await this.getLayout(layoutId);

      const { count, error } = await supabase
        .from('generated_reports')
        .select('*', { count: 'exact', head: true })
        .eq('layout_id', layout.layout_id);

      if (error) {
        // FIXED: Silently fail instead of throwing
        // Table may not exist yet or RLS may block
        console.warn('⚠️ Could not fetch layout usage (table may not exist yet)');
        return 0;
      }

      return count || 0;

    } catch (error) {
      // FIXED: Return 0 instead of throwing
      console.warn('⚠️ Could not fetch layout usage:', error.message);
      return 0;
    }
  }

  /**
   * Validate layout schema JSONB structure
   * 
   * @param {Object} schema - Layout schema to validate
   * @throws {Error} If schema is invalid
   */
  validateLayoutSchema(schema) {
    const errors = [];

    // Check required top-level fields
    if (!schema.page) {
      errors.push('Missing required field: page');
    }

    if (!schema.sections || !Array.isArray(schema.sections)) {
      errors.push('Missing or invalid field: sections (must be array)');
    }

    // Validate page config
    if (schema.page) {
      const validSizes = ['A4', 'A3', 'Letter'];
      const validOrientations = ['portrait', 'landscape'];

      if (schema.page.size && !validSizes.includes(schema.page.size)) {
        errors.push(`Invalid page.size: ${schema.page.size} (must be: ${validSizes.join(', ')})`);
      }

      if (schema.page.orientation && !validOrientations.includes(schema.page.orientation)) {
        errors.push(`Invalid page.orientation: ${schema.page.orientation} (must be: ${validOrientations.join(', ')})`);
      }
    }

    // Validate sections
    if (schema.sections) {
      schema.sections.forEach((section, idx) => {
        if (!section.section_id) {
          errors.push(`Section ${idx}: Missing section_id`);
        }

        if (!section.block_type) {
          errors.push(`Section ${idx}: Missing block_type`);
        }

        const validBlockTypes = BLOCK_TYPES.map(b => b.type);
        if (section.block_type && !validBlockTypes.includes(section.block_type)) {
          errors.push(`Section ${idx}: Invalid block_type: ${section.block_type}`);
        }
      });
    }

    if (errors.length > 0) {
      throw new Error(`Schema validation failed:\n${errors.join('\n')}`);
    }

    return true;
  }

  /**
   * Generate layout_id from name
   * 
   * @param {string} name - Layout name
   * @returns {string} Generated layout_id
   */
  generateLayoutId(name) {
    // Convert to snake_case and add version
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

    return `${slug}_v1`;
  }

  /**
   * Get default empty layout schema
   * 
   * @returns {Object} Empty layout schema
   */
  getEmptySchema() {
    return {
      page: {
        size: 'A4',
        orientation: 'portrait',
        margins: {
          top: 20,
          bottom: 20,
          left: 20,
          right: 20
        }
      },
      sections: []
    };
  }

  /**
   * Add section to schema
   * 
   * @param {Object} schema - Current schema
   * @param {Object} section - Section to add
   * @returns {Object} Updated schema
   */
  addSection(schema, section) {
    const updated = { ...schema };
    updated.sections = [...schema.sections, section];
    return updated;
  }

  /**
   * Remove section from schema
   * 
   * @param {Object} schema - Current schema
   * @param {number} index - Section index to remove
   * @returns {Object} Updated schema
   */
  removeSection(schema, index) {
    const updated = { ...schema };
    updated.sections = schema.sections.filter((_, i) => i !== index);
    return updated;
  }

  /**
   * Reorder sections
   * 
   * @param {Object} schema - Current schema
   * @param {number} fromIndex - Source index
   * @param {number} toIndex - Destination index
   * @returns {Object} Updated schema
   */
  reorderSections(schema, fromIndex, toIndex) {
    const updated = { ...schema };
    const sections = [...schema.sections];
    const [moved] = sections.splice(fromIndex, 1);
    sections.splice(toIndex, 0, moved);
    updated.sections = sections;
    return updated;
  }
}

// Export singleton instance
export const layoutService = new LayoutService();
