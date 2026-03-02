# WORKLEDGER DEVELOPMENT CHECKLIST
## Complete Sequenced Development Plan (Start to Finish)

**Project:** WorkLedger — Multi-Client, Contract-Aware Work Reporting Platform
**Developer:** Eff (Solo Developer) + AI Assistant
**Business Model:** Service-Based (Bina Jaya provides reporting services to clients)
**Budget:** RM 0 (100% free-tier)
**Philosophy:** Do it right the first time

**Last Updated:** February 27, 2026
**Version:** 3.0 — Session 15 Complete

---

## 📊 PROGRESS OVERVIEW

### Summary
- **Sessions Completed:** 15
- **Phase 0 (Project Setup):** ✅ 100%
- **Phase 1 (Foundation — CRUD + Templates + Work Entries):** ✅ 100%
- **Phase 2 (Multi-Client Platform):** ✅ 95% (Approval Workflow remaining)
- **Phase 3 (Offline-First):** ⏸ Deferred

### Feature Completion

| Feature | Status |
|---------|--------|
| Authentication & Authorization | ✅ 100% |
| Organizations (CRUD) | ✅ 100% |
| Projects (CRUD) | ✅ 100% |
| Contracts (CRUD + 8 Types) | ✅ 100% |
| Templates (8 Malaysian templates) | ✅ 100% |
| Multi-Template per Contract (Junction Table) | ✅ 100% |
| Work Entries (Template-Driven Forms) | ✅ 100% |
| Report Layouts (Visual Builder) | ✅ 100% |
| Report Generation (PDF) | ✅ 80% |
| Multi-Tenancy Foundation | ✅ 100% |
| Organization Switcher (BJ Staff) | ✅ 100% |
| Role System (7 roles, RBAC) | ✅ 100% |
| Permission Guards (UI + Route) | ✅ 100% |
| User Management UI | ✅ 100% |
| Quick Entry / WhatsApp Workflow | ✅ 100% |
| Subcontractor Management (MTSB) | ✅ 100% |
| Cross-Org Work Visibility | ✅ 100% |
| Delete Ownership Guard + Audit Log | ✅ 100% |
| Dashboard Permission-Aware | ✅ 100% |
| Photo Attachments | ✅ Working |
| Approval Workflow | 🔥 Session 16 — NEXT |
| Offline-First (IndexedDB + PWA) | ⏸ Deferred |
| Client Onboarding Wizard | ⏸ Not Started |

---

## 🎯 STRATEGIC CONTEXT

**Date of Pivot:** February 18, 2026
**Decision:** Transform WorkLedger from single-tenant tool to
multi-client service platform operated by Bina Jaya Engineering.

### Three Client Scenarios

| Client | Type | Notes |
|--------|------|-------|
| FEST ENT Sdn Bhd | Fire system service company | 5 users (owner, admin, manager, technician, subcontractor) |
| Mr. Roz Air-Cond | Freelance technician | Data entered by BJ staff via WhatsApp messages |
| MTSB Maintenance | Main contractor | Internal team + subcontractors (FEST ENT) |

### Architecture Decisions (Locked)
- `global_role` on `user_profiles` → platform identity (super_admin, bina_jaya_staff)
- `org_members.role` → per-org identity (7 org roles)
- BJ staff access all orgs via **org switcher** — never via `org_members` rows
- Platform staff (super_admin, bina_jaya_staff) must NOT appear in client org member lists
- DB trigger auto-propagates `organization_id` on INSERT
- `orgId` param pattern for all services (backward compatible)
- `useCallback([orgId])` pattern for re-fetch on org switch
- Technicians/subcontractors CAN see Projects + Contracts nav (read access for work entry creation)
  PermissionGuard hides write buttons — navigation ≠ write access
- Test users MUST be created via Supabase Dashboard (not SQL INSERT — GoTrue password hashing)
- Contracts use many-to-many junction table (`contract_templates`) — not single template_id FK
- Subcontractor cross-org access via `subcontractor_relationships` table + `performing_org_id` on contracts

---

## ✅ PHASE 0: PROJECT SETUP — COMPLETE

### Session 1: Repository Structure & Configuration ✅
**Date:** January 25, 2026

