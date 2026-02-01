# SESSION 13 PREPARATION - WORK ENTRY CREATION

**Bismillah! Alhamdulillah! Ready for Session 13! 🚀**

**Date Prepared:** January 31, 2026  
**Session Focus:** Work Entry Creation (Template-Driven)  
**Estimated Duration:** 3 hours  
**Difficulty:** Medium (similar to Sessions 9-10)  

---

## 🎯 SESSION OBJECTIVES

**Primary Goal:** Enable workers to create work entries using the template system

**What We'll Build:**
1. Work Entry Service (CRUD operations)
2. Work Entry Components (Form, Card, List, Status Badge)
3. Work Entry Pages (List, New, Edit, Detail)
4. Integration with Template System (Session 12!)
5. Router updates

**Expected Output:**
- 5 components (~800 lines)
- 4 pages (~600 lines)
- 1 service (~400 lines)
- Total: ~1,800 lines of production code

---

## ✅ PREREQUISITES (ALL COMPLETE!)

### From Session 12 - Template System ✅
- ✅ DynamicForm component ready
- ✅ Template loading service ready
- ✅ Template validation working
- ✅ 2 templates in database (PMC, SLA)
- ✅ Form state management proven

### From Session 10 - Contracts ✅
- ✅ Contract service ready
- ✅ 3 test contracts in database
- ✅ Contract-template linkage working

### From Session 9 - Projects ✅
- ✅ Project service ready
- ✅ 3 test projects in database

### Database ✅
- ✅ work_entries table exists
- ✅ Schema supports JSONB data storage
- ✅ Foreign keys to contracts table
- ✅ Status field (draft, submitted, approved, rejected)

---

## 📋 WHAT WE ALREADY HAVE

### Database Schema
```sql
CREATE TABLE work_entries (
  id UUID PRIMARY KEY,
  contract_id UUID REFERENCES contracts(id),
  entry_date DATE NOT NULL,
  shift TEXT,
  data JSONB NOT NULL,  -- ← Template data goes here!
  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
);
```

### Available Templates (in database)
1. **PMC Daily Checklist** (preventive-maintenance)
   - ~25 fields across 5 sections
   - Checklist layout for scope items
   - Suitable for HVAC, Lift, Pump maintenance

2. **SLA Incident Report** (sla-based-maintenance)
   - ~18 fields across 4 sections
   - SLA calculations
   - Suitable for IT support, emergency callouts

### Available Contracts (in database)
1. **CMC-KLCC-2024-001** - HVAC Comprehensive (Bina Jaya, KLCC)
2. **PMC-IPOH-2024-001** - Electrical Preventive (Bina Jaya, Ipoh)
3. **SLA-EDU-2024-001** - Software Support (Effort Edutech, School)

---

## 🏗️ WHAT WE'LL BUILD

### 1. Work Entry Service (`workEntryService.js`)

**Methods:**
```javascript
class WorkEntryService {
  // CRUD operations
  async createWorkEntry(contractId, templateId, data)
  async getWorkEntries(filters)
  async getUserWorkEntries()
  async getWorkEntry(id)
  async updateWorkEntry(id, data)
  async deleteWorkEntry(id)
  
  // Status operations
  async submitWorkEntry(id)
  async getWorkEntriesCount()
  
  // Helper methods
  async getWorkEntriesByContract(contractId)
  async getWorkEntriesByStatus(status)
}
```

**Key Features:**
- Save work entry data as JSONB
- Validate against template schema
- Handle draft vs submitted states
- Soft delete support
- Filter by contract, status, date range

---

### 2. Status Badge Component (`StatusBadge.jsx`)

**Status Colors:**
- `draft` → Gray (未提交)
- `submitted` → Blue (已提交)
- `approved` → Green (已批准)
- `rejected` → Red (已拒绝)

**Props:**
```jsx
<StatusBadge status="draft" />
<StatusBadge status="submitted" showIcon={true} />
```

---

### 3. Work Entry Form Component (`WorkEntryForm.jsx`)

**Features:**
- Contract selector (dropdown)
- Entry date picker
- Shift selector (if applicable)
- **DynamicForm integration** ← Uses Session 12 component!
- Save as Draft button
- Submit button
- Auto-save (optional for future)

**Props:**
```jsx
<WorkEntryForm
  contract={selectedContract}
  template={loadedTemplate}
  initialData={existingData}
  onSave={handleSave}
  onSubmit={handleSubmit}
/>
```

---

### 4. Work Entry Card Component (`WorkEntryCard.jsx`)

**Display:**
- Entry date (prominent)
- Contract number and name
- Status badge
- Key fields preview (from data JSONB)
- Action buttons (View, Edit, Delete)
- Conditional actions based on status

