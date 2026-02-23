# WORKLEDGER DEVELOPMENT CHECKLIST
## Complete Sequenced Development Plan (Start to Finish)

**Project:** WorkLedger - Multi-Client Work Reporting Service Platform  
**Developer:** Eff (Solo Developer) + AI Assistant  
**Business Model:** Service-Based (Bina Jaya provides reporting services)  
**Budget:** RM 0 (100% free-tier)  
**Philosophy:** Do it right the first time  

**Last Updated:** February 23, 2026  
**Version:** 3.1 — Sessions 12–14 + Route Security + userService PGRST200 Fix

---

## 📊 PROGRESS OVERVIEW

### Summary
- **Total Sessions Completed:** 14 + ongoing bug-fix session (Feb 23)
- **Phase 1 Status:** 100% ✅
- **Phase 2 (Multi-Client) Status:** ~85% 🔄
- **Immediate Blocker:** Deploy `FIX_org_members_rls.sql` → then FEST ENT is 100%

### Phase Progress
- **Phase 0 (Project Setup):** 100% ✅
- **Phase 1 (Foundation):** 100% ✅
- **Phase 2 (Multi-Client Platform):** 85% 🔄
- **Phase 3 (Offline-First):** 0% — Deferred

### Feature Completion
| Feature | Status |
|---|---|
| Authentication & Authorization | ✅ 100% |
| Organizations | ✅ 100% |
| Multi-Tenancy Foundation | ✅ 100% |
| Organization Switcher + Context | ✅ 100% |
| Service/Page Org Wiring | ✅ 100% |
| Permission System (useRole + PermissionGuard) | ✅ 100% |
| Role-Filtered Navigation (Sidebar + BottomNav) | ✅ 100% |
| Route-Level Security (RouteGuard — ALL routes) | ✅ 100% |
| FEST ENT Test Users (5 roles) | ✅ 100% |
| Projects | ✅ 100% |
| Contracts | ✅ 100% |
| Templates (8 Malaysian templates) | ✅ 100% |
| Work Entries | ✅ 100% |
| Report Layouts | ✅ 100% |
| Report Generation | ✅ 90% |
| Multi-Template per Contract (junction table) | ✅ 100% |
| Button Guards (PermissionGuard on all CRUD) | ✅ 100% |
| User Management UI (UserList, ChangeRoleModal, InviteUser) | ✅ 100% (code complete) |
| Quick Entry + WhatsApp Parser | ✅ 100% |
| userService PGRST200 fix (two-step query) | ✅ 100% |
| **org_members RLS tiered policies** | 🔴 **PENDING DEPLOYMENT** |

---

## 🎯 STRATEGIC CONTEXT

**Business Scenarios:**
1. **FEST ENT** — Fire system service company (4 technicians + admin + owner)
2. **MR. ROZ** — Freelance air-cond technician (solo, data via WhatsApp)
3. **MTSB** — Main contractor (internal + subcontractors)

### Scenario Readiness
| Scenario | Status | Blocking |
|---|---|---|
| FEST ENT | 95% | Deploy `FIX_org_members_rls.sql` |
| Mr. Roz | 90% | End-to-end test with real WhatsApp data |
| MTSB | 10% | Subcontractor relationships (future) |

---

## 📅 COMPLETED SESSIONS

---

## SESSIONS 1–5: Foundation & Database ✅
- [x] 8 core tables, RLS policies, 8 Malaysian contract templates

## SESSIONS 6–7: Report Layouts ✅
- [x] Layout system, template-layout automation, 3 default layouts

## SESSION 8: Layout Builder ✅
- [x] Visual block-based builder, 8 block types, 4-tab editor, preview

## SESSION 8B: Multi-Client Strategy ✅
- [x] 5-Phase roadmap, business model, revenue projections

---

## SESSION 9: Multi-Tenancy Foundation ✅

### 9.1 Database Migrations
- [x] Migration 022: `global_role` column on `user_profiles`
- [x] Migration 023: `organization_id` on `work_entries` + `attachments` + auto triggers
- [x] Migration 024: RLS policies on all 9 tables
- [x] Migration 025: Test orgs created + duplicate cleanup (5 clean orgs)

### 9.2 Frontend Files
- [x] `src/context/OrganizationContext.jsx` — org switching + localStorage
- [x] `src/components/organizations/OrganizationSwitcher.jsx` — amber dropdown
- [x] `src/components/layout/AppLayout.jsx` — switcher in header center
- [x] `src/App.jsx` — OrganizationProvider wrapping Router

