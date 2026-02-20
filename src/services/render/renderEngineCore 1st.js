/**
 * WorkLedger - Render Engine Core
 * 
 * Generates Intermediate Representation (Render Tree) from:
 * - Report Layout JSONB (structure)
 * - Work Entry Data (content)
 * - Binding Rules (mapping)
 * 
 * The Render Tree is output-agnostic and can be rendered by any adapter:
 * - HTMLAdapter → Preview
 * - PDFAdapter → PDF
 * - ExcelAdapter → Excel (future)
 * 
 * @module services/render/renderEngineCore
 * @created February 12, 2026 - Session 2
 */

class RenderEngineCore {
  /**
   * Generate Render Tree (Intermediate Representation)
   * 
   * @param {Object} layoutSchema - Report layout JSONB schema
   * @param {Object} workEntryData - Complete work entry with relations
   * @param {Object} bindingRules - Field mapping rules
   * @returns {Object} Render Tree (IR)
   */
  generateRenderTree(layoutSchema, workEntryData, bindingRules) {
    console.log('🔧 RenderEngineCore: Generating Render Tree...');
    
    const renderTree = {
      page: this.extractPageConfig(layoutSchema.page),
      metadata: this.extractMetadata(workEntryData),
      blocks: []
    };
    
    // Process each section in layout
    for (const section of layoutSchema.sections) {
      const block = this.processSection(section, workEntryData, bindingRules);
      
      if (block) {
        renderTree.blocks.push(block);
      }
    }
    
    console.log(`✅ Render Tree generated: ${renderTree.blocks.length} blocks`);
    return renderTree;
  }
  
  /**
   * Extract page configuration
   */
  extractPageConfig(pageConfig) {
    return {
      size: pageConfig?.size || 'A4',
      orientation: pageConfig?.orientation || 'portrait',
      margins: pageConfig?.margins || { top: 20, bottom: 20, left: 20, right: 20 }
    };
  }
  
  /**
   * Extract metadata for headers/footers
   */
  extractMetadata(workEntry) {
    return {
      generatedAt: new Date().toISOString(),
      entryId: workEntry.id,
      entryDate: workEntry.entry_date,
      shift: workEntry.shift,
      contract: {
        number: workEntry.contract?.contract_number,
        name: workEntry.contract?.client_name,
        location: workEntry.contract?.site_location,
        category: workEntry.contract?.contract_category
      },
      template: {
        name: workEntry.template?.template_name,
        category: workEntry.template?.contract_category
      },
      creator: {
        id: workEntry.created_by,
        name: workEntry.created_by_profile?.full_name || 'Unknown',
        role: workEntry.created_by_profile?.role
      },
      status: workEntry.status
    };
  }
  
  /**
   * Process a single section into a render block
   */
  processSection(section, data, bindingRules) {
    // Check conditional visibility
    if (section.show_if) {
      const shouldShow = this.evaluateCondition(section.show_if, data);
      if (!shouldShow) {
        console.log(`  ⏭️  Skipping section ${section.section_id} (condition not met)`);
        return null;
      }
    }
    
    // Map data using binding rules
    const content = this.mapData(section, data, bindingRules);
    
    // Create render block
    const block = {
      blockId: section.section_id,
      type: section.type,
      layout: section.layout || 'default',
      content: content,
      options: this.extractSectionOptions(section)
    };
    
    return block;
  }
  
  /**
   * Map data from work entry to section fields using binding rules
   */
  mapData(section, data, bindingRules) {
    const mappedData = {};
    
    // Get fields for this section
    const fields = section.fields || [];
    
    // Map each field
    for (const fieldKey of fields) {
      // Get binding rule for this field
      const bindingPath = bindingRules[fieldKey];
      
      if (!bindingPath) {
        console.warn(`  ⚠️  No binding rule for field: ${fieldKey}`);
        continue;
      }
      
      // Resolve data using binding path
      const value = this.resolveDataPath(data, bindingPath);
      
      mappedData[fieldKey] = value;
    }
    
    // Special handling for different section types
    switch (section.type) {
      case 'photo_grid':
        mappedData.photos = this.resolvePhotos(data, bindingRules);
        break;
      
      case 'signature_box':
        mappedData.signatures = this.resolveSignatures(data, bindingRules);
        break;
      
      case 'checklist':
        mappedData.items = this.resolveChecklist(data, section, bindingRules);
        break;
      
      case 'text_section':
        mappedData.text = this.resolveDataPath(data, bindingRules['observations'] || 'data.work_details.observations');
        break;
    }
    
    return mappedData;
  }
  
