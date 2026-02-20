# WorkLedger Layout Section Keys - Complete Guide
**Version:** 1.0 | **Date:** February 17, 2026

---

## 🗺️ OVERVIEW: How Layouts Connect to Templates

```
TEMPLATE (fields_schema)              LAYOUT (layout_schema)
========================              ======================
Defines WHAT data to collect    →    Defines HOW to display it

sections[].section_id          →    binding_rules.template_section
sections[].section_name        →    content.title
sections[].fields[].field_id   →    (auto-extracted by engine)
sections[].fields[].field_name →    shown as column labels (_labels)
field_type: "photo"            →    block_type: "photo_grid"
field_type: "signature"        →    block_type: "signature_box"
```

---

## 📦 LAYOUT SECTION STRUCTURE

Every section in a layout has this shape:

```json
{
  "section_id": "unique_id_here",
  "block_type": "detail_entry",

  "content": {
    "title": "Section Heading in Report"
  },

  "options": {
    "columns": 2,
    "showTimestamps": true
  },

  "binding_rules": {
    "template_section": "section_id_from_template"
  }
}
```

---

## 1️⃣ CONTENT KEY
**Purpose:** Controls STATIC text/labels shown in the rendered report.

### Available content keys:

| Key | Type | Purpose | Example |
|-----|------|---------|---------|
| `title` | string | Section heading | `"Weather Conditions"` |
| `subtitle` | string | Sub-heading below title | `"Recorded on-site"` |
| `description` | string | Intro paragraph | `"Photos taken before work began"` |

### Usage by block type:

```json
// For ANY block type:
"content": {
  "title": "Work Entry Details"
}

// For header block:
"content": {
  "title": "Construction Daily Work Diary"
}
```

### ✅ Best Practice:
- Use template's `section_name` as the `title`
- Keep titles short and professional
- Match the language of the contract (Bahasa or English)

---

## 2️⃣ OPTIONS KEY
**Purpose:** Controls HOW the section is displayed (layout, columns, toggles).

### Options by block type:

#### `detail_entry` block:
| Key | Type | Default | Purpose |
|-----|------|---------|---------|
| `columns` | number | `2` | Fields per row (1 or 2) |
| `layout` | string | `"two_column"` | `"two_column"` or `"single_column"` |

```json
// Example: 2-column entry detail
"options": {
  "columns": 2,
  "layout": "two_column"
}
```

#### `photo_grid` block:
| Key | Type | Default | Purpose |
|-----|------|---------|---------|
| `columns` | number | `2` | Photos per row (1 or 2) |
| `showTimestamps` | boolean | `true` | Show upload time |
| `showCaptions` | boolean | `true` | Show photo caption/filename |
| `showLocation` | boolean | `false` | Show GPS location |
| `photoSize` | string | `"medium"` | `"small"`, `"medium"`, `"large"` |

```json
// Example: Large before photos, 1 per row
"options": {
  "columns": 1,
  "showTimestamps": true,
  "showCaptions": true,
  "photoSize": "large"
}
```

#### `signature_box` block:
| Key | Type | Default | Purpose |
|-----|------|---------|---------|
| `layout` | string | `"two_column"` | `"two_column"` or `"single_column"` |
| `showDate` | boolean | `true` | Show signature date |
| `showRole` | boolean | `true` | Show signer role |

```json
// Example: Signatures in two columns
"options": {
  "layout": "two_column",
  "showDate": true,
  "showRole": true
}
```

#### `table` block:
| Key | Type | Default | Purpose |
|-----|------|---------|---------|
| `showHeaders` | boolean | `true` | Show column headers |
| `striped` | boolean | `false` | Alternate row colors |

#### `metrics_cards` block:
| Key | Type | Default | Purpose |
|-----|------|---------|---------|
| `columns` | number | `3` | Cards per row |
| `showUnit` | boolean | `true` | Show unit labels |

#### `checklist` block:
| Key | Type | Default | Purpose |
|-----|------|---------|---------|
| `showStatus` | boolean | `true` | Show ✅/❌ status |
| `columns` | number | `1` | Columns per row |

---

## 3️⃣ BINDING RULES KEY
**Purpose:** Tells the engine WHERE to get the actual DATA from the work entry.

This is the MOST IMPORTANT key. It maps your layout section to actual template data.