---

## SESSION 10: Organization Switcher Wiring ✅

### 10.1 Services Updated (orgId param)
- [x] `src/services/api/projectService.js` — `getUserProjects(orgId)`, `getProjectsCount(orgId)`
- [x] `src/services/api/contractService.js` — `getUserContracts(orgId)`, `getContractsCount(orgId)`
- [x] `src/services/api/workEntryService.js` — `getUserWorkEntries(filters, orgId)`, `getWorkEntriesCount(orgId)`

### 10.2 Pages Updated
- [x] `src/pages/Dashboard.jsx`
- [x] `src/pages/projects/ProjectListPage.jsx`
- [x] `src/pages/contracts/ContractListPage.jsx`
- [x] `src/pages/workEntries/WorkEntryListPage.jsx`

### 10.3 Org Switch Toast
- [x] `src/components/organizations/OrgSwitchToast.jsx`

---

## SESSION 11: Role System Foundation ✅

### 11.1 Database
- [x] Migration 026: Updated `org_members.role` CHECK constraint
  - Added: `org_owner`, `technician`, `subcontractor`
  - Kept: `org_admin`, `manager`, `worker`, `client`
- [x] 5 FEST ENT test users created via Supabase Dashboard
  - **Key lesson:** Must use Dashboard — NOT `INSERT INTO auth.users` + pgcrypto (GoTrue cannot verify externally-hashed passwords)

### 11.2 Permission Architecture
- [x] `src/constants/permissions.js`
  - [x] `PERMISSIONS` matrix — 30+ permissions, all 9 roles mapped
  - [x] `NAV_*` permissions for navigation filtering
  - [x] `ROLE_META` — labels, descriptions, badge colours for all 9 roles
  - [x] `ASSIGNABLE_ORG_ROLES` — roles that org_admin can assign (not platform roles)
  - [x] `getRoleMeta(role)` helper

### 11.3 OrganizationContext Updated
- [x] `userOrgRole` — fetched from `org_members` per active org
- [x] BJ staff: `userOrgRole` = their `global_role`
- [x] `fetchUserOrgRole()` re-runs when `currentOrg` changes

### 11.4 React Hooks & Components
- [x] `src/hooks/useRole.js` — `can()`, `role`, `globalRole`, `isBinaJayaStaff`, `loading`
- [x] `src/components/auth/PermissionGuard.jsx` — `permission`, `permissions`, `requireAll`, `fallback` props
- [x] `src/components/auth/RoleBadge.jsx` — colour-coded badge from ROLE_META

### 11.5 Role-Filtered Navigation
- [x] `src/components/layout/Sidebar.jsx` — filters `allNavItems` by `can(item.permission)`
- [x] `src/components/layout/BottomNav.jsx` — same pattern, max 5 tabs

### 11.6 All 7 Role Tests PASSED ✅
```
Role            | Nav items visible
────────────────|────────────────────────────────────────────────
super_admin     | All 9
bina_jaya_staff | All 9
org_owner       | All 9
org_admin       | All 9
manager         | 6 (no Layouts, no Orgs, no Users)
technician      | 4 (Dashboard + Work + Projects + Contracts)
subcontractor   | 4 (same as technician)
```

---

## SESSION 12: User Management UI ✅ (Code Complete)

### 12.1 Database
- [x] Migration 027: `find_user_by_email(p_email)` RPC function
  - Queries `auth.users` for email (not directly accessible via anon key)
  - Returns matching `id` + `full_name` from `user_profiles`

### 12.2 userService — `src/services/api/userService.js` ✅
- [x] `getOrgMembers(orgId)` — **two-step query** (see architecture note below)
- [x] `getActiveMemberCount(orgId)`
- [x] `getOwnerCount(orgId)` — for last-owner guard
- [x] `updateMemberRole(orgId, memberId, newRole)` — last-owner guard enforced
- [x] `deactivateMember(orgId, memberId)` — soft delete (is_active = false), last-owner guard
- [x] `reactivateMember(orgId, memberId)`
- [x] `findUserByEmail(email)` — calls `find_user_by_email` RPC
- [x] `checkExistingMembership(orgId, userId)`
- [x] `addExistingUserToOrg(orgId, userId, role)` — reactivates inactive membership if exists

**Architecture Note — Two-Step Query:**
```
❌ BROKEN (PGRST200): .select('user:user_profiles(id, full_name...)')
   Reason: org_members.user_id is FK to auth.users (cross-schema)
   PostgREST cannot traverse FKs outside public schema

✅ FIXED: Step 1: fetch org_members rows
           Step 2: fetch user_profiles where id IN (user_ids)
           Step 3: merge in JS with profileMap[m.user_id]
```