- [x] package.json
- [x] .env.example
- [x] .gitignore
- [x] vite.config.js
- [x] tailwind.config.js
- [x] postcss.config.js
- [x] vercel.json
- [x] .eslintrc.cjs
- [x] LICENSE
- [x] .github/workflows/deploy.yml
- [x] README.md
- [x] docs/PROGRESS.md
- [x] SETUP_GUIDE.md
- [x] Git repository initialized + GitHub created
- [x] npm install completed
- [x] .env.local created

### Sessions 2–4: Database Foundation ✅
**Date:** January 25–27, 2026

- [x] Supabase project created (Singapore region)
- [x] 8 core tables created:
  - [x] `organizations`
  - [x] `user_profiles`
  - [x] `org_members`
  - [x] `projects`
  - [x] `contracts`
  - [x] `templates`
  - [x] `work_entries`
  - [x] `attachments`
- [x] 50+ RLS policies (all tables)
- [x] DB triggers (updated_at, organization_id auto-propagation)
- [x] 8 Malaysian contract templates seeded:
  - [x] PMC (Preventive Maintenance Contract)
  - [x] CMC (Comprehensive Maintenance Contract)
  - [x] AMC (Annual Maintenance Contract)
  - [x] SLA (Service Level Agreement)
  - [x] Corrective Maintenance
  - [x] Emergency Response
  - [x] T&M (Time & Materials)
  - [x] Construction

### Sessions 5–7: Frontend Foundation + Report Layouts ✅
**Date:** January 27–29, 2026

- [x] React 18, Tailwind CSS, React Router setup
- [x] AuthContext (login, register, logout, session restore)
- [x] ProtectedRoute component
- [x] AppLayout (Sidebar + BottomNav + Header)
- [x] Common UI components (Button, Input, Modal, Badge, LoadingSpinner)
- [x] Report Layout system (visual block-based builder)
- [x] 8 layout block types
- [x] 4-tab layout editor
- [x] Layout preview with sample data
- [x] 3 default layouts seeded

---

## ✅ PHASE 1: FOUNDATION — COMPLETE

### Session 8: Organizations & Dashboard ✅
**Date:** January 29, 2026

- [x] `organizationService.js` — full CRUD (getOrganizations, getOrganization,
      createOrganization, updateOrganization, deleteOrganization, getOrganizationsCount)
- [x] `StatsCard.jsx` — dashboard stat card component
- [x] `RecentActivity.jsx` — recent activity feed
- [x] `Dashboard.jsx` — live stats (work entries, projects, contracts, orgs)
- [x] `OrganizationList.jsx` — list + search
- [x] `NewOrganization.jsx` — create form
- [x] `OrganizationSettings.jsx` — edit form
- [x] AppLayout updated with Home icon in sidebar

**Test Data at end of Session 8:**
- 2 organisations: Bina Jaya Engineering, Effort Edutech
- 3 projects, 3 contracts

---

### Session 9: Multi-Tenancy Foundation ✅
**Date:** February 20, 2026

#### Database Migrations
- [x] **Migration 022** — `global_role` column on `user_profiles`
      (values: super_admin, bina_jaya_staff, client_user)
- [x] **Migration 023** — `organization_id` on `work_entries` + `attachments`
      + auto-propagation DB trigger
- [x] **Migration 024** — Full RLS rewrite on all 9 tables for org isolation
- [x] **Migration 025** — 5 clean test orgs created, duplicates removed:
      Bina Jaya Engineering, Effort Edutech, FEST ENT Sdn Bhd,
      Mr. Roz Air-Cond Services, MTSB Maintenance Sdn Bhd

#### Frontend
- [x] `src/context/OrganizationContext.jsx`
      — currentOrg, orgId, isBinaJayaStaff, switchOrganization, allOrgs
- [x] `src/components/organizations/OrganizationSwitcher.jsx`
      — amber dropdown for BJ staff
- [x] `src/components/layout/AppLayout.jsx` — switcher in header center
- [x] `src/App.jsx` — OrganizationProvider wraps Router

**Architecture locked:** BJ staff access orgs via switcher, NOT org_members rows.

---

### Session 10: Org Switching Wired Across Platform ✅
**Date:** February 20, 2026

