# WORKLEDGER DEVELOPMENT CHECKLIST
## Complete Sequenced Development Plan (Start to Finish)

**Project:** WorkLedger — Multi-Client, Contract-Aware Work Reporting Platform
**Developer:** Eff (Solo Developer) + AI Assistant
**Business Model:** Service-Based (Bina Jaya provides reporting services to clients)
**Budget:** RM 0 (100% free-tier)
**Philosophy:** Do it right the first time

**Last Updated:** March 1, 2026
**Version:** 4.0 — Session 16 Complete

---

## 📊 PROGRESS OVERVIEW

### Summary
- **Sessions Completed:** 16
- **Phase 0 (Project Setup):** ✅ 100%
- **Phase 1 (Foundation — CRUD + Templates + Work Entries):** ✅ 100%
- **Phase 2 (Multi-Client Platform):** ✅ 100% 🎉
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
| **Approval Workflow** | ✅ **100% — Session 16 DONE** |
| reject_entry_history (Training Audit) | ✅ 100% |
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
- `created_by` references `auth.users` (different schema) — PostgREST cannot join across schemas
  → Always select as plain UUID in list queries; resolve name via user_profiles separately
- `reject_entry_history` is append-only — no UPDATE/DELETE policies (permanent audit)
- `resubmitWorkEntry` must NOT clear `rejected_at/rejected_by/rejection_reason` — needed for timeline
- Route ordering: literal paths (/work/new, /work/approvals) MUST precede /work/:id in Router.jsx

---

## ✅ PHASE 0: PROJECT SETUP — COMPLETE

### Session 1: Repository Structure & Configuration ✅
**Date:** January 25, 2026

- [x] package.json, .env.example, .gitignore, vite.config.js
- [x] tailwind.config.js, postcss.config.js, vercel.json, .eslintrc.cjs
- [x] LICENSE, README.md, docs/PROGRESS.md, SETUP_GUIDE.md
- [x] .github/workflows/deploy.yml
- [x] Git repository initialized + GitHub created
- [x] npm install completed, .env.local created

### Sessions 2–4: Database Foundation ✅
**Date:** January 25–27, 2026

- [x] Supabase project created (Singapore region)
- [x] 8 core tables created
- [x] 50+ RLS policies
- [x] DB triggers (updated_at, organization_id auto-propagation)
- [x] 8 Malaysian contract templates seeded

### Sessions 5–7: Frontend Foundation + Report Layouts ✅
**Date:** January 27–29, 2026

- [x] React 18, Tailwind CSS, React Router setup
- [x] AuthContext, ProtectedRoute, AppLayout
- [x] Common UI components
- [x] Report Layout system (visual block-based builder)
- [x] 4-tab layout editor, layout preview, 3 default layouts seeded

---

## ✅ PHASE 1: FOUNDATION — COMPLETE

### Session 8: Organizations & Dashboard ✅
### Session 9: Multi-Tenancy Foundation ✅
### Session 10: Org Switching Wired Across Platform ✅
### Session 11: RBAC + Role System ✅
### Session 12: User Management UI ✅
### Session 13: Work Entry Forms + DynamicForm ✅
### Session 14: Report Generation + PDF ✅
### Session 15: Subcontractor Management (MTSB) ✅

*[Full detail for Sessions 8–15 preserved — see v3.0 checklist]*

---

## ✅ PHASE 2: MULTI-CLIENT PLATFORM — COMPLETE

### Session 16: Approval Workflow ✅
**Date:** March 1, 2026

#### Database
- [x] **Migration 030** — Approval columns on `work_entries`:
      `submitted_at`, `submitted_by`, `approved_at`, `approved_by`,
      `approval_remarks`, `rejected_at`, `rejected_by`, `rejection_reason`
- [x] **Migration 031** — `reject_entry_history` table (new — permanent audit log):
      `work_entry_id`, `organization_id`, `contract_id`, `template_id`,
      `entry_date`, `entry_created_by`, `rejected_by`, `rejected_at`,
      `rejection_reason`, `rejection_count`, `entry_data_snapshot` (JSONB),
      `created_at`
      — Append-only (no UPDATE/DELETE RLS policies)
      — 5 indexes: org/date, work_entry, rejected_by, technician, contract

#### Service Layer
- [x] `workEntryService.getPendingApprovals(orgId, countOnly)` — submitted entries list
      + cheap countOnly=true variant for Sidebar badge (head:true query)
- [x] `workEntryService.approveWorkEntry(entryId, remarks)` — approve + concurrency guard
      + audit log to activity_logs
- [x] `workEntryService.rejectWorkEntry(entryId, reason)` — reject (reason required)
      + writes to BOTH `work_entries` AND `reject_entry_history`
      + calculates rejection_count (1st, 2nd, 3rd rejection of same entry)
      + snapshots entry_data at time of rejection