### 12.3 UserList Page — `src/pages/users/UserList.jsx` ✅
- [x] Route: `/users` (guarded by `NAV_USERS`)
- [x] Table: avatar, name, phone_number (not email — not in user_profiles), role badge, status badge, joined date
- [x] Live search by name/phone
- [x] Status tabs: Active / Inactive / All
- [x] Role filter dropdown
- [x] "Change Role" button — `PermissionGuard` on `CHANGE_USER_ROLES`
- [x] "Deactivate / Reactivate" — `PermissionGuard` on `MANAGE_ORG_USERS`
- [x] "Invite User" button — `PermissionGuard` on `INVITE_USERS`
- [x] Optimistic UI update after role change
- [x] `useCallback([currentOrg?.id])` — auto-refreshes on org switch
- [x] Empty state with CTA

### 12.4 ChangeRoleModal — `src/components/users/ChangeRoleModal.jsx` ✅
- [x] Two-step flow: role selector → confirmation screen
- [x] Radio buttons showing `ROLE_META` descriptions
- [x] Cannot demote last `org_owner` — error banner blocks Save
- [x] Only shows `ASSIGNABLE_ORG_ROLES` (filters out super_admin, bina_jaya_staff)
- [x] `onSuccess(memberId, newRole)` callback — parent updates optimistically

### 12.5 InviteUser — `src/pages/users/InviteUser.jsx` ✅
- [x] Route: `/users/invite` (guarded by `INVITE_USERS`)
- [x] Four-state machine: Form → Loading → Found/NotFound → Success
- [x] **Path A (email found):** confirm name + role → add to org_members
- [x] **Path B (email not found):** show signup URL + copy button
  - Zero-budget design: no email sending needed
  - Staff shares link via WhatsApp to new member
- [x] Role badge preview updates live as role is selected

### 12.6 Module Resolution Fix
```
ASSIGNABLE_ORG_ROLES lives in permissions.js (single source of truth)
userService re-exports it for backward compatibility
Both ChangeRoleModal and userService import from permissions.js

Why: Vite module resolution race caused "no export named ASSIGNABLE_ORG_ROLES"
     when it was defined in userService and imported simultaneously by ChangeRoleModal
```

---

## SESSION 13: Button Guards + Quick Entry ✅

### 13.1 Button Guards (PermissionGuard on all CRUD)
- [x] `src/pages/projects/ProjectListPage.jsx` — "New Project" guarded by `CREATE_PROJECT`
- [x] `src/pages/projects/ProjectDetail.jsx` — Edit / Delete guarded
- [x] `src/pages/contracts/ContractListPage.jsx` — "New Contract" guarded by `CREATE_CONTRACT`
- [x] `src/pages/contracts/ContractDetail.jsx` — Edit / Delete guarded
- [x] `src/pages/workEntries/WorkEntryListPage.jsx` — "New Entry" guarded by `CREATE_WORK_ENTRY`
- [x] `src/components/workEntries/WorkEntryCard.jsx` — Edit / Delete use `useRole().can()` directly

### 13.2 Quick Entry — `src/pages/admin/QuickEntry.jsx` ✅
- [x] Route: `/admin/quick-entry` — `NAV_QUICK_ENTRY` (BJ staff + super_admin only)
- [x] WhatsApp paste area + "Parse Message" button
- [x] Parse confidence badge (high / medium / low) + warnings shown inline
- [x] Org selector (only shown for BJ staff with multiple orgs)
- [x] Contract selector — filtered to org, auto-selects first active
- [x] Template selector — auto-matched by contract category
- [x] Date picker — defaults to yesterday
- [x] Fields: Location, Equipment Type, Description, Remarks
- [x] "Save Draft" + "Save & Submit" buttons
- [x] Success screen with "Add Another" shortcut
- [x] Access denied screen for non-BJ-staff who reach the URL

