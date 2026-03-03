# SESSION 18 PREPARATION
## Offline-First (IndexedDB + PWA) + Email Notifications

**Date:** March 3, 2026
**Session:** 18
**Prepared by:** AI Assistant (pre-session planning)
**Status:** Ready to start

---

## 🎯 SESSION OBJECTIVES

Two parallel tracks, both completable in one session:

| Track | Priority | Why Now |
|-------|----------|---------|
| **Offline-First** | 🔴 Critical | Field technicians on construction sites / basements will lose unsaved entries without internet. Blocking real deployment. |
| **Email Notifications** | 🔴 High | Managers have no way to know when entries are submitted. Approval queue is invisible unless they actively check. |

**Not in scope this session:**
- Client Onboarding Wizard (future)
- Loading skeletons (cosmetic, low priority)
- SLA auto-calculations (future)

---

## 📦 PACKAGES TO INSTALL

```bash
# Offline-First
npm install dexie
npm install vite-plugin-pwa

# Email (Edge Function dependency — installed in Supabase, not frontend)
# Resend SDK is imported inside the Edge Function — no npm install needed locally
```

Check `package.json` first — `dexie` may already be listed (it was in the
original stack plan). If already present, skip that install.

---

## 🗄️ NO NEW DATABASE MIGRATIONS

Both tracks are additive:
- IndexedDB is entirely client-side (browser storage)
- Email notifications use a **Supabase Database Webhook** → Edge Function
  (no new tables needed — triggers on existing `work_entries` table)

---

## 📋 TRACK 1: OFFLINE-FIRST

### Architecture Overview

```
User submits work entry
        │
        ▼
┌─────────────────┐
│  IndexedDB       │  ← Always written first (instant, never fails)
│  (Dexie.js)      │
└────────┬────────┘
         │
         ▼
    Is online?
    ┌──────┴──────┐
   YES            NO
    │              │
    ▼              ▼
Supabase      sync_queue
(immediate)   (retry on reconnect)
    │
    ▼
Update IndexedDB
  record with
  remote UUID +
  sync_status: 'synced'
```

**Principle:** IndexedDB is the source of truth for the UI.
Supabase is the authority for the final record.
The sync engine reconciles the two.

---

### 1.1 — `src/services/offline/db.js`

Dexie schema covering all tables the app reads/writes offline:

```javascript
import Dexie from 'dexie';

export const db = new Dexie('WorkLedgerDB');

db.version(1).stores({
  // Reference data — cached on login, refreshed on reconnect
  organizations: 'id, updated_at',
  projects:      'id, organization_id, updated_at',
  contracts:     'id, project_id, updated_at',
  templates:     'template_id, contract_category, updated_at',

  // Main offline storage
  workEntries: [
    '++localId',          // Auto-increment local primary key
    'remoteId',           // UUID from Supabase (null until synced)
    'contract_id',
    'template_id',
    'entry_date',
    'status',
    'sync_status',        // 'pending' | 'syncing' | 'synced' | 'failed'
    'created_at'
  ].join(', '),

  // Attachments (photos stored as base64 blobs offline)
  attachments: [
    '++localId',
    'remoteId',
    'entry_local_id',     // FK → workEntries.localId
    'field_id',
    'attachment_type',    // 'photo' | 'signature'
    'data',               // base64 string
    'sync_status',
    'created_at'
  ].join(', '),

  // Sync queue — tracks every pending mutation
  syncQueue: [
    '++id',
    'entity_type',        // 'work_entry' | 'attachment'
    'entity_local_id',    // localId in the entity's table
    'action',             // 'create' | 'update' | 'delete'
    'payload',            // JSON blob of the full record
    'sync_status',        // 'pending' | 'processing' | 'done' | 'failed'
    'retry_count',
    'created_at'
  ].join(', '),
});

export const SYNC_STATUS = {
  PENDING:  'pending',
  SYNCING:  'syncing',
  SYNCED:   'synced',
  FAILED:   'failed',
};

export default db;
```

**Key design decisions:**
- `++localId` is the offline primary key — never exposed to the user
- `remoteId` is populated after Supabase sync succeeds
- `sync_status` on both `workEntries` and `syncQueue` — two-layer tracking
- `attachments.data` stores base64 inline (avoids IndexedDB blob issues in Safari)

---

### 1.2 — `src/context/OfflineContext.jsx`

```
State:
  isOnline        boolean  — window.navigator.onLine + event listeners
  syncStatus      string   — 'idle' | 'syncing' | 'error'
  pendingCount    number   — count of sync_queue rows with status='pending'

Methods (via context):
  triggerSync()   — manually kick off sync (called on reconnect)
```