- [x] `workEntryService.resubmitWorkEntry(entryId)` — rejected → submitted
      + removed created_by guard (org members can resubmit on behalf)
      + does NOT clear rejected_* fields (kept for timeline audit trail)

#### Components
- [x] `src/components/workEntries/ApprovalBadge.jsx`
      — colour-coded + animated pulse for submitted
- [x] `src/components/workEntries/ApprovalActions.jsx`
      — Approve + Reject inline with confirm modal, rejection reason required
- [x] `src/components/workEntries/ApprovalHistory.jsx`
      — Chronological timeline: Created → Rejected → Resubmitted → Approved
      — "Resubmitted for Review" label (orange) when rejected_at < submitted_at
      — Events sorted by actual timestamp (not insertion order)
- [x] `src/components/workEntries/PendingApprovalList.jsx`
      — card list for manager review queue

#### Pages
- [x] `src/pages/workEntries/ApprovalsPage.jsx`
      — route: /work/approvals, guard: APPROVE_WORK_ENTRY
- [x] `WorkEntryDetail.jsx` — ApprovalActions + ApprovalHistory + isOwnOrgEntry guard
      (MTSB managers cannot approve FEST ENT entries)
- [x] `WorkEntryCard.jsx` — ApprovalBadge inline with date (not justify-between)
      Edit hidden for submitted/approved; rejection reason snippet for rejected
- [x] `WorkEntryListPage.jsx` — Pending Approval tab for managers
- [x] `EditWorkEntry.jsx` — two modes: draft (Save Changes) / rejected (Save & Resubmit)
      Rejection reason shown as banner at top of edit form
- [x] `DynamicForm.jsx` — initialData sync useEffect (fixes blank form on edit)

#### Navigation
- [x] `Router.jsx` — /work/approvals before /work/:id (literal before param — critical)
- [x] `Sidebar.jsx` — Approvals nav item with live pending count badge (30s refresh)
- [x] `Dashboard.jsx` — "Review Approvals" quick action with count badge for managers
- [x] `routes.js` — WORK_ENTRY_APPROVALS constant added

#### Bugs Fixed in Session 16
- [x] `getPendingApprovals` — removed cross-schema join (auth.users → PostgREST 400)
- [x] `DynamicForm` — useState(initialData) doesn't sync after mount → useEffect fix
- [x] `resubmitWorkEntry` — created_by guard too strict → 406 for org members
- [x] `WorkEntryList` — isOwnEntry calculated but never passed to WorkEntryCard
- [x] `WorkEntryDetail` — ApprovalActions shown to wrong org managers
- [x] `WorkEntryCard` — ApprovalBadge floating opposite corner → now inline with date
- [x] super_admin org membership — Effort Edutech org_member row inserted

#### Testing — All 7 Tests Passed ✅
- [x] Test 1: Technician submits → status = submitted, cannot edit after submit
- [x] Test 2: Manager sees entry in /work/approvals + Sidebar badge count
- [x] Test 3: Manager approves with optional note → entry locked (immutable)
- [x] Test 4: Manager rejects with required note → rejected status, reason visible
- [x] Test 5: Technician edits rejected entry → Save & Resubmit in one action
- [x] Test 6: Full approval history timeline (Created → Rejected → Resubmitted → Approved)
- [x] Test 7: MTSB cannot Edit/Delete/Approve FEST ENT entries (org isolation enforced)

---

## 🔥 SESSION 17: NEXT — Reporting & PDF Enhancement

**Status:** Ready to start
**Priority:** High — clients need professional printable reports

### 17A: Report Generation Improvements
- [ ] Fix report generation to include approval status on each entry
- [ ] Add approval stamps (Approved by + date) in PDF output
- [ ] Filter: generate report for approved entries only
- [ ] Filter: generate report by date range
- [ ] Filter: generate report by status (draft/submitted/approved)

### 17B: MTSB Consolidated Report
- [ ] Combined PDF: MTSB internal entries + FEST ENT subcontractor entries
- [ ] Section headers per org (MTSB Internal / FEST ENT Subcontractor)
- [ ] Summary table: total entries per org, approval rate
- [ ] Filter by team (internal vs specific subcontractor)

### 17C: Rejection Analytics Page (Admin)
- [ ] New route: /reports/rejections (APPROVE_WORK_ENTRY permission)
- [ ] Query `reject_entry_history` table
- [ ] Show: most rejected technicians (training focus)
- [ ] Show: most common rejection reasons (template improvement)
- [ ] Show: entries rejected more than once
- [ ] Date range filter (last 30 days / 90 days / custom)

### 17D: Error Boundaries
- [ ] `src/components/common/ErrorBoundary.jsx`
- [ ] Wrap AppLayout, all major pages
- [ ] Friendly error UI (not blank white screen)

### 17E: Loading Skeletons (optional, if time)
- [ ] Skeleton cards for WorkEntryList
- [ ] Skeleton rows for ApprovalsPage
- [ ] Prevents empty state flash on load

---

## ⏸ PHASE 3: OFFLINE-FIRST — DEFERRED

