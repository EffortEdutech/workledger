# WorkLedger Report System Upgrade - COMPREHENSIVE IMPLEMENTATION CHECKLIST

**Date:** February 11, 2026  
**Developer:** Eff  
**Implementation Type:** COMPREHENSIVE (Full Architecture)  
**Estimated Duration:** 20-25 hours over 2-3 sessions  
**Status:** 🚀 READY TO START  

---

## 📋 OVERVIEW

This checklist implements the **complete** dual-template architecture with:
- ✅ Separation of data structure (Work Template) from presentation (Report Layout)
- ✅ User-selectable report layouts
- ✅ Print preview with zoom controls
- ✅ Render Engine with Intermediate Representation (IR)
- ✅ HTML and PDF adapters
- ✅ **MAINTAINS existing UI:** Per-entry selection with expand/collapse and per-field checkboxes
- ✅ Future-proof for Excel, API, dashboard outputs

---

## 🎯 SESSION 1: FOUNDATION & DATABASE (6-8 hours)

### Pre-Session Preparation
- [ ] Review REPORT_SYSTEM_UPGRADE_STRATEGY.md thoroughly
- [ ] Backup current database
- [ ] Document current pdf_layout structure from all 8 templates
- [ ] Test current report generation to establish baseline

---

### TASK 1.1: Create Report Layouts Table (1 hour)

**File:** `database/schema/004_report_layouts.sql`

**Checklist:**
- [ ] Create report_layouts table with fields:
  - [ ] id (UUID, primary key)
  - [ ] layout_id (TEXT, unique)
  - [ ] layout_name (TEXT)
  - [ ] description (TEXT)
  - [ ] compatible_template_types (TEXT[])
  - [ ] layout_schema (JSONB) - the actual layout definition
  - [ ] binding_rules (JSONB) - data mapping rules
  - [ ] preview_config (JSONB) - preview settings
  - [ ] is_public (BOOLEAN)
  - [ ] organization_id (UUID, FK)
  - [ ] version (TEXT)
  - [ ] is_active (BOOLEAN)
  - [ ] created_by (UUID, FK)
  - [ ] created_at, updated_at timestamps

- [ ] Create indexes:
  - [ ] layout_id (unique)
  - [ ] compatible_template_types (GIN)
  - [ ] is_active
  - [ ] organization_id

- [ ] Add RLS policies:
  - [ ] Public layouts visible to all
  - [ ] Private layouts visible to organization only
  - [ ] Create: authenticated users can create
  - [ ] Update: owner or admin can update
  - [ ] Delete: soft delete only (is_active = false)

**SQL Template:**
```sql
-- database/schema/004_report_layouts.sql

-- ============================================
-- REPORT LAYOUTS TABLE
-- ============================================

CREATE TABLE report_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  layout_id TEXT UNIQUE NOT NULL,
  layout_name TEXT NOT NULL,
  description TEXT,
  
  -- Compatibility
  compatible_template_types TEXT[] NOT NULL,
  
  -- Layout Definition (JSONB)
  layout_schema JSONB NOT NULL,
  binding_rules JSONB NOT NULL,
  
  -- Preview Configuration
  preview_config JSONB,
  
  -- Access Control
  is_public BOOLEAN DEFAULT true,
  organization_id UUID REFERENCES organizations(id),
  
  -- Version Control
  version TEXT NOT NULL DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT layout_id_format CHECK (layout_id ~ '^[a-z0-9_]+$')
);

-- Indexes
CREATE INDEX idx_report_layouts_layout_id ON report_layouts(layout_id);
CREATE INDEX idx_report_layouts_compatible_types ON report_layouts USING gin(compatible_template_types);
CREATE INDEX idx_report_layouts_active ON report_layouts(is_active) WHERE is_active = true;
CREATE INDEX idx_report_layouts_org ON report_layouts(organization_id);
CREATE INDEX idx_report_layouts_public ON report_layouts(is_public) WHERE is_public = true;

-- JSONB indexes
CREATE INDEX idx_report_layouts_schema_gin ON report_layouts USING gin(layout_schema);
CREATE INDEX idx_report_layouts_binding_gin ON report_layouts USING gin(binding_rules);

-- RLS Policies
ALTER TABLE report_layouts ENABLE ROW LEVEL SECURITY;

-- Read: Public layouts OR own organization's layouts
CREATE POLICY "report_layouts_select_policy"
ON report_layouts FOR SELECT
USING (
  is_public = true 
  OR organization_id IN (
    SELECT organization_id FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);

-- Create: Authenticated users
CREATE POLICY "report_layouts_insert_policy"
ON report_layouts FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Update: Creator or organization admin
CREATE POLICY "report_layouts_update_policy"
ON report_layouts FOR UPDATE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_id = auth.uid()
    AND organization_id = report_layouts.organization_id
    AND role IN ('admin', 'owner')
  )
);

-- Delete: Soft delete only (set is_active = false)
CREATE POLICY "report_layouts_delete_policy"
ON report_layouts FOR UPDATE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_id = auth.uid()
    AND organization_id = report_layouts.organization_id
    AND role IN ('admin', 'owner')
  )
);

-- Trigger for updated_at
CREATE TRIGGER set_report_layouts_updated_at
BEFORE UPDATE ON report_layouts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE report_layouts IS 'Report layout templates for document composition';
COMMENT ON COLUMN report_layouts.layout_schema IS 'JSONB schema defining report structure and sections';
COMMENT ON COLUMN report_layouts.binding_rules IS 'JSONB rules for mapping work entry data to layout fields';
COMMENT ON COLUMN report_layouts.compatible_template_types IS 'Array of template types this layout works with (PMC, CMC, etc.)';
```

**Testing:**
- [ ] Run migration in Supabase SQL editor
- [ ] Verify table created with correct structure
- [ ] Test RLS policies with different user roles
- [ ] Verify indexes created

**Commit Message:**
```
feat: Add report_layouts table for dual-template architecture

- Create report_layouts table with JSONB schema
- Add RLS policies for public/private layouts
- Add indexes for performance
- Enable layout versioning and activation control
- Foundation for user-selectable report formats
```

---

### TASK 1.2: Update Templates Table (30 minutes)

**File:** `database/migrations/005_update_templates_for_layouts.sql`

**Checklist:**
- [ ] Add default_layout_id column to templates table
- [ ] Create FK constraint to report_layouts
- [ ] Keep existing pdf_layout column (backward compatibility)
- [ ] Add migration note for future cleanup

**SQL:**
```sql
-- database/migrations/005_update_templates_for_layouts.sql

-- Add default_layout_id to templates
ALTER TABLE templates
ADD COLUMN default_layout_id TEXT REFERENCES report_layouts(layout_id);

-- Add index
CREATE INDEX idx_templates_default_layout ON templates(default_layout_id);

-- Update existing templates to use 'standard_v1' (will be created in next step)
-- NOTE: This will be updated after we create the default layouts

COMMENT ON COLUMN templates.default_layout_id IS 'Default report layout for this template (FK to report_layouts.layout_id)';

-- Migration Note:
-- pdf_layout column is kept for backward compatibility during transition
-- Future: Remove pdf_layout after all systems migrated to report_layouts
```

**Testing:**
- [ ] Run migration
- [ ] Verify column added
- [ ] Verify FK constraint works
- [ ] Verify existing templates still work

**Commit Message:**
```
feat: Add default_layout_id to templates table

- Link templates to report_layouts
- Maintain backward compatibility with pdf_layout
- Prepare for dual-template architecture
```

---

### TASK 1.3: Extract & Create Default Layouts (2-3 hours)

**Goal:** Convert existing pdf_layout from templates into report_layout records

**File:** `database/seeds/002_default_report_layouts.sql`

**Process:**
1. Document current pdf_layout from each template type
2. Design 3 default layouts:
   - **standard_v1** - Current comprehensive layout
   - **simple_v1** - Minimal quick report
   - **photo_evidence_v1** - Photo-focused layout

3. Create layout_schema JSONB structure
4. Create binding_rules JSONB structure

**Checklist:**

**A. Document Existing Layouts (1 hour)**
- [ ] PMC template pdf_layout documented
- [ ] CMC template pdf_layout documented
- [ ] AMC template pdf_layout documented
- [ ] SLA template pdf_layout documented
- [ ] CORRECTIVE template pdf_layout documented
- [ ] EMERGENCY template pdf_layout documented
- [ ] T&M template pdf_layout documented
- [ ] CONSTRUCTION template pdf_layout documented

**B. Design Standard Layout (1 hour)**
- [ ] Create layout_schema for standard_v1
- [ ] Define sections array
- [ ] Create binding_rules mapping
- [ ] Add preview_config

**Layout Schema Structure:**
```json
{
  "page": {
    "size": "A4",
    "orientation": "portrait",
    "margins": { "top": 20, "bottom": 20, "left": 20, "right": 20 }
  },
  "sections": [
    {
      "section_id": "header",
      "type": "header",
      "layout": "full_width",
      "show_logo": true,
      "show_contract": true,
      "content": {
        "title": "Work Report",
        "show_date_range": true
      }
    },
    {
      "section_id": "work_details",
      "type": "detail_entry",
      "layout": "two_column",
      "fields": ["date", "shift", "technician", "location"],
      "show_if": null
    },
    {
      "section_id": "checklist",
      "type": "checklist",
      "layout": "table",
      "show_status": true,
      "show_if": {
        "field": "template.fields_schema.sections",
        "contains": { "section_id": "checklist" }
      }
    },
    {
      "section_id": "observations",
      "type": "text_section",
      "layout": "full_width",
      "field": "work_details.observations"
    },
    {
      "section_id": "photos",
      "type": "photo_grid",
      "layout": "grid",
      "columns": 2,
      "show_timestamps": true,
      "show_captions": true
    },
    {
      "section_id": "signatures",
      "type": "signature_box",
      "layout": "two_column"
    }
  ]
}
```