**Key pattern:**
```javascript
useEffect(() => {
  const goOnline  = () => { setIsOnline(true);  triggerSync(); };
  const goOffline = () => { setIsOnline(false); };
  window.addEventListener('online',  goOnline);
  window.addEventListener('offline', goOffline);
  return () => {
    window.removeEventListener('online',  goOnline);
    window.removeEventListener('offline', goOffline);
  };
}, []);
```

---

### 1.3 — `src/services/offline/syncService.js`

Core sync logic. Three responsibilities:

**A. Push (local → Supabase)**
```
For each syncQueue entry where sync_status = 'pending':
  1. Set sync_status = 'processing'
  2. POST to Supabase
  3. On success:
     - Update entity's remoteId with Supabase UUID
     - Set entity's sync_status = 'synced'
     - Set syncQueue entry sync_status = 'done'
  4. On failure:
     - Increment retry_count
     - If retry_count >= 3: set sync_status = 'failed'
     - Otherwise: set back to 'pending' (retry next cycle)
```

**B. Pull (Supabase → local)**
```
On login / reconnect:
  1. Fetch organizations, projects, contracts, templates
  2. Upsert into IndexedDB (by id/template_id)
  3. Fetch work_entries for current user (last 90 days)
  4. Upsert into IndexedDB workEntries
```

**C. Conflict resolution (last-write-wins)**
```
If remoteId already exists in IndexedDB AND Supabase has a newer updated_at:
  → Overwrite local with remote (server wins)
  → This is correct: server = final authority
```

---

### 1.4 — `src/components/common/OfflineIndicator.jsx`

Slim banner shown at the top of `<main>` (inside AppLayout, below header):

```
┌─────────────────────────────────────────────────────────────┐
│  🔴  You are offline. Entries will sync when reconnected.   │
└─────────────────────────────────────────────────────────────┘
```

When sync is running:
```
┌─────────────────────────────────────────────────────────────┐
│  🔄  Syncing 3 pending entries...                           │
└─────────────────────────────────────────────────────────────┘
```

When sync fails:
```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  2 entries failed to sync. Tap to retry.               │
└─────────────────────────────────────────────────────────────┘
```

**Implementation note:** Use `useOffline()` hook, not direct context.
The banner should NOT use `position: fixed` — it flows inside `<main>` so
it doesn't overlap the header.

---

### 1.5 — Update `workEntryService.js`

The **only** change to existing code. Add the offline-first wrapper:

```javascript
async createWorkEntry(data, orgId) {
  // 1. Save to IndexedDB immediately (never fails, works offline)
  const localId = await db.workEntries.add({
    ...data,
    sync_status: SYNC_STATUS.PENDING,
    created_at: new Date().toISOString(),
  });

  // 2. Add to sync queue
  await db.syncQueue.add({
    entity_type:     'work_entry',
    entity_local_id: localId,
    action:          'create',
    payload:         JSON.stringify(data),
    sync_status:     'pending',
    retry_count:     0,
    created_at:      new Date().toISOString(),
  });

  // 3. If online, sync immediately — don't wait for next reconnect
  if (navigator.onLine) {
    await syncService.pushSingle('work_entry', localId);
  }

  return { success: true, localId };
}
```

**Important:** `getUserWorkEntries()` should read from IndexedDB when offline,
Supabase when online. Keep both paths.

---

### 1.6 — PWA Setup (vite.config.js + manifest)

```javascript
// vite.config.js — add VitePWA plugin
import { VitePWA } from 'vite-plugin-pwa';

plugins: [
  react(),
  VitePWA({
    registerType: 'autoUpdate',
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      runtimeCaching: [
        {
          // Cache Supabase API responses
          urlPattern: /^https:\/\/.*\.supabase\.co\/rest\//,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'supabase-api',
            expiration: { maxAgeSeconds: 60 * 60 * 24 }, // 24h
          },
        },
      ],
    },
    manifest: {
      name: 'WorkLedger',
      short_name: 'WorkLedger',
      theme_color: '#2563eb',
      background_color: '#f9fafb',
      display: 'standalone',
      orientation: 'portrait',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
  }),
]
```

**Icons needed:** Two PNG files in `public/icons/`:
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)

Can use a simple W logo on blue background — generate with any image editor.

---

### Track 1 Files Summary

| File | Action | Notes |
|------|--------|-------|
| `src/services/offline/db.js` | Create | Dexie schema |
| `src/context/OfflineContext.jsx` | Create | isOnline state + triggerSync |
| `src/hooks/useOffline.js` | Create | Thin hook wrapping OfflineContext |
| `src/services/offline/syncService.js` | Create | Push/pull/conflict |
| `src/components/common/OfflineIndicator.jsx` | Create | Banner UI |
| `src/services/api/workEntryService.js` | Modify | Wrap create/update with IndexedDB |
| `vite.config.js` | Modify | Add VitePWA plugin |
| `src/main.jsx` | Modify | Wrap app in `<OfflineContext>` |
| `src/components/layout/AppLayout.jsx` | Modify | Add `<OfflineIndicator>` inside `<main>` |
| `public/icons/icon-192.png` | Create | PWA icon |
| `public/icons/icon-512.png` | Create | PWA icon |

