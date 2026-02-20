# WorkLedger Multi-Client Implementation - Quick Checklist
**Transform from:** Single-tenant system  
**Transform to:** Multi-tenant service platform

---

## 🎯 THE 3 CLIENT SCENARIOS

```
┌─────────────────────────────────────────────────────────────────┐
│ SCENARIO 1: FEST ENT (Fire System Service Company)             │
├─────────────────────────────────────────────────────────────────┤
│ • 4 technicians + 1 admin + 1 owner                            │
│ • Multiple clients with contracts                               │
│ • Direct platform usage ✅                                      │
│ • Need: Multi-user, RBAC, organization isolation               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SCENARIO 2: MR. ROZ (Freelance Air-Cond Technician)           │
├─────────────────────────────────────────────────────────────────┤
│ • Solo freelancer, no staff                                     │
│ • Sends data via WhatsApp                                       │
│ • Bina Jaya staff enters data & generates reports              │
│ • Need: Quick entry form, service provider mode                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SCENARIO 3: MTSB (Main Contractor)                             │
├─────────────────────────────────────────────────────────────────┤
│ • Large contractor with multiple projects                       │
│ • Internal technicians + subcontractors (FEST ENT)             │
│ • Need consolidated view of all work                            │
│ • Need: Subcontractor management, hierarchical structure        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 IMPLEMENTATION PHASES

### **PHASE 1: Multi-Tenancy (Weeks 1-2) - CRITICAL** 🔥

**Goal:** Each client company gets isolated data space

```sql
-- 1. Ensure all tables have organization_id
ALTER TABLE work_entries ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS organization_id UUID;

-- 2. Update RLS policies for organization isolation
CREATE POLICY "Users see only their org's data"
ON work_entries FOR SELECT
USING (
  organization_id = (
    SELECT organization_id 
    FROM user_profiles 
    WHERE id = auth.uid()
  )
  OR
  auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'bina_jaya_staff')
);

-- Repeat for all tables!
```

**UI Changes:**
```jsx
// For Bina Jaya Staff - Organization Switcher
<Header>
  <OrganizationSwitcher 
    organizations={allClientOrgs}
    currentOrg={selectedOrg}
    onChange={setSelectedOrg}
  />
  <span className="text-xs">
    Working as Bina Jaya Staff
  </span>
</Header>
```

**Checklist:**
- [ ] Audit all tables for organization_id
- [ ] Add organization_id where missing
- [ ] Update ALL RLS policies
- [ ] Build organization switcher UI
- [ ] Test: Create 2 test orgs, verify data isolation
- [ ] Test: Bina Jaya staff can access both orgs

---

### **PHASE 2: Role System (Weeks 3-4) - CRITICAL** 🔥

**Goal:** Support different user types in each scenario

**New Roles:**
```
BINA JAYA:
- super_admin (Eff - owner)
- bina_jaya_staff (Data entry for clients)