  /**
   * Resolve data path using dot notation and array filtering
   * 
   * Examples:
   * - "entry_date" → data.entry_date
   * - "data.header.asset_id" → data.data.header.asset_id
   * - "created_by_profile.full_name" → data.created_by_profile.full_name
   * - "attachments[file_type=photo]" → filtered array
   */
  resolveDataPath(data, path) {
    if (!path) return null;
    
    // Handle array filtering
    if (path.includes('[')) {
      return this.resolveArrayFilter(data, path);
    }
    
    // Handle simple dot notation
    const keys = path.split('.');
    let current = data;
    
    for (const key of keys) {
      if (current === null || current === undefined) {
        return null;
      }
      current = current[key];
    }
    
    return current;
  }
  
  /**
   * Resolve array filtering
   * Example: "attachments[file_type=photo]"
   */
  resolveArrayFilter(data, path) {
    const match = path.match(/^(\w+)\[(\w+)=(\w+)\]$/);
    
    if (!match) {
      console.warn(`  ⚠️  Invalid array filter syntax: ${path}`);
      return null;
    }
    
    const [, arrayKey, filterKey, filterValue] = match;
    const array = data[arrayKey];
    
    if (!Array.isArray(array)) {
      return null;
    }
    
    return array.filter(item => item[filterKey] === filterValue);
  }
  
  /**
   * Resolve photos from attachments
   */
  resolvePhotos(data, bindingRules) {
    const photosPath = bindingRules['photos'] || 'attachments[file_type=photo]';
    const photos = this.resolveDataPath(data, photosPath) || [];
    
    // Ensure photos have required fields
    return photos.map(photo => ({
      url: photo.storage_url || photo.url,
      caption: photo.caption || photo.metadata?.caption || '',
      timestamp: photo.uploaded_at || photo.created_at,
      location: photo.metadata?.location,
      field_id: photo.field_id
    }));
  }
  
  /**
   * Resolve signatures from attachments
   */
  resolveSignatures(data, bindingRules) {
    const signaturesPath = bindingRules['signatures'] || 'attachments[file_type=signature]';
    const signatures = this.resolveDataPath(data, signaturesPath) || [];
    
    // Ensure signatures have required fields
    return signatures.map(sig => ({
      url: sig.storage_url || sig.url,
      name: sig.metadata?.signer_name || 'Signature',
      date: sig.uploaded_at || sig.created_at,
      role: sig.metadata?.signer_role,
      field_id: sig.field_id
    }));
  }
  
  /**
   * Resolve checklist items
   */
  resolveChecklist(data, section, bindingRules) {
    const checklistPath = bindingRules['checklist_items'] || 'data.checklist.items';
    const items = this.resolveDataPath(data, checklistPath) || [];
    
    // Ensure checklist items have required fields
    return items.map(item => ({
      task: item.task || item.label || item.item || '',
      status: item.status || item.value || item.checked || '',
      remarks: item.remarks || item.notes || ''
    }));
  }
  
  /**
   * Evaluate conditional visibility
   */
  evaluateCondition(condition, data) {
    // Simple field equality
    if (condition.field && condition.equals !== undefined) {
      const value = this.resolveDataPath(data, condition.field);
      return value === condition.equals;
    }
    
    // Field exists
    if (condition.field && condition.exists !== undefined) {
      const value = this.resolveDataPath(data, condition.field);
      const exists = value !== null && value !== undefined;
      return condition.exists ? exists : !exists;
    }
    
    // Array contains
    if (condition.field && condition.contains !== undefined) {
      const value = this.resolveDataPath(data, condition.field);
      if (!Array.isArray(value)) return false;
      
      // Check if any item in array matches condition
      return value.some(item => {
        for (const [key, val] of Object.entries(condition.contains)) {
          if (item[key] !== val) return false;
        }
        return true;
      });
    }
    
    // Array has items
    if (condition.field && condition.has_items !== undefined) {
      const value = this.resolveDataPath(data, condition.field);
      const hasItems = Array.isArray(value) && value.length > 0;
      return condition.has_items ? hasItems : !hasItems;
    }
    
    // Default: show section
    return true;
  }
  
  /**
   * Extract section-specific options
   */
  extractSectionOptions(section) {
    const options = {};
    
    // Common options
    if (section.show_logo !== undefined) options.showLogo = section.show_logo;
    if (section.show_contract !== undefined) options.showContract = section.show_contract;
    if (section.columns !== undefined) options.columns = section.columns;
    if (section.title !== undefined) options.title = section.title;
    
    // Photo-specific
    if (section.show_timestamps !== undefined) options.showTimestamps = section.show_timestamps;
    if (section.show_captions !== undefined) options.showCaptions = section.show_captions;
    if (section.show_location !== undefined) options.showLocation = section.show_location;
    if (section.photo_size !== undefined) options.photoSize = section.photo_size;
    
    // Checklist-specific
    if (section.show_status !== undefined) options.showStatus = section.show_status;
    
    // Header-specific
    if (section.content) options.content = section.content;
    
    return options;
  }
}

// Export singleton instance
export const renderEngineCore = new RenderEngineCore();
