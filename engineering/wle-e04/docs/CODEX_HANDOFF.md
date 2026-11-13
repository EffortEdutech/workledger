# WLE-E04-04 — Codex Engineering Handoff

## Baseline pinned
- WorkLedger Enterprise GitHub `EffortEdutech/workledger`, parent `feature/wle-e03-evidence-audit-foundation` observed SHA `53031747fb16ae09cf7f500bc4750638f30714b5` (verify again before any PR).
- Enterprise architecture reference WLE-P1B `1.0.0-rc1` candidate, E01/E01B appointments, E02 version registry, E03 custody.
- Contract Diary reference `EffortEdutech/contract-diary-platform` pinned `6d3a9ad292e702100d133095bb03362ab38638dc`, specifically `frontend/src/services/diaryService.js`. Do not edit that repository implicitly.

## Delivered isolated workpack
`engineering/wle-e04/` contains `src/diary.mjs`, `src/offlineQueue.mjs`, `tests/diary.test.mjs`, design-only SQL, candidate private contract, UI specification, static prototype, threat/gate/docs and test evidence. This is **NOT** a ready-to-ship Supabase implementation or browser PWA.

## Reproduction
```bash
cd engineering/wle-e04
node --version
npm test
# expected from this package: 58/58 local synthetic tests PASS
cd ../wle-e03 && npm test    # separate 45/45 regression, if files present
cd ../wle-e02 && npm test    # separate 30/30 regression, if files present
```
Do not accept `node --test` with zero tests as a regression pass; verify the count and real `.test.mjs` files are present. Keep test output SHA/Node/runtime and PR source SHA.

## Next bounded PR order
1. Read E01B `appointmentCommands.mjs` and scope/cap RLS. Solve `CDP-SEC-004` legacy MC role-check gap at Enterprise gateway and prove main-contractor reviewer independently of submitter. No downgrade to browser role claims.
2. Implement private E04 PostgreSQL/SQL transaction gateway *only in an explicitly owner-approved isolated staging project* after a DBA adapts all E01–E04 schema candidates. Preserve immutable submitted/acknowledged snapshots, exact version compare-and-set and idempotent receipts.
3. Implement E03 `verifyForDiary` byte-integrity/scoped asset port separate from E03 `verifyForE02` party-signature port; fresh E03 object readback and quarantine status required. Never accept `verified:true` from browser; never infer legal signature validity.
4. Build tested encrypted IndexedDB/local-offline draft storage and service worker under an Enterprise-only feature flag (disabled default); no bearer token stored in local queue. Test browser restarts, multi-user logout, duplicate retry, stale version and offline file-size/security limits.
5. Integrate the Enterprise diary UI only after end-to-end staging and no Standard UI regressions. Keep Contract Diary source IDs mapped explicitly; decide whether shifts are allowed before legacy import.
6. Independently implement outbox publisher/monitoring, backup/restore, retention/legal hold, audit trust anchor. No direct service-role/browser access or unreviewed RLS policy.
7. Provide PR evidence: schemas/API diff, role matrix, 2 real users + 2 tenants, sibling-contract denies, audit/rollback, screenshots, performance, unresolved risks and human approvals.

## Exact bounded handoff prompt
> Proceed WorkLedger Enterprise **WLE-E04 integration only** from the isolated candidate. Preserve WLE-P1B `1.0.0-rc1`, and parent E03 verified SHA. Reproduce all 58 E04 local tests and separate E03/E02 regression counts. Implement the diary backend under a protected private command boundary, with verified `getUser`, E01 active appointment and capacity, version-checked draft sync, trusted E03 evidence linkage, online-only submit and independent main-contractor review. Prepare a browser offline IndexedDB client as a separately reviewed extension. Preserve CDP legacy data and all release holds. Do not edit `main`, use production, modify unrelated Supabase projects, infer CIPAA compliance or issue certification. Deliver PR-ready diff, test log, negative security fixtures, staging/rollback plan and remaining gates.

## Release label
Engineering candidate PASS is **not** staging acceptance; no merge, deployment, customer migration, legal assertion or statutory certificate.
