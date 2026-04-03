# WORKLEDGER DEVELOPMENT CHECKLIST
## Complete Sequenced Development Plan (Start to Finish)

**Project:** WorkLedger — Multi-Client, Contract-Aware Work Reporting Platform
**Developer:** Eff (Solo Developer) + AI Assistant
**Business Model:** Service-Based (Bina Jaya Engineering provides reporting services)
**Budget:** RM 0 (100% free-tier)
**Philosophy:** Do it right the first time

**Last Updated:** March 4, 2026
**Version:** 5.0 — Session 17 Complete / Session 18 Ready

---

## 📊 PROGRESS OVERVIEW

### Summary

| Metric | Value |
|--------|-------|
| Sessions Completed | 17 |
| Current Session | 18 |
| Phase 0 (Setup) | ✅ 100% |
| Phase 1 (Foundation) | ✅ 100% |
| Phase 2 (Multi-Client Platform) | ✅ ~98% |
| Phase 3 (Offline-First) | 🔥 IN PROGRESS |
| Database Migrations Run | 031 total |
| Test Users | 8 (across 3 client orgs) |

### Feature Completion Table

| Feature | Status | Session |
|---------|--------|---------|
| Authentication & Authorization | ✅ 100% | 1-5 |
| Organizations (CRUD) | ✅ 100% | 1-5 |
| Projects (CRUD) | ✅ 100% | 1-5 |
| Contracts (CRUD + 8 Types) | ✅ 100% | 1-5 |
| Templates (8 Malaysian) | ✅ 100% | 1-5 |
| Report Layouts (Visual Builder) | ✅ 100% | 6-8 |
| Report Generation (PDF) | ✅ 90% | 6-8, 17 |
| Multi-Tenancy Foundation | ✅ 100% | 9-10 |
| Organization Switcher | ✅ 100% | 9-10 |
| Role System (7 roles, RBAC) | ✅ 100% | 11 |
| Permission Guards (UI + Route) | ✅ 100% | 11 |
| User Management UI | ✅ 100% | 12 |
| Multi-Template per Contract | ✅ 100% | 13 |
| Quick Entry / WhatsApp Workflow | ✅ 100% | 13-14 |
| Work Entries (Template-Driven) | ✅ 100% | 13-14 |
| Photo Attachments | ✅ Working | 14 |
| Subcontractor Management (MTSB) | ✅ 100% | 15 |
| Cross-Org Work Visibility | ✅ 100% | 15 |
| Delete Ownership Guard + Audit Log | ✅ 100% | 15 |
| Dashboard Permission-Aware | ✅ 100% | 15 |
| Approval Workflow (Full Lifecycle) | ✅ 100% | 16 |
| reject_entry_history Audit Table | ✅ 100% | 16 |
| PDF Reports w/ Approval Stamps | ✅ 100% | 17 |
| MTSB Consolidated Report | ✅ 100% | 17 |
| Rejection Analytics Page | ⚠️ Verify | 17 (check) |
| Error Boundaries | ⚠️ Verify | 17 (check) |
| Offline-First (IndexedDB + PWA) | 🔥 Session 18 | NOW |
| Email Notifications | 🔥 Session 18 | NOW |
| SLA Auto-Calculations | ⏸ Deferred | Future |
| Client Onboarding Wizard | ⏸ Deferred | Future |
| WhatsApp Bot Integration | ⏸ Deferred | Future |

---

## 🏗️ STRATEGIC CONTEXT

### Three Client Scenarios
1. **FEST ENT** — Fire system service company
   - 4 technicians + manager + admin + owner
   - Technicians → Submit → Manager approves
   - FEST ENT is also a subcontractor to MTSB
2. **Mr. Roz** — Freelance air-cond technician
   - Solo user, WhatsApp workflow
   - BJ Staff enters data on his behalf (Quick Entry)
3. **MTSB** — Main contractor
   - Internal teams + FEST ENT as subcontractor
   - Consolidated reports across both orgs