### 13.3 WhatsApp Parser — `src/utils/whatsappParser.js` ✅
- [x] `parseWhatsAppMessage(rawText)` — main export
- [x] Malay day names: Isnin, Selasa, Rabu, Khamis, Jumaat, Sabtu, Ahad
- [x] Malay month names: Jan, Feb, Mac, Apr, Mei, Jun, Jul, Ogo, Sep, Okt, Nov, Dis
- [x] Date formats: "Jumaat, 20 Feb 2026" / "20/2/26" / "20-02-2026" / "20 Feb" (assumes current year)
- [x] Location extraction: detects "Unit", "No.", "Lot", "Blok", unit-number patterns
- [x] Equipment extraction: aircond, pump, chiller, lift, generator, water heater, paip...
- [x] Problem keyword detection: bocor, leak, rosak, trip, compressor, tersumbat...
- [x] Confidence scoring: high / medium / low
- [x] Warnings array for fields needing manual verification
- [x] `toWorkEntryData(parsed, overrides)` — maps parsed result to work entry JSONB

### 13.4 Permissions + Navigation
- [x] `NAV_QUICK_ENTRY: ['super_admin', 'bina_jaya_staff']` added to permissions.js
- [x] Quick Entry nav item added to Sidebar with 📱 icon

### 13.5 Org Filter Fixes
- [x] `src/pages/workEntries/WorkEntryListPage.jsx` — `useOrganization()` wired
- [x] `src/pages/reports/ReportHistory.jsx` — org filter applied
- [x] `src/pages/reports/GenerateReport.jsx` — org filter applied + encoding fixed
- [x] `src/pages/workEntries/WorkEntryForm.jsx` (NewWorkEntry + EditWorkEntry) — org filter applied

---

## SESSION 14: Multi-Template Architecture ✅

### 14.1 Database
- [x] `contract_templates` junction table
  ```sql
  contract_id  UUID → contracts.id (ON DELETE CASCADE)
  template_id  UUID → templates.id
  is_default   BOOLEAN DEFAULT false
  sort_order   INTEGER DEFAULT 0
  label        TEXT            -- override display name per contract
  assigned_by  UUID → user_profiles.id
  assigned_at  TIMESTAMPTZ DEFAULT now()
  ```
- [x] RLS policies on `contract_templates`
- [x] `contracts.template_id` single FK removed (backward compat preserved during migration)

### 14.2 Service Layer
- [x] `src/services/api/contractService.js`
  - [x] `getContractWithTemplates(contractId)` — fetches contract + junction rows
  - [x] `assignTemplatesToContract(contractId, templateAssignments)` — replaces all assignments atomically
  - [x] `getUserContracts(orgId)` — includes `contract_templates` in select
- [x] `src/services/api/templateService.js`
  - [x] `getContractsUsingTemplate(templateId)` — fixed to query junction table (was using old `template_id` FK)

### 14.3 Contract UI
- [x] `src/components/contracts/ContractForm.jsx`
  - [x] Multi-template selector (checkbox list)
  - [x] `is_default` toggle per template
  - [x] Template assignment during create/edit (not a separate step)
  - [x] Fallback: contract saves OK even with no templates assigned (warning shown)
- [x] `src/pages/contracts/NewContract.jsx` — uses updated ContractForm
- [x] `src/pages/contracts/EditContract.jsx` — uses updated ContractForm
- [x] `src/pages/contracts/ContractDetail.jsx`
  - [x] Read-only template list
  - [x] Warning banner if no templates assigned
- [x] `src/components/contracts/ContractList.jsx` — updated for junction table
- [x] `src/components/contracts/ContractCard.jsx`
  - [x] Template count badge
  - [x] ⚠️ indicator if no templates assigned

### 14.4 Work Entry + Report Fixes
- [x] `src/pages/workEntries/WorkEntryForm.jsx`
  - [x] Template dropdown loaded via `contract_templates` junction (not `contracts.template_id`)
- [x] `src/components/reports/ReportGenerator.jsx`
  - [x] Fetches templates via junction table
  - [x] Encoding issue fixed (GenerateReport page)

---

## FEB 23: Route Security + userService Bug Fixes ✅

### Route Security (RouteGuard)
- [x] `src/components/auth/RouteGuard.jsx` — NEW file
  - Checks `can(permission)` before rendering page
  - If denied → `<Navigate to="/" replace />`
  - Shows `LoadingSpinner` while `useRole()` loads (prevents premature redirect)
  - **Critical:** `redirectTo='/'` not `'/dashboard'` (ROUTES.DASHBOARD is `'/'`)

