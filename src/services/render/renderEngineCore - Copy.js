/**
 * WorkLedger - Render Engine Core (BACKWARD COMPATIBLE)
 * 
 * Supports BOTH old and new layout formats:
 * - Old hardcoded layouts: use "type" field
 * - New Layout Builder layouts: use "block_type" field
 * 
 * @module services/render/renderEngineCore
 * @updated February 13, 2026 - Backward Compatibility Fix
 * @updated February 16, 2026 - Photo/Signature auto-extraction fix
 */

import { extractSectionData, extractPhotos, extractSignatures, getFieldLabel } from '../../utils/templateBindingMapper';

class RenderEngineCore {
  /**
   * Generate Render Tree (Intermediate Representation)
   */
  generateRenderTree(layoutSchema, workEntryData, bindingRules = null) {
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
        name: workEntry.contract?.contract_name,
        client: workEntry.contract?.project?.client_name,
        location: workEntry.contract?.project?.site_address,
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
   * BACKWARD COMPATIBLE with old and new formats!
   * FIXED: Handles photo_grid and signature_box properly!
   */
  processSection(section, workEntry, legacyBindingRules = null) {
    // Check conditional visibility
    if (section.show_if) {
      const shouldShow = this.evaluateCondition(section.show_if, workEntry);
      if (!shouldShow) {
        console.log(`  ⏭️  Skipping section ${section.section_id} (condition not met)`);
        return null;
      }
    }
    
    // Determine block type (support both old and new)
    const blockType = section.block_type || section.type;
    
    // Extract content based on format
    let content;
    
    if (section.binding_rules) {
      // NEW FORMAT: Layout Builder with binding_rules
      content = extractSectionData(workEntry, section);
      
      // Add field labels if available
      if (section.binding_rules.template_section && workEntry.template) {
        content._labels = this.extractFieldLabels(
          section.binding_rules,
          workEntry.template
        );
      }
    } else if (blockType === 'photo_grid') {
      // CRITICAL FIX: Photo grid without binding_rules
      // Check if there's a filter
      const filter = section.binding_rules?.filter_by_field;
      const photos = extractPhotos(workEntry, filter);
      content = { photos };
      console.log(`  📸 Extracted ${photos.length} photos for ${section.section_id}${filter ? ` (${filter})` : ''}`);
      
    } else if (blockType === 'signature_box') {
      // CRITICAL FIX: Signature box without binding_rules
      // Call extractSignatures directly!
      const signatures = extractSignatures(workEntry);
      content = { signatures };
      console.log(`  ✍️ Extracted ${signatures.length} signatures for ${section.section_id}`);
      
    } else if (section.fields || legacyBindingRules) {
      // OLD FORMAT: Hardcoded layouts with fields array
      content = this.mapDataLegacy(section, workEntry, legacyBindingRules);
    } else {
      // Fallback: empty content
      content = {};
    }
    
    // Create render block
    const block = {
      blockId: section.section_id,
      type: blockType,
      layout: section.layout,
      content: content,
      options: section.options || this.extractSectionOptions(section)
    };
    
    return block;
  }
  
  /**
   * Legacy data mapping (for old hardcoded layouts)
   * FIXED: Now extracts from work_entries.data JSONB field automatically!
   */
  mapDataLegacy(section, workEntry, bindingRules) {
    const mappedData = {};
    
    // Get fields for this section
    const fields = section.fields || [];
    
    // CRITICAL FIX: If no bindingRules provided, extract from work_entries.data
    if (!bindingRules || Object.keys(bindingRules).length === 0) {
      console.log('  📦 No binding rules - auto-extracting from work_entries.data');
      
      // Get all data from work_entries.data JSONB field
      const entryData = workEntry.entry_data || workEntry.data || {};
      
      // For each field in section, find it in entry data
      for (const fieldKey of fields) {
        let found = false;
        
        // Search in all sections of entry data
        for (const [sectionKey, sectionData] of Object.entries(entryData)) {
          if (typeof sectionData === 'object' && sectionData !== null) {
            if (fieldKey in sectionData) {
              mappedData[fieldKey] = sectionData[fieldKey];
              found = true;
              break;
            }
          }
        }
        
        // If not found in sections, try top-level
        if (!found && fieldKey in entryData) {
          mappedData[fieldKey] = entryData[fieldKey];
        }
        
        // Fallback to workEntry top-level (for entry_date, shift, etc.)
        if (!found && fieldKey in workEntry) {
          mappedData[fieldKey] = workEntry[fieldKey];
        }
      }
      
      console.log('  ✅ Auto-extracted:', Object.keys(mappedData));
    } else {
      // Has binding rules - use them
      for (const fieldKey of fields) {
        const bindingPath = bindingRules[fieldKey];
        
        if (!bindingPath) {
          console.warn(`  ⚠️  No binding rule for field: ${fieldKey}`);
          continue;
        }
        
        // Resolve data using binding path
        const value = this.resolveDataPath(workEntry, bindingPath);
        mappedData[fieldKey] = value;
      }
    }
    
    // Special handling for different section types
    switch (section.type) {
      case 'photo_grid':
        mappedData.photos = this.resolvePhotos(workEntry, bindingRules);
        break;
      
      case 'signature_box':
        mappedData.signatures = this.resolveSignatures(workEntry, bindingRules);
        break;
      
      case 'checklist':
        mappedData.items = this.resolveChecklist(workEntry, section, bindingRules);
        break;
      
      case 'text_section':
        mappedData.text = this.resolveDataPath(workEntry, bindingRules?.['observations'] || 'data.work_details.observations');
        break;
    }
    
    return mappedData;
  }
  
  /**
   * Resolve data path using dot notation
   */
  resolveDataPath(data, path) {
    if (!path) return null;
    
    // Handle array filtering
    if (path.includes('[')) {
      return this.resolveArrayFilter(data, path);
    }
    
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
   * Resolve array filtering (legacy)
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
   * Resolve photos from attachments (legacy)
   */
  resolvePhotos(data, bindingRules) {
    const photosPath = bindingRules?.['photos'] || 'attachments[file_type=photo]';
    const photos = this.resolveDataPath(data, photosPath) || [];
    
    return photos.map(photo => ({
      url: photo.storage_url || photo.url,
      caption: photo.caption || photo.metadata?.caption || '',
      timestamp: photo.uploaded_at || photo.created_at,
      location: photo.metadata?.location,
      field_id: photo.field_id
    }));
  }
  
  /**
   * Resolve signatures from attachments (legacy)
   */
  resolveSignatures(data, bindingRules) {
    const signaturesPath = bindingRules?.['signatures'] || 'attachments[file_type=signature]';
    const signatures = this.resolveDataPath(data, signaturesPath) || [];
    
    return signatures.map(sig => ({
      url: sig.storage_url || sig.url,
      name: sig.metadata?.signer_name || 'Signature',
      date: sig.uploaded_at || sig.created_at,
      role: sig.metadata?.signer_role,
      field_id: sig.field_id
    }));
  }
  
  /**
   * Resolve checklist items (legacy)
   */
  resolveChecklist(data, section, bindingRules) {
    const checklistPath = bindingRules?.['checklist_items'] || 'data.checklist.items';
    const items = this.resolveDataPath(data, checklistPath) || [];
    
    return items.map(item => ({
      task: item.task || item.label || item.item || '',
      status: item.status || item.value || item.checked || '',
      remarks: item.remarks || item.notes || ''
    }));
  }
  
  /**
   * Extract field labels from template
   */
  extractFieldLabels(bindingRules, template) {
    const { template_section, fields } = bindingRules;
    const labels = {};
    
    if (fields && Array.isArray(fields)) {
      fields.forEach(fieldId => {
        labels[fieldId] = getFieldLabel(template, template_section, fieldId);
      });
    }
    
    return labels;
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
   * Extract section-specific options (legacy)
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
