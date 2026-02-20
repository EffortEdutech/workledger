# Next Session Preparation - Multi-Client Implementation
**Session 9 Focus:** Multi-Tenancy Foundation (Phase 1)  
**Target Date:** February 19-20, 2026  
**Estimated Duration:** 2 days

---

## 🎯 SESSION 9 OBJECTIVES

**Primary Goal:** Enable organization-level data isolation

**Deliverables:**
1. ✅ All tables audited for organization_id
2. ✅ RLS policies updated for organization isolation
3. ✅ Organization switcher UI for Bina Jaya staff
4. ✅ Test organizations created and verified
5. ✅ Data isolation thoroughly tested

---

## 📚 REQUIRED READING BEFORE SESSION 9

**Priority 1 (MUST READ):**
1. **WORKLEDGER_MULTI_CLIENT_STRATEGY.md** (30 pages)
   - Read sections: Scenario Analysis, Enhancement 1, Phase 1
   - Focus on: Multi-tenancy architecture
   - Time: 30 minutes

2. **IMPLEMENTATION_CHECKLIST.md**
   - Read: Phase 1 section thoroughly
   - Note: Week-by-week tasks
   - Time: 15 minutes

**Priority 2 (Reference):**
3. **19FEB2026_DATABASE_SCHEMA** (project knowledge)
   - Review: All tables and their organization_id columns
   - Time: 10 minutes

4. **RBAC_GUIDE.md** (project knowledge)
   - Review: Current RLS policy patterns
   - Time: 10 minutes

**Total Reading Time:** ~65 minutes

---

## 🔍 PRE-SESSION AUDIT TASKS

### **Task 1: Database Audit (30 minutes)**

Run this audit script in Supabase SQL Editor:

```sql
-- Check which tables have organization_id column
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'organization_id'
ORDER BY table_name;

-- Expected tables with organization_id:
-- - organizations (has it)
-- - user_profiles (has it)
-- - projects (has it)
-- - contracts (has it)
-- - templates (has it)
-- - work_entries (check!)
-- - report_layouts (has it)
-- - generated_reports (check!)
```

**Create a checklist:**
```
Tables with organization_id:
[ ] organizations ✅ (primary)
[ ] user_profiles ✅
[ ] projects ✅
[ ] contracts ✅
[ ] templates ✅
[ ] work_entries (?)
[ ] report_layouts ✅
[ ] generated_reports (?)
[ ] attachments (?)
```

---

### **Task 2: RLS Policy Audit (30 minutes)**

List all current RLS policies:

```sql
-- Get all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Create a checklist:**
```
Tables with RLS enabled:
[ ] organizations
[ ] user_profiles
[ ] projects
[ ] contracts
[ ] templates
[ ] work_entries
[ ] report_layouts
[ ] generated_reports

Policies to update:
[ ] SELECT policies (add organization check)
[ ] INSERT policies (add organization check)
[ ] UPDATE policies (add organization check)
[ ] DELETE policies (add organization check)
```

---

### **Task 3: Identify Bina Jaya Users (10 minutes)**

```sql
-- Check current user roles
SELECT 
  id,
  email,
  full_name,
  role,
  organization_id
FROM user_profiles
ORDER BY created_at;

-- Decide which users are:
-- 1. Super Admin (Eff)
-- 2. Bina Jaya Staff (employees)
-- 3. Test Client Users
```

**Make a list:**
```
Bina Jaya Team:
- [ ] Eff (super_admin)
- [ ] Staff 1 (bina_jaya_staff)