- [x] `projectService.js` — getUserProjects(orgId), getProjectsCount(orgId)
- [x] `contractService.js` — getUserContracts(orgId), getContractsCount(orgId)
- [x] `workEntryService.js` — getUserWorkEntries(filters, orgId), getWorkEntriesCount(orgId)
- [x] `Dashboard.jsx` — re-fetches on org switch
- [x] `ProjectListPage.jsx` — re-fetches on org switch
- [x] `ContractListPage.jsx` — re-fetches on org switch
- [x] `WorkEntryListPage.jsx` — re-fetches on org switch
- [x] `OrgSwitchToast.jsx` — auto-fires feedback on switch
- [x] All 6 end-to-end tests passed ✅

---

### Session 11: Role System & RBAC ✅
**Date:** February 21, 2026

#### Database
- [x] **Migration 026** — Updated `org_members.role` CHECK constraint
      Roles: org_owner, org_admin, manager, technician, subcontractor, worker, client
- [x] 5 FEST ENT test users created via Supabase Dashboard:
      Fazrul (org_owner), Hafiz (org_admin), Roslan (manager),
      Amirul (technician), Khairul (subcontractor)

#### Permission Architecture
- [x] `src/constants/permissions.js`
  - [x] PLATFORM_ROLES, ORG_ROLES constants
  - [x] FIELD_WORKER_ROLES, ORG_MANAGER_ROLES groups
  - [x] PERMISSIONS matrix — 30+ permission keys, all 9 roles mapped
  - [x] NAV_* permissions for navigation filtering
  - [x] ROLE_META — labels, descriptions, badge colours
  - [x] ASSIGNABLE_ORG_ROLES constant
  - [x] getRoleMeta(role) helper function

#### Context + Hooks + Components
- [x] `OrganizationContext.jsx` updated — `userOrgRole` fetched from org_members per org
- [x] `src/hooks/useRole.js`
      — can(permission), role, globalRole, isBinaJayaStaff, isFieldWorker, loading
- [x] `src/components/auth/PermissionGuard.jsx`
      — permission / permissions props, requireAll, fallback
- [x] `src/components/auth/RoleBadge.jsx`
      — colour-coded from ROLE_META, size prop, showDescription prop
- [x] `src/components/layout/Sidebar.jsx` — role-filtered nav items
- [x] `src/components/layout/BottomNav.jsx` — role-filtered tabs

**All 7 role tests passed ✅**

---

### Session 12: User Management UI ✅
**Date:** February 21–23, 2026

#### Database
- [x] **Migration 027** — `find_user_by_email` RPC function

#### Service + Components + Pages
- [x] `src/services/api/userService.js`
  - [x] getOrgMembers(orgId) — two-step query (PostgREST PGRST200 workaround)
  - [x] updateMemberRole(orgId, userId, newRole)
  - [x] deactivateMember(orgId, userId)
  - [x] reactivateMember(orgId, userId)
  - [x] findUserByEmail(email)
  - [x] addExistingUserToOrg(orgId, userId, role)
  - [x] Platform staff filter (super_admin excluded from member lists)
- [x] `src/pages/users/UserList.jsx`
      — member table, search, role filter, Change Role + Deactivate buttons
- [x] `src/components/users/ChangeRoleModal.jsx`
      — role selector, confirmation step, cannot demote last org_owner
- [x] `src/pages/users/InviteUser.jsx`
      — email lookup + add to org, role badge preview
- [x] `src/components/auth/RouteGuard.jsx`
      — route-level permission guard
- [x] `src/router.jsx` — rewritten with guarded() helper pattern

**Bugs fixed:**
- [x] 0 members showing (RLS policy gap on org_members SELECT)
- [x] Unauthorised route access (RouteGuard missing)
- [x] 404 redirect on login (wrong default path)
- [x] PGRST200 — org_members FK points to auth.users not user_profiles
      → solved with two-step manual query merge

---

### Session 13: RBAC Button Guards + Quick Entry ✅
**Date:** February 21–22, 2026

#### Part A — RBAC Guards
- [x] PermissionGuard wired to all Create/Edit/Delete buttons:
  - [x] ProjectListPage, ProjectDetail
  - [x] ContractListPage, ContractDetail
  - [x] WorkEntryListPage, WorkEntryDetail
  - [x] TemplateList