### Business Model
- Pricing: RM 100–800/month per client tier
- Target: RM 5,000/month by Month 6
- Infrastructure: 100% free-tier (Supabase + Vercel + GitHub)

---

## ✅ COMPLETED SESSIONS (1–17)

---

### SESSIONS 1–5: Foundation & Database ✅

- [x] 8 core tables (organizations, user_profiles, org_members, projects, contracts, templates, work_entries, attachments)
- [x] 50+ RLS policies across all tables
- [x] 8 Malaysian contract templates (PMC, CMC, AMC, SLA, HVAC, Fire System, etc.)
- [x] Supabase project configured (Singapore region)
- [x] Auth working (login, register, logout)
- [x] Protected routes

---

### SESSIONS 6–8: Report Layouts & Builder ✅

- [x] Layout system with JSONB schema
- [x] Template-layout automation (auto-generate layout from template)
- [x] 3 default layouts created
- [x] Visual block-based builder (8 block types)
- [x] 4-tab layout editor: Basic Info, Visual Builder, Preview, JSON Editor
- [x] A4/Letter page size toggle, Portrait/Landscape
- [x] Template Automation ("From Template" button)
- [x] Hard delete for inactive layouts

---

### SESSION 8B: Multi-Client Strategy ✅

- [x] 5-Phase roadmap created
- [x] Business model + revenue projections (RM 100–800/month)
- [x] 3 client scenarios defined (FEST ENT, Mr. Roz, MTSB)
- [x] Strategic pivot: WorkLedger → multi-client service platform

---

### SESSION 9: Multi-Tenancy Foundation ✅

- [x] Migration 022: `global_role` column on `user_profiles`
- [x] Migration 023: `organization_id` on `work_entries` + `attachments` + auto triggers
- [x] Migration 024: RLS policies for all 9 tables
- [x] Migration 025: Test orgs + duplicate cleanup
- [x] `OrganizationContext.jsx` — org switching + localStorage persistence
- [x] `OrganizationSwitcher.jsx` — amber dropdown in header
- [x] `AppLayout.jsx` — switcher in header center
- [x] `App.jsx` — OrganizationProvider wrapped

---

### SESSION 10: Org Switcher Wiring ✅

- [x] `projectService.js` — `getUserProjects(orgId)`
- [x] `contractService.js` — `getUserContracts(orgId)`
- [x] `workEntryService.js` — `getUserWorkEntries(filters, orgId)`
- [x] Dashboard, ProjectListPage, ContractListPage, WorkEntryListPage — all org-aware
- [x] `OrgSwitchToast.jsx` — fires on org switch
- [x] `useCallback([orgId])` pattern for clean re-fetch

---

### SESSION 11: Role System ✅

- [x] Migration 026: Updated `org_members.role` CHECK constraint (org_owner, technician, subcontractor added)
- [x] 5 FEST ENT test users created (all roles verified)
- [x] `src/constants/permissions.js` — 30+ permissions, 9 roles
- [x] `useRole.js` — `can()`, `role`, `isBinaJayaStaff`, `isFieldWorker`
- [x] `PermissionGuard.jsx` — wraps any UI element
- [x] `RoleBadge.jsx` — colour-coded from ROLE_META
- [x] Sidebar + BottomNav role-filtered
- [x] All 7 role tests PASSED

**Key architecture:**
```
Login → AuthContext (global_role) → OrganizationContext (userOrgRole per org)
useRole() → can(permission) → PERMISSIONS[permission].includes(effectiveRole)
```

---

### SESSION 12: User Management UI ✅

- [x] `userService.js` — getOrgMembers, updateMemberRole, deactivateMember, reactivateMember
- [x] `UserList.jsx` — table with role badges, search, filter by role
- [x] `ChangeRoleModal.jsx` — with confirmation, cannot demote last org_owner
- [x] `InviteUser.jsx` — email-based, checks if user exists in auth.users
- [x] Router updated: `/users` and `/users/invite`