**Binding Rules Structure:**
```json
{
  "date": "work_entry.entry_date",
  "shift": "work_entry.shift",
  "technician": "work_entry.created_by_profile.full_name",
  "location": "work_entry.contract.site_location",
  "contract_number": "work_entry.contract.contract_number",
  "client_name": "work_entry.contract.client_name",
  "observations": "work_entry.data.work_details.observations",
  "checklist_items": "work_entry.data.checklist.items",
  "photos": "work_entry.attachments[file_type=photo]",
  "signatures": "work_entry.attachments[file_type=signature]"
}
```

**C. Design Simple Layout (30 minutes)**
- [ ] Create layout_schema for simple_v1
- [ ] Minimal sections (header, summary, observations only)
- [ ] Create binding_rules
- [ ] Add preview_config

**D. Design Photo Evidence Layout (30 minutes)**
- [ ] Create layout_schema for photo_evidence_v1
- [ ] Photo-focused (header, minimal details, large photo grid)
- [ ] Create binding_rules
- [ ] Add preview_config

**E. Insert into Database**
- [ ] Insert standard_v1 layout
- [ ] Insert simple_v1 layout
- [ ] Insert photo_evidence_v1 layout
- [ ] Update templates.default_layout_id to 'standard_v1'

**SQL Template:**
```sql
-- database/seeds/002_default_report_layouts.sql

-- ============================================
-- DEFAULT REPORT LAYOUTS
-- ============================================

-- 1. STANDARD REPORT (Comprehensive)
INSERT INTO report_layouts (
  layout_id,
  layout_name,
  description,
  compatible_template_types,
  layout_schema,
  binding_rules,
  preview_config,
  is_public,
  version
) VALUES (
  'standard_v1',
  'Standard Report',
  'Comprehensive report with all details, photos, and signatures',
  ARRAY['PMC', 'CMC', 'AMC', 'SLA', 'CORRECTIVE', 'EMERGENCY', 'T_AND_M', 'CONSTRUCTION'],
  '{
    "page": {...},
    "sections": [...]
  }'::jsonb,
  '{
    "date": "work_entry.entry_date",
    ...
  }'::jsonb,
  '{
    "thumbnail": null,
    "zoom_default": 1.0,
    "show_margins": true
  }'::jsonb,
  true,
  '1.0'
);

-- 2. SIMPLE REPORT (Quick Overview)
INSERT INTO report_layouts (
  layout_id,
  layout_name,
  description,
  compatible_template_types,
  layout_schema,
  binding_rules,
  preview_config,
  is_public,
  version
) VALUES (
  'simple_v1',
  'Simple Report',
  'Quick overview with essential details only - no photos',
  ARRAY['PMC', 'CMC', 'AMC', 'SLA', 'CORRECTIVE'],
  '{
    "page": {...},
    "sections": [
      {
        "section_id": "header",
        "type": "header",
        "layout": "minimal"
      },
      {
        "section_id": "summary",
        "type": "detail_entry",
        "layout": "compact",
        "fields": ["date", "shift", "technician", "location", "status"]
      },
      {
        "section_id": "observations",
        "type": "text_section",
        "layout": "full_width"
      }
    ]
  }'::jsonb,
  '{...}'::jsonb,
  '{...}'::jsonb,
  true,
  '1.0'
);

-- 3. PHOTO EVIDENCE REPORT (Visual Documentation)
INSERT INTO report_layouts (
  layout_id,
  layout_name,
  description,
  compatible_template_types,
  layout_schema,
  binding_rules,
  preview_config,
  is_public,
  version
) VALUES (
  'photo_evidence_v1',
  'Photo Evidence Report',
  'Photo-focused report with large images and minimal text',
  ARRAY['PMC', 'CMC', 'AMC', 'CORRECTIVE', 'EMERGENCY'],
  '{
    "page": {...},
    "sections": [
      {
        "section_id": "header",
        "type": "header",
        "layout": "compact"
      },
      {
        "section_id": "basic_info",
        "type": "detail_entry",
        "layout": "single_line",
        "fields": ["date", "location", "technician"]
      },
      {
        "section_id": "photos",
        "type": "photo_grid",
        "layout": "grid",
        "columns": 1,
        "photo_size": "large",
        "show_timestamps": true,
        "show_captions": true,
        "show_location": true
      }
    ]
  }'::jsonb,
  '{...}'::jsonb,
  '{...}'::jsonb,
  true,
  '1.0'
);

-- Update all templates to use standard_v1 as default
UPDATE templates
SET default_layout_id = 'standard_v1'
WHERE contract_category IN ('PMC', 'CMC', 'AMC', 'SLA', 'CORRECTIVE', 'EMERGENCY', 'T_AND_M', 'CONSTRUCTION');

-- Verify
SELECT 
  t.template_name,
  t.contract_category,
  t.default_layout_id,
  l.layout_name
FROM templates t
LEFT JOIN report_layouts l ON t.default_layout_id = l.layout_id;
```

**Testing:**
- [ ] Run seed script
- [ ] Verify 3 layouts created
- [ ] Verify templates linked to standard_v1
- [ ] Query layouts by compatible types
- [ ] Test RLS policies

**Commit Message:**
```
feat: Add 3 default report layouts (standard, simple, photo)

- Create standard_v1 layout (comprehensive)
- Create simple_v1 layout (quick overview)
- Create photo_evidence_v1 layout (visual documentation)
- Link all templates to standard_v1 as default
- Define layout_schema and binding_rules for each
```

---

### TASK 1.4: Database Testing & Validation (30 minutes)

**Checklist:**
- [ ] Test querying layouts by template type
- [ ] Test RLS policies with different users
- [ ] Verify FK constraints work
- [ ] Test layout versioning (create v2 of a layout)
- [ ] Verify JSONB queries work
- [ ] Document any issues found

**Test Queries:**
```sql
-- Get all layouts compatible with PMC
SELECT * FROM report_layouts
WHERE 'PMC' = ANY(compatible_template_types)
AND is_active = true;

-- Get template with its default layout
SELECT 
  t.template_name,
  t.contract_category,
  l.layout_name,
  l.description
FROM templates t
JOIN report_layouts l ON t.default_layout_id = l.layout_id
WHERE t.template_id = 'pmc-daily-v1';

-- Test binding rules query
SELECT 
  layout_id,
  layout_name,
  binding_rules->'date' as date_binding,
  binding_rules->'technician' as technician_binding
FROM report_layouts;
```

---

### SESSION 1 DELIVERABLES

**Files Created:**
- [ ] `database/schema/004_report_layouts.sql`
- [ ] `database/migrations/005_update_templates_for_layouts.sql`
- [ ] `database/seeds/002_default_report_layouts.sql`

**Database Changes:**
- [ ] report_layouts table created
- [ ] templates.default_layout_id added
- [ ] 3 default layouts inserted
- [ ] All templates linked to layouts

**Git Commit:**
```bash
git add database/
git commit -m "feat(database): Implement dual-template architecture foundation

- Add report_layouts table with RLS policies
- Add default_layout_id to templates
- Create 3 default layouts (standard, simple, photo_evidence)
- Maintain backward compatibility with pdf_layout
- Foundation for user-selectable report formats

Related to: Report System Upgrade - Session 1
"
git push
```

**Session 1 Complete! ✅**

---

## 🎯 SESSION 2: RENDER ENGINE & SERVICES (8-10 hours)

### Pre-Session Preparation
- [ ] Review Session 1 deliverables
- [ ] Test database changes in dev environment
- [ ] Review current pdfService.js architecture
- [ ] Plan service refactoring approach

---

### TASK 2.1: Create Render Engine Core (2-3 hours)

**Goal:** Build the IR (Intermediate Representation) generator

**File:** `src/services/render/renderEngineCore.js`

**Architecture:**
```
Work Entry Data + Report Layout → Render Engine Core → Render Tree (IR)
                                                              ↓
                                            ┌─────────────────┴─────────────────┐
                                            ↓                                    ↓
                                    HTML Adapter                          PDF Adapter
                                            ↓                                    ↓
                                    Preview UI                            PDF File
```

**Checklist:**

**A. Core Service Structure**
- [ ] Create `/src/services/render/` directory
- [ ] Create `renderEngineCore.js` file
- [ ] Import necessary utilities
- [ ] Define RenderEngineCore class

**B. Generate Render Tree Method**
- [ ] Implement `generateRenderTree(layoutSchema, workEntryData, bindingRules)`
- [ ] Create page configuration
- [ ] Extract metadata
- [ ] Process sections array
- [ ] Return complete Render Tree

**C. Section Processing**
- [ ] Implement `processSection(section, data, bindingRules)`
- [ ] Handle conditional visibility (show_if)
- [ ] Map section to render block
- [ ] Apply layout rules

**D. Data Mapping**
- [ ] Implement `mapData(section, data, bindingRules)`
- [ ] Resolve field paths using binding rules
- [ ] Handle nested object access
- [ ] Handle array filtering
- [ ] Format values appropriately

**E. Path Resolution**
- [ ] Implement `resolveDataPath(data, path)`
- [ ] Support dot notation (work_entry.entry_date)
- [ ] Support array access (attachments[file_type=photo])
- [ ] Support conditional access
- [ ] Handle missing data gracefully

