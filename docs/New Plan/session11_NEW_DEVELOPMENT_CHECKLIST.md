# WORKLEDGER DEVELOPMENT CHECKLIST
## Complete Sequenced Development Plan (Start to Finish)

**Project:** WorkLedger - Multi-Client Work Reporting Service Platform  
**Developer:** Eff (Solo Developer) + AI Assistant  
**Business Model:** Service-Based (Bina Jaya provides reporting services)  
**Budget:** RM 0 (100% free-tier)  
**Philosophy:** Do it right the first time  

**Last Updated:** February 21, 2026  
**Version:** 2.3 - Session 11 Complete

---

## 📊 PROGRESS OVERVIEW

### Summary
- **Total Sessions Completed:** 11 (+ Session 8B Planning)
- **Phase 1 Status:** 100% Complete ✅
- **Phase 2 (Multi-Client) Status:** Weeks 5-8 COMPLETE ✅
- **Next:** Session 12 — User Management UI

### Phase Progress
- **Phase 0 (Project Setup):** 100% ✅
- **Phase 1 (Foundation):** 100% ✅
- **Phase 2 (Multi-Client Platform):** 30% 🔄 (Weeks 5-8 done, Week 9-10 next)
- **Phase 3 (Offline-First):** 0% (Deferred)

### Feature Completion
- ✅ Authentication & Authorization: 100%
- ✅ Organizations: 100%
- ✅ Multi-Tenancy Foundation: 100%
- ✅ Organization Switcher + Context: 100%
- ✅ Service/Page Org Wiring: 100%
- ✅ Permission System (useRole + PermissionGuard): 100% ✅ NEW
- ✅ Role-Filtered Navigation (Sidebar + BottomNav): 100% ✅ NEW
- ✅ FEST ENT Test Users (5 roles): 100% ✅ NEW
- ✅ Projects: 100%
- ✅ Contracts: 100%
- ✅ Templates: 100% (8 Malaysian templates)
- ✅ Work Entries: 100%
- ✅ Report Layouts: 100%
- ✅ Report Generation: 80% (basic PDF working)
- ⬜ User Management UI (Session 12): 0%

---

## 🎯 STRATEGIC PIVOT - MULTI-CLIENT FOCUS

**Date:** February 18, 2026  
**Decision:** Transform WorkLedger from single-tenant tool to multi-client service platform

**Business Scenarios:**
1. **FEST ENT** - Fire system service company (4 technicians + admin + owner)
2. **MR. ROZ** - Freelance air-cond technician (solo, data via WhatsApp)
3. **MTSB** - Main contractor (internal + subcontractors)

**Deferred:**
- ⚠️ Session 14 (Approval Workflow) → after Phase 2
- ✅ Phase 3 (Offline-First) → after multi-client foundation

---

## 📅 COMPLETED SESSIONS

---

## SESSION 1-5: Foundation & Database ✅ COMPLETE
- [x] 8 core tables, RLS policies, 8 Malaysian contract templates

## SESSION 6-7: Report Layouts ✅ COMPLETE
- [x] Layout system, template-layout automation, 3 default layouts

## SESSION 8: Layout Builder ✅ COMPLETE
- [x] Visual block-based builder, 8 block types, 4-tab editor, preview

## SESSION 8B: Multi-Client Strategy ✅ COMPLETE
- [x] 5-Phase roadmap, business model, revenue projections

---

## SESSION 9: Multi-Tenancy Foundation (Feb 19-20, 2026) ✅ COMPLETE

### 9.1 Database Migrations
- [x] Migration 022: `global_role` column on `user_profiles`
- [x] Migration 023: `organization_id` on `work_entries` + `attachments` + auto triggers
- [x] Migration 024: RLS policies on all 9 tables
- [x] Migration 025: Test orgs created + duplicate cleanup (5 clean orgs)