- [x] ContractForm — template assignment during New/Edit (not ContractDetail)
- [x] ContractDetail — read-only template display
- [x] ContractCard — visual warning badge for contracts missing templates

#### Part B — Quick Entry (Mr. Roz Scenario)
- [x] `src/pages/admin/QuickEntry.jsx` — at route /admin/quick-entry
- [x] `src/utils/whatsappParser.js` — parses Malay date format, extracts fields
- [x] Org switcher prominent on Quick Entry page

#### Bugs fixed:
- [x] PermissionGuard not hiding buttons (effectiveRole was undefined)
- [x] Empty contract dropdowns (EditContract using direct Supabase blocked by RLS
      → fixed to use contractService)
- [x] Org switcher not filtering list pages (missing useOrganization wiring)
- [x] super_admin bypass added to projectService + contractService

---

### Session 14: Multi-Template per Contract ✅
**Date:** February 22–23, 2026

**Architecture Change:** Replaced single `template_id` FK on contracts with
many-to-many `contract_templates` junction table.

#### Database
- [x] Migration — `contract_templates` junction table:
      (contract_id, template_id, is_default, label, display_order)
- [x] Migration — `contract_value` + `description` columns added to contracts
- [x] CHECK constraint fixes (reporting_frequency, maintenance_cycle values)

#### Service + Components
- [x] `contractService.js` additions:
  - [x] getContractTemplates(contractId)
  - [x] addContractTemplate(contractId, templateId, label, isDefault)
  - [x] setDefaultContractTemplate(contractId, templateId)
  - [x] removeContractTemplate(contractId, templateId)
- [x] `ContractTemplateManager.jsx` — template assignment UI in ContractForm
- [x] `WorkEntryForm.jsx` — template selector dropdown per contract
- [x] Duplicate filter UI removed from WorkEntryList
- [x] Report pages — org filter wired

**Bugs fixed:**
- [x] PGRST204 on contract save (missing columns)
- [x] CHECK constraint mismatches on dropdown values
- [x] ContractDetail org property access error

---

### Session 15: Subcontractor Management (MTSB) ✅
**Date:** February 24–26, 2026

**Overview:** MTSB (main contractor) manages work performed by FEST ENT
(subcontractor). Cross-organisation work visibility with strict ownership rules.

#### Database Migrations
- [x] **Migration 028** — `org_type` column on organizations;
      `subcontractor_relationships` table; initial cross-org RLS policies
- [x] **Migration 029** — 8 RLS policies for subcontractor project/contract
      and work entry cross-org access
- [x] **Migration 029b** — `organization_id` added to contracts (was missing);
      backfill trigger; null org_id in work_entries repaired
- [x] **Migration 029c** — `contract_role` ('main'/'sub') +
      `performing_org_id` columns on contracts; backfill from relationships;
      5 new RLS policies
- [x] **Migration 029d** — `activity_logs` table (immutable audit trail);
      `work_entries` DELETE RLS ownership guard
      (MTSB cannot delete FEST ENT entries — enforced at DB level)
- [x] **Migration 029e** — `user_profiles` SELECT policy org-scoped
      (platform staff not visible in client org user lists)
- [x] **Migration 029f** — Removed super_admin / bj_staff from all
      `org_members` rows (they use org switcher, not membership rows)

#### Services
- [x] `src/services/api/subcontractorService.js`
  - [x] createRelationship(mainOrgId, subOrgId, projectId, contractId)
  - [x] getSubcontractors(orgId)
  - [x] getSubcontractorWork(relationshipId, filters)
  - [x] acceptInvitation(relationshipId)
- [x] `contractService.js` — dual-query merge (owned + performing contracts)
- [x] `workEntryService.js` updates:
  - [x] getUserWorkEntries — subcon org expansion for MTSB
  - [x] deleteWorkEntry(id, callerOrgId) — ownership guard + audit log
  - [x] createWorkEntry — accepts flat object OR 3-arg legacy call (normalised)
- [x] `userService.js` — platform staff filtered from getOrgMembers output