---

## 📧 TRACK 2: EMAIL NOTIFICATIONS

### Architecture Overview

```
Technician submits work entry
        │
        ▼
work_entries UPDATE  (status: 'submitted')
        │
        ▼
Supabase Database Webhook
(fires on work_entries UPDATE where new.status = 'submitted')
        │
        ▼
Supabase Edge Function
  notify-approval-required
        │
        ├── Query: who are the managers in this org?
        │   SELECT user_id FROM org_members
        │   WHERE organization_id = new.organization_id
        │   AND role IN ('manager', 'org_admin', 'org_owner')
        │
        ├── Query: technician name + contract details
        │
        └── POST to Resend API → sends email to each manager
```

**Zero-budget:** Resend free tier = 3,000 emails/month. More than enough
for initial clients (FEST ENT has 1 manager, a few submissions per day).

---

### 2.1 — Resend Account Setup (one-time)

1. Create free account at resend.com
2. Add domain (or use Resend's shared domain for testing: `onboarding@resend.dev`)
3. Get API key → store as Supabase secret:
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
   ```

---

### 2.2 — Supabase Edge Function: `notify-approval-required`

File: `supabase/functions/notify-approval-required/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_URL        = Deno.env.get('APP_URL') ?? 'https://workledger.vercel.app';

serve(async (req) => {
  try {
    const payload = await req.json();        // Database webhook payload
    const record  = payload.record;          // The updated work_entry row

    // Only fire when status becomes 'submitted'
    if (record.status !== 'submitted') {
      return new Response('ignored', { status: 200 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Get managers in this org
    const { data: managers } = await supabase
      .from('org_members')
      .select('user_id, user_profiles(full_name, email:id)')
      .eq('organization_id', record.organization_id)
      .in('role', ['manager', 'org_admin', 'org_owner']);

    // 2. Resolve manager emails via auth.users (service role can access)
    const managerEmails = [];
    for (const m of managers ?? []) {
      const { data: authUser } = await supabase.auth.admin.getUserById(m.user_id);
      if (authUser?.user?.email) {
        managerEmails.push({
          email: authUser.user.email,
          name:  m.user_profiles?.full_name ?? 'Manager',
        });
      }
    }

    if (managerEmails.length === 0) {
      return new Response('no managers found', { status: 200 });
    }

    // 3. Get technician name
    const { data: techProfile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', record.created_by)
      .single();

    // 4. Get contract details
    const { data: contract } = await supabase
      .from('contracts')
      .select('contract_number, contract_name')
      .eq('id', record.contract_id)
      .single();

    const techName       = techProfile?.full_name  ?? 'Technician';
    const contractRef    = contract?.contract_number ?? record.contract_id;
    const contractName   = contract?.contract_name   ?? '';
    const entryDate      = new Date(record.entry_date).toLocaleDateString('en-GB');
    const approvalUrl    = `${APP_URL}/work/approvals`;

    // 5. Send email to each manager via Resend
    for (const manager of managerEmails) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          from:    'WorkLedger <notifications@yourdomain.com>',
          to:      [manager.email],
          subject: `Work Entry Submitted — ${contractRef} (${entryDate})`,
          html: `
            <h2>New Work Entry Pending Approval</h2>
            <p>Hi ${manager.name},</p>
            <p>A work entry has been submitted for your review:</p>
            <table>
              <tr><td><strong>Technician:</strong></td><td>${techName}</td></tr>
              <tr><td><strong>Contract:</strong></td><td>${contractRef} — ${contractName}</td></tr>
              <tr><td><strong>Entry Date:</strong></td><td>${entryDate}</td></tr>
            </table>
            <br/>
            <a href="${approvalUrl}"
               style="background:#2563eb;color:white;padding:10px 20px;
                      border-radius:6px;text-decoration:none;">
              Review Approval Queue
            </a>
            <p style="color:#666;font-size:12px;margin-top:20px;">
              WorkLedger — Work Reporting Platform
            </p>
          `,
        }),
      });
    }

    return new Response(
      JSON.stringify({ sent: managerEmails.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('notify-approval-required error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
```

---

### 2.3 — Supabase Database Webhook Setup (Supabase Dashboard)

1. Go to **Database → Webhooks → Create Webhook**
2. Name: `notify-approval-required`
3. Table: `work_entries`
4. Events: `UPDATE` only
5. Type: `Supabase Edge Functions`
6. Edge Function: `notify-approval-required`
7. HTTP method: POST
8. Filter (optional): `status=eq.submitted` — reduces unnecessary invocations

**Alternative (if webhooks unavailable on free tier):** Use a PostgreSQL trigger
that calls `pg_net.http_post()` to the Edge Function URL directly.

---

### 2.4 — Supabase Secrets to Set

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
supabase secrets set APP_URL=https://workledger.vercel.app
# SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase
```

---

### 2.5 — Deploy Edge Function

```bash
supabase functions deploy notify-approval-required
```

---

### Track 2 Files Summary

| File | Action | Notes |
|------|--------|-------|
| `supabase/functions/notify-approval-required/index.ts` | Create | Deno edge function |
| Supabase Dashboard → Webhooks | Configure | work_entries UPDATE → edge fn |
| Supabase Secrets | Set | RESEND_API_KEY, APP_URL |

---

## 🧪 TESTING CHECKLIST

### Offline-First

- [ ] Open app, disable network in DevTools → offline banner appears
- [ ] Create work entry while offline → saves instantly, no error
- [ ] Re-enable network → sync triggers automatically, banner disappears
- [ ] Verify entry appears in Supabase Dashboard after sync
- [ ] Check IndexedDB in DevTools (Application → IndexedDB → WorkLedgerDB)
- [ ] Hard refresh while offline → app still loads (service worker serves cache)
- [ ] On mobile: Add to Home Screen → opens as standalone PWA

### Email Notifications

- [ ] Log in as `amirul.tech@test.com` (technician)
- [ ] Create and submit a work entry
- [ ] Check `roslan.manager@test.com`'s inbox → approval email received
- [ ] Email contains correct contract number, technician name, entry date
- [ ] "Review Approval Queue" button links to `/work/approvals`
- [ ] Submit a second entry → second email received
- [ ] Check Resend dashboard for delivery status

---

## ⚠️ KNOWN GOTCHAS

### Offline-First
1. **Safari IndexedDB** — Safari has stricter storage limits and may clear
   IndexedDB if storage is under pressure. Document this as a known limitation.
   Chrome / Android Chrome is the recommended browser for field use.

2. **Dexie version upgrades** — If you add new tables/indexes later, you MUST
   increment the Dexie version number and provide a migration. Never change
   an existing version's schema.

3. **remoteId vs localId** — React components must never store `localId` in
   URLs or state that persists beyond the session. Always prefer `remoteId`
   once synced. Before sync, show the entry from IndexedDB by `localId`.

4. **VitePWA in dev mode** — Service workers don't run in Vite dev mode by
   default. Test the PWA in `vite build && vite preview` or deploy to Vercel.

5. **Background sync API** — The Background Sync API (for sync after browser
   close) is Chrome-only. For now, sync on reconnect (online event) is
   sufficient. Background sync can be added later.

### Email Notifications
1. **Resend domain verification** — Without a verified domain, emails go from
   `onboarding@resend.dev` (fine for testing). Before real client use, verify
   your domain in Resend and update the `from` address.

2. **auth.admin.getUserById** — Requires service role key, not anon key.
   Edge Functions have access to `SUPABASE_SERVICE_ROLE_KEY` automatically.
   Never expose this key to the frontend.

3. **Database Webhooks free tier** — Supabase free tier supports database
   webhooks. If not available, the pg_net alternative (PostgreSQL trigger)
   is the fallback.

4. **Email on reject** — This session only covers "submitted" notifications.
   "Rejected" notifications (technician gets email when manager rejects)
   can be added in the same edge function in a future session.

---

## 📁 FINAL FILE COUNT

**New files (10):**
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
src/components/layout/AppLayout.jsx    — OfflineIndicator in <main>
src/main.jsx                           — wrap in OfflineContext provider
vite.config.js                         — VitePWA plugin
```

**Estimated total new code:** ~600 lines

---

## 🎯 SUCCESS CRITERIA FOR SESSION 18

- [ ] App loads and works fully with DevTools network set to Offline
- [ ] Work entry created offline appears in Supabase after reconnect
- [ ] Offline indicator banner visible when offline, disappears when online
- [ ] PWA installable on Android Chrome ("Add to Home Screen")
- [ ] Manager receives email within 30 seconds of technician submitting entry
- [ ] Email contains correct content and working approval link
- [ ] No regressions in existing features (run through FEST ENT workflow)

---

**Bismillah. Let's make WorkLedger truly field-ready! 🚀**

*Session 18 Preparation*
*Created: March 3, 2026*
*WorkLedger — Multi-Client Work Reporting Platform*