**F. Condition Evaluation**
- [ ] Implement `evaluateCondition(condition, data)`
- [ ] Support simple equality (field = value)
- [ ] Support existence checks (field exists)
- [ ] Support array contains
- [ ] Plan for complex expressions (future)

**Code Structure:**
```javascript
// src/services/render/renderEngineCore.js

/**
 * Render Engine Core
 * 
 * Generates Intermediate Representation (Render Tree) from:
 * - Report Layout JSONB
 * - Work Entry Data
 * - Binding Rules
 * 
 * The Render Tree is output-agnostic and can be rendered by any adapter.
 * 
 * @module services/render/renderEngineCore
 * @created February 11, 2026 - Session 2
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
    console.log('🔧 Generating Render Tree...');
    
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
      contract: {
        number: workEntry.contract?.contract_number,
        name: workEntry.contract?.client_name,
        location: workEntry.contract?.site_location
      },
      template: {
        name: workEntry.template?.template_name,
        category: workEntry.template?.contract_category
      },
      creator: {
        name: workEntry.created_by_profile?.full_name,
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
        console.log(`⏭️  Skipping section ${section.section_id} (condition not met)`);
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
        console.warn(`⚠️  No binding rule for field: ${fieldKey}`);
        continue;
      }
      
      // Resolve data using binding path
      const value = this.resolveDataPath(data, bindingPath);
      
      mappedData[fieldKey] = value;
    }
    
    // Special handling for different section types
    if (section.type === 'photo_grid') {
      mappedData.photos = this.resolvePhotos(data, bindingRules);
    }
    
    if (section.type === 'signature_box') {
      mappedData.signatures = this.resolveSignatures(data, bindingRules);
    }
    
    if (section.type === 'checklist') {
      mappedData.items = this.resolveChecklist(data, section, bindingRules);
    }
    
    return mappedData;
  }
  
  /**
   * Resolve data path using dot notation and array filtering
   * 
   * Examples:
   * - "work_entry.entry_date" → data.entry_date
   * - "work_entry.data.header.asset_id" → data.data.header.asset_id
   * - "work_entry.created_by_profile.full_name" → data.created_by_profile.full_name
   * - "work_entry.attachments[file_type=photo]" → filtered array
   */
  resolveDataPath(data, path) {
    // Remove "work_entry." prefix if present
    const cleanPath = path.replace(/^work_entry\./, '');
    
    // Handle array filtering
    if (cleanPath.includes('[')) {
      return this.resolveArrayFilter(data, cleanPath);
    }
    
    // Handle simple dot notation
    return cleanPath.split('.').reduce((obj, key) => {
      return obj?.[key];
    }, data);
  }
  
  /**
   * Resolve array filtering
   * Example: "attachments[file_type=photo]"
   */
  resolveArrayFilter(data, path) {
    const match = path.match(/^(\w+)\[(\w+)=(\w+)\]$/);
    
    if (!match) {
      console.warn(`⚠️  Invalid array filter syntax: ${path}`);
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
    return this.resolveDataPath(data, photosPath) || [];
  }
  
  /**
   * Resolve signatures from attachments
   */
  resolveSignatures(data, bindingRules) {
    const signaturesPath = bindingRules['signatures'] || 'attachments[file_type=signature]';
    return this.resolveDataPath(data, signaturesPath) || [];
  }
  
  /**
   * Resolve checklist items
   */
  resolveChecklist(data, section, bindingRules) {
    const checklistPath = bindingRules['checklist_items'] || 'data.checklist.items';
    return this.resolveDataPath(data, checklistPath) || [];
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
      return condition.exists ? (value !== null && value !== undefined) : !value;
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
    
    // Photo-specific
    if (section.show_timestamps !== undefined) options.showTimestamps = section.show_timestamps;
    if (section.show_captions !== undefined) options.showCaptions = section.show_captions;
    if (section.photo_size !== undefined) options.photoSize = section.photo_size;
    
    // Checklist-specific
    if (section.show_status !== undefined) options.showStatus = section.show_status;
    
    return options;
  }
}

export const renderEngineCore = new RenderEngineCore();
```

**Testing:**
- [ ] Unit test path resolution
- [ ] Unit test array filtering
- [ ] Unit test condition evaluation
- [ ] Integration test with sample work entry
- [ ] Verify Render Tree structure

**Commit Message:**
```
feat(render): Implement Render Engine Core with IR generation

- Create RenderEngineCore class
- Implement Render Tree (IR) generation
- Support dot notation path resolution
- Support array filtering (attachments[file_type=photo])
- Implement conditional visibility (show_if)
- Map work entry data to layout using binding rules
- Foundation for output-agnostic rendering
```

---

### TASK 2.2: Create HTML Adapter (1-2 hours)

**Goal:** Convert Render Tree to HTML for preview

**File:** `src/services/render/adapters/htmlAdapter.js`

**Checklist:**
- [ ] Create `/src/services/render/adapters/` directory
- [ ] Create `htmlAdapter.js` file
- [ ] Implement HTMLAdapter class
- [ ] Render page setup with CSS
- [ ] Render each block type
- [ ] Support inline styling for preview
- [ ] Export HTML string

**Block Renderers:**
- [ ] `renderHeader()` - Report header with logo, title
- [ ] `renderDetailEntry()` - Key-value fields in grid/single column
- [ ] `renderTextSection()` - Full-width text/observations
- [ ] `renderChecklist()` - Table with checkboxes/status
- [ ] `renderPhotoGrid()` - Photo grid with captions
- [ ] `renderSignatureBox()` - Signature images
- [ ] `renderMetricsCards()` - Metrics display (if used)

**Code Template:**
```javascript
// src/services/render/adapters/htmlAdapter.js

/**
 * HTML Adapter
 * 
 * Converts Render Tree (IR) to HTML for preview.
 * Includes inline CSS for A4 page rendering.
 * 
 * @module services/render/adapters/htmlAdapter
 * @created February 11, 2026 - Session 2
 */

class HTMLAdapter {
  /**
   * Convert Render Tree to HTML
   * 
   * @param {Object} renderTree - Intermediate Representation
   * @returns {string} HTML string with inline CSS
   */
  render(renderTree) {
    console.log('🌐 Rendering HTML from Render Tree...');
    
    const html = [];
    
    // Page CSS and wrapper
    html.push(this.renderPageSetup(renderTree.page));
    
    // Render each block
    for (const block of renderTree.blocks) {
      html.push(this.renderBlock(block));
    }
    
    // Close page wrapper
    html.push('</div>'); // .page-preview
    
    console.log('✅ HTML rendered');
    return html.join('\n');
  }
  
  /**
   * Render page setup with A4 dimensions and CSS
   */
  renderPageSetup(pageConfig) {
    const dimensions = this.getPageDimensions(pageConfig.size, pageConfig.orientation);
    
    return `