#### UI Components
- [x] `src/components/subcontractors/SubcontractorList.jsx`
- [x] `src/components/subcontractors/AddSubcontractorModal.jsx`
- [x] `WorkEntryListPage.jsx` — Internal / Subcontractor / All tabs
- [x] `ContractCard.jsx` — 🔵 Main badge / 🟠 Sub badge; "View only" for sub contracts
- [x] `ContractList.jsx` — currentOrgId prop pass-through
- [x] `AppLayout.jsx`:
  - [x] Amber org switcher button in header for BJ staff
  - [x] Persistent orange "Staff View — [Org Name]" banner below header
- [x] `Dashboard.jsx` — permission-aware stats cards + quick actions
      (technicians see only their relevant cards/actions)
- [x] `WorkEntryList.jsx` — pure display component (filters removed,
      all filters live in WorkEntryListPage)

**Bugs fixed:**
- [x] WorkEntryForm "no template assigned" on all entries
      (contract_templates backfill + contractService junction join fix)
- [x] FEST ENT could not see MTSB contracts/projects (4-layer RLS gap)
- [x] contracts.organization_id missing (Migration 029b)
- [x] createWorkEntry 3-arg vs flat-object signature mismatch
- [x] null org_id in work_entries (backfill trigger)
- [x] Missing `projects_select_subcontractor` RLS policy
- [x] WorkEntryListPage prop name mismatch (entries → workEntries)
- [x] No performing_org_id concept (Migration 029c)
- [x] MTSB getUserWorkEntries org filter too strict
- [x] MTSB could delete FEST ENT entries (DELETE RLS + ownership guard)
- [x] super_admin visible in FEST ENT Users page (org_members cleanup
      + userService filter — two-layer fix)
- [x] DynamicForm calling onChange inside setState updater
      (React "Cannot update a component while rendering" warning)

**Test Data (End of Session 15):**

| Org | Members |
|-----|---------|
| FEST ENT Sdn Bhd | 5 (Fazrul, Hafiz, Roslan, Amirul, Khairul) |
| MTSB Maintenance Sdn Bhd | 3 |
| Mr. Roz Air-Cond Services | 0 |
| Bina Jaya Engineering | 0 (Eff via super_admin switcher) |
| Effort Edutech | 0 |

---

## 🔥 PHASE 2 REMAINING — Session 16: Approval Workflow

**Status:** NEXT SESSION
**Priority:** 🔴 High — Last major gap before real client demo

### Database — Migration 030
- [ ] `approved_by` (UUID) column on work_entries
- [ ] `approved_at` (TIMESTAMPTZ) column on work_entries
- [ ] `rejected_by` (UUID) column on work_entries
- [ ] `rejected_at` (TIMESTAMPTZ) column on work_entries
- [ ] `approval_note` (TEXT) column on work_entries
- [ ] Extend status CHECK: draft, submitted, approved, rejected
- [ ] RLS: approved entries immutable (workers cannot edit)
- [ ] RLS: managers can only UPDATE status (not content) of submitted entries

### Service Layer
- [ ] `workEntryService.getPendingApprovals(orgId)` — all submitted entries
- [ ] `workEntryService.approveWorkEntry(entryId, note)` — approve + audit log
- [ ] `workEntryService.rejectWorkEntry(entryId, note)` — reject (note required) + audit log
- [ ] `workEntryService.resubmitWorkEntry(entryId)` — rejected → submitted again

### Components
- [ ] `src/components/workEntries/ApprovalBadge.jsx`
      — colour-coded status: draft/submitted/approved/rejected
- [ ] `src/components/workEntries/ApprovalActions.jsx`
      — Approve + Reject buttons + inline modal (managers only, submitted entries only)
- [ ] `src/components/workEntries/ApprovalHistory.jsx`
      — read-only audit: submitted by, approved/rejected by, when, note
- [ ] `src/components/workEntries/PendingApprovalList.jsx`
      — card list of submitted entries for manager review

### Pages
- [ ] `src/pages/workEntries/ApprovalsPage.jsx`
      — route: /work/approvals, guard: APPROVE_WORK_ENTRY
- [ ] `WorkEntryDetail.jsx` — add ApprovalActions + ApprovalHistory sections
- [ ] `WorkEntryCard.jsx` — add ApprovalBadge; disable Edit when approved
- [ ] `WorkEntryListPage.jsx` — add Pending Approval tab for managers