### 9.2 Frontend Files
- [x] `src/context/OrganizationContext.jsx` — org switching + localStorage
- [x] `src/components/organizations/OrganizationSwitcher.jsx` — amber dropdown
- [x] `src/components/layout/AppLayout.jsx` — switcher in header center
- [x] `src/App.jsx` — OrganizationProvider between Auth and Router

---

## SESSION 10: Organization Switcher Wiring (Feb 21, 2026) ✅ COMPLETE

### 10.1 Services Updated (orgId param)
- [x] `src/services/api/projectService.js` — `getUserProjects(orgId)`, `getProjectsCount(orgId)`
- [x] `src/services/api/contractService.js` — `getUserContracts(orgId)`, `getContractsCount(orgId)`
- [x] `src/services/api/workEntryService.js` — `getUserWorkEntries(filters, orgId)`, `getWorkEntriesCount(orgId)`

### 10.2 Pages Updated (useOrganization + useCallback[orgId])
- [x] `src/pages/Dashboard.jsx`
- [x] `src/pages/projects/ProjectListPage.jsx`
- [x] `src/pages/contracts/ContractListPage.jsx`
- [x] `src/pages/workEntries/WorkEntryListPage.jsx`

### 10.3 Org Switch Toast
- [x] `src/components/organizations/OrgSwitchToast.jsx` — auto-fires on switch

### 10.4 All Tests Passed ✅
- [x] No compile errors
- [x] Org switch → all data updates instantly
- [x] Toast appears on switch
- [x] localStorage persists selection on refresh

---

## SESSION 11: Role System Foundation (Feb 21, 2026) ✅ COMPLETE

### 11.1 Database
- [x] Migration 026: Updated `org_members.role` CHECK constraint
  - [x] Added: `org_owner`, `technician`, `subcontractor`
  - [x] Kept: `org_admin`, `manager`, `worker` (legacy), `client` (legacy)
- [x] 5 FEST ENT test users created via Supabase Dashboard
  - [x] All confirmed, all linked to FEST ENT org
  - [x] Fix applied: Dashboard creation (not SQL INSERT) for correct GoTrue password hashing

### 11.2 Permission Architecture
- [x] `src/constants/permissions.js`
  - [x] `PLATFORM_ROLES` constants
  - [x] `ORG_ROLES` constants
  - [x] `FIELD_WORKER_ROLES` + `ORG_MANAGER_ROLES` groups
  - [x] `PERMISSIONS` matrix (30+ permissions, all roles mapped)
  - [x] `NAV_*` permissions for navigation filtering
  - [x] `ROLE_META` — labels, descriptions, badge colours for all 9 roles
  - [x] `getRoleMeta(role)` helper function

### 11.3 OrganizationContext Updated
- [x] `src/context/OrganizationContext.jsx`
  - [x] Added `userOrgRole` state — fetched from `org_members` per active org
  - [x] BJ staff: `userOrgRole` = their `global_role`
  - [x] Regular users: `userOrgRole` = `org_members.role` for active org
  - [x] `fetchUserOrgRole()` re-runs when `currentOrg` changes
  - [x] Context exposes: `orgId`, `currentOrg`, `isBinaJayaStaff`, `userOrgRole`, `switchOrganization`, `allOrgs`

### 11.4 React Hooks & Components
- [x] `src/hooks/useRole.js`
  - [x] `can(permission)` — checks PERMISSIONS matrix
  - [x] `super_admin` always returns true
  - [x] Returns: `can`, `role`, `globalRole`, `isBinaJayaStaff`, `isFieldWorker`, `loading`
- [x] `src/components/auth/PermissionGuard.jsx`
  - [x] `permission` (single) and `permissions` (array) props
  - [x] `requireAll` prop (AND vs OR logic)
  - [x] `fallback` prop (show alternative if denied)
  - [x] Returns `null` while loading (prevents flash)