---

### SESSION 13–14: Work Entries + Quick Entry ✅

- [x] `workEntryService.js` — full CRUD (create, list, detail, update, delete, submit)
- [x] `DynamicForm.jsx` — renders all 17 field types from template schema
- [x] `WorkEntryListPage.jsx` — tabs: My Entries / All Entries / Pending Approval
- [x] `WorkEntryDetail.jsx` — full entry view with template field rendering
- [x] `NewWorkEntry.jsx` + `EditWorkEntry.jsx`
- [x] `WorkEntryCard.jsx` — status badge, entry summary
- [x] Photo attachments — upload to Supabase Storage, preview
- [x] Quick Entry (`/admin/quick-entry`) — BJ Staff enters for Mr. Roz
- [x] `whatsappParser.js` — parses Malay date format + job description

**Key pattern:**
```
DynamicForm onChange: must be outside setState updater (React rule)
Field path format: section_id.field_id
```

---

### SESSION 15: Subcontractor Management ✅

- [x] Migration 027: `contract_templates` junction table (many-to-many)
- [x] Migration 028: `subcontractor_relationships` table
- [x] Migration 029: `performing_org_id` on contracts
- [x] Migrations 029b–029f: org_id fixes, activity_logs, DELETE guard, user_profiles RLS
- [x] MTSB ↔ FEST ENT subcontractor relationship created
- [x] `Pavilion KL Facilities Management 2026` project — shared between MTSB + FEST ENT
- [x] Cross-org RLS: MTSB sees FEST ENT entries (read-only)
- [x] BJ platform staff: org switcher access only (NOT in org_members)
- [x] Delete ownership guard: only entry creator can delete

**Key architecture:**
```
MTSB (main contractor) → can see FEST ENT entries via subcontractor relationship
MTSB cannot Edit/Delete/Approve FEST ENT entries (org isolation enforced)
```

---

### SESSION 16: Approval Workflow ✅

- [x] Migration 030: Approval columns on `work_entries`
  - `submitted_at`, `submitted_by`
  - `approved_at`, `approved_by`, `approval_remarks`
  - `rejected_at`, `rejected_by`, `rejection_reason`
- [x] Migration 031: `reject_entry_history` table (append-only audit log)
  - 5 indexes: org/date, work_entry, rejected_by, technician, contract
  - `rejection_count` tracks 1st/2nd/3rd rejection of same entry
  - `entry_data_snapshot` (JSONB) captures field data at rejection time
- [x] `ApprovalBadge.jsx` — colour-coded + pulse animation
- [x] `ApprovalActions.jsx` — Approve/Reject with confirmation modals
- [x] `ApprovalHistory.jsx` — chronological timeline
- [x] `PendingApprovalList.jsx` — manager queue cards
- [x] `/work/approvals` page — manager approval queue
- [x] Sidebar badge with live pending count
- [x] MTSB org isolation enforced for approval actions
- [x] All 7 approval workflow tests PASSED

**Critical patterns:**
```
Route ordering: /work/approvals MUST be before /work/:id
resubmitWorkEntry must NOT clear rejected_* fields (audit trail)
created_by cross-schema join: removed from getPendingApprovals (PostgREST limitation)
reject_entry_history: append-only, NO UPDATE/DELETE RLS policies
```

---

### SESSION 17: Reporting & PDF Enhancement ✅

- [x] `reportService.js` — includes approval metadata per entry
  (approved_by, approved_at, rejected_by, rejection_reason)
- [x] Approval stamp in PDF: "✅ Approved by [Name] — [Date]"
- [x] "Approved entries only" filter in GenerateReport page
- [x] `ConsolidatedReport.jsx` — MTSB combined report (internal + FEST ENT)
  - Date range selector
  - Toggle: include subcontractor entries
  - Sections: MTSB Internal / FEST ENT Subcontractor / Summary