### Navigation
- [ ] `Router.jsx` — /work/approvals route guarded by APPROVE_WORK_ENTRY
- [ ] `Sidebar.jsx` — Approvals nav item with pending count badge
- [ ] `Dashboard.jsx` — "Review Approvals" quick action for managers

### Testing
- [ ] Technician submits → cannot edit after submit
- [ ] Manager sees entry in /work/approvals
- [ ] Manager approves with optional note → entry locked
- [ ] Manager rejects with required note → technician can edit + resubmit
- [ ] Technician resubmits after rejection
- [ ] Technician cannot access /work/approvals (RouteGuard blocks)
- [ ] MTSB cannot approve FEST ENT entries (only FEST ENT manager can)

---

## ⏸ PHASE 3: OFFLINE-FIRST — DEFERRED

**Status:** Deferred until Phase 2 fully complete and first paying client onboarded.

### When ready — IndexedDB Foundation
- [ ] Install Dexie.js (`npm install dexie`)
- [ ] `src/services/offline/db.js` — Dexie schema (all tables mirrored)
- [ ] IndexedDB tables: organizations, projects, contracts, templates,
      work_entries, attachments, sync_queue
- [ ] `src/services/offline/syncService.js` — push/pull sync logic
- [ ] Online/offline detection
- [ ] Sync queue for pending mutations

### When ready — Service Worker (Workbox)
- [ ] Install Workbox (`npm install workbox-webpack-plugin`)
- [ ] Cache strategies per route type
- [ ] Background sync for work entries
- [ ] Push notifications (optional)

### When ready — PWA
- [ ] PWA manifest.json
- [ ] Icons (72, 96, 128, 144, 152, 192, 384, 512px)
- [ ] "Add to Home Screen" prompt
- [ ] Offline fallback page

---

## ⏸ FUTURE — Client Onboarding Wizard

- [ ] 5-step onboarding wizard for new client orgs
- [ ] Step 1: Company info + industry
- [ ] Step 2: Template selection (PMC / CMC / SLA etc.)
- [ ] Step 3: First project
- [ ] Step 4: First contract
- [ ] Step 5: Invite first user (optional)
- [ ] Onboarding < 5 minutes per client

---

## ⏸ FUTURE — MTSB Consolidated Report

- [ ] Combined PDF report: MTSB internal + subcontractor entries
- [ ] Filter by team (internal vs specific subcontractor)
- [ ] Performance comparison section
- [ ] Export consolidated report

---

## ⏸ POST-MVP BACKLOG

- [ ] Email notifications (approvals, invites, alerts)
- [ ] SLA auto-calculations (response time, resolution time, penalty)
- [ ] Dashboard analytics (charts, trends, KPIs)
- [ ] Bulk operations (approve many, export CSV)
- [ ] Custom template builder (no-code field editor)
- [ ] Multi-language (Bahasa Malaysia, Tamil, Chinese)
- [ ] Mobile app (React Native)
- [ ] Integration with accounting systems
- [ ] White-label options
- [ ] API for third-party integrations
- [ ] Error boundaries (app hard-crashes currently)
- [ ] Advanced search & filters

---

## 📁 KEY FILES REFERENCE

### Context & Hooks
```
src/context/AuthContext.jsx
src/context/OrganizationContext.jsx
src/hooks/useRole.js
src/constants/permissions.js      ← PERMISSIONS matrix, ROLE_META
src/constants/routes.js
```

### Services
```
src/services/api/organizationService.js
src/services/api/projectService.js
src/services/api/contractService.js
src/services/api/workEntryService.js
src/services/api/templateService.js
src/services/api/userService.js
src/services/api/subcontractorService.js
src/services/api/layoutService.js
```

### Auth + Layout
```
src/components/auth/ProtectedRoute.jsx
src/components/auth/RouteGuard.jsx        ← route-level permission guard
src/components/auth/PermissionGuard.jsx   ← UI-level permission guard
src/components/auth/RoleBadge.jsx
src/components/layout/AppLayout.jsx       ← org switcher + staff banner
src/components/layout/Sidebar.jsx         ← permission-filtered nav
src/components/layout/BottomNav.jsx       ← permission-filtered tabs
```