<style>
  .page-preview {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: white;
    box-shadow: 0 0 20px rgba(0,0,0,0.1);
    margin: 0 auto;
  }
  .page-preview h1 { font-size: 24px; margin: 0 0 8px 0; color: #1a1a1a; }
  .page-preview h2 { font-size: 18px; margin: 16px 0 8px 0; color: #333; }
  .page-preview h3 { font-size: 14px; margin: 12px 0 6px 0; color: #555; font-weight: 600; }
  .page-preview p { margin: 4px 0; line-height: 1.5; }
  .header-block { border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 16px; }
  .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 12px 0; }
  .detail-field { padding: 8px; background: #f9fafb; border-radius: 4px; }
  .detail-field label { display: block; font-size: 11px; color: #6b7280; font-weight: 500; margin-bottom: 2px; }
  .detail-field span { display: block; font-size: 13px; color: #1f2937; }
  .photo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 16px 0; }
  .photo-item img { width: 100%; height: auto; border-radius: 6px; border: 1px solid #e5e7eb; }
  .photo-caption { font-size: 11px; color: #6b7280; margin-top: 4px; }
  .checklist-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  .checklist-table th { background: #f3f4f6; padding: 8px; text-align: left; font-size: 12px; border: 1px solid #e5e7eb; }
  .checklist-table td { padding: 8px; font-size: 12px; border: 1px solid #e5e7eb; }
  .signature-box { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
  .signature-item { text-align: center; }
  .signature-item img { max-width: 200px; height: auto; border: 1px solid #e5e7eb; }
  .signature-label { font-size: 11px; color: #6b7280; margin-top: 4px; }
</style>
<div class="page-preview" style="width: ${dimensions.width}mm; padding: ${pageConfig.margins.top}mm ${pageConfig.margins.left}mm;">
    `;
  }
  
  /**
   * Get page dimensions in mm
   */
  getPageDimensions(size, orientation) {
    const sizes = {
      A4: { width: 210, height: 297 },
      Letter: { width: 216, height: 279 }
    };
    
    const dims = sizes[size] || sizes.A4;
    
    if (orientation === 'landscape') {
      return { width: dims.height, height: dims.width };
    }
    
    return dims;
  }
  
  /**
   * Render a block based on type
   */
  renderBlock(block) {
    switch (block.type) {
      case 'header':
        return this.renderHeader(block);
      case 'detail_entry':
        return this.renderDetailEntry(block);
      case 'text_section':
        return this.renderTextSection(block);
      case 'checklist':
        return this.renderChecklist(block);
      case 'photo_grid':
        return this.renderPhotoGrid(block);
      case 'signature_box':
        return this.renderSignatureBox(block);
      default:
        return this.renderGeneric(block);
    }
  }
  
  /**
   * Render header block
   */
  renderHeader(block) {
    const { content, options } = block;
    
    return `
<div class="header-block">
  <h1>${content.title || 'Work Report'}</h1>
  ${content.subtitle ? `<p style="color: #6b7280; font-size: 13px;">${content.subtitle}</p>` : ''}
  ${content.contract_number ? `<p style="font-size: 12px; color: #6b7280;">Contract: ${content.contract_number}</p>` : ''}
</div>
    `;
  }
  
  /**
   * Render detail entry (key-value fields)
   */
  renderDetailEntry(block) {
    const { content, layout, options } = block;
    const columns = options.columns || 2;
    
    if (layout === 'two_column' || layout === 'grid') {
      return `
<div class="detail-grid" style="grid-template-columns: repeat(${columns}, 1fr);">
  ${Object.entries(content).map(([key, value]) => `
    <div class="detail-field">
      <label>${this.formatLabel(key)}</label>
      <span>${this.formatValue(value)}</span>
    </div>
  `).join('')}
</div>
      `;
    }
    
    // Single column
    return `
<div style="margin: 12px 0;">
  ${Object.entries(content).map(([key, value]) => `
    <p><strong>${this.formatLabel(key)}:</strong> ${this.formatValue(value)}</p>
  `).join('')}
</div>
    `;
  }
  
  /**
   * Render text section (observations, etc.)
   */
  renderTextSection(block) {
    const { content } = block;
    const text = content.text || content.observations || '';
    
    return `
<div style="margin: 16px 0;">
  <h3>Observations</h3>
  <p style="white-space: pre-wrap;">${text}</p>
</div>
    `;
  }
  
  /**
   * Render checklist table
   */
  renderChecklist(block) {
    const { content } = block;
    const items = content.items || [];
    
    return `
<div style="margin: 16px 0;">
  <h3>Checklist</h3>
  <table class="checklist-table">
    <thead>
      <tr>
        <th>Task</th>
        <th>Status</th>
        <th>Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td>${item.task || item.label}</td>
          <td>${item.status || item.value}</td>
          <td>${item.remarks || ''}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</div>
    `;
  }
  
  /**
   * Render photo grid
   */
  renderPhotoGrid(block) {
    const { content, options } = block;
    const photos = content.photos || content || [];
    const columns = options.columns || 2;
    
    if (photos.length === 0) return '';
    
    return `
<div style="margin: 16px 0;">
  <h3>Photos</h3>
  <div class="photo-grid" style="grid-template-columns: repeat(${columns}, 1fr);">
    ${photos.map(photo => `
      <div class="photo-item">
        <img src="${photo.url || photo.storage_url}" alt="${photo.caption || 'Photo'}" />
        ${options.showCaptions && photo.caption ? `<p class="photo-caption">${photo.caption}</p>` : ''}
        ${options.showTimestamps && photo.timestamp ? `<p class="photo-caption">${photo.timestamp}</p>` : ''}
      </div>
    `).join('')}
  </div>
</div>
    `;
  }
  
  /**
   * Render signature box
   */
  renderSignatureBox(block) {
    const { content } = block;
    const signatures = content.signatures || content || [];
    
    if (signatures.length === 0) return '';
    
    return `
<div style="margin: 20px 0;">
  <h3>Signatures</h3>
  <div class="signature-box">
    ${signatures.map(sig => `
      <div class="signature-item">
        ${sig.url ? `<img src="${sig.url}" alt="${sig.name || 'Signature'}" />` : '<div style="height: 60px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; color: #999;">No signature</div>'}
        <p class="signature-label">${sig.name || 'Signature'}</p>
        ${sig.date ? `<p class="signature-label">${sig.date}</p>` : ''}
      </div>
    `).join('')}
  </div>
</div>
    `;
  }
  
  /**
   * Render generic block (fallback)
   */
  renderGeneric(block) {
    return `
<div style="margin: 12px 0; padding: 12px; background: #f9fafb; border-left: 3px solid #3b82f6;">
  <strong>${block.type}</strong>
  <pre style="font-size: 11px; margin: 8px 0;">${JSON.stringify(block.content, null, 2)}</pre>
</div>
    `;
  }
  
  /**
   * Format field label
   */
  formatLabel(key) {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  /**
   * Format field value
   */
  formatValue(value) {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
}

export const htmlAdapter = new HTMLAdapter();
```

**Testing:**
- [ ] Test with sample Render Tree
- [ ] Verify HTML renders correctly in browser
- [ ] Test different block types
- [ ] Verify CSS styling
- [ ] Test responsive layout

**Commit Message:**
```
feat(render): Implement HTML Adapter for preview rendering

- Create HTMLAdapter class
- Convert Render Tree to HTML with inline CSS
- Support all block types (header, detail, checklist, photos, signatures)
- A4 page dimensions and margins
- Foundation for print preview feature
```

---

### TASK 2.3: Enhance PDF Adapter (2-3 hours)

**Goal:** Refactor existing pdfService to use Render Tree

**Strategy:** Keep existing pdfLayouts.js renderers, but call them from PDF adapter using Render Tree

**File:** `src/services/render/adapters/pdfAdapter.js`

**Checklist:**
- [ ] Create `pdfAdapter.js`
- [ ] Import existing pdfLayouts renderers
- [ ] Implement PDFAdapter class
- [ ] Map Render Tree blocks to existing renderers
- [ ] Handle attachments (photos, signatures)
- [ ] Preserve backward compatibility
- [ ] Test with existing work entries

**Code Template:**
```javascript
// src/services/render/adapters/pdfAdapter.js

/**
 * PDF Adapter
 * 
 * Converts Render Tree (IR) to PDF using jsPDF.
 * Delegates to existing pdfLayouts.js renderers for actual rendering.
 * 
 * @module services/render/adapters/pdfAdapter
 * @created February 11, 2026 - Session 2
 */

import jsPDF from 'jspdf';
import {
  renderTwoColumn,
  renderSingleColumn,
  renderChecklist,
  renderTable,
  renderMetricsCards,
  renderSignatureBox,
  renderPhotoGrid
} from '../../pdf/pdfLayouts';

class PDFAdapter {
  /**
   * Convert Render Tree to PDF
   * 
   * @param {Object} renderTree - Intermediate Representation
   * @param {Array} attachments - Photos and signatures (for embedding)
   * @param {jsPDF} existingPdf - Optional existing PDF instance (for multi-entry)
   * @returns {jsPDF} PDF document
   */
  async render(renderTree, attachments = [], existingPdf = null) {
    console.log('📄 Rendering PDF from Render Tree...');
    
    // Create or use existing PDF
    const pdf = existingPdf || new jsPDF({
      orientation: renderTree.page.orientation || 'portrait',
      unit: 'mm',
      format: renderTree.page.size || 'A4'
    });
    
    let yPos = 20;
    
    // Render header (metadata)
    yPos = this.renderPDFHeader(pdf, renderTree.metadata, yPos);
    
    // Render each block
    for (const block of renderTree.blocks) {
      yPos = await this.renderBlock(pdf, block, yPos, attachments);
    }
    
    console.log('✅ PDF rendered');
    return pdf;
  }
  
  /**
   * Render PDF header (contract info, report title)
   */
  renderPDFHeader(pdf, metadata, yPos) {
    const marginLeft = 20;
    const pageWidth = pdf.internal.pageSize.width;
    
    // Logo text
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(59, 130, 246);
    pdf.text('WORKLEDGER', marginLeft, yPos);
    
    // Generated date (right)
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      `Generated: ${new Date(metadata.generatedAt).toLocaleString()}`,
      pageWidth - 20,
      yPos,
      { align: 'right' }
    );
    yPos += 8;
    
    // Report title
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('WORK REPORT', marginLeft, yPos);
    yPos += 7;
    
    // Contract info
    if (metadata.contract?.number) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Contract: ${metadata.contract.number}`, marginLeft, yPos);
      yPos += 5;
    }
    
    if (metadata.contract?.name) {
      pdf.setFontSize(9);
      pdf.text(`Client: ${metadata.contract.name}`, marginLeft, yPos);
      yPos += 5;
    }
    
    yPos += 5;
    return yPos;
  }
  
  /**
   * Render a block based on type
   */
  async renderBlock(pdf, block, yPos, attachments) {
    console.log(`  Rendering block: ${block.type}`);
    
    // Map Render Tree block to existing pdfLayouts renderer
    switch (block.type) {
      case 'header':
        return this.renderHeaderBlock(pdf, block, yPos);
        
      case 'detail_entry':
        return this.renderDetailBlock(pdf, block, yPos);
        
      case 'text_section':
        return this.renderTextBlock(pdf, block, yPos);
        
      case 'checklist':
        return await this.renderChecklistBlock(pdf, block, yPos);
        
      case 'photo_grid':
        return await this.renderPhotoBlock(pdf, block, yPos, attachments);
        
      case 'signature_box':
        return await this.renderSignatureBlock(pdf, block, yPos, attachments);
        
      default:
        console.warn(`⚠️  Unknown block type: ${block.type}`);
        return yPos;
    }
  }
  
  /**
   * Render header block (section title)
   */
  renderHeaderBlock(pdf, block, yPos) {
    const marginLeft = 20;
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    
    if (block.content.title) {
      pdf.text(block.content.title, marginLeft, yPos);
      yPos += 7;
    }
    
    if (block.content.subtitle) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(block.content.subtitle, marginLeft, yPos);
      yPos += 6;
    }
    
    yPos += 3;
    return yPos;
  }
  
  /**
   * Render detail entry block using existing two_column renderer
   */
  renderDetailBlock(pdf, block, yPos) {
    // Convert block.content to section format expected by pdfLayouts
    const section = {
      section_id: block.blockId,
      section_name: this.formatLabel(block.blockId),
      fields: Object.entries(block.content).map(([key, value]) => ({
        field_id: key,
        field_name: this.formatLabel(key),
        field_type: this.guessFieldType(value)
      }))
    };
    
    const data = {};
    Object.entries(block.content).forEach(([key, value]) => {
      data[`${block.blockId}.${key}`] = value;
    });
    
    // Delegate to existing renderer
    if (block.layout === 'two_column' || block.layout === 'grid') {
      return renderTwoColumn(pdf, section, data, yPos);
    } else {
      return renderSingleColumn(pdf, section, data, yPos);
    }
  }
  
  /**
   * Render text section
   */
  renderTextBlock(pdf, block, yPos) {
    const marginLeft = 20;
    const maxWidth = 170;
    
    const text = block.content.text || block.content.observations || '';
    
    if (!text) return yPos;
    
    // Section title
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Observations', marginLeft, yPos);
    yPos += 6;
    
    // Text content
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, marginLeft, yPos);
    yPos += (lines.length * 5) + 5;
    
    return yPos;
  }
  
  /**
   * Render checklist using existing renderer
   */
  async renderChecklistBlock(pdf, block, yPos) {
    const section = {
      section_id: block.blockId,
      section_name: 'Checklist',
      fields: [
        { field_id: 'items', field_name: 'Checklist Items', field_type: 'checklist' }
      ]
    };
    
    const data = {
      [`${block.blockId}.items`]: block.content.items || []
    };
    
    const sectionLayout = {
      layout: 'checklist',
      show_status: block.options.showStatus !== false
    };
    
    return renderChecklist(pdf, section, data, sectionLayout, yPos);
  }
  
  /**
   * Render photo grid using existing renderer
   */
  async renderPhotoBlock(pdf, block, yPos, attachments) {
    const photos = block.content.photos || block.content || [];
    
    if (photos.length === 0) return yPos;
    
    const photoLayout = {
      columns: block.options.columns || 2,
      title: 'Photo Documentation'
    };
    
    return await renderPhotoGrid(pdf, photos, photoLayout, yPos);
  }
  
  /**
   * Render signature box using existing renderer
   */
  async renderSignatureBlock(pdf, block, yPos, attachments) {
    const signatures = block.content.signatures || block.content || [];
    
    if (signatures.length === 0) return yPos;
    
    const section = {
      section_id: block.blockId,
      section_name: 'Signatures',
      fields: [
        { field_id: 'technician', field_name: 'Technician', field_type: 'signature' },
        { field_id: 'supervisor', field_name: 'Supervisor', field_type: 'signature' }
      ]
    };
    
    const data = {};
    
    // Map signatures to expected format
    signatures.forEach((sig, index) => {
      const role = sig.role || (index === 0 ? 'technician' : 'supervisor');
      data[`${block.blockId}.${role}`] = sig;
    });
    
    return await renderSignatureBox(pdf, section, data, yPos, signatures[0]);
  }
  
  /**
   * Format label from snake_case
   */
  formatLabel(key) {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  /**
   * Guess field type from value
   */
  guessFieldType(value) {
    if (typeof value === 'boolean') return 'checkbox';
    if (typeof value === 'number') return 'number';
    if (value instanceof Date) return 'date';
    return 'text';
  }
}

export const pdfAdapter = new PDFAdapter();
```

**Testing:**
- [ ] Test with existing work entries
- [ ] Verify PDF output matches current quality
- [ ] Test all block types
- [ ] Test with photos and signatures
- [ ] Compare with legacy pdfService output

**Commit Message:**
```
feat(render): Implement PDF Adapter using Render Tree

- Create PDFAdapter class
- Map Render Tree blocks to existing pdfLayouts renderers
- Maintain backward compatibility
- Support all layout types
- Handle attachments (photos, signatures)
- Foundation for layout-driven PDF generation
```

---

### TASK 2.4: Create Layout Registry Service (1 hour)

**Goal:** Service to fetch and manage report layouts

**File:** `src/services/layoutRegistryService.js`

**Checklist:**
- [ ] Create service file
- [ ] Implement getAvailableLayouts(templateType, organizationId)
- [ ] Implement getLayout(layoutId)
- [ ] Implement createLayout(layoutData) - admin only
- [ ] Implement updateLayout(layoutId, updates) - admin only
- [ ] Add caching for performance
- [ ] Add error handling

**Code:**
```javascript
// src/services/layoutRegistryService.js

/**
 * Layout Registry Service
 * 
 * Manages report layouts:
 * - Fetch available layouts by template type
 * - Get layout details
 * - Create/update layouts (admin)
 * 
 * @module services/layoutRegistryService
 * @created February 11, 2026 - Session 2
 */

import { supabase } from './supabase/client';

class LayoutRegistryService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }
  
  /**
   * Get available layouts for a template type
   * 
   * @param {string} templateType - e.g., 'PMC', 'CMC', 'AMC'
   * @param {string} organizationId - Optional organization filter
   * @returns {Promise<Array>} Array of available layouts
   */
  async getAvailableLayouts(templateType, organizationId = null) {
    try {
      console.log('📋 Fetching layouts for:', templateType);
      
      // Check cache
      const cacheKey = `${templateType}-${organizationId || 'public'}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('✅ Using cached layouts');
        return cached.data;
      }
      
      // Build query
      let query = supabase
        .from('report_layouts')
        .select('layout_id, layout_name, description, preview_config')
        .contains('compatible_template_types', [templateType])
        .eq('is_active', true)
        .order('layout_name');
      
      // Filter by access
      if (organizationId) {
        query = query.or(`is_public.eq.true,organization_id.eq.${organizationId}`);
      } else {
        query = query.eq('is_public', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform data
      const layouts = data.map(layout => ({
        layoutId: layout.layout_id,
        name: layout.layout_name,
        description: layout.description,
        preview: layout.preview_config?.thumbnail
      }));
      
      // Cache
      this.cache.set(cacheKey, {
        data: layouts,
        timestamp: Date.now()
      });
      
      console.log(`✅ Found ${layouts.length} layouts`);
      return layouts;
      
    } catch (error) {
      console.error('❌ Failed to fetch layouts:', error);
      throw error;
    }
  }
  
  /**
   * Get complete layout details
   * 
   * @param {string} layoutId - Layout ID
   * @returns {Promise<Object>} Complete layout with schema and binding rules
   */
  async getLayout(layoutId) {
    try {
      console.log('📋 Fetching layout:', layoutId);
      
      // Check cache
      const cacheKey = `layout-${layoutId}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('✅ Using cached layout');
        return cached.data;
      }
      
      const { data, error } = await supabase
        .from('report_layouts')
        .select('*')
        .eq('layout_id', layoutId)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      
      if (!data) {
        throw new Error(`Layout not found: ${layoutId}`);
      }
      
      // Cache
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      console.log('✅ Layout fetched:', data.layout_name);
      return data;
      
    } catch (error) {
      console.error('❌ Failed to fetch layout:', error);
      throw error;
    }
  }
  
  /**
   * Create new layout (admin only)
   */
  async createLayout(layoutData) {
    try {
      console.log('➕ Creating layout:', layoutData.layout_name);
      
      const { data, error } = await supabase
        .from('report_layouts')
        .insert({
          layout_id: layoutData.layout_id,
          layout_name: layoutData.layout_name,
          description: layoutData.description,
          compatible_template_types: layoutData.compatible_template_types,
          layout_schema: layoutData.layout_schema,
          binding_rules: layoutData.binding_rules,
          preview_config: layoutData.preview_config,
          is_public: layoutData.is_public ?? true,
          organization_id: layoutData.organization_id,
          version: layoutData.version || '1.0'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Clear cache
      this.cache.clear();
      
      console.log('✅ Layout created:', data.layout_id);
      return data;
      
    } catch (error) {
      console.error('❌ Failed to create layout:', error);
      throw error;
    }
  }
  
  /**
   * Update layout (admin only)
   */
  async updateLayout(layoutId, updates) {
    try {
      console.log('✏️ Updating layout:', layoutId);
      
      const { data, error } = await supabase
        .from('report_layouts')
        .update(updates)
        .eq('layout_id', layoutId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Clear cache
      this.cache.clear();
      
      console.log('✅ Layout updated');
      return data;
      
    } catch (error) {
      console.error('❌ Failed to update layout:', error);
      throw error;
    }
  }
  
  /**
   * Clear cache (for testing)
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Layout cache cleared');
  }
}

export const layoutRegistryService = new LayoutRegistryService();
```

**Testing:**
- [ ] Test fetching layouts by template type
- [ ] Test layout caching
- [ ] Test organization-specific layouts
- [ ] Test error handling
- [ ] Test RLS enforcement

**Commit Message:**
```
feat(services): Add Layout Registry Service with caching

- Fetch layouts by template type
- Get complete layout details
- Support organization-specific layouts
- Implement caching for performance
- Create/update layouts (admin)
- Foundation for layout selection UI
```

---

### TASK 2.5: Refactor Report Service (2-3 hours)

**Goal:** Update reportService to use Render Engine architecture

**File:** `src/services/api/reportService.js`

**Strategy:**
- Keep existing API for backward compatibility
- Add new layout-driven generation path
- Use Render Engine when layoutId provided
- Fall back to legacy when no layoutId

**Checklist:**
- [ ] Import render engine components
- [ ] Add layout fetching logic
- [ ] Implement Render Tree generation
- [ ] Route to HTML or PDF adapter based on output format
- [ ] Maintain backward compatibility
- [ ] Add comprehensive error handling
- [ ] Update JSDoc

**Code Template:**
```javascript
// src/services/api/reportService.js (refactored)

/**
 * Report Service
 * 
 * Orchestrates report generation using Render Engine architecture.
 * Supports both new layout-driven and legacy template-driven generation.
 * 
 * @module services/api/reportService
 * @updated February 11, 2026 - Session 2 - Render Engine integration
 */

import { supabase } from '../supabase/client';
import { renderEngineCore } from '../render/renderEngineCore';
import { htmlAdapter } from '../render/adapters/htmlAdapter';
import { pdfAdapter } from '../render/adapters/pdfAdapter';
import { layoutRegistryService } from '../layoutRegistryService';

// Legacy PDF service (fallback)
import { pdfService as legacyPDFService } from '../pdf/pdfService';

class ReportService {
  /**
   * Generate report with layout selection
   * 
   * @param {Array<string>} entryIds - Work entry IDs
   * @param {Object} options - Generation options
   * @param {string} options.layoutId - Optional layout ID (new architecture)
   * @param {string} options.outputFormat - 'pdf' | 'html' | 'preview'
   * @param {string} options.orientation - 'portrait' | 'landscape'
   * @param {string} options.pageSize - 'a4' | 'letter'
   * @param {Object} options.entrySelections - Per-entry field selections
   * @returns {Promise<Object>} { success, blob?, html?, filename?, format }
   */
  async generateReport(entryIds, options = {}) {
    try {
      console.log('📄 Starting report generation...');
      console.log('  Entries:', entryIds.length);
      console.log('  Layout ID:', options.layoutId);
      console.log('  Output:', options.outputFormat || 'pdf');
      
      // Fetch work entries with all relations
      const entries = await this.fetchWorkEntries(entryIds);
      
      if (!entries || entries.length === 0) {
        throw new Error('No work entries found');
      }
      
      // Determine which generation path to use
      if (options.layoutId) {
        // NEW: Layout-driven generation using Render Engine
        return await this.generateWithRenderEngine(entries, options);
      } else {
        // LEGACY: Template-driven generation (backward compatibility)
        console.log('⚠️  Using legacy generation (no layoutId provided)');
        return await this.generateLegacy(entries, options);
      }
      
    } catch (error) {
      console.error('❌ Report generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * NEW: Generate report using Render Engine architecture
   */
  async generateWithRenderEngine(entries, options) {
    try {
      console.log('🚀 Using Render Engine architecture');
      
      // 1. Fetch report layout
      const layout = await layoutRegistryService.getLayout(options.layoutId);
      
      console.log('  Layout:', layout.layout_name);
      
      // 2. Generate Render Trees for each entry
      const renderTrees = [];
      
      for (const entry of entries) {
        const renderTree = renderEngineCore.generateRenderTree(
          layout.layout_schema,
          entry,
          layout.binding_rules
        );
        
        renderTrees.push(renderTree);
      }
      
      console.log(`✅ Generated ${renderTrees.length} Render Trees`);
      
      // 3. Select output format
      if (options.outputFormat === 'html' || options.outputFormat === 'preview') {
        // HTML for preview
        return await this.generateHTML(renderTrees, entries, layout);
      } else {
        // PDF for final output (default)
        return await this.generatePDF(renderTrees, entries, layout, options);
      }
      
    } catch (error) {
      console.error('❌ Render Engine generation failed:', error);
      throw error;
    }
  }
  
  /**
   * Generate HTML for preview
   */
  async generateHTML(renderTrees, entries, layout) {
    console.log('🌐 Generating HTML...');
    
    const htmlParts = renderTrees.map((tree, index) => {
      const html = htmlAdapter.render(tree);
      
      // Add page break between entries (except last)
      if (index < renderTrees.length - 1) {
        return html + '<div style="page-break-after: always;"></div>';
      }
      
      return html;
    });
    
    const fullHTML = htmlParts.join('\n');
    
    console.log('✅ HTML generated');
    
    return {
      success: true,
      html: fullHTML,
      format: 'html',
      layoutName: layout.layout_name
    };
  }
  
  /**
   * Generate PDF
   */
  async generatePDF(renderTrees, entries, layout, options) {
    console.log('📄 Generating PDF...');
    
    // Create first page
    let pdf = await pdfAdapter.render(
      renderTrees[0],
      entries[0].attachments
    );
    
    // Add subsequent entries as new pages
    for (let i = 1; i < renderTrees.length; i++) {
      pdf.addPage();
      pdf = await pdfAdapter.render(
        renderTrees[i],
        entries[i].attachments,
        pdf
      );
    }
    
    // Add page numbers (use existing helper)
    this.addPageNumbers(pdf);
    
    // Generate blob
    const blob = pdf.output('blob');
    const filename = this.generateFilename(entries[0].template, entries, layout);
    
    console.log('✅ PDF generated:', filename);
    
    return {
      success: true,
      blob,
      filename,
      pdf,
      format: 'pdf',
      layoutName: layout.layout_name
    };
  }
  
  /**
   * LEGACY: Generate using old pdfService
   */
  async generateLegacy(entries, options) {
    console.log('⚠️  Using legacy PDF generation');
    
    // Map to legacy format
    const legacyOptions = {
      orientation: options.orientation || 'portrait',
      pageSize: options.pageSize || 'a4',
      output: options.outputFormat || 'download',
      entrySelections: options.entrySelections
    };
    
    return await legacyPDFService.generatePDF(
      {
        entries,
        metadata: this.extractMetadata(entries)
      },
      legacyOptions
    );
  }
  
  /**
   * Fetch work entries with all relations
   */
  async fetchWorkEntries(entryIds) {
    console.log('📥 Fetching work entries...');
    
    const { data, error } = await supabase
      .from('work_entries')
      .select(`
        *,
        contract:contracts(*),
        template:templates(*),
        created_by_profile:auth.users!work_entries_created_by_fkey(
          id,
          email,
          raw_user_meta_data
        ),
        attachments(*)
      `)
      .in('id', entryIds)
      .order('entry_date', { ascending: true });
    
    if (error) throw error;
    
    // Map profile data
    const entries = data.map(entry => ({
      ...entry,
      created_by_profile: {
        id: entry.created_by_profile?.id,
        email: entry.created_by_profile?.email,
        full_name: entry.created_by_profile?.raw_user_meta_data?.full_name || 'Unknown'
      }
    }));
    
    console.log(`✅ Fetched ${entries.length} entries`);
    return entries;
  }
  
  /**
   * Extract metadata for headers/footers
   */
  extractMetadata(entries) {
    const firstEntry = entries[0];
    
    return {
      generatedAt: new Date().toISOString(),
      totalEntries: entries.length,
      dateRange: {
        from: entries[0].entry_date,
        to: entries[entries.length - 1].entry_date
      },
      contract: firstEntry.contract
    };
  }
  
  /**
   * Generate filename
   */
  generateFilename(template, entries, layout = null) {
    const contractCategory = template?.contract_category || 'REPORT';
    const layoutName = layout?.layout_name.replace(/\s+/g, '_') || 'standard';
    const dateStr = new Date().toISOString().split('T')[0];
    const entryCount = entries.length;
    
    return `WorkLedger_${contractCategory}_${layoutName}_${entryCount}entries_${dateStr}.pdf`;
  }
  
  /**
   * Add page numbers to PDF
   */
  addPageNumbers(pdf) {
    const pageCount = pdf.internal.getNumberOfPages();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
  }
  
  /**
   * Download PDF blob
   */
  downloadPDF(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('💾 PDF downloaded:', filename);
  }
  
  /**
   * Open PDF in new tab
   */
  openPDFInNewTab(blob) {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    console.log('🔗 PDF opened in new tab');
  }
}

export const reportService = new ReportService();
```

**Testing:**
- [ ] Test with layoutId (new path)
- [ ] Test without layoutId (legacy path)
- [ ] Test HTML generation
- [ ] Test PDF generation
- [ ] Test with multiple entries
- [ ] Verify backward compatibility

**Commit Message:**
```
feat(services): Refactor Report Service for Render Engine

- Integrate Render Engine architecture
- Support layout-driven generation
- Route to HTML or PDF adapter based on output
- Maintain backward compatibility with legacy path
- Add comprehensive error handling
- Foundation for layout selection and preview features
```

---

### SESSION 2 DELIVERABLES

**Files Created:**
- [ ] `src/services/render/renderEngineCore.js`
- [ ] `src/services/render/adapters/htmlAdapter.js`
- [ ] `src/services/render/adapters/pdfAdapter.js`
- [ ] `src/services/layoutRegistryService.js`

**Files Updated:**
- [ ] `src/services/api/reportService.js` (refactored)

**Features Implemented:**
- [ ] Render Engine Core with IR generation
- [ ] HTML Adapter for preview
- [ ] PDF Adapter using Render Tree
- [ ] Layout Registry Service with caching
- [ ] Report Service refactored for dual-path

**Git Commit:**
```bash
git add src/services/
git commit -m "feat(render): Implement complete Render Engine architecture

- Add RenderEngineCore for IR generation
- Add HTMLAdapter for preview rendering
- Add PDFAdapter using Render Tree
- Add LayoutRegistryService with caching
- Refactor ReportService for layout-driven generation
- Maintain backward compatibility
- Foundation for layout selection and preview

Related to: Report System Upgrade - Session 2
"
git push
```

**Session 2 Complete! ✅**

---

## 🎯 SESSION 3: UI & USER EXPERIENCE (6-8 hours)

### Pre-Session Preparation
- [ ] Review Session 2 deliverables
- [ ] Test Render Engine with sample data
- [ ] Review current ReportGenerator.jsx UI
- [ ] Plan UI enhancements

---

### TASK 3.1: Layout Selector Component (2 hours)

**Goal:** Visual layout selection UI

**File:** `src/components/reports/LayoutSelector.jsx`

**Checklist:**
- [ ] Create component file
- [ ] Fetch available layouts
- [ ] Display as cards with preview thumbnails
- [ ] Handle selection state
- [ ] Show layout descriptions
- [ ] Add loading state
- [ ] Add error handling
- [ ] Make responsive

**Component Features:**
- [ ] Grid layout (3 columns on desktop, 1 on mobile)
- [ ] Visual preview thumbnails
- [ ] Selected state indication
- [ ] Layout name and description
- [ ] Compatible template types badge

**Code Template:**
```javascript
// src/components/reports/LayoutSelector.jsx

import { useState, useEffect } from 'react';
import { layoutRegistryService } from '../../services/layoutRegistryService';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Layout Selector Component
 * 
 * Displays available report layouts as visual cards.
 * User selects one layout for report generation.
 * 
 * @param {string} templateType - Template type (PMC, CMC, etc.)
 * @param {Function} onSelect - Callback when layout selected
 * @param {string} defaultLayoutId - Default selected layout
 */
export default function LayoutSelector({ templateType, onSelect, defaultLayoutId }) {
  const [layouts, setLayouts] = useState([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState(defaultLayoutId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadLayouts();
  }, [templateType]);
  
  const loadLayouts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const available = await layoutRegistryService.getAvailableLayouts(templateType);
      setLayouts(available);
      
      // Auto-select first if no default
      if (!selectedLayoutId && available.length > 0) {
        setSelectedLayoutId(available[0].layoutId);
        onSelect(available[0].layoutId);
      }
      
    } catch (err) {
      console.error('Failed to load layouts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelect = (layoutId) => {
    setSelectedLayoutId(layoutId);
    onSelect(layoutId);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
        <span className="ml-3 text-gray-600">Loading report layouts...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load layouts: {error}</p>
        <button
          onClick={loadLayouts}
          className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (layouts.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">No layouts available for this template type.</p>
      </div>
    );
  }
  
  return (
    <div className="layout-selector">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Select Report Layout
      </label>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {layouts.map(layout => (
          <button
            key={layout.layoutId}
            onClick={() => handleSelect(layout.layoutId)}
            className={`
              p-4 border-2 rounded-lg text-left transition-all
              ${selectedLayoutId === layout.layoutId
                ? 'border-primary-500 bg-primary-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}
            `}
          >
            {/* Preview thumbnail */}
            {layout.preview ? (
              <img
                src={layout.preview}
                alt={layout.name}
                className="w-full h-32 object-cover rounded mb-3 bg-gray-100"
              />
            ) : (
              <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded mb-3 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            )}
            
            {/* Layout name */}
            <div className="font-semibold text-gray-900 mb-1">
              {layout.name}
            </div>
            
            {/* Description */}
            {layout.description && (
              <p className="text-sm text-gray-600 mb-2">
                {layout.description}
              </p>
            )}
            
            {/* Selected indicator */}
            {selectedLayoutId === layout.layoutId && (
              <div className="mt-3 flex items-center text-primary-600 font-medium text-sm">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Selected
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Testing:**
- [ ] Test with different template types
- [ ] Test selection state
- [ ] Test responsive layout
- [ ] Test loading state
- [ ] Test error handling
- [ ] Test with no layouts

**Commit Message:**
```
feat(components): Add Layout Selector with visual preview

- Display available layouts as cards
- Show preview thumbnails
- Handle layout selection
- Responsive grid layout
- Loading and error states
- Auto-select first layout
```

---

### TASK 3.2: Print Preview Component (2-3 hours)

**Goal:** Full-screen preview modal with zoom

**File:** `src/components/reports/PrintPreview.jsx`

**Checklist:**
- [ ] Create modal component
- [ ] Implement preview toolbar
- [ ] Add zoom controls (+/- buttons, slider)
- [ ] Display HTML preview
- [ ] Add "Generate PDF" button
- [ ] Add loading state
- [ ] Add error handling
- [ ] Make responsive

**Features:**
- [ ] Full-screen modal overlay
- [ ] Dark toolbar at top
- [ ] Zoom: 50% to 200%
- [ ] Scrollable preview area
- [ ] Close button
- [ ] Generate PDF button
- [ ] Loading indicator during preview generation

**Code Template:** (continuation of comprehensive checklist)
```javascript
// src/components/reports/PrintPreview.jsx

import { useState, useEffect } from 'react';
import { reportService } from '../../services/api/reportService';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Print Preview Component
 * 
 * Full-screen modal displaying HTML preview of report.
 * Includes zoom controls and Generate PDF button.
 * 
 * @param {Array<string>} entryIds - Work entry IDs
 * @param {string} layoutId - Selected layout ID
 * @param {Function} onClose - Close modal callback
 * @param {Function} onGenerate - Generate PDF callback
 */
export default function PrintPreview({ entryIds, layoutId, onClose, onGenerate }) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1.0);
  
  useEffect(() => {
    loadPreview();
  }, [entryIds, layoutId]);
  
  const loadPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await reportService.generateReport(entryIds, {
        layoutId,
        outputFormat: 'html'
      });
      
      if (result.success) {
        setHtml(result.html);
      } else {
        throw new Error(result.error);
      }
      
    } catch (err) {
      console.error('Preview failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleZoomIn = () => {
    setZoom(Math.min(2.0, zoom + 0.1));
  };
  
  const handleZoomOut = () => {
    setZoom(Math.max(0.5, zoom - 0.1));
  };
  
  const handleZoomReset = () => {
    setZoom(1.0);
  };
  
  const handleGeneratePDF = () => {
    onGenerate();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col">
      {/* Toolbar */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          {/* Close button */}
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back</span>
          </button>
          
          <div className="h-6 w-px bg-gray-700" /> {/* Divider */}
          
          <span className="text-lg font-semibold">Print Preview</span>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Zoom controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              −
            </button>
            
            <button
              onClick={handleZoomReset}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded transition-colors min-w-[60px]"
            >
              {Math.round(zoom * 100)}%
            </button>
            
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 2.0}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              +
            </button>
          </div>
          
          {/* Generate PDF button */}
          <button
            onClick={handleGeneratePDF}
            disabled={loading || error}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            Generate PDF
          </button>
        </div>
      </div>
      
      {/* Preview area */}
      <div className="flex-1 overflow-auto bg-gray-200 p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <LoadingSpinner />
            <p className="mt-4 text-gray-700">Generating preview...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-white rounded-lg p-8 shadow-lg max-w-md">
              <div className="text-red-600 text-center mb-4">
                <svg className="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold">Preview Failed</h3>
              </div>
              <p className="text-gray-700 text-center mb-4">{error}</p>
              <button
                onClick={loadPreview}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease-out'
            }}
            className="max-w-4xl mx-auto"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </div>
  );
}
```

**Testing:**
- [ ] Test preview generation
- [ ] Test zoom controls
- [ ] Test Generate PDF flow
- [ ] Test responsive layout
- [ ] Test loading state
- [ ] Test error handling

**Commit Message:**
```
feat(components): Add Print Preview with zoom controls

- Full-screen preview modal
- HTML preview rendering
- Zoom controls (50% - 200%)
- Generate PDF from preview
- Loading and error states
- Dark toolbar UI
```

---

### TASK 3.3: Integrate into ReportGenerator (2 hours)

**Goal:** Add Layout Selector and Preview to existing ReportGenerator

**File:** `src/components/reports/ReportGenerator.jsx` (update)

**Checklist:**
- [ ] Import new components
- [ ] Add layout selection state
- [ ] Add Layout Selector before Generate button
- [ ] Add Preview button
- [ ] Update Generate handler to include layoutId
- [ ] Add Print Preview modal
- [ ] Maintain existing entry selection UI
- [ ] Test complete flow

**Integration Points:**
1. After entry selection, show Layout Selector
2. Add "Preview" and "Generate PDF" buttons
3. Preview opens modal
4. Generate PDF uses selected layout
5. Maintain all existing functionality

**Code Changes:**
```javascript
// src/components/reports/ReportGenerator.jsx (updated)

import LayoutSelector from './LayoutSelector';
import PrintPreview from './PrintPreview';

export default function ReportGenerator({ contractId, onReportGenerated }) {
  // ... existing state ...
  
  // NEW: Layout selection state
  const [selectedLayoutId, setSelectedLayoutId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // ... existing code ...
  
  const handlePreview = () => {
    if (selectedEntryIds.length === 0) {
      setError('Please select at least one entry');
      return;
    }
    
    if (!selectedLayoutId) {
      setError('Please select a report layout');
      return;
    }
    
    setShowPreview(true);
  };
  
  const handleGenerate = async () => {
    if (selectedEntryIds.length === 0) {
      setError('Please select at least one entry');
      return;
    }
    
    if (!selectedLayoutId) {
      setError('Please select a report layout');
      return;
    }
    
    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);
      
      // Close preview if open
      setShowPreview(false);
      
      const result = await reportService.generateReport(selectedEntryIds, {
        layoutId: selectedLayoutId, // NEW!
        outputFormat: 'pdf',
        orientation: pageOptions.orientation,
        pageSize: pageOptions.pageSize,
        entrySelections
      });
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Download PDF
      reportService.downloadPDF(result.blob, result.filename);
      setSuccess(`PDF generated: ${result.filename}`);
      
      if (onReportGenerated) {
        onReportGenerated(result);
      }
      
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* ... existing entry selection UI ... */}
      
      {/* NEW: Layout Selector (show when entries selected) */}
      {selectedEntryIds.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <LayoutSelector
            templateType={contract?.contract_type || 'PMC'}
            defaultLayoutId={contract?.template?.default_layout_id}
            onSelect={setSelectedLayoutId}
          />
        </div>
      )}
      
      {/* ... existing page options ... */}
      
      {/* Action buttons */}
      {selectedEntryIds.length > 0 && selectedLayoutId && (
        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            disabled={generating}
            className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Preview Report
          </button>
          
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate PDF'}
          </button>
        </div>
      )}
      
      {/* ... existing status messages ... */}
      
      {/* NEW: Print Preview Modal */}
      {showPreview && (
        <PrintPreview
          entryIds={selectedEntryIds}
          layoutId={selectedLayoutId}
          onClose={() => setShowPreview(false)}
          onGenerate={handleGenerate}
        />
      )}
    </div>
  );
}
```

**Testing:**
- [ ] Test complete workflow
- [ ] Test layout selection
- [ ] Test preview functionality
- [ ] Test PDF generation with layout
- [ ] Verify existing features still work
- [ ] Test error handling

**Commit Message:**
```
feat(reports): Integrate Layout Selector and Preview into ReportGenerator

- Add layout selection before generation
- Add Preview Report button
- Integrate Print Preview modal
- Pass layoutId to report service
- Maintain existing entry selection UI
- Complete layout-driven report flow
```

---

### TASK 3.4: UI Polish & Testing (1 hour)

**Checklist:**
- [ ] Add loading skeletons
- [ ] Improve error messages
- [ ] Add success animations
- [ ] Test mobile responsiveness
- [ ] Test keyboard navigation
- [ ] Add accessibility attributes
- [ ] Test with screen reader
- [ ] Add helpful tooltips

**Polish Items:**
- [ ] Loading skeleton for Layout Selector
- [ ] Animated success checkmark
- [ ] Better error messages with retry
- [ ] Keyboard shortcuts (ESC to close preview)
- [ ] Focus management in modal
- [ ] ARIA labels for buttons
- [ ] Tooltip for zoom percentage

**Commit Message:**
```
polish(reports): Improve UX with loading states and accessibility

- Add loading skeletons
- Improve error messages
- Add success animations
- Improve mobile responsiveness
- Add keyboard navigation
- Add ARIA labels
- Add helpful tooltips
```

---

### SESSION 3 DELIVERABLES

**Files Created:**
- [ ] `src/components/reports/LayoutSelector.jsx`
- [ ] `src/components/reports/PrintPreview.jsx`

**Files Updated:**
- [ ] `src/components/reports/ReportGenerator.jsx`

**Features Implemented:**
- [ ] Visual layout selection
- [ ] Print preview with zoom
- [ ] Complete integrated workflow
- [ ] UI polish and accessibility

**Git Commit:**
```bash
git add src/components/
git commit -m "feat(ui): Complete report UI with layout selection and preview

- Add LayoutSelector component with visual cards
- Add PrintPreview modal with zoom controls
- Integrate into ReportGenerator
- Maintain existing entry selection UI
- Add loading states and error handling
- Improve accessibility and mobile responsiveness
- Complete user-selectable report generation flow

Related to: Report System Upgrade - Session 3
"
git push
```

**Session 3 Complete! ✅**

---

## 🎯 POST-IMPLEMENTATION

### Testing Checklist

**Unit Tests:**
- [ ] RenderEngineCore path resolution
- [ ] RenderEngineCore condition evaluation
- [ ] HTMLAdapter block rendering
- [ ] PDFAdapter block rendering
- [ ] LayoutRegistryService caching

**Integration Tests:**
- [ ] Complete report generation flow
- [ ] Layout selection → Preview → PDF
- [ ] Multi-entry reports
- [ ] Different layout types
- [ ] Error scenarios

**User Acceptance Testing:**
- [ ] Create work entry
- [ ] Generate report with standard layout
- [ ] Generate report with simple layout
- [ ] Preview before generating
- [ ] Zoom controls work
- [ ] Download PDF
- [ ] Multiple entries in one report
- [ ] Per-field selection works

**Performance Testing:**
- [ ] Preview generation time
- [ ] PDF generation time
- [ ] Large reports (10+ entries)
- [ ] Reports with many photos
- [ ] Layout caching effectiveness

---

### Documentation Updates

**Files to Update:**
- [ ] README.md - Add report features section
- [ ] DEVELOPMENT_CHECKLIST.md - Mark Phase complete
- [ ] Create REPORT_SYSTEM_GUIDE.md for users
- [ ] Create LAYOUT_CREATION_GUIDE.md for admins
- [ ] Update API documentation

**Documentation Content:**
- [ ] How to generate reports
- [ ] How to select layouts
- [ ] How to use preview
- [ ] How to create custom layouts
- [ ] Troubleshooting guide

---

### Deployment Checklist

**Pre-Deployment:**
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Database migrations tested
- [ ] RLS policies verified
- [ ] Performance acceptable
- [ ] Error handling comprehensive

**Deployment Steps:**
1. [ ] Run database migrations (schema, seeds)
2. [ ] Deploy backend changes
3. [ ] Deploy frontend changes
4. [ ] Verify in staging
5. [ ] Deploy to production
6. [ ] Monitor for errors

**Post-Deployment:**
- [ ] Verify layouts appear correctly
- [ ] Test report generation
- [ ] Test preview functionality
- [ ] Monitor performance
- [ ] Collect user feedback

---

### Future Enhancements (Beyond Comprehensive Scope)

**Phase 4 - Advanced Features:**
- [ ] Excel export adapter
- [ ] Email delivery
- [ ] Scheduled reports
- [ ] Report templates library
- [ ] Layout marketplace
- [ ] AI-powered layout suggestions

**Phase 5 - Analytics:**
- [ ] Layout usage analytics
- [ ] Report generation metrics
- [ ] User preferences tracking
- [ ] Popular layouts dashboard

---

## 🎉 SUCCESS CRITERIA

Implementation is complete when:

✅ **Database Foundation:**
- [ ] report_layouts table created with RLS
- [ ] 3 default layouts available
- [ ] All templates linked to layouts

✅ **Render Engine:**
- [ ] RenderEngineCore generates IR
- [ ] HTMLAdapter produces preview
- [ ] PDFAdapter generates PDF
- [ ] Layout binding rules work

✅ **User Interface:**
- [ ] Layout selection UI functional
- [ ] Preview modal with zoom works
- [ ] Per-entry field selection maintained
- [ ] Generate PDF with layout works

✅ **Quality:**
- [ ] All tests passing
- [ ] No RLS violations
- [ ] Performance acceptable (<3s for preview, <5s for PDF)
- [ ] Error handling comprehensive
- [ ] Documentation complete

✅ **User Value:**
- [ ] Users can choose report layouts
- [ ] Users can preview before generating
- [ ] Reports look professional
- [ ] Existing functionality preserved

---

## 📝 NOTES

**Key Decisions Made:**
1. **Comprehensive Architecture** - Full IR-based render engine
2. **Backward Compatibility** - Legacy path maintained
3. **UI Preservation** - Keep existing entry selection UI
4. **Three Default Layouts** - Standard, Simple, Photo Evidence

**Risks Mitigated:**
1. **Breaking Changes** - Legacy fallback path
2. **Performance** - Layout caching, optimized rendering
3. **User Confusion** - Clear UI, default selections
4. **Data Loss** - Comprehensive error handling

**Success Metrics:**
- Report generation time < 5 seconds
- Preview generation time < 3 seconds
- Layout selection time < 1 second
- User satisfaction score > 4/5
- Bug reports < 5 in first week

---

**Alhamdulillah! This comprehensive implementation checklist will transform WorkLedger's reporting into a professional, scalable document composition system. Inshallah, execution will go smoothly! 🚀**

---

*Checklist Version: 1.0*  
*Created: February 11, 2026*  
*For: Comprehensive Report System Upgrade*  
*Estimated Total Duration: 20-25 hours across 3 sessions*


QUESTIONS FOR YOU

**1. Should we build Layout Builder now?**
- ✅ Yes → Start Session 6 next
- ❌ No → What's next priority?

**2. How should layout creation work?**
- 🎨 Visual (drag & drop like Canva)?
- 📝 Form-based (fill forms)?
- 💻 Code editor (JSON with validation)?
- 🔥 All of above?

**3. Who creates layouts?**
- You (developer)?
- End users (managers)?
- Both?

**4. How many layouts do you need?**
- Just these 3?
- 5-10 per contract type?
- Unlimited (user-created)?

---

## 🚀 WHAT I SUGGEST

**Next 5 Sessions (20 hours):**

**Session 6:** Layout Management (4h)
- Layout list page
- Layout detail page
- CRUD operations

**Session 7:** Visual Builder Foundation (4h)
- Builder page scaffold
- Canvas component
- Block palette

**Session 8:** Section Editor (3h)
- Add/remove sections
- Drag & drop
- Properties panel

**Session 9:** Binding Rules (3h)
- Data mapper
- Field selector
- Preview

**Session 10:** Testing & Polish (3h)
- Validation
- Error handling
- User testing

**Session 11:** Advanced Features (3h)
- Export/import
- Templates library
- Versioning