- [x] `src/components/auth/RoleBadge.jsx`
  - [x] Colour-coded badge from `ROLE_META`
  - [x] `size` prop (sm / md)
  - [x] `showDescription` prop (tooltip)

### 11.5 Role-Filtered Navigation
- [x] `src/components/layout/Sidebar.jsx`
  - [x] `useRole()` imported, filters `allNavItems` by `can(item.permission)`
  - [x] 9 nav items defined, each with `NAV_*` permission key
  - [x] Active state preserved
- [x] `src/components/layout/BottomNav.jsx`
  - [x] Same pattern — filters tabs by `can(item.permission)`, max 5

### 11.6 All 7 Role Tests PASSED ✅
```
Role            | Nav items visible
────────────────|──────────────────────────────────────────────────────
super_admin     | All 9 (Dashboard+Work+Projects+Contracts+Templates+Reports+Layouts+Orgs+Users)
bina_jaya_staff | All 9 (same as super_admin)
org_owner       | All 9 (same — includes Users page they manage)
org_admin       | All 9 (same)
manager         | 6 (Dashboard+Work+Projects+Contracts+Templates+Reports)
technician      | 4 (Dashboard+Work+Projects+Contracts)
subcontractor   | 4 (Dashboard+Work+Projects+Contracts)
```

**Design note:** Technicians and subcontractors see Projects + Contracts (read-only via RLS).
They need these to select the right contract when creating a work entry.
PermissionGuard hides Create/Edit/Delete buttons — navigation access ≠ write access.

### Key Architecture: How Permissions Flow
```
Login
 → AuthContext: profile.global_role loaded
 → OrganizationContext: userOrgRole fetched from org_members

useRole()
 → isBinaJayaStaff? → effectiveRole = globalRole
 → else             → effectiveRole = userOrgRole
 → can(permission)  → super_admin? true
                    → else PERMISSIONS[permission].includes(effectiveRole)

PermissionGuard  → wraps buttons/sections
Sidebar/BottomNav → filters nav items
```

---

## 🚀 PHASE 2: MULTI-CLIENT PLATFORM

**Status:** Weeks 5-8 COMPLETE ✅ | Week 9-10 NEXT

---

## ✅ WEEK 5-6: Multi-Tenancy Foundation — COMPLETE (Sessions 9+10)
## ✅ WEEK 7-8: Role System — COMPLETE (Session 11)

---

## WEEK 7-8 CONTINUED: Role Management UI

### SESSION 12: User Management UI
**Target Date:** Feb 24, 2026  
**Duration:** 1 day  
**Focus:** UI for org_admin and org_owner to manage their team

#### 12.1 userService (new)
- [ ] Create `src/services/api/userService.js`
  - [ ] `getOrgMembers(orgId)` — list all members with user_profiles joined
  - [ ] `updateMemberRole(orgId, userId, newRole)` — change role
  - [ ] `deactivateMember(orgId, userId)` — soft remove (is_active = false)
  - [ ] `reactivateMember(orgId, userId)`

#### 12.2 User List Page
- [ ] Create `src/pages/users/UserList.jsx`
  - [ ] Route: `/users` (already in Sidebar/Router)
  - [ ] Wrapped in `<AppLayout>`
  - [ ] Table of members: name, email, role badge, joined date, active status
  - [ ] Search by name
  - [ ] Filter by role
  - [ ] "Change Role" button → only if `can('CHANGE_USER_ROLES')`
  - [ ] "Deactivate" button → only if `can('MANAGE_ORG_USERS')`
  - [ ] "Invite User" button → only if `can('INVITE_USERS')`
  - [ ] Empty state with invite CTA

#### 12.3 Change Role Modal
- [ ] Create `src/components/users/ChangeRoleModal.jsx`
  - [ ] Role selector with `ROLE_META` descriptions shown
  - [ ] Confirmation step ("Change Roslan from Manager to Admin?")
  - [ ] Calls `userService.updateMemberRole()`
  - [ ] Cannot demote last org_owner (validation)
  - [ ] Success toast on completion