### Database Migrations (in order)
```
001–021  Core schema + RLS + templates (Sessions 1–8)
022      global_role on user_profiles (Session 9)
023      organization_id on work_entries + attachments + trigger (Session 9)
024      Full RLS rewrite for org isolation (Session 9)
025      5 clean test orgs (Session 9)
026      org_members.role expanded to 7 roles (Session 11)
027      find_user_by_email RPC (Session 12)
028      org_type + subcontractor_relationships table (Session 15)
029      Cross-org RLS for subcontractor access (Session 15)
029b     contracts.organization_id + work_entries org_id backfill (Session 15)
029c     contract_role + performing_org_id on contracts (Session 15)
029d     activity_logs table + work_entries DELETE guard (Session 15)
029e     user_profiles RLS org-scoped (Session 15)
029f     Remove platform staff from org_members (Session 15)
030      [NEXT] Approval workflow columns + RLS (Session 16)
```

---

## 📋 TEST USERS REFERENCE

| Email | Role | Org |
|-------|------|-----|
| super_admin@test.com (Eff) | super_admin | All (via switcher) |
| fazrul.owner@test.com | org_owner | FEST ENT |
| hafiz.admin@test.com | org_admin | FEST ENT |
| roslan.manager@test.com | manager | FEST ENT |
| amirul.tech@test.com | technician | FEST ENT |
| khairul.sub@test.com | subcontractor | FEST ENT |
| mtsb.admin@test.com | org_admin | MTSB |
| (2 more MTSB users) | - | MTSB |

---

## 📊 BUSINESS MODEL

| Tier | Price | Target |
|------|-------|--------|
| Small (1-5 users) | RM 100/month | Mr. Roz |
| Medium (6-20 users) | RM 300/month | FEST ENT |
| Large (21+ users) | RM 800/month | MTSB |
| **Target** | **RM 5,000/month** | **By Month 6** |

---

## 📝 DECISION LOG

| Date | Decision |
|------|----------|
| Feb 18, 2026 | Strategic Pivot → multi-client service platform |
| Feb 20, 2026 | `global_role` for platform identity, `org_members.role` for per-org identity |
| Feb 20, 2026 | DB trigger auto-propagates `organization_id` on INSERT |
| Feb 21, 2026 | `orgId` param pattern for all services — backward compatible |
| Feb 21, 2026 | `useCallback([orgId])` pattern — clean re-fetch on org switch |
| Feb 21, 2026 | Technicians see Projects + Contracts nav (read-only). PermissionGuard hides write buttons. |
| Feb 21, 2026 | Test users via Supabase Dashboard only (GoTrue password hashing incompatibility with pgcrypto) |
| Feb 22, 2026 | contract_templates junction table (many-to-many) replaces single template_id FK |
| Feb 24, 2026 | subcontractor_relationships table (not parent_org_id) for MTSB architecture |
| Feb 24, 2026 | performing_org_id on contracts — identifies which org performs a sub contract |
| Feb 26, 2026 | Platform staff must never be in org_members — org switcher is their access method |
| Feb 26, 2026 | DynamicForm onChange must be called outside setState updater (React rule) |
| Feb 26, 2026 | createWorkEntry accepts flat object OR 3-arg (normalised in service layer) |

---

## ⚠️ KNOWN REMAINING GAPS

| Gap | Priority | Notes |
|-----|----------|-------|
| Approval workflow | 🔴 High | Session 16 — next |
| Mr. Roz has 0 members | 🟡 Medium | Add via UI before demo |
| Offline-First | 🟡 Medium | Phase 3, deferred |
| MTSB consolidated report | 🟡 Medium | Future session |
| Email notifications | 🟠 Low | No email system yet |
| Error boundaries | 🟠 Low | App hard-crashes on errors |
| Loading skeletons | 🟠 Low | Some pages flash empty state |

---

**Bismillah! 15 sessions complete. Multi-tenant, multi-role,**
**subcontractor-aware platform working end-to-end. Session 16 next! 🚀**

*Checklist Version: 3.0*
*Last Updated: February 27, 2026*
*WorkLedger — Multi-Client Work Reporting Platform*