- [x] Router: `/reports/consolidated` added (guarded: GENERATE_REPORTS)
- [x] Sidebar: "Consolidated Report" nav item added

**Unconfirmed (verify at start of Session 18):**
- ⚠️ `RejectionAnalytics.jsx` — `/reports/rejections` (Priority 3 from Session 17)
- ⚠️ `ErrorBoundary.jsx` — prevents app hard-crash (Priority 4 from Session 17)

---

## 🔥 SESSION 18: OFFLINE-FIRST + EMAIL NOTIFICATIONS

**Date:** March 4, 2026
**Status:** READY TO START
**Priority:** 🔴 Critical (field technicians need offline capability for real deployment)

---

### 18.0 Pre-session: Verify Session 17 Leftovers

Before starting Session 18, confirm whether these were completed:

- [ ] `src/pages/reports/RejectionAnalytics.jsx` exists?
- [ ] `src/components/common/ErrorBoundary.jsx` exists?
- [ ] Route `/reports/rejections` in Router.jsx?
- [ ] "Rejections" nav item in Sidebar.jsx?

If NOT done → tackle these first (est. 45 min) before offline work.

---

### TRACK 1: OFFLINE-FIRST (IndexedDB + PWA)

#### 18.1 Install Packages

```bash
# Check package.json first — dexie may already be listed
npm install dexie
npm install vite-plugin-pwa
```

#### 18.2 Dexie DB Schema — `src/services/offline/db.js`

- [ ] Create `src/services/offline/db.js`
  - [ ] `WorkLedgerDB` Dexie database
  - [ ] `organizations` store: `id, updated_at`
  - [ ] `projects` store: `id, organization_id, updated_at`
  - [ ] `contracts` store: `id, project_id, updated_at`
  - [ ] `templates` store: `template_id, contract_category, updated_at`
  - [ ] `workEntries` store: `++localId, remoteId, contract_id, template_id, entry_date, status, sync_status, created_at`
  - [ ] `attachments` store: `++localId, remoteId, entry_local_id, field_id, attachment_type, data (base64), sync_status, created_at`
  - [ ] `syncQueue` store: `++id, entity_type, entity_local_id, action, payload, sync_status, retry_count, created_at`
  - [ ] `SYNC_STATUS` constants: `pending | syncing | synced | failed`

**Key design decisions:**
- `++localId` = offline primary key (never shown to user)
- `remoteId` = Supabase UUID (null until synced)
- `attachments.data` = base64 string (avoids Safari IndexedDB blob issues)

#### 18.3 Offline Context — `src/context/OfflineContext.jsx`

- [ ] Create `src/context/OfflineContext.jsx`
  - [ ] `isOnline` state (boolean) — `window.navigator.onLine` + event listeners
  - [ ] `syncStatus` state: `idle | syncing | error`
  - [ ] `pendingCount` state — count of `syncQueue` rows with `status='pending'`
  - [ ] `triggerSync()` method — kicks off sync engine
  - [ ] `online` / `offline` event listeners with cleanup
  - [ ] `OfflineProvider` component export

#### 18.4 useOffline Hook — `src/hooks/useOffline.js`

- [ ] Create `src/hooks/useOffline.js`
  - [ ] Returns `{ isOnline, syncStatus, pendingCount, triggerSync }`
  - [ ] Consumes `OfflineContext`
  - [ ] Throws if used outside `OfflineProvider`

#### 18.5 Sync Service — `src/services/offline/syncService.js`