**Status:** Deferred until Phase 2 fully complete and first paying client onboarded.

### When ready — IndexedDB Foundation
- [ ] Install Dexie.js
- [ ] `src/services/offline/db.js` — Dexie schema (all tables mirrored)
- [ ] `src/services/offline/syncService.js` — push/pull sync logic
- [ ] Online/offline detection, sync queue for pending mutations

### When ready — Service Worker (Workbox)
- [ ] Cache strategies per route type
- [ ] Background sync for work entries

### When ready — PWA
- [ ] PWA manifest.json, icons, "Add to Home Screen", offline fallback

---

## ⏸ FUTURE — Client Onboarding Wizard
- [ ] 5-step onboarding wizard (< 5 minutes per client)

---

## ⏸ POST-MVP BACKLOG
- [ ] Email notifications (approvals, invites)
- [ ] SLA auto-calculations (response time, resolution, penalty)
- [ ] Dashboard analytics (charts, trends, KPIs)
- [ ] Bulk operations (approve many, export CSV)
- [ ] Multi-language (Bahasa Malaysia)
- [ ] Error boundaries
- [ ] Advanced search & filters

---

## 📁 KEY FILES REFERENCE

### Database Migrations (in order)
```
001–021  Core schema + RLS + templates (Sessions 1–8)
022      global_role on user_profiles
023      organization_id on work_entries + trigger
024      Full RLS rewrite for org isolation
025      5 clean test orgs
026      org_members.role expanded to 7 roles
027      find_user_by_email RPC
028      org_type + subcontractor_relationships table
029–029f Cross-org RLS, contract roles, activity_logs (Session 15)
030      Approval workflow columns on work_entries (Session 16)
031      reject_entry_history table (Session 16)
```

### Key Architectural Notes
- `created_by` → `auth.users` (cross-schema) — NEVER join in PostgREST, select as UUID only
- Route order: `/work/approvals` BEFORE `/work/:id` in Router.jsx (permanent note)
- `reject_entry_history` — append-only, never clear, never delete
- `resubmitWorkEntry` — never clear rejected_* fields (audit trail)
- `DynamicForm` — always use useEffect to sync initialData (useState is one-time snapshot)

---

## 📋 TEST USERS REFERENCE

| Email | Role | Org |
|-------|------|-----|
| effort.edutech@gmail.com (Eff) | super_admin | All (via switcher) + Effort Edutech |
| fazrul.owner@test.com | org_owner | FEST ENT |
| hafiz.admin@test.com | org_admin | FEST ENT |
| roslan.manager@test.com | manager | FEST ENT |
| amirul.tech@test.com | technician | FEST ENT |
| khairul.sub@test.com | subcontractor | FEST ENT |
| mtsb.admin@test.com | org_admin | MTSB |

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
| Feb 21, 2026 | `useCallback([orgId])` — clean re-fetch on org switch |
| Feb 21, 2026 | Technicians see Projects + Contracts nav (read-only) |
| Feb 21, 2026 | Test users via Supabase Dashboard only (GoTrue hashing) |
| Feb 22, 2026 | contract_templates junction table (many-to-many) |
| Feb 24, 2026 | subcontractor_relationships + performing_org_id on contracts |
| Feb 26, 2026 | Platform staff never in org_members — org switcher is their access |
| Feb 26, 2026 | DynamicForm onChange outside setState updater (React rule) |
| Mar 1, 2026  | reject_entry_history is append-only permanent audit (no UPDATE/DELETE) |
| Mar 1, 2026  | resubmitWorkEntry must NOT clear rejected_* fields (timeline audit trail) |
| Mar 1, 2026  | created_by cross-schema join removed from getPendingApprovals (PostgREST limitation) |
| Mar 1, 2026  | Route ordering: literal paths before :id params is critical in Router.jsx |

---

## ⚠️ KNOWN REMAINING GAPS

| Gap | Priority | Notes |
|-----|----------|-------|
| Report PDF — approval stamps | 🔴 High | Session 17 |
| MTSB consolidated report | 🔴 High | Session 17 |
| Rejection analytics page | 🟡 Medium | Session 17 — uses reject_entry_history |
| Error boundaries | 🟡 Medium | App hard-crashes on errors |
| Mr. Roz has 0 members | 🟡 Medium | Add via UI before demo |
| Offline-First | 🟢 Low | Phase 3, deferred |
| Email notifications | 🟢 Low | No email system yet |
| Loading skeletons | 🟢 Low | Some pages flash empty state |

---

**Alhamdulillah! 16 sessions complete.**
**Phase 2 (Multi-Client Platform) is 100% done.**
**Full approval lifecycle working end-to-end across all 3 client scenarios.**
**Session 17: Reporting & PDF enhancements next. Bismillah! 🚀**

*Checklist Version: 4.0*
*Last Updated: March 1, 2026*
*WorkLedger — Multi-Client Work Reporting Platform*
