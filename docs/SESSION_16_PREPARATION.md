# SESSION 16 PREPARATION — Approval Workflow
**Date Prepared:** February 27, 2026
**Session Focus:** Work Entry Approval Workflow
**Estimated Duration:** 1 day
**Difficulty:** Medium
**Priority:** 🔴 High — Last major gap before real client demo

---

## 🎯 SESSION OBJECTIVES

Enable managers and org admins to review, approve, and reject submitted
work entries. Complete the full work entry lifecycle:

```
draft → submitted → approved
                 ↘ rejected (with remarks)
```

**What success looks like:**
- Amirul (FEST ENT technician) submits a work entry
- Roslan (FEST ENT manager) sees it in his Pending Approvals list
- Roslan approves it with a remark
- The entry is now locked — Amirul cannot edit it
- Hafiz (FEST ENT admin) can see the approval history

---

## ✅ PREREQUISITES — ALL MET

| Item | Status |
|------|--------|
| Work entry creation working | ✅ (fixed Session 15) |
| Status field on work_entries ('draft','submitted') | ✅ Exists |
| `submitted_at` column on work_entries | ✅ Exists |
| `APPROVE_WORK_ENTRY` permission in permissions.js | ✅ Exists |
| `SUBMIT_WORK_ENTRY` permission in permissions.js | ✅ Exists |
| PermissionGuard component working | ✅ |
| useRole hook working | ✅ |
| RLS policies pattern established | ✅ |
| activity_logs table (for approval audit) | ✅ Migration 029d |

---

## 🗄️ DATABASE — Migration 030

### New columns needed on `work_entries`

```sql
-- Migration_030_approval_workflow.sql

ALTER TABLE public.work_entries
  ADD COLUMN IF NOT EXISTS approved_by    UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by    UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rejected_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approval_note  TEXT;       -- remarks from approver

-- Status check constraint — extend to include new statuses
-- (If existing CHECK constraint exists, drop and recreate)
ALTER TABLE public.work_entries
  DROP CONSTRAINT IF EXISTS work_entries_status_check;

ALTER TABLE public.work_entries
  ADD CONSTRAINT work_entries_status_check
  CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'));
```

### RLS policies for approved entries (immutability)

```sql
-- Approved entries are immutable — nobody can UPDATE them
-- (approved_by / approved_at / approval_note are the only exception
--  and those are set by the approval action itself)

-- 1. Workers can only edit their OWN entries in draft status
DROP POLICY IF EXISTS "work_entries_update_own_draft" ON public.work_entries;
CREATE POLICY "work_entries_update_own_draft"
ON public.work_entries FOR UPDATE
USING (
  created_by = auth.uid()
  AND status = 'draft'
);

-- 2. Managers/admins can update status field only (to approve/reject)
--    They cannot edit the entry content once submitted
DROP POLICY IF EXISTS "work_entries_approve_reject" ON public.work_entries;
CREATE POLICY "work_entries_approve_reject"
ON public.work_entries FOR UPDATE
USING (
  status = 'submitted'
  AND EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = work_entries.organization_id
      AND om.role IN ('org_owner', 'org_admin', 'manager')
      AND om.is_active = true
  )
);

-- 3. Super admin bypass
DROP POLICY IF EXISTS "work_entries_update_super_admin" ON public.work_entries;
CREATE POLICY "work_entries_update_super_admin"
ON public.work_entries FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND global_role = 'super_admin'
  )
);
```

---

## 🔧 SERVICE LAYER — workEntryService.js additions

### New methods to add:

```javascript
// ── Fetch pending approvals for a manager ──────────────────────────
async getPendingApprovals(orgId) {
  // Returns all 'submitted' entries for the org
  // Ordered by submitted_at ASC (oldest first)
}

// ── Approve a work entry ──────────────────────────────────────────
async approveWorkEntry(entryId, note = '') {
  // 1. Fetch entry — verify status === 'submitted'
  // 2. UPDATE status='approved', approved_by, approved_at, approval_note
  // 3. Log to activity_logs (action='APPROVE_WORK_ENTRY')
  // 4. Return { success, data }
}

// ── Reject a work entry ──────────────────────────────────────────
async rejectWorkEntry(entryId, note) {
  // note is REQUIRED for rejection — must explain why
  // 1. Fetch entry — verify status === 'submitted'
  // 2. UPDATE status='rejected', rejected_by, rejected_at, approval_note
  // 3. Log to activity_logs (action='REJECT_WORK_ENTRY')
  // 4. Return { success, data }
}

// ── Re-submit a rejected entry (after editing) ──────────────────
async resubmitWorkEntry(entryId) {
  // 1. Verify status === 'rejected' AND created_by === auth.uid()
  // 2. UPDATE status='submitted', submitted_at=now()
  //    Clear: rejected_by, rejected_at, approval_note
  // 3. Return { success, data }
}
```

---

## 🖥️ COMPONENTS TO BUILD

### 1. `ApprovalBadge.jsx` — Status display component
```
src/components/workEntries/ApprovalBadge.jsx
```

Shows colour-coded status badge for any work entry status:
- `draft`     → 🔘 Grey  "Draft"
- `submitted` → 🔵 Blue  "Pending Review"
- `approved`  → 🟢 Green "Approved"
- `rejected`  → 🔴 Red   "Rejected"

### 2. `ApprovalActions.jsx` — Approve/Reject buttons + modal
```
src/components/workEntries/ApprovalActions.jsx
```

Rendered inside WorkEntryDetail for managers.
- Shows only when `entry.status === 'submitted'`
- Shows only when `can('APPROVE_WORK_ENTRY')`
- "Approve" button → optional note → confirm → calls approveWorkEntry
- "Reject" button → required note → confirm → calls rejectWorkEntry
- Inline modal (no separate page needed)

### 3. `ApprovalHistory.jsx` — Read-only audit section
```
src/components/workEntries/ApprovalHistory.jsx
```

Rendered at bottom of WorkEntryDetail.
Shows: who submitted, when submitted, who approved/rejected, when, note.
Uses `approved_by` / `rejected_by` — needs a lookup to get names.

### 4. `PendingApprovalList.jsx` — Manager dashboard
```
src/components/workEntries/PendingApprovalList.jsx
```

Card list of submitted entries awaiting review.
Each card shows: entry date, contract name, technician name, submitted_at.
Click card → go to WorkEntryDetail where approval action lives.

---

## 📄 PAGES TO BUILD / UPDATE

### New: `ApprovalsPage.jsx`
```
src/pages/workEntries/ApprovalsPage.jsx
Route: /work/approvals
Guard: APPROVE_WORK_ENTRY
```

- Header: "Pending Approvals"
- Count badge: "3 entries awaiting review"
- Renders `PendingApprovalList`
- Empty state: "No entries pending review 🎉"
- Only visible to: org_owner, org_admin, manager

### Update: `WorkEntryDetail.jsx`
- Add `ApprovalBadge` next to entry status
- Add `ApprovalActions` section (shows for managers when status=submitted)
- Add `ApprovalHistory` section at bottom

### Update: `WorkEntryCard.jsx`
- Add `ApprovalBadge` — status visible in list view
- Rejected entries: show rejection note as subtitle
- Edit button: disabled when status = 'approved'

### Update: `WorkEntryListPage.jsx`
- Add "Pending Approval" tab for managers (alongside Internal/Subcontractor/All)
- Tab shows count badge

---

## 🔗 ROUTING & NAVIGATION

### Router.jsx — add:
```javascript
// Protected by APPROVE_WORK_ENTRY
guarded('/work/approvals', <ApprovalsPage />, 'APPROVE_WORK_ENTRY')
```