---

### MODE 1: `template_section` ⭐ RECOMMENDED
**Use when:** You want fields from ONE specific section of your template.

```json
"binding_rules": {
  "template_section": "section_id_from_template"
}
```

**How it works:**
- Engine finds all `work_entries.data` keys starting with `"section_id."`
- Extracts those values
- Gets proper labels from `templates.fields_schema`
- Renders with correct field names as labels

**Example - Construction Diary Weather Section:**

Template has:
```json
{
  "section_id": "weather",
  "section_name": "Weather Conditions",
  "fields": [
    { "field_id": "weather_morning", "field_name": "Morning Weather" },
    { "field_id": "temperature", "field_name": "Temperature (°C)" }
  ]
}
```

Matching layout section:
```json
{
  "section_id": "weather_block",
  "block_type": "detail_entry",
  "content": { "title": "Weather Conditions" },
  "options": { "columns": 2 },
  "binding_rules": {
    "template_section": "weather"
  }
}
```

**Result:** Report shows:
```
Weather Conditions
─────────────────────────────────────
Morning Weather    │  Sunny
Temperature (°C)   │  32
```

---

### MODE 2: `template_section` + `fields` (Selective)
**Use when:** You only want SPECIFIC fields from a section.

```json
"binding_rules": {
  "template_section": "manpower",
  "fields": ["workers_skilled", "workers_general", "total_manpower"]
}
```

Only those 3 fields extracted from the manpower section.

---

### MODE 3: `auto_extract_all`
**Use when:** You want ALL fields from ALL sections (generic/universal layout).

```json
"binding_rules": {
  "mode": "auto_extract_all"
}
```

**How it works:**
- Extracts every field from `work_entries.data`
- Automatically skips photos and signatures
- Shows field_id as label (less pretty)

**Best for:** Universal Dynamic Layout, quick reports

---

### MODE 4: `filter_by_field` (for photo_grid only)
**Use when:** Separating Before/During/After photos.

```json
"binding_rules": {
  "filter_by_field": "photos_before"
}
```

**How it works:**
- Finds all attachments where `field_id` contains `"photos_before"`
- This matches the template's photo field_id exactly

**Template field:**
```json
{ "field_id": "photos_before", "field_type": "photo" }
```

**Matching layout section:**
```json
{
  "section_id": "before_photos",
  "block_type": "photo_grid",
  "content": { "title": "Before Work" },
  "options": { "columns": 2, "showTimestamps": true },
  "binding_rules": { "filter_by_field": "photos_before" }
}
```

---

### MODE 5: `source` (dot notation path)
**Use when:** Getting data from non-template locations.

```json
"binding_rules": {
  "source": "contract.contract_number"
}
```

Available paths:
```
workEntry.entry_date
workEntry.shift
workEntry.status
workEntry.contract.contract_number
workEntry.contract.contract_name
workEntry.contract.project.client_name
workEntry.contract.project.site_address
workEntry.created_by_profile.full_name
```

---

### MODE 6: `metrics` (for metrics_cards block)
**Use when:** Displaying KPI-style number cards.

```json
"binding_rules": {
  "metrics": [
    { "label": "Total Visits",   "template_section": "report_period", "field": "total_visits",    "unit": "visits" },
    { "label": "Man Hours",      "template_section": "report_period", "field": "total_man_hours", "unit": "hrs" },
    { "label": "PM Completed",   "template_section": "preventive_work", "field": "pm_completed",  "unit": "" }
  ]
}
```

---

## 🏗️ COMPLETE LAYOUT EXAMPLES

### Example 1: Construction Daily Diary Layout

Based on `construction-daily-diary-v1` template sections:
- `diary_info`, `weather`, `manpower`, `equipment`, `work_performed`, `materials`, `safety_quality`, `visitors_issues`, `tomorrow_plan`

