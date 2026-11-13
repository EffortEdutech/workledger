# WLE-E04 — Executed Test and Gate Evidence

**Date:** 13 November 2026 (MYT)  
**Runtime:** isolated Linux container, Node.js v22.16.0 / npm 10.9.2.  
**E04 command:** `cd WLE-E04_Candidate_v0.1 && npm test`.

| Executable reference | Actual Node tests | Result | Execution |
|---|---:|---|---|
| E04 Daily Diary + Offline Evidence Queue | 58 | 58 PASS, 0 FAIL | Ran for this package; log `NODE_TEST_OUTPUT.txt` |
| E03 Evidence & Audit Foundation | 45 | 45 PASS, 0 FAIL | Separate run from the fully verified E03 candidate extracted package |
| E02 Contract Version Registry | 30 | 30 PASS, 0 FAIL | Separate run from the full E02 ZIP (the older loose E02 directory lacked test files; it was **not** accepted as evidence) |

**Total isolated tests run across those three packages: 133 PASS / 0 FAIL.** This is an arithmetic sum of separate packages and **NOT** one integrated end-to-end test suite. Earlier E00/E01/E01B tests are not rerun or silently claimed here.

## E04 case classes
- Tenant/project/contract identity, date+shift uniqueness, source fields/decimal strings, strict body keys, forged principal/roles.
- Verified active appointment callback and separate `construction.diary.submit` vs independent `construction.diary.acknowledge` capacity.
- Full draft snapshots and optimistic versions; duplicate retry; stale conflict protection and in-process concurrent idempotency.
- Incomplete diary fail, submitted/acknowledged locks, different MC reviewer, forbidden self-acknowledge.
- E03 evidence ID/digest/scope, no unsupported byte claims, pre-submit attachment.
- Offline local drafts, sequential version assignment, unchanged retry key, local bytes, preservation/diary-link dual receipt requirement, pending intent and conflict retention.
- Synthetic outbox/audit/receipt rollback, event digest chain. No client commerce/CIPAA authority.

## Explicit NOT TESTED
- Actual PostgreSQL SQL execution, private role grants, FORCE RLS effectiveness, real distributed transactions or Supabase staging Auth/JWT.
- Actual browser IndexedDB, service worker, encrypted at-rest storage, tabs, offline restart, background sync, file quota, network retry or UI UAT.
- E03 real Storage provider, malware quarantine, original object readback, orphan reconciliation or legal hold/retention.
- Cross-module combined transaction for E02/E03/E04; audit independent anchor/outbox delivery/queue monitoring.
- Real Contract Diary ID migration, contract revision acceptance, payment, CIPAA statutory notice/legal reliance, customer pilot or production.

## Release disposition
**ENGINEERING CANDIDATE / SYNTHETIC LOCAL TEST PASS ONLY.** Staging, main merge, customer-data migration, production and legal gates remain HOLD. No production or shared database modified.