CLIENTS:
- org_owner (Company owner)
- org_admin (Admin staff)
- manager (Supervisor)
- technician (Field worker)
- subcontractor (External worker)
```

**Database:**
```sql
ALTER TABLE user_profiles
ADD COLUMN role TEXT CHECK (role IN (
  'super_admin', 'bina_jaya_staff', 
  'org_owner', 'org_admin', 'manager', 
  'technician', 'subcontractor'
));
```

**Permission Matrix:**
| Role | View All | Edit All | Manage Users | Gen Reports |
|------|----------|----------|--------------|-------------|
| super_admin | ✅ All orgs | ✅ | ✅ | ✅ |
| bina_jaya_staff | ✅ All orgs | ✅ | ❌ | ✅ |
| org_owner | ✅ Own org | ✅ | ✅ | ✅ |
| org_admin | ✅ Own org | ✅ | ✅ | ✅ |
| manager | ✅ Own org | ✅ | ❌ | ✅ |
| technician | ❌ Own only | ✅ Own | ❌ | ❌ |
| subcontractor | ❌ Own only | ✅ Own | ❌ | ❌ |

**Checklist:**
- [ ] Add role column to user_profiles
- [ ] Migrate existing users to new roles
- [ ] Update ALL RLS policies for roles
- [ ] Build role management UI
- [ ] Test: Technician can only see own work
- [ ] Test: Admin can see all work in org

---

### **PHASE 3: Service Provider Mode (Weeks 5-6) - HIGH**

**Goal:** Enable Bina Jaya staff to work on behalf of Mr. Roz

**Quick Entry Form for WhatsApp Data:**
```jsx
<QuickEntryForm>
  <h3>Quick Entry (from WhatsApp)</h3>
  
  <OrganizationSelect />  // Mr. Roz, FEST ENT, etc.
  <ContractSelect />      // Select contract
  <DatePicker />         // Work date
  
  <TextField 
    label="Technician Name" 
    placeholder="Mr. Roz"
  />
  
  <TextField 
    label="Location"
    placeholder="Copy from WhatsApp"
  />
  
  <TextArea 
    label="Work Done"
    rows={10}
    placeholder="Paste WhatsApp message here..."
  />
  
  <PhotoUpload 
    label="Photos from WhatsApp"
    multiple
  />
  
  <Button>Quick Save</Button>
</QuickEntryForm>
```

**Bulk Import from Excel:**
```jsx
<BulkImportForm>
  <FileUpload accept=".xlsx, .csv" />
  
  <ColumnMapping>
    Excel Column → Platform Field
    "Date" → entry_date
    "Technician" → technician_name
    "Site" → location
    "Work Done" → work_description
  </ColumnMapping>
  
  <Button>Import 50 entries</Button>
</BulkImportForm>
```

**Checklist:**
- [ ] Build Quick Entry form
- [ ] Build Bulk Import (Excel/CSV)
- [ ] Add "entered_by" field to work_entries
- [ ] Test: WhatsApp to platform workflow
- [ ] Test: Can enter 10 entries in 5 minutes

---

### **PHASE 4: Subcontractor Management (Weeks 7-8) - MEDIUM**

**Goal:** MTSB can manage work from FEST ENT and other subcontractors

**New Tables:**
```sql
CREATE TABLE subcontractor_relationships (
  id UUID PRIMARY KEY,
  main_contractor_org_id UUID,  -- MTSB
  subcontractor_org_id UUID,    -- FEST ENT
  project_id UUID,
  contract_id UUID,
  status TEXT,
  start_date DATE,
  end_date DATE
);
```

**MTSB Dashboard:**
```
┌─────────────────────────────────────────────┐
│ MTSB Project Dashboard                      │
├─────────────────────────────────────────────┤
│ Project: Shopping Mall Renovation           │
│                                             │
│ Internal Team:                              │
│ ├── 150 work entries                        │
│ └── 15 technicians                          │
│                                             │
│ Subcontractors:                             │
│ ├── FEST ENT (Fire System)                 │
│ │   └── 80 work entries                    │
│ ├── ABC Plumbing                            │
│ │   └── 45 work entries                    │
│ └── XYZ Electrical                          │
│     └── 60 work entries                     │
│                                             │
│ Total: 335 work entries across all teams   │
└─────────────────────────────────────────────┘
```

**Checklist:**
- [ ] Create subcontractor tables
- [ ] Build invitation system
- [ ] Build work visibility controls
- [ ] Build consolidated dashboard
- [ ] Test: MTSB can see FEST ENT work
- [ ] Test: FEST ENT can't see MTSB internal work

---

### **PHASE 5: Client Onboarding (Weeks 9-10) - HIGH**

**Goal:** Onboard new clients in 5 minutes

**Onboarding Wizard:**
```
Step 1: Company Info
├── Company name
├── Industry (Fire, Air-cond, Construction)
└── Client type (Service provider, Freelancer, Contractor)