```json
{
  "page": { "size": "A4", "orientation": "portrait", "margins": {"top":20,"left":20,"right":20,"bottom":20} },
  "sections": [

    {
      "section_id": "header",
      "block_type": "header",
      "content": { "title": "Construction Daily Work Diary" }
    },

    {
      "section_id": "diary_info_block",
      "block_type": "detail_entry",
      "content": { "title": "Diary Information" },
      "options": { "columns": 2 },
      "binding_rules": { "template_section": "diary_info" }
    },

    {
      "section_id": "weather_block",
      "block_type": "detail_entry",
      "content": { "title": "Weather Conditions" },
      "options": { "columns": 2 },
      "binding_rules": { "template_section": "weather" }
    },

    {
      "section_id": "manpower_block",
      "block_type": "detail_entry",
      "content": { "title": "Manpower on Site" },
      "options": { "columns": 2 },
      "binding_rules": { "template_section": "manpower" }
    },

    {
      "section_id": "work_block",
      "block_type": "detail_entry",
      "content": { "title": "Work Performed Today" },
      "options": { "columns": 1 },
      "binding_rules": { "template_section": "work_performed" }
    },

    {
      "section_id": "safety_block",
      "block_type": "detail_entry",
      "content": { "title": "Safety & Quality" },
      "options": { "columns": 1 },
      "binding_rules": { "template_section": "safety_quality" }
    },

    {
      "section_id": "site_photos",
      "block_type": "photo_grid",
      "content": { "title": "Site Photos" },
      "options": { "columns": 2, "showTimestamps": true, "showCaptions": true },
      "binding_rules": {}
    },

    {
      "section_id": "signatures",
      "block_type": "signature_box",
      "content": { "title": "Acknowledgment" },
      "options": { "layout": "two_column" },
      "binding_rules": {}
    }
  ]
}
```

---

### Example 2: CMC Monthly Summary Layout

Based on `cmc-monthly-summary-v1` template sections:
- `report_period`, `preventive_work`, `corrective_work`, `equipment_status`, `parts_consumables`, `recommendations`

```json
{
  "page": { "size": "A4", "orientation": "portrait", "margins": {"top":20,"left":20,"right":20,"bottom":20} },
  "sections": [

    {
      "section_id": "header",
      "block_type": "header",
      "content": { "title": "Comprehensive Maintenance Monthly Report" }
    },

    {
      "section_id": "kpi_cards",
      "block_type": "metrics_cards",
      "content": { "title": "Monthly Summary" },
      "options": { "columns": 3 },
      "binding_rules": {
        "metrics": [
          { "label": "Total Visits",   "template_section": "report_period",   "field": "total_visits",      "unit": "visits" },
          { "label": "Man Hours",      "template_section": "report_period",   "field": "total_man_hours",   "unit": "hrs" },
          { "label": "PM Completed",   "template_section": "preventive_work", "field": "pm_completed",      "unit": "" },
          { "label": "Breakdowns",     "template_section": "corrective_work", "field": "breakdown_calls",   "unit": "" },
          { "label": "Systems OK",     "template_section": "equipment_status","field": "systems_operational","unit": "" }
        ]
      }
    },

    {
      "section_id": "pm_block",
      "block_type": "detail_entry",
      "content": { "title": "Preventive Maintenance" },
      "options": { "columns": 2 },
      "binding_rules": { "template_section": "preventive_work" }
    },

    {
      "section_id": "corrective_block",
      "block_type": "detail_entry",
      "content": { "title": "Corrective Maintenance" },
      "options": { "columns": 2 },
      "binding_rules": { "template_section": "corrective_work" }
    },

    {
      "section_id": "recommendations_block",
      "block_type": "detail_entry",
      "content": { "title": "Recommendations & Next Month Plan" },
      "options": { "columns": 1 },
      "binding_rules": { "template_section": "recommendations" }
    },

    {
      "section_id": "evidence_photos",
      "block_type": "photo_grid",
      "content": { "title": "Photo Evidence" },
      "options": { "columns": 2, "showTimestamps": true },
      "binding_rules": {}
    },

    {
      "section_id": "signatures",
      "block_type": "signature_box",
      "content": { "title": "Approval & Signatures" },
      "options": { "layout": "two_column" },
      "binding_rules": {}
    }
  ]
}
```

---

### Example 3: Complete Feature Test Template Layout

Based on `complete-test-all-features` template sections:
- `section_1_dates`, `section_2_text`, `section_3_numbers`, `section_4_selection`,
  `section_5_photos` (photos_before), `section_6_work`, `section_7_photos_after` (photos_after),
  `section_8_conditional`, `section_9_signatures`

