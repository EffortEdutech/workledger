# WorkLedger Enterprise — WLE-E04 Daily Diary & Offline Evidence Capture

**Candidate v0.1 · 13 November 2026 (MYT) · ISOLATED / NON-PRODUCTION ENGINEERING**

**Base:** `EffortEdutech/workledger` E03 branch `feature/wle-e03-evidence-audit-foundation` at observed `53031747fb16ae09cf7f500bc4750638f30714b5`. Upstream WLE-P1B contract `1.0.0-rc1` is provisionally frozen; it is **not changed** by this package.

## What was implemented

- `src/diary.mjs`: server-only isolated synthetic reference. Four commands: `sync_draft`, `attach_evidence`, `submit`, `acknowledge`. Factual diary fields from the Contract Diary legacy service include weather, site conditions, work progress, manpower, equipment, materials and issues/delays. Command IDs and client user/role assertions cannot impersonate an actor; verified token and current contract appointment must be checked within the eventual DB transaction.
- `src/offlineQueue.mjs`: memory-only offline factual draft and raw evidence-intent queue, stable idempotency keys, per-diary expected-version ordering, conflict retention, byte hashing and explicit attachment-confirmation gate. **No real IndexedDB, encryption, persistence, service worker, automatic upload, background sync or user session storage exists.** Only drafts/evidence intents can be queued offline; final submission and acknowledgement are online-only.
- `sql/005_diary_offline_CANDIDATE.sql`: private candidate design for composite tenant-scoped diary records, E03 evidence links, event/outbox/receipts and FORCE RLS. **NO POLICIES OR GRANTS: DEFAULT DENY. NOT EXECUTED.** Requires staging reconciliation and owner/DBA approval before any use.
- `ui/DIARY_UI_SCREEN_SPEC.md` and `ui/diary_prototype.html`: UI layout and **synthetic view-only demo** (not a running WorkLedger feature).
- `docs/`: domain/legacy mapping, offline protocol, release gate/threat register, Codex handoff.
- `evidence/`: execution logs for E04 and separate E03/E02 regression, manifest of exact packaged files.

## Local test commands

```bash
cd engineering/wle-e04
node --version             # local test: Node v22.16.0
npm test                   # 58 passed / 0 failed / 0 skipped
```

Independent source-package regression records included: E03 **45/45** passing; E02 **30/30** passing. All are Node synthetic-reference tests. The regression commands do **not** prove a combined E01–E04 database transaction, real offline PWA, e-signature or production workflow.

## Non-negotiable state boundaries

`draft → submitted → acknowledged`; server draft update only by original author; submitted/acknowledged diaries locked. Server checks `construction.diary.submit` on `sync_draft`, `attach_evidence` and `submit`; capacity is `main_contractor_submitter` or `subcontractor_submitter`. Acknowledgement requires **`construction.diary.acknowledge` and `main_contractor_reviewer`**, distinct from original submitter. This addresses the legacy Contract Diary `acknowledgeDiary` TODO where the role check was not implemented; the legacy repository itself remains unchanged.

E03 asset linking requires a fresh, server-trusted byte-integrity receipt and exact organization/project/contract scope, not a client hash or object URL. Offline evidence cannot be treated as submitted until E03 preservation **and** E04 diary linkage are independently acknowledged.

## Open holds

- E01/E01B contract appointment authority bootstrap and independent Supabase Auth `getUser(token)` verification.
- Real multi-tenant PostgreSQL RLS, roles, schema compatibility, two-user/two-tenant integration, concurrency and source-to-canonical migration.
- Durable private object storage, malware screening/quarantine, actual file readback, retention policy, legal holds, independent signer assurance.
- Browser encrypted IndexedDB, service worker, offline storage quotas, multi-tab/device reconciliation, logout/device-loss clearing.
- Outbox publisher, independent audit anchor, disaster recovery, Vercel Node 20 preview remediation.
- Owner/DBA/security/legal sign-offs for staging, customer pilot, production and CIPAA-related reliance.

**No modification to `main`, WorkLedger Standard application code, Contract Diary, QS Service, Supabase, production storage or customer data.**