### Sidebar.jsx — add nav item:
```javascript
{
  label: 'Approvals',
  path: '/work/approvals',
  icon: <CheckCircleIcon />,
  permission: 'APPROVE_WORK_ENTRY',
  badge: pendingCount  // ← show number of pending entries
}
```

### Dashboard.jsx — add Quick Action for managers:
```javascript
{
  permission: 'APPROVE_WORK_ENTRY',
  to: '/work/approvals',
  label: 'Review Approvals',
  icon: <CheckCircleIcon />,
  // show badge count here too
}
```

---

## 🧪 TESTING CHECKLIST

### Test 1 — Submit entry as technician
- [ ] Login as Amirul (FEST ENT technician)
- [ ] Create work entry → fill form → click "Submit Entry"
- [ ] Entry status changes to `submitted`
- [ ] Amirul CANNOT edit the entry after submitting
- [ ] ApprovalBadge shows "Pending Review" in blue

### Test 2 — Manager sees pending approval
- [ ] Login as Roslan (FEST ENT manager)
- [ ] Sidebar shows "Approvals" with count badge (1)
- [ ] Navigate to `/work/approvals`
- [ ] Amirul's entry visible in list
- [ ] Click entry → WorkEntryDetail opens
- [ ] ApprovalActions section visible with Approve + Reject buttons

### Test 3 — Approve entry
- [ ] Roslan clicks "Approve"
- [ ] Optional note: "Good work, all items checked"
- [ ] Confirms in modal
- [ ] Entry status → `approved`
- [ ] ApprovalBadge → green "Approved"
- [ ] Approve/Reject buttons disappear
- [ ] ApprovalHistory shows: "Approved by Roslan on [date] — Good work..."
- [ ] Amirul logs in — entry shows approved, cannot edit

### Test 4 — Reject entry
- [ ] Login as Roslan
- [ ] Find another submitted entry
- [ ] Click "Reject" → note is REQUIRED
- [ ] Try submitting without note → validation error
- [ ] Enter note: "Missing equipment ID, please correct"
- [ ] Entry status → `rejected`
- [ ] ApprovalBadge → red "Rejected"

### Test 5 — Resubmit after rejection
- [ ] Login as Amirul
- [ ] See rejected entry with rejection note visible
- [ ] Edit the entry (add missing equipment ID)
- [ ] Click "Resubmit"
- [ ] Status returns to `submitted`
- [ ] Roslan sees it again in Pending Approvals

### Test 6 — Permission guard
- [ ] Login as Amirul (technician)
- [ ] Navigate to `/work/approvals` directly
- [ ] Should redirect (RouteGuard blocks non-managers)
- [ ] Sidebar should NOT show "Approvals" nav item