Test Client Organizations:
- [ ] FEST ENT (test org)
- [ ] Mr. Roz (test org)
- [ ] MTSB (test org)
```

---

## 🛠️ PREPARATION CHECKLIST

### **Database Preparation:**
- [ ] Audit completed (organization_id columns)
- [ ] RLS policies listed
- [ ] Missing organization_id columns identified
- [ ] Backup database before changes

### **Development Environment:**
- [ ] Git committed (Session 8 complete)
- [ ] Clean working directory
- [ ] All dependencies installed
- [ ] Dev server running smoothly

### **Documentation Ready:**
- [ ] Multi-client strategy read
- [ ] Implementation checklist reviewed
- [ ] Database schema understood
- [ ] RBAC patterns familiar

### **Test Data Prepared:**
- [ ] 3 test organizations planned
- [ ] Test users identified
- [ ] Sample contracts ready
- [ ] Test work entries ready

---

## 📋 SESSION 9 TASKS BREAKDOWN

### **Week 1, Day 1 (Feb 19) - Database Foundation**

**Morning (3 hours):**
1. ✅ Add organization_id to missing tables
2. ✅ Write migration scripts
3. ✅ Test migrations on dev database
4. ✅ Backup production data

**Afternoon (3 hours):**
1. ✅ Create 3 test organizations
2. ✅ Update existing data with organization_id
3. ✅ Verify data integrity
4. ✅ Test queries with organization filter

**Deliverable:** All tables have organization_id, test data ready

---

### **Week 1, Day 2 (Feb 20) - RLS Policies & UI**

**Morning (3 hours):**
1. ✅ Update RLS policies for organization isolation
2. ✅ Test each policy thoroughly
3. ✅ Verify data isolation between orgs
4. ✅ Document policy patterns

**Afternoon (3 hours):**
1. ✅ Build organization switcher component
2. ✅ Add to header for Bina Jaya staff
3. ✅ Test switching between organizations
4. ✅ Verify data filtering works

**Deliverable:** RLS policies secure, organization switcher functional

---

## 🗄️ DATABASE MIGRATIONS TO CREATE

**Migration 022: Add organization_id to missing tables**
```sql
-- File: 022_add_organization_id_missing_tables.sql

-- Add to work_entries if missing
ALTER TABLE work_entries 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add to generated_reports if missing
ALTER TABLE generated_reports 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add to attachments if missing
ALTER TABLE attachments 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_work_entries_organization 
ON work_entries(organization_id);

CREATE INDEX IF NOT EXISTS idx_generated_reports_organization 
ON generated_reports(organization_id);

CREATE INDEX IF NOT EXISTS idx_attachments_organization 
ON attachments(organization_id);
```

**Migration 023: Update RLS policies for organization isolation**
```sql
-- File: 023_update_rls_organization_isolation.sql

-- Example: work_entries SELECT policy
DROP POLICY IF EXISTS "Users can view work entries" ON work_entries;

CREATE POLICY "Users see only their organization's work entries"
ON work_entries FOR SELECT
TO authenticated
USING (
  -- User's organization matches entry's organization
  organization_id = (
    SELECT organization_id 
    FROM user_profiles 
    WHERE id = auth.uid()
  )
  OR
  -- OR user is Bina Jaya staff (can see all)
  auth.uid() IN (
    SELECT id 
    FROM user_profiles 
    WHERE role IN ('super_admin', 'bina_jaya_staff')
  )
);