- [x] `src/Router.jsx` — full rewrite
  - `guarded(permission, Page)` helper applies ProtectedRoute + RouteGuard to every route
  - **All 25+ routes now protected at route level** (previously only protected via sidebar hiding)
  - `/admin/quick-entry` route restored (was accidentally dropped in rewrite)
  
  **Access Control Matrix (enforced at route level):**
  | Role | Dashboard | Work/Projects/Contracts | Templates/Reports | Layouts | Orgs | Users | Quick Entry |
  |---|---|---|---|---|---|---|---|
  | technician | ✅ | ✅ | 🔴 → / | 🔴 → / | 🔴 → / | 🔴 → / | 🔴 → / |
  | manager | ✅ | ✅ | ✅ | 🔴 → / | 🔴 → / | 🔴 → / | 🔴 → / |
  | org_admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🔴 → / |
  | bina_jaya_staff | ✅ | ✅ | ✅ | ✅ | ✅ | 🔴 → / | ✅ |
  | super_admin | ✅ ALL (bypasses all checks) |

### Bugs Fixed
- [x] **Blank page after login** — removed self-referencing redirect `{ path: '/', element: <Navigate to={ROUTES.DASHBOARD} /> }`. `ROUTES.DASHBOARD = '/'`, so it caused an infinite redirect loop.
- [x] **404 on page refresh** — RouteGuard was redirecting denied users to `'/dashboard'` (non-existent route). Fixed to `'/'`.
- [x] **0 members in UserList** — root cause: org_members RLS SELECT policy was `user_id = auth.uid()` (each user sees only their own row). SQL fix written: `FIX_org_members_rls.sql`
- [x] **PGRST200 in getOrgMembers** — `user:user_profiles(...)` join fails because `org_members.user_id` FK is to `auth.users` (outside `public` schema). Fixed to two-step query.
- [x] **email not in user_profiles** — `email` lives in `auth.users` only, not accessible via RLS. `UserList.jsx` updated to show `phone_number` as secondary identifier.

### ⚠️ PENDING DEPLOYMENT
```
Run FIX_org_members_rls.sql in Supabase SQL Editor

This SQL:
  - Drops the single "own row only" SELECT policy on org_members
  - Creates 3 tiered SELECT policies:
      1. org_members_select_own     → user sees own row (all roles)
      2. org_members_select_managers → org_owner/org_admin see all rows in their org
      3. org_members_select_bj_staff → super_admin/bina_jaya_staff see everything
  - Creates UPDATE policy: org_owner/org_admin can change roles in their org
  - Creates INSERT policy: org_owner/org_admin can add members to their org

Without this: UserList always shows 0 members ← CURRENT BLOCKER
```

---

## 🧪 NEXT: FEST ENT END-TO-END TEST

**Step 1 (5 min):** Run `FIX_org_members_rls.sql` in Supabase  
**Step 2 (20 min):** Run test matrix below

```
Login: festent.admin@test.com (org_admin)
✅ Sidebar shows 9 items (including Users)
✅ /users shows all 5 FEST ENT members with names + role badges
✅ Change role: technician → worker → back to technician
✅ Cannot demote last org_owner (error banner appears)
✅ Deactivate member → moves to Inactive tab
✅ Reactivate → back to Active tab
✅ Invite known email → Path A (confirm + add to org)
✅ Invite unknown email → Path B (signup link + copy button)

Login: festent.tech@test.com (technician)
✅ Sidebar shows 4 items (Dashboard, Work, Projects, Contracts)
✅ Type /templates → redirected to /
✅ Type /reports → redirected to /
✅ Type /users → redirected to /
✅ Type /admin/quick-entry → redirected to /
✅ Projects page: no "New Project" button
✅ ContractDetail: no Edit or Delete buttons
✅ WorkEntryCard: no Edit/Delete on other users' entries

Login: effort.edutech@gmail.com (super_admin / BJ staff)
✅ Quick Entry in sidebar
✅ /admin/quick-entry loads
✅ Paste: "Jumaat, 21 Feb 2026\nUnit 12A Sri Damansara\nAircond bocor"
✅ entry_date = 2026-02-21 (high confidence)
✅ location = "Unit 12A Sri Damansara"
✅ equipment = air_conditioner
✅ Select contract → template auto-matches
✅ Save & Submit → success screen
```

---

## UPCOMING SESSIONS

### SESSION 15: MTSB Subcontractor Relationships
- [ ] Migration: `parent_org_id` on `organizations`
- [ ] Link MTSB subcontractor orgs to MTSB as parent
- [ ] MTSB consolidated dashboard: own + subcontractor entries in one view
- [ ] Filter: Internal / Subcontractor / All

### SESSION 16: Client Onboarding Wizard
- [ ] 5-step wizard: org → template → project → contract → invite user
- [ ] Target: new client fully onboarded in < 5 minutes