- [ ] Create `src/services/offline/syncService.js`

  **A. Push (local → Supabase):**
  - [ ] Fetch all `syncQueue` entries where `sync_status = 'pending'`
  - [ ] For each: set status → `processing`
  - [ ] POST to Supabase
  - [ ] On success: update entity `remoteId` + set `sync_status = 'synced'` + queue `= 'done'`
  - [ ] On failure: increment `retry_count`; if >= 3 → `failed`; else back to `pending`

  **B. Pull (Supabase → local):**
  - [ ] On login / reconnect: fetch organizations, projects, contracts, templates
  - [ ] Upsert into IndexedDB (by id / template_id)
  - [ ] Fetch `work_entries` for current user (last 90 days)
  - [ ] Upsert into IndexedDB `workEntries`

  **C. Conflict resolution:**
  - [ ] If `remoteId` exists AND Supabase `updated_at` is newer → overwrite local (server wins)
  - [ ] Principle: IndexedDB = UI source of truth; Supabase = final authority

#### 18.6 Offline Indicator — `src/components/common/OfflineIndicator.jsx`

- [ ] Create `src/components/common/OfflineIndicator.jsx`
  - [ ] Offline: `🔴 You are offline. Entries will sync when reconnected.`
  - [ ] Syncing: `🔄 Syncing 3 pending entries...`
  - [ ] Sync failed: `⚠️ 2 entries failed to sync. Tap to retry.`
  - [ ] Flow inside `<main>` (NOT `position: fixed` — must not overlap header)
  - [ ] Uses `useOffline()` hook

#### 18.7 Update workEntryService.js

- [ ] Modify `src/services/api/workEntryService.js`
  - [ ] `createWorkEntry()` — save to IndexedDB first, then Supabase if online
  - [ ] `updateWorkEntry()` — same offline-first pattern
  - [ ] `getUserWorkEntries()` — read from IndexedDB, refresh from Supabase if online
  - [ ] On sync failure — update `syncQueue` entry status accordingly

**Offline-first pattern:**
```javascript
// 1. Save to IndexedDB (always, instant)
const localId = await db.workEntries.add({ ...entry, sync_status: 'pending' });

// 2. Sync to Supabase (only if online)
if (navigator.onLine) {
  // POST to Supabase → update localId with remoteId
}
```

#### 18.8 Update AppLayout.jsx

- [ ] Modify `src/components/layout/AppLayout.jsx`
  - [ ] Import and render `<OfflineIndicator />` inside `<main>`, below the header

#### 18.9 Update main.jsx

- [ ] Modify `src/main.jsx`
  - [ ] Wrap app in `<OfflineProvider>` (after `<AuthProvider>`, before `<Router>`)

#### 18.10 VitePWA Config — vite.config.js

- [ ] Modify `vite.config.js`
  - [ ] Import `{ VitePWA }` from `vite-plugin-pwa`
  - [ ] Configure `VitePWA` plugin:
    - [ ] `registerType: 'autoUpdate'`
    - [ ] `manifest`: name, short_name, icons (192 + 512), theme_color
    - [ ] `workbox`: `runtimeCaching` for API calls (NetworkFirst strategy)
    - [ ] Cache static assets (CacheFirst for images/fonts)
  - [ ] Note: Service workers only run in `vite build && vite preview` (NOT dev mode)

#### 18.11 PWA Icons

- [ ] Create `public/icons/icon-192.png` (192×192 — can be placeholder square)
- [ ] Create `public/icons/icon-512.png` (512×512 — same design, larger)

---

### TRACK 2: EMAIL NOTIFICATIONS

#### 18.12 Resend Account Setup

- [ ] Create account at resend.com (free tier: 3,000 emails/month)
- [ ] Generate API key → save as Supabase secret
- [ ] Note: Without verified domain, emails send from `onboarding@resend.dev` (fine for testing)
- [ ] For production: verify your domain in Resend dashboard → update `from` address

#### 18.13 Edge Function — `supabase/functions/notify-approval-required/index.ts`