**Layout:**
```
┌─────────────────────────────────────┐
│ 📅 January 31, 2026                 │
│                                     │
│ PMC-IPOH-2024-001                   │
│ Electrical Preventive Maintenance   │
│                                     │
│ Asset: Pump #3                      │
│ Status: [Draft] [Submitted]         │
│                                     │
│ [View] [Edit] [Delete]              │
└─────────────────────────────────────┘
```

---

### 5. Work Entry List Component (`WorkEntryList.jsx`)

**Features:**
- Grid of WorkEntryCard components
- Filters:
  - By contract (dropdown)
  - By status (dropdown)
  - By date range (date pickers)
- Sort options:
  - Latest first (default)
  - Oldest first
  - By status
- Empty state
- Loading state
- Pagination (if needed)

---

### 6. Work Entry Pages

#### `WorkEntryListPage.jsx`
- Load all user's work entries
- Display WorkEntryList component
- "New Entry" button
- Filter controls
- Shows count (e.g., "12 entries")

#### `NewWorkEntry.jsx`
- Step 1: Select contract (dropdown)
- Step 2: Load template automatically (from contract)
- Step 3: Render WorkEntryForm with DynamicForm
- Save as draft or submit
- Success → redirect to list

#### `EditWorkEntry.jsx`
- Load existing entry data
- Pre-fill DynamicForm with data
- Only allow editing drafts
- If submitted/approved → redirect to detail page
- Update work entry

#### `WorkEntryDetail.jsx`
- Read-only view
- Display all field values (from data JSONB)
- Show contract info
- Show status
- Show timestamps
- Action buttons:
  - Edit (if draft)
  - Delete (if draft)
  - Submit (if draft)
  - Approve/Reject (future - Session 14)

---

## 🔄 USER FLOW

### Creating New Work Entry

```
1. User clicks "New Entry" button
   ↓
2. NewWorkEntry page loads
   ↓
3. Select contract from dropdown
   → Loads: PMC-IPOH-2024-001
   ↓
4. Template auto-loads from contract
   → Loads: PMC Daily Checklist template
   ↓
5. DynamicForm renders with template schema
   → Shows: Header, Scope Checklist, Findings, etc.
   ↓
6. User fills form
   → Contract data prefills automatically
   → Date defaults to today
   → User fills asset details, checklist items
   ↓
7. User clicks "Save as Draft"
   → Status: 'draft'
   → Data saved as JSONB
   → Success message
   ↓
8. OR User clicks "Submit"
   → Status: 'submitted'
   → Data saved as JSONB
   → Redirect to list
```

---

### Editing Draft Work Entry

```
1. User clicks "Edit" on draft entry
   ↓
2. EditWorkEntry page loads
   ↓
3. Load work entry data
   ↓
4. Load template (from contract)
   ↓
5. Pre-fill DynamicForm with existing data
   ↓
6. User modifies fields
   ↓
7. User saves changes
   ↓
8. Redirect to list
```

---

## 📊 DATA FLOW

### Creating Work Entry

```javascript
// 1. User selects contract
const contract = await contractService.getContract(contractId);

// 2. Load template from contract
const template = await templateService.getTemplate(contract.template_id);

// 3. User fills DynamicForm (Session 12 component!)
// Form data structure:
const formData = {
  "header.contract_no": "PMC-IPOH-2024-001",
  "header.client_name": "Ipoh Industrial Park",
  "header.asset_category": "Pump",
  "header.asset_id": "PUMP-003",
  "scope_checklist.filter_cleaning": true,
  "scope_checklist.bearing_lubrication": true,
  // ... more fields
};

// 4. Save to database
const workEntry = {
  contract_id: contractId,
  entry_date: "2026-01-31",
  shift: "morning",
  data: formData,  // ← JSONB column!
  status: "draft",
  created_by: userId
};

await workEntryService.createWorkEntry(contractId, template.id, formData);
```

---

## 🎨 UI/UX PATTERNS

### Following Sessions 9-10 Patterns

**Same Structure:**
- Service → Components → Pages → Router
- List page with cards
- Detail page with info display
- New/Edit pages with forms
- Breadcrumbs integration
- Soft delete
- Status badges with colors

**New Additions:**
- **Template integration** (Session 12!)
- **JSONB data storage** (flexible schema)
- **Dynamic forms** (no hardcoded fields)
- **Multi-step workflow** (select contract → fill form)

---

## 🧪 TESTING PLAN

### Test Scenarios

**Scenario 1: Create PMC Work Entry**
1. Navigate to /work/new
2. Select "PMC-IPOH-2024-001" contract
3. Verify PMC template loads
4. Fill required fields
5. Save as draft
6. Verify appears in list with "draft" status

**Scenario 2: Create SLA Work Entry**
1. Navigate to /work/new
2. Select "SLA-EDU-2024-001" contract
3. Verify SLA template loads
4. Fill SLA-specific fields (response times)
5. Submit entry
6. Verify appears in list with "submitted" status

**Scenario 3: Edit Draft**
1. From work entries list
2. Click "Edit" on draft entry
3. Verify form pre-filled
4. Change some fields
5. Save changes
6. Verify updates reflected