### DEFERRED (Post Phase 2)
- **Approval Workflow** — draft → submitted → approved/rejected with notifications
- **Phase 3 Offline-First** — IndexedDB (Dexie.js), Service Worker (Workbox), background sync

---

## 📚 KEY FILES REFERENCE

### Security Layer
- `src/components/auth/RouteGuard.jsx` → **route-level** permission (redirects)
- `src/components/auth/PermissionGuard.jsx` → **element-level** permission (hides/shows)
- `src/Router.jsx` → all routes use `guarded(permission, Page)` helper

### Permission System
- `src/constants/permissions.js` → PERMISSIONS matrix, ROLE_META, ASSIGNABLE_ORG_ROLES
- `src/hooks/useRole.js` → `can()`, `role`, `isBinaJayaStaff`, `loading`

### Context Providers
- `src/context/AuthContext.jsx` → `user`, `profile`, `profile.global_role`
- `src/context/OrganizationContext.jsx` → `orgId`, `currentOrg`, `userOrgRole`, `isBinaJayaStaff`, `allOrgs`

### User Management
- `src/services/api/userService.js` → two-step query pattern (see Session 12 note)
- `src/pages/users/UserList.jsx` → team management page
- `src/components/users/ChangeRoleModal.jsx` → role change with last-owner guard
- `src/pages/users/InviteUser.jsx` → zero-budget invite (signup link via WhatsApp)

### Quick Entry (Mr. Roz)
- `src/pages/admin/QuickEntry.jsx` → BJ staff only, < 30 second entry
- `src/utils/whatsappParser.js` → Malay date/location/equipment extraction

### Multi-Template (Session 14)
- `contract_templates` junction table → many templates per contract
- `src/services/api/contractService.js` → `getContractWithTemplates()`, `assignTemplatesToContract()`
- `src/components/contracts/ContractForm.jsx` → template assignment in form

---

## 📝 DECISION LOG

| Date | Decision |
|---|---|
| Feb 18 | Strategic Pivot → multi-client service platform |
| Feb 20 | `global_role` for platform identity, `org_members.role` for per-org |
| Feb 20 | DB trigger auto-propagates `organization_id` on INSERT |
| Feb 21 | `orgId` param pattern for services — backward compatible |
| Feb 21 | `useCallback([orgId])` pattern — clean re-fetch on org switch |
| Feb 21 | Technicians CAN see Projects+Contracts nav (read access for work entry selection). PermissionGuard hides write buttons. Navigation ≠ write access. |
| Feb 21 | Test users must be created via Supabase Dashboard — NOT via SQL INSERT (GoTrue cannot verify pgcrypto-hashed passwords) |
| Feb 21 | `ASSIGNABLE_ORG_ROLES` lives in `permissions.js` (single source of truth). userService re-exports. Prevents Vite circular module race. |
| Feb 22 | Many-to-many contract-template via junction table. Template assigned during New/Edit Contract. ContractDetail = read-only view. |
| Feb 23 | RouteGuard: `redirectTo='/'` not `'/dashboard'` — ROUTES.DASHBOARD = '/' |
| Feb 23 | `getOrgMembers` two-step query — `org_members.user_id` FK to `auth.users` (cross-schema). PostgREST PGRST200 on direct join. |
| Feb 23 | `user_profiles` has no `email` column — lives in `auth.users` only. UserList shows `phone_number` as secondary identifier. |

---

## 🎉 MAJOR ACHIEVEMENTS TO DATE

**Phase 1 (100%):** Database, RLS, 8 templates, layout builder, PDF generation

**Phase 2 (85%):**
- ✅ Multi-tenancy with complete org isolation
- ✅ OrganizationContext + switcher + toast + all pages/services wired
- ✅ 7-role permission system (`useRole`, `PermissionGuard`, `RoleBadge`)
- ✅ Role-filtered navigation (Sidebar + BottomNav)
- ✅ Route-level security — RouteGuard on all 25+ routes
- ✅ Many-to-many contract-template junction architecture
- ✅ User Management UI (UserList, ChangeRoleModal, InviteUser)
- ✅ Quick Entry with full Malay WhatsApp parser
- ✅ Button guards on all CRUD operations across all pages
- ✅ Org filter working across all pages, reports, work entry form
- 🔴 **One SQL file from 100%:** `FIX_org_members_rls.sql`

---

*Last Updated: February 23, 2026*
*Version: 3.1 — Sessions 12–14 + Route Security + PGRST200 Fix*
*Next: Deploy FIX_org_members_rls.sql → FEST ENT 100% complete*