### Test 7 — MTSB scenario
- [ ] Login as MTSB admin
- [ ] FEST ENT subcontractor entry (status=submitted) visible in All tab
- [ ] MTSB admin should NOT see Approve/Reject for FEST ENT entries
  (MTSB cannot approve another org's internal entries)
- [ ] Only FEST ENT manager can approve FEST ENT entries

---

## 📋 IMPLEMENTATION ORDER

```
Step 1: Migration_030_approval_workflow.sql
        → Run in Supabase SQL Editor first

Step 2: workEntryService.js
        → Add: getPendingApprovals, approveWorkEntry,
               rejectWorkEntry, resubmitWorkEntry

Step 3: ApprovalBadge.jsx (small, pure display)

Step 4: ApprovalActions.jsx (approve/reject modal)

Step 5: ApprovalHistory.jsx (read-only audit)

Step 6: PendingApprovalList.jsx

Step 7: ApprovalsPage.jsx (new page)

Step 8: WorkEntryDetail.jsx (add ApprovalActions + ApprovalHistory)

Step 9: WorkEntryCard.jsx (add ApprovalBadge, disable edit when approved)

Step 10: WorkEntryListPage.jsx (add Pending tab for managers)

Step 11: Router.jsx (new /work/approvals route)

Step 12: Sidebar.jsx (add Approvals nav item with badge)

Step 13: Dashboard.jsx (add Review Approvals quick action)

Step 14: Test all 7 test cases above
```

---

## ⚠️ KEY DESIGN DECISIONS TO CONFIRM IN SESSION

**1. Can managers edit a submitted entry or only approve/reject?**

Recommendation: No. Once submitted, content is locked. Manager
can only approve or reject. If content needs fixing, they reject
with a note and the technician edits + resubmits.

**2. Can an approved entry ever be un-approved?**

Recommendation: No. Approved = immutable. This is important for
contract audit trails. Only super_admin bypass applies.

**3. Can MTSB approve FEST ENT subcontractor entries?**

Recommendation: No. Each org approves their own entries. MTSB
sees FEST ENT entries in read-only mode (Sub tab). FEST ENT
manager is responsible for approving FEST ENT entries.

**4. Pending count in Sidebar — live or cached?**

Recommendation: Live fetch on every Sidebar render using
`workEntryService.getPendingApprovals(orgId)` with `head:true`
count query. Cache for 30 seconds in OrganizationContext
to avoid hammering DB on every page change.

---

## 📚 REFERENCE — EXISTING PATTERNS TO FOLLOW

### Permission check pattern (from Session 11):
```javascript
const { can } = useRole();
{can('APPROVE_WORK_ENTRY') && <ApprovalActions entry={entry} />}
```

### Status update pattern (from workEntryService):
```javascript
const { data, error } = await supabase
  .from('work_entries')
  .update({ status: 'approved', approved_by: user.id, approved_at: now })
  .eq('id', entryId)
  .eq('status', 'submitted')   // ← optimistic concurrency guard
  .select()
  .single();
```

### Activity log pattern (from Migration 029d):
```javascript
await supabase.from('activity_logs').insert({
  action:        'APPROVE_WORK_ENTRY',
  entity_type:   'work_entry',
  entity_id:     entryId,
  actor_user_id: user.id,
  actor_org_id:  callerOrgId,
  metadata:      { approval_note: note, entry_date, contract_id }
});
```

### Route guard pattern (from Session 12):
```javascript
// router.jsx
const guarded = (path, element, permission) => ({
  path,
  element: (
    <ProtectedRoute>
      <RouteGuard permission={permission}>
        {element}
      </RouteGuard>
    </ProtectedRoute>
  )
});
```

---

## 🎯 EXPECTED DELIVERABLES — END OF SESSION 16

| File | Type |
|------|------|
| `Migration_030_approval_workflow.sql` | New |
| `workEntryService.js` | Updated |
| `ApprovalBadge.jsx` | New |
| `ApprovalActions.jsx` | New |
| `ApprovalHistory.jsx` | New |
| `PendingApprovalList.jsx` | New |
| `ApprovalsPage.jsx` | New |
| `WorkEntryDetail.jsx` | Updated |
| `WorkEntryCard.jsx` | Updated |
| `WorkEntryListPage.jsx` | Updated |
| `Router.jsx` | Updated |
| `Sidebar.jsx` | Updated |
| `Dashboard.jsx` | Updated |

**Total:** 4 new files, 9 updated files

---

## 🤲 SESSION CLOSING NOTE

Alhamdulillah for completing Session 15! The platform now supports:

- Full multi-tenancy with 5 organisations
- 7-role RBAC enforced at database + service + UI level
- MTSB main contractor managing FEST ENT subcontractor work
- Delete ownership guard with immutable audit logs
- Super admin org switcher with unmissable staff banner

Session 16 (Approval Workflow) completes the work entry lifecycle
and makes WorkLedger genuinely ready for its first real client demo.

**Bismillah — let's build Session 16! 🚀**

---

*Prepared: February 27, 2026*
*Developer: Eff (Solo, Bina Jaya Engineering / Effort Edutech)*
*Next session: Session 16 — Approval Workflow*