Step 2: Template Selection
├── Auto-suggest based on industry
└── PMC, CMC, AMC templates

Step 3: User Setup
├── Create owner account
├── Invite staff
└── Assign roles

Step 4: Go Live
├── Training session scheduled
└── Demo data cleanup
```

**Checklist:**
- [ ] Build onboarding wizard
- [ ] Create industry templates
- [ ] Build user invitation system
- [ ] Test: Onboard FEST ENT in 5 minutes
- [ ] Test: Onboard Mr. Roz in 3 minutes

---

## 💰 PRICING RECOMMENDATION

**Start Simple:**
```
Small (1-5 users):    RM 100/month  → Mr. Roz
Medium (6-20 users):  RM 300/month  → FEST ENT
Large (21+ users):    RM 800/month  → MTSB

Premium Add-On (+RM 150/month):
- Bina Jaya staff data entry
- WhatsApp processing
- Priority support
```

**Later Add:**
- Per-report pricing (RM 5/report)
- Volume discounts
- Annual contracts

---

## 🎯 QUICK WINS (Do First!)

**Week 1:**
1. ✅ Update RLS policies for organization isolation
2. ✅ Test with 2 dummy organizations
3. ✅ Verify no data leaks

**Week 2:**
1. ✅ Build organization switcher for Bina Jaya staff
2. ✅ Test switching between orgs
3. ✅ Show current org in header

**Week 3:**
1. ✅ Build Quick Entry form
2. ✅ Test with sample WhatsApp data
3. ✅ Time how long 10 entries take

**Week 4:**
1. ✅ Update roles in database
2. ✅ Build role-based dashboards
3. ✅ Test all permission combinations

---

## ⚠️ CRITICAL DECISIONS NEEDED

### **Decision 1: Service Model**

**Option A: Self-Service Only**
- Clients use platform directly
- Lower operational cost
- More scalable

**Option B: Full-Service Only**
- Bina Jaya does everything
- Higher operational cost
- Not scalable

**Option C: Hybrid (RECOMMENDED)**
- Default: Self-service
- Premium: Full-service (limited slots)
- Flexibility for all client types

### **Decision 2: Which Scenario First?**

**Option A: FEST ENT First**
- Most common scenario
- Tests multi-user features
- Good proof of concept

**Option B: Mr. Roz First**
- Simplest to implement
- Tests service provider mode
- Quick win

**Option C: All Together**
- Longer development
- More complex
- Better coverage

**Recommendation: FEST ENT → Mr. Roz → MTSB**

---

## 📊 SUCCESS CRITERIA

**Technical:**
- ✅ 3 test organizations created
- ✅ Data isolation verified (no leaks)
- ✅ All roles working correctly
- ✅ Quick Entry < 30 seconds per entry
- ✅ Onboarding < 5 minutes

**Business:**
- ✅ 1 paying client by Month 1 (Mr. Roz)
- ✅ 3 paying clients by Month 3
- ✅ 10 paying clients by Month 6
- ✅ RM 5,000/month revenue by Month 6

---

## 📝 THIS WEEK'S ACTION ITEMS

**For Eff (Owner):**
- [ ] Review full strategy document
- [ ] Decide on service model (self-service vs hybrid)
- [ ] Prioritize scenarios (which first?)
- [ ] Set target launch date

**For Development:**
- [ ] Audit all tables for organization_id
- [ ] List all RLS policies to update
- [ ] Design organization switcher UI
- [ ] Plan database migration

**For Business:**
- [ ] Contact FEST ENT for pilot
- [ ] Contact Mr. Roz for pilot
- [ ] Prepare pitch deck
- [ ] Define pricing tiers

---

**This checklist transforms WorkLedger from a single-client tool to a multi-client service platform!**

**Let's execute phase by phase, Bismillah!** 🚀

*Implementation Checklist | February 18, 2026*