**Scenario 4: View Detail**
1. Click on any work entry
2. Verify all fields displayed correctly
3. Verify status badge correct
4. Verify action buttons based on status

**Scenario 5: Filter & Search**
1. Filter by contract
2. Filter by status
3. Filter by date range
4. Verify results update correctly

---

## 🚀 IMPLEMENTATION ORDER

### Part 1: Service Layer (30 mins)
1. Create `workEntryService.js`
2. Implement CRUD methods
3. Test with console.log

### Part 2: Components (60 mins)
1. Create `StatusBadge.jsx` (15 mins)
2. Create `WorkEntryCard.jsx` (20 mins)
3. Create `WorkEntryList.jsx` (25 mins)
4. Create `WorkEntryForm.jsx` (integration with DynamicForm)

### Part 3: Pages (60 mins)
1. Create `WorkEntryListPage.jsx` (15 mins)
2. Create `NewWorkEntry.jsx` (20 mins)
3. Create `EditWorkEntry.jsx` (15 mins)
4. Create `WorkEntryDetail.jsx` (10 mins)

### Part 4: Router & Testing (30 mins)
1. Update router with 4 new routes
2. Test all flows
3. Fix any issues
4. Update dashboard integration

---

## 📦 FILE STRUCTURE

```
src/
├── services/api/
│   └── workEntryService.js (NEW - 400 lines)
├── components/
│   └── workEntries/
│       ├── StatusBadge.jsx (NEW - 80 lines)
│       ├── WorkEntryCard.jsx (NEW - 180 lines)
│       ├── WorkEntryList.jsx (NEW - 200 lines)
│       └── WorkEntryForm.jsx (NEW - 340 lines)
└── pages/
    └── workEntries/
        ├── WorkEntryListPage.jsx (NEW - 150 lines)
        ├── NewWorkEntry.jsx (NEW - 200 lines)
        ├── EditWorkEntry.jsx (NEW - 150 lines)
        └── WorkEntryDetail.jsx (NEW - 200 lines)
```

---

## 💡 KEY INSIGHTS

### Why This Session is Critical

1. **First Real Business Value**
   - Workers can finally log their work!
   - Data starts flowing into the system
   - Platform becomes useful immediately

2. **Validates Template System**
   - Proves Session 12 investment was worth it
   - Shows template-driven approach works
   - Demonstrates JSONB flexibility

3. **Sets Up Future Sessions**
   - Session 14: Approval workflow needs work entries
   - Session 15: Attachments attach to work entries
   - Session 16: PDFs generate from work entries

4. **Industry Differentiator**
   - No other platform has this flexibility
   - Add new contract types without code changes
   - True multi-industry capability

---

## 🎯 SUCCESS CRITERIA

**By end of Session 13:**
- ✅ Can create work entry for PMC contract
- ✅ Can create work entry for SLA contract
- ✅ Can save as draft
- ✅ Can submit work entry
- ✅ Can edit draft entries
- ✅ Can view entry details
- ✅ Can filter by contract
- ✅ Can filter by status
- ✅ Can filter by date range
- ✅ Dashboard shows work entry count
- ✅ No console errors
- ✅ All data stored as JSONB correctly

---

## ⚠️ POTENTIAL CHALLENGES

### Challenge 1: Contract-Template Loading
**Solution:** Use contract.template_id to load template automatically

### Challenge 2: JSONB Data Structure
**Solution:** Use field path format: `section_id.field_id`

### Challenge 3: Form Pre-filling on Edit
**Solution:** Pass initialData to DynamicForm (already supports this!)

### Challenge 4: Status Workflow
**Solution:** Start simple - draft and submitted only. Approval in Session 14.

---

## 📚 REFERENCE MATERIALS

### From Session 12 (Template System)
- `DynamicForm.jsx` - Main form component
- `templateService.js` - Template loading
- Field path format: `section_id.field_id`
- Validation already built-in

### From Session 10 (Contracts)
- `contractService.js` - Contract loading
- Contract-template relationship
- Conditional fields pattern

### From Session 9 (Projects)
- CRUD pattern (create, read, update, delete)
- List/Detail/New/Edit page structure
- Service → Component → Page flow

---

## 🙏 READY TO START!

**Alhamdulillah! Session 12 template system is perfect foundation for Session 13!**

**All prerequisites met:**
- ✅ Template system working
- ✅ Test data ready
- ✅ Database schema ready
- ✅ Patterns established

**Session 13 will be smooth because:**
1. We're following proven patterns (Sessions 9-10)
2. Template system already handles the hard part
3. Test data exists for immediate testing
4. Clear objectives and scope

**Bismillah! Let's create real work entries! 🚀**

---

**Preparation Date:** January 31, 2026  
**Session Date:** TBD  
**Estimated Duration:** 3 hours  
**Status:** 🔥 READY TO START