#### 12.4 Invite User Flow
- [ ] Create `src/pages/users/InviteUser.jsx`
  - [ ] Route: `/users/invite`
  - [ ] Email input + role selector
  - [ ] On submit: check if email exists in auth.users
    - [ ] If yes: add to org_members directly
    - [ ] If no: show "User not registered" message + copy signup link
  - [ ] Role badge previews as role is selected
  - [ ] Cancel → back to `/users`

#### 12.5 Router Update
- [ ] Add to Router.jsx:
  - [ ] `/users` → `UserList` (PermissionGuard: MANAGE_ORG_USERS)
  - [ ] `/users/invite` → `InviteUser` (PermissionGuard: INVITE_USERS)

**Deliverables:**
- User list with role badges and management actions
- Role change modal with confirmation
- Invite flow (email-based, no email system — shows signup link)
- All protected by PermissionGuard

---

## WEEK 9-10: Service Provider Mode

### SESSION 13: Quick Entry System
**Target Date:** Mar 3, 2026  
**Duration:** 1 day  
**Focus:** Bina Jaya staff entering data on behalf of Mr. Roz

#### 13.1 Quick Entry Form
- [ ] Create `src/pages/admin/QuickEntry.jsx`
  - [ ] Auto-selects active org from org switcher
  - [ ] Contract selector (filtered to org)
  - [ ] Minimal required fields only (date + key data fields)
  - [ ] Entry date defaults to yesterday
  - [ ] Save in < 30 seconds total
  - [ ] Only visible to `bina_jaya_staff` and `super_admin`

#### 13.2 WhatsApp Data Parser
- [ ] Create `src/utils/whatsappParser.js`
  - [ ] Parse Malay date format ("Jumaat, 20 Feb 2026")
  - [ ] Extract job description
  - [ ] Map to work entry fields
  - [ ] Returns structured object ready for Quick Entry form

#### 13.3 Batch Entry
- [ ] Queue multiple entries, review, submit in one action

---

## WEEK 11-12: Subcontractor Management

### SESSION 15: Subcontractor Relationships
**Target Date:** Mar 10, 2026  

#### 15.1 DB: Link Subcontractor Orgs
- [ ] Migration: Add `parent_org_id` to `organizations`
- [ ] MTSB subcontractors link to MTSB as parent

#### 15.2 MTSB Consolidated Dashboard
- [ ] Own + subcontractor entries in one view
- [ ] Filter: Internal / Subcontractor / All

---

## WEEK 13-14: Client Onboarding

### SESSION 17: Onboarding Wizard
**Target Date:** Mar 11, 2026  

#### 17.1 5-Step Wizard
- [ ] Step 1: Org details
- [ ] Step 2: Template selection
- [ ] Step 3: First project
- [ ] Step 4: First contract
- [ ] Step 5: Invite first user (optional)

---

## 📊 PHASE 2 SUCCESS CRITERIA

**Technical:**
- [x] 3 test organizations fully operational ✅
- [x] Data isolation verified ✅
- [x] Org switching works across all pages ✅
- [x] All 7 roles working correctly ✅ NEW
- [x] Role-filtered navigation working ✅ NEW
- [ ] User management UI (invite, change roles)
- [ ] Quick Entry < 30 seconds
- [ ] Onboarding < 5 minutes per client

**Business:**
- [ ] 1 paying client by Month 1 (Mr. Roz)
- [ ] RM 500/month by Month 3
- [ ] RM 5,000/month by Month 6

---

## 📅 DEFERRED

### PHASE 3: OFFLINE-FIRST
After Phase 2. Components: IndexedDB, Service Worker, Background sync.

### APPROVAL WORKFLOW
After Phase 2. Components: submission, approval/rejection, notifications.

---

## 🎯 CURRENT PRIORITIES