-- Repeat for all tables and all operations (INSERT, UPDATE, DELETE)
```

---

## 🎨 UI COMPONENTS TO BUILD

### **Component 1: OrganizationSwitcher**

**File:** `src/components/organizations/OrganizationSwitcher.jsx`

```jsx
/**
 * Organization Switcher for Bina Jaya Staff
 * 
 * Shows in header when user is super_admin or bina_jaya_staff
 * Allows switching between client organizations
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';

export default function OrganizationSwitcher() {
  const { user, profile } = useAuth();
  const { currentOrg, setCurrentOrg, allOrgs } = useOrganization();
  
  // Only show for Bina Jaya staff
  if (!['super_admin', 'bina_jaya_staff'].includes(profile?.role)) {
    return null;
  }
  
  return (
    <div className="organization-switcher">
      <label>Working as:</label>
      <select 
        value={currentOrg?.id} 
        onChange={(e) => setCurrentOrg(e.target.value)}
      >
        {allOrgs.map(org => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
      <span className="badge">Bina Jaya Staff</span>
    </div>
  );
}
```

---

### **Component 2: OrganizationContext**

**File:** `src/contexts/OrganizationContext.jsx`

```jsx
/**
 * Organization Context
 * 
 * Manages current organization state
 * Provides organization switching for Bina Jaya staff
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabase/client';

const OrganizationContext = createContext();

export function OrganizationProvider({ children }) {
  const { user, profile } = useAuth();
  const [currentOrg, setCurrentOrgState] = useState(null);
  const [allOrgs, setAllOrgs] = useState([]);
  
  // Load organizations
  useEffect(() => {
    loadOrganizations();
  }, [user]);
  
  // Set current organization
  const setCurrentOrg = (orgId) => {
    const org = allOrgs.find(o => o.id === orgId);
    setCurrentOrgState(org);
    localStorage.setItem('currentOrgId', orgId);
  };
  
  const loadOrganizations = async () => {
    if (!user) return;
    
    // If Bina Jaya staff, load all organizations
    if (['super_admin', 'bina_jaya_staff'].includes(profile?.role)) {
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .order('name');
      setAllOrgs(data || []);
    } else {
      // Regular users see only their organization
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile?.organization_id);
      setAllOrgs(data || []);
      setCurrentOrgState(data?.[0]);
    }
  };
  
  return (
    <OrganizationContext.Provider value={{
      currentOrg,
      setCurrentOrg,
      allOrgs
    }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export const useOrganization = () => useContext(OrganizationContext);
```

---

## 🧪 TESTING CHECKLIST

### **Test Scenario 1: Data Isolation**
```
1. Create 2 test organizations: FEST ENT, Mr. Roz
2. Create 2 test users: User A (FEST ENT), User B (Mr. Roz)
3. User A creates work entry
4. User B tries to view work entry
5. Expected: User B cannot see User A's work entry ✅
```

### **Test Scenario 2: Bina Jaya Staff Access**
```
1. Login as Bina Jaya staff
2. Switch to FEST ENT organization
3. View work entries
4. Expected: See FEST ENT work entries ✅
5. Switch to Mr. Roz organization
6. View work entries
7. Expected: See Mr. Roz work entries ✅
```

### **Test Scenario 3: Cross-Organization Queries**
```sql
-- Run as different users
SELECT COUNT(*) FROM work_entries;

-- User A (FEST ENT): Should see only FEST ENT entries
-- User B (Mr. Roz): Should see only Mr. Roz entries
-- Bina Jaya Staff: Should see all entries
```

---

## 🎯 SUCCESS CRITERIA FOR SESSION 9

**Technical:**
- [ ] All tables have organization_id
- [ ] All RLS policies enforce organization isolation
- [ ] Organization switcher works smoothly
- [ ] No data leaks between organizations
- [ ] Performance acceptable (<500ms queries)

**Functional:**
- [ ] 3 test organizations created
- [ ] Can create work entries per organization
- [ ] Can generate reports per organization
- [ ] Bina Jaya staff can switch organizations
- [ ] Regular users see only their org

**Quality:**
- [ ] All migrations tested
- [ ] All policies tested
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] No breaking changes to existing features

---

## 📞 QUESTIONS TO CLARIFY

**Before Session 9, decide:**

1. **Organization Creation:** Who can create new organizations?
   - [ ] Only super_admin (Eff)
   - [ ] Any Bina Jaya staff
   - [ ] Recommendation: Only super_admin

2. **Default Organization:** What if user has no organization?
   - [ ] Prevent login
   - [ ] Create default "Personal" org
   - [ ] Recommendation: Require organization

3. **Organization Switching:** Store in session or database?
   - [ ] Session/localStorage (simpler)
   - [ ] Database (more complex)
   - [ ] Recommendation: Session

4. **Existing Data:** How to handle?
   - [ ] Assign all to Bina Jaya organization
   - [ ] Create migration to assign properly
   - [ ] Recommendation: Assign to default org, migrate later

---

## 🚀 QUICK START COMMANDS FOR SESSION 9

```bash
# 1. Pull latest code
git pull origin main

# 2. Create feature branch
git checkout -b feature/multi-tenancy-foundation

# 3. Open strategy documents
code docs/multi_client_strategy/WORKLEDGER_MULTI_CLIENT_STRATEGY.md
code docs/multi_client_strategy/IMPLEMENTATION_CHECKLIST.md

# 4. Run database audit
psql $DATABASE_URL < scripts/audit_organization_columns.sql

# 5. Start dev server
npm run dev

# 6. Begin implementation!
```

---

## 💡 PRO TIPS

**Tip 1:** Test RLS policies in Supabase SQL Editor first before deploying

**Tip 2:** Use database transactions for migrations:
```sql
BEGIN;
-- migration commands
COMMIT;
-- Or ROLLBACK if something fails
```

**Tip 3:** Keep organization switcher state in localStorage for persistence

**Tip 4:** Add organization info to all API logs for debugging

**Tip 5:** Create a "test mode" switch to see all data temporarily

---

## 📦 DEPENDENCIES TO INSTALL

```bash
# None required - using existing tech stack
# But verify these are available:
npm list react react-router-dom
```

---

## ✅ FINAL PRE-SESSION CHECKLIST

**Complete before Session 9:**
- [ ] Session 8 fully committed to Git
- [ ] Strategy documents read thoroughly
- [ ] Database audit completed
- [ ] RLS policies listed
- [ ] Test organizations planned
- [ ] Development environment ready
- [ ] Questions clarified with team
- [ ] Coffee/tea prepared ☕

---

**You're ready for Session 9!**

**Bismillah, let's implement multi-tenancy!** 🚀

---

*Next Session Prep | February 18, 2026*
*Session 9: Multi-Tenancy Foundation*