- [ ] Create `supabase/functions/notify-approval-required/index.ts`
  - [ ] Triggered on `work_entries` UPDATE where `status = 'submitted'`
  - [ ] Fetch managers in the entry's org via `org_members`
  - [ ] Resolve manager emails via `supabase.auth.admin.getUserById()` (service role)
  - [ ] Fetch technician name from `user_profiles`
  - [ ] Fetch contract details from `contracts`
  - [ ] Send email to each manager via Resend API
  - [ ] Email contains: technician name, contract ref, entry date, "Review Approval Queue" button
  - [ ] Return `{ sent: managerEmails.length }` on success
  - [ ] Ignore updates where status ≠ 'submitted' (return 200 immediately)

**Note:** `auth.admin.getUserById()` requires service role key — auto-injected in Edge Functions. Never expose to frontend.

#### 18.14 Set Supabase Secrets

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
supabase secrets set APP_URL=https://workledger.vercel.app
# SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are auto-injected
```

#### 18.15 Deploy Edge Function

```bash
supabase functions deploy notify-approval-required
```

#### 18.16 Configure Supabase Database Webhook

- [ ] Go to Supabase Dashboard → Database → Webhooks → Create Webhook
  - [ ] Name: `notify-approval-required`
  - [ ] Table: `work_entries`
  - [ ] Events: `UPDATE` only
  - [ ] Type: Supabase Edge Functions
  - [ ] Edge Function: `notify-approval-required`
  - [ ] HTTP method: POST
  - [ ] Filter (optional): `status=eq.submitted`

**Fallback (if webhooks unavailable on free tier):** PostgreSQL trigger using `pg_net.http_post()` to Edge Function URL.

---

### 18.17 Session 18 Testing Checklist

#### Offline-First Tests
- [ ] Open app → DevTools → Network: Offline → offline banner appears
- [ ] Create work entry while offline → saves instantly, no error
- [ ] Re-enable network → sync triggers automatically, banner disappears
- [ ] Verify entry appears in Supabase Dashboard after sync
- [ ] Check DevTools → Application → IndexedDB → WorkLedgerDB
- [ ] Hard refresh while offline → app still loads (service worker serves cache)
- [ ] Mobile Chrome: Add to Home Screen → opens as standalone PWA
- [ ] `vite build && vite preview` → test service worker (NOT dev mode)

#### Email Notification Tests
- [ ] Login as `amirul.tech@test.com` (technician)
- [ ] Create and submit a work entry
- [ ] Check `roslan.manager@test.com`'s inbox → approval email received ≤ 30 seconds
- [ ] Email contains correct: contract number, technician name, entry date
- [ ] "Review Approval Queue" button links to `/work/approvals`
- [ ] Submit second entry → second email received
- [ ] Check Resend dashboard for delivery status

#### Regression Tests (existing features)
- [ ] FEST ENT technician → submit entry → manager approves (full cycle)
- [ ] PDF report generates with approval stamps
- [ ] MTSB consolidated report generates
- [ ] Org switching still works
- [ ] Permission guards still enforced

---

### 18.18 Session 18 — Files Summary

**New files (8):**
```
src/services/offline/db.js
src/context/OfflineContext.jsx
src/hooks/useOffline.js
src/services/offline/syncService.js
src/components/common/OfflineIndicator.jsx
public/icons/icon-192.png
public/icons/icon-512.png
supabase/functions/notify-approval-required/index.ts
```

**Modified files (4):**
```
src/services/api/workEntryService.js   — offline-first create/update
src/components/layout/AppLayout.jsx   — OfflineIndicator in <main>
src/main.jsx                          — OfflineProvider wrap
vite.config.js                        — VitePWA plugin
```

---

## ⚠️ KNOWN GOTCHAS & CRITICAL PATTERNS

### Offline-First
1. **Safari IndexedDB** — stricter storage limits; may clear on storage pressure.
   Recommend Chrome/Android Chrome for field use. Document as known limitation.
2. **Dexie version upgrades** — MUST increment version number + provide migration when adding tables/indexes. NEVER change an existing version's schema.
3. **remoteId vs localId** — Components must never store `localId` in URLs. Always prefer `remoteId` once synced. Show entry from IndexedDB by `localId` before sync.
4. **VitePWA dev mode** — Service workers DON'T run in `vite dev`. Test PWA with `vite build && vite preview` or deploy to Vercel.
5. **Background sync API** — Chrome-only. Not implemented this session. Sync on `online` event is sufficient for MVP.

### Email Notifications
1. **Domain verification** — Without verified domain, emails send from `onboarding@resend.dev` (fine for testing). Verify domain before real client use.
2. **auth.admin.getUserById** — Requires service role key. Auto-available in Edge Functions. NEVER expose to frontend.
3. **Database Webhooks** — Supabase free tier supports them. Fallback: `pg_net.http_post()` in a PostgreSQL trigger.
4. **Reject notification** — NOT implemented this session. "Technician rejected" email is Phase 3 follow-up.

### Established Patterns (from Sessions 11–16)
- Route ordering: literal paths before `:id` params is critical in Router.jsx
- `resubmitWorkEntry` must NOT clear `rejected_*` fields (audit trail)
- `created_by` cross-schema join: do NOT use in list queries (PostgREST limitation)
- `reject_entry_history` is append-only — no UPDATE/DELETE RLS policies
- `DynamicForm onChange` must be outside `setState` updater (React rule)
- Platform staff (BJ) are NOT in `org_members` — org switcher is their access mechanism
- Test users: create via Supabase Dashboard ONLY (not SQL INSERT — GoTrue hashing)

---

## 📅 UPCOMING SESSIONS (Planned)

### SESSION 19: Client Onboarding Polish
- Client onboarding wizard (5-step: org → template → project → contract → invite user)
- Loading skeletons for WorkEntryList + ApprovalsPage
- Mr. Roz — add at least 1 member via UI
- SLA auto-calculation foundation

### SESSION 20: Production Readiness
- Error boundaries (if not done in 17)
- Performance audit (1000+ entries test)
- Final ESLint run + remove console.logs
- Security testing (RLS policy review)
- Cross-device testing (Android, iOS, desktop)

### SESSION 21: First Client Deployment
- Deploy to Vercel (production)
- Configure custom domain
- Setup production environment variables
- Onboard Mr. Roz as first paying client
- Document known limitations

### FUTURE (Deferred)
- WhatsApp Bot integration (automated parsing)
- SLA auto-calculations + penalty tracking
- Advanced analytics & charts
- AI-powered work summaries
- Multi-language (Bahasa Malaysia)
- Mobile app (React Native)

---

## 📚 KEY FILES REFERENCE

### Context & Hooks
- `src/context/AuthContext.jsx` → `user`, `profile`, `profile.global_role`
- `src/context/OrganizationContext.jsx` → `orgId`, `currentOrg`, `userOrgRole`, `isBinaJayaStaff`
- `src/context/OfflineContext.jsx` → `isOnline`, `syncStatus`, `pendingCount` (NEW Session 18)
- `src/hooks/useRole.js` → `can(permission)`, `role`, `isBinaJayaStaff`
- `src/hooks/useOffline.js` → `isOnline`, `syncStatus`, `pendingCount`, `triggerSync` (NEW Session 18)

### Permission System
- `src/constants/permissions.js` → 30+ permissions, 9 roles, ROLE_META
- `src/components/auth/PermissionGuard.jsx` → wraps any UI element
- `src/components/auth/RoleBadge.jsx` → colour-coded role badge

### Services
- `src/services/api/workEntryService.js` → CRUD, submit, approve, reject (offline-first after Session 18)
- `src/services/api/reportService.js` → PDF generation with approval stamps
- `src/services/offline/db.js` → Dexie IndexedDB schema (NEW Session 18)
- `src/services/offline/syncService.js` → push/pull/conflict resolution (NEW Session 18)

### Components
- `src/components/layout/AppLayout.jsx` → wraps all pages (includes OfflineIndicator after S18)
- `src/components/workEntries/ApprovalActions.jsx` → Approve/Reject modals
- `src/components/workEntries/ApprovalHistory.jsx` → timeline
- `src/components/common/OfflineIndicator.jsx` → NEW Session 18

---

## 📝 DECISION LOG (All Sessions)

| Date | Decision |
|------|----------|
| Feb 18, 2026 | Strategic pivot → multi-client service platform |
| Feb 20, 2026 | `global_role` for platform identity; `org_members.role` for per-org |
| Feb 20, 2026 | DB trigger auto-propagates `organization_id` on INSERT |
| Feb 21, 2026 | `orgId` param pattern for services — backward compatible |
| Feb 21, 2026 | `useCallback([orgId])` — clean re-fetch on org switch |
| Feb 21, 2026 | Technicians CAN see Projects + Contracts nav (read-only). PermissionGuard hides write buttons. Navigation ≠ write access. |
| Feb 21, 2026 | Test users via Supabase Dashboard ONLY (GoTrue hashing — not SQL INSERT) |
| Feb 22, 2026 | `contract_templates` junction table (many-to-many) |
| Feb 24, 2026 | `subcontractor_relationships` + `performing_org_id` on contracts |
| Feb 26, 2026 | Platform staff (BJ) never in `org_members` — org switcher is their access |
| Feb 26, 2026 | `DynamicForm onChange` outside `setState` updater (React rule) |
| Mar 1, 2026 | `reject_entry_history` is append-only permanent audit (no UPDATE/DELETE) |
| Mar 1, 2026 | `resubmitWorkEntry` must NOT clear `rejected_*` fields (timeline audit trail) |
| Mar 1, 2026 | `created_by` cross-schema join removed from `getPendingApprovals` (PostgREST limitation) |
| Mar 1, 2026 | Route ordering: literal paths before `:id` params is critical in Router.jsx |
| Mar 3, 2026 | PDF approval stamps: text blocks only (not images) for simplicity |
| Mar 3, 2026 | MTSB consolidated report uses existing `subconOrgIds` pattern from `workEntryService` |
| Mar 4, 2026 | IndexedDB = UI source of truth; Supabase = final authority (server wins on conflict) |
| Mar 4, 2026 | base64 inline for offline attachments (avoids Safari IndexedDB blob issues) |
| Mar 4, 2026 | Sync on `online` event — Background Sync API deferred (Chrome-only, MVP not needed) |

---

## 🎉 MAJOR MILESTONES

- **Session 1–5:** Database + Auth foundation ✅
- **Session 6–8:** Layout builder + multi-client strategy ✅
- **Session 9–11:** Multi-tenancy + role system ✅
- **Session 12–14:** User management + work entries + Quick Entry ✅
- **Session 15:** Subcontractor management (MTSB ↔ FEST ENT) ✅
- **Session 16:** Full approval lifecycle — Phase 2 100% COMPLETE ✅
- **Session 17:** PDF approval stamps + MTSB consolidated report ✅
- **Session 18:** Offline-First + Email Notifications 🔥 IN PROGRESS
- **Session 19–21:** Client onboarding + production deployment ⏳ PLANNED

---

## 🚀 SESSION 18 QUICK START

```bash
# Verify packages
cat package.json | grep -E "dexie|vite-plugin-pwa"

# Install if missing
npm install dexie
npm install vite-plugin-pwa

# Start dev server
npm run dev
```

**Test accounts:**
```
amirul.tech@test.com / TestPass123!     → FEST ENT technician (create entries offline)
roslan.manager@test.com / TestPass123!  → FEST ENT manager (receive approval emails)
effort.edutech@gmail.com / [your pass]  → super_admin / BJ Staff
```

---

**Bismillah! Session 18 — let's make WorkLedger truly field-ready! 🚀**

*Checklist Version: 5.0*
*Last Updated: March 4, 2026*
*WorkLedger — Multi-Client Work Reporting Platform*
*Sessions completed: 17 | Next: Session 18 (Offline-First + Email Notifications)*