```json
{
  "page": { "size": "A4", "orientation": "portrait", "margins": {"top":20,"left":20,"right":20,"bottom":20} },
  "sections": [

    {
      "section_id": "header",
      "block_type": "header",
      "content": { "title": "Work Report - Complete Details" }
    },

    {
      "section_id": "datetime_block",
      "block_type": "detail_entry",
      "content": { "title": "Date & Time" },
      "options": { "columns": 2 },
      "binding_rules": { "template_section": "section_1_dates" }
    },

    {
      "section_id": "work_details_block",
      "block_type": "detail_entry",
      "content": { "title": "Work Details" },
      "options": { "columns": 1 },
      "binding_rules": { "template_section": "section_6_work" }
    },

    {
      "section_id": "status_block",
      "block_type": "detail_entry",
      "content": { "title": "Status & Priority" },
      "options": { "columns": 2 },
      "binding_rules": { "template_section": "section_4_selection" }
    },

    {
      "section_id": "conditional_block",
      "block_type": "detail_entry",
      "content": { "title": "Issues" },
      "options": { "columns": 1 },
      "binding_rules": { "template_section": "section_8_conditional" }
    },

    {
      "section_id": "photos_before_block",
      "block_type": "photo_grid",
      "content": { "title": "Before Work" },
      "options": { "columns": 2, "showTimestamps": true, "showCaptions": true },
      "binding_rules": { "filter_by_field": "photos_before" }
    },

    {
      "section_id": "photos_after_block",
      "block_type": "photo_grid",
      "content": { "title": "After Work" },
      "options": { "columns": 2, "showTimestamps": true, "showCaptions": true },
      "binding_rules": { "filter_by_field": "photos_after" }
    },

    {
      "section_id": "signatures",
      "block_type": "signature_box",
      "content": { "title": "Signatures & Acknowledgment" },
      "options": { "layout": "two_column" },
      "binding_rules": {}
    }
  ]
}
```

---

## 🔑 QUICK REFERENCE: Finding Template Section IDs

To find the correct `template_section` value, run in Supabase:

```sql
SELECT 
  template_id,
  template_name,
  jsonb_array_elements(fields_schema->'sections')->>'section_id' as section_id,
  jsonb_array_elements(fields_schema->'sections')->>'section_name' as section_name
FROM templates
ORDER BY template_name, section_id;
```

---

## ⚠️ COMMON MISTAKES

| Mistake | Wrong | Correct |
|---------|-------|---------|
| Wrong section_id | `"template_section": "Weather"` | `"template_section": "weather"` |
| Photos in detail block | `"mode": "auto_extract_all"` (shows photo UUIDs) | Use separate `photo_grid` block |
| Missing filter | `binding_rules: {}` for photos | `"filter_by_field": "photos_before"` |
| Signatures in detail | `"mode": "auto_extract_all"` (shows UUID) | Use separate `signature_box` block |

---

## 🗂️ ALL BLOCK TYPES

| Block Type | Purpose | Binding Mode |
|------------|---------|--------------|
| `header` | Report header with logo & contract | No binding needed |
| `detail_entry` | Key-value field display | `template_section` or `auto_extract_all` |
| `photo_grid` | Photo grid with captions | `filter_by_field` or empty `{}` |
| `signature_box` | Signature display | Empty `{}` (auto-detects) |
| `metrics_cards` | KPI number cards | `metrics` array |
| `table` | Tabular data | `template_section` |
| `checklist` | Checkbox items | `template_section` |
| `text_section` | Free text block | `source` path |

---

## 🚀 HOW TO CREATE A LAYOUT FOR ANY TEMPLATE

1. **Open Template** → Note all `section_id` values
2. **Open Layout Editor** → Create new layout
3. **Add header block** → Set content.title to report name
4. **For each template section:**
   - If it contains text/number/select fields → Add `detail_entry` block, set `binding_rules.template_section` to the section_id
   - If it contains photo field → Add `photo_grid` block, set `binding_rules.filter_by_field` to the photo field_id
   - If it contains signature field → Add `signature_box` block, leave binding_rules empty `{}`
5. **Set options** → columns, showTimestamps, etc.
6. **Set content.title** → Use section_name from template
7. **Save layout** → Assign to contract

---

*WorkLedger Layout Keys Guide v1.0 | February 17, 2026*