**Immediate Next Steps (Session 12):**
1. [ ] Create `src/services/api/userService.js`
2. [ ] Create `src/pages/users/UserList.jsx`
3. [ ] Create `src/components/users/ChangeRoleModal.jsx`
4. [ ] Create `src/pages/users/InviteUser.jsx`
5. [ ] Update Router.jsx with `/users` and `/users/invite`
6. [ ] Test as `festent.admin@test.com` — can see Users page, can change roles
7. [ ] Test as `festent.manager@test.com` — cannot see Users page

**This Week's Goals:**
- [x] Session 11: Permission system + role-aware nav ✅
- [ ] Session 12: User management UI

**This Month's Goals:**
- [ ] Phase 2 through Week 9-10 (Quick Entry for Mr. Roz)
- [ ] Onboard Mr. Roz as first paying client

---

## 📚 KEY FILES REFERENCE

**Permission System (Session 11):**
- `src/constants/permissions.js` → PERMISSIONS matrix, ROLE_META
- `src/hooks/useRole.js` → `can()`, `role`, `isBinaJayaStaff`
- `src/components/auth/PermissionGuard.jsx` → wrap any UI element
- `src/components/auth/RoleBadge.jsx` → display role with colour

**Context Providers:**
- `src/context/AuthContext.jsx` → `user`, `profile`, `profile.global_role`
- `src/context/OrganizationContext.jsx` → `orgId`, `currentOrg`, `userOrgRole`, `isBinaJayaStaff`

**Services (all org-aware):**
- `src/services/api/projectService.js` → accepts `orgId`
- `src/services/api/contractService.js` → accepts `orgId`
- `src/services/api/workEntryService.js` → accepts `orgId`

---

## 📝 DECISION LOG

**Feb 18, 2026:** Strategic Pivot → multi-client service platform  
**Feb 20, 2026:** `global_role` for platform identity, `org_members.role` for per-org  
**Feb 20, 2026:** DB trigger auto-propagates `organization_id` on INSERT  
**Feb 21, 2026:** `orgId` param pattern for services — backward compatible  
**Feb 21, 2026:** `useCallback([orgId])` pattern — clean re-fetch on org switch  
**Feb 21, 2026:** Technicians/subcontractors CAN see Projects+Contracts nav (read access for work entry creation). PermissionGuard hides write buttons. Navigation ≠ write access.  
**Feb 21, 2026:** Test users must be created via Supabase Dashboard — NOT via `INSERT INTO auth.users` + pgcrypto (GoTrue cannot verify externally-hashed passwords)

---

## 🎉 MAJOR ACHIEVEMENTS TO DATE

**Phase 1 (100%):** Database, RLS, 8 templates, layout builder, PDF generation  
**Phase 2 Weeks 5-8 (100%):**
- ✅ Multi-tenancy with org isolation
- ✅ OrganizationContext + org switcher + OrgSwitchToast
- ✅ All services and pages org-aware
- ✅ `permissions.js` — 30+ permissions, 9 roles
- ✅ `useRole()` hook — `can()` checks throughout app
- ✅ `PermissionGuard` — wraps any UI element
- ✅ `RoleBadge` — consistent role display
- ✅ Sidebar + BottomNav role-filtered
- ✅ 5 FEST ENT test users, all roles verified
- ✅ Complete role test matrix PASSED

---

## 🚀 SESSION 12 QUICK START

```bash
git add .
git commit -m "Session 11: Role system complete - all 7 roles tested and verified"
git checkout -b feature/user-management
npm run dev
```

**Test setup for Session 12 (login as org_admin to build against):**
```
festent.admin@test.com / TestPass123!
→ Can see /users in sidebar
→ Will test invite + role change flows
```

---

*Last Updated: February 21, 2026*  
*Session 11: Role System COMPLETE — All 7 roles tested and verified ✅*  
*Next: Session 12 — User Management UI*  
*Version: 2.3*